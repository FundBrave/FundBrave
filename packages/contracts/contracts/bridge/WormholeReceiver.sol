// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ISwapAdapter.sol";
import "./BridgeRouter.sol";

/**
 * @title IWormholeCoreBridge
 * @dev Minimal interface for Wormhole Core Bridge VAA verification
 */
interface IWormholeCoreBridge {
    struct Signature {
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint8 guardianIndex;
    }

    struct VM {
        uint8 version;
        uint32 timestamp;
        uint32 nonce;
        uint16 emitterChainId;
        bytes32 emitterAddress;
        uint64 sequence;
        uint8 consistencyLevel;
        bytes payload;
        uint32 guardianSetIndex;
        Signature[] signatures;
        bytes32 hash;
    }

    function parseAndVerifyVM(bytes calldata encodedVM)
        external
        view
        returns (VM memory vm, bool valid, string memory reason);
}

/**
 * @title WormholeReceiver
 * @author FundBrave Team
 * @notice Receives Wormhole VAAs (Verified Action Approvals) on Base from Solana
 * @dev Validates VAA signatures via Wormhole Core Contract, decodes the payload,
 *      redeems wrapped tokens, and routes the message through BridgeRouter.
 *
 * Flow:
 *   Solana → Wormhole Guardians → VAA → WormholeReceiver (Base)
 *     → Swap wrapped SOL/tokens to USDC
 *     → Route through BridgeRouter → FundraiserFactory
 */
contract WormholeReceiver is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Solana chain ID in Wormhole ecosystem
    uint16 public constant SOLANA_CHAIN_ID = 1;

    /// @notice Solana chain ID used in BridgeRouter (non-Wormhole format)
    uint256 public constant SOLANA_BRIDGE_CHAIN_ID = 1399811149;

    // ============ State Variables ============

    /// @notice Wormhole Core Bridge contract for VAA verification
    IWormholeCoreBridge public wormholeCoreBridge;

    /// @notice BridgeRouter contract for message routing
    BridgeRouter public bridgeRouter;

    /// @notice Swap adapter for converting wrapped tokens to USDC
    ISwapAdapter public swapAdapter;

    /// @notice USDC token on Base
    IERC20 public immutable usdcToken;

    /// @notice Registered Wormhole emitter addresses per chain (bytes32 format)
    mapping(uint16 => bytes32) public registeredEmitters;

    /// @notice Processed VAA hashes to prevent replay attacks
    mapping(bytes32 => bool) public processedVAAs;

    /// @notice Statistics
    uint256 public totalVAAsProcessed;
    uint256 public totalVolumeUSDC;

    // ============ Events ============

    event VAAProcessed(
        bytes32 indexed vaaHash,
        uint16 emitterChainId,
        address indexed donor,
        uint256 fundraiserId,
        uint8 action,
        uint256 usdcAmount
    );
    event EmitterRegistered(uint16 indexed chainId, bytes32 emitterAddress);
    event WormholeCoreUpdated(address indexed newCore);
    event BridgeRouterUpdated(address indexed newRouter);
    event SwapAdapterUpdated(address indexed newAdapter);

    // ============ Custom Errors ============

    error InvalidVAA();
    error VAAAlreadyProcessed();
    error UnregisteredEmitter();
    error InvalidPayload();
    error SwapFailed();

    // ============ Constructor ============

    constructor(
        address _wormholeCoreBridge,
        address _bridgeRouter,
        address _swapAdapter,
        address _usdcToken,
        address _owner
    ) Ownable(_owner) {
        require(_usdcToken != address(0), "Invalid USDC");
        wormholeCoreBridge = IWormholeCoreBridge(_wormholeCoreBridge);
        bridgeRouter = BridgeRouter(payable(_bridgeRouter));
        swapAdapter = ISwapAdapter(_swapAdapter);
        usdcToken = IERC20(_usdcToken);
    }

    // ============ Core VAA Processing ============

    /**
     * @notice Process a Wormhole VAA containing a cross-chain FundBrave action
     * @dev Anyone can call this to relay a VAA. The VAA is verified by the Wormhole Core Contract.
     * @param encodedVAA The encoded Wormhole VAA bytes
     */
    function processVAA(bytes calldata encodedVAA)
        external
        nonReentrant
        whenNotPaused
    {
        // 1. Parse and verify the VAA via Wormhole Core
        (IWormholeCoreBridge.VM memory vm, bool valid, string memory reason) =
            wormholeCoreBridge.parseAndVerifyVM(encodedVAA);

        if (!valid) revert InvalidVAA();

        // 2. Check for replay
        if (processedVAAs[vm.hash]) revert VAAAlreadyProcessed();

        // 3. Verify emitter is registered
        if (registeredEmitters[vm.emitterChainId] != vm.emitterAddress) {
            revert UnregisteredEmitter();
        }

        // 4. Mark as processed before external calls (CEI)
        processedVAAs[vm.hash] = true;

        // 5. Decode payload
        // Payload format: abi.encode(donor, fundraiserId, action, tokenAddress, amount)
        // Where donor is the Solana wallet address converted to bytes32 then to address
        (
            address donor,
            uint256 fundraiserId,
            uint8 action,
            address wrappedToken,
            uint256 tokenAmount
        ) = abi.decode(vm.payload, (address, uint256, uint8, address, uint256));

        if (action > 2) revert InvalidPayload();

        // 6. Convert tokens to USDC
        uint256 usdcAmount;
        if (wrappedToken == address(usdcToken)) {
            // Already USDC - just use it directly
            usdcAmount = tokenAmount;
        } else {
            // Swap wrapped token to USDC
            IERC20(wrappedToken).forceApprove(address(swapAdapter), tokenAmount);
            usdcAmount = swapAdapter.swapToUSDT(wrappedToken, tokenAmount);
            if (usdcAmount == 0) revert SwapFailed();
        }

        // 7. Transfer USDC to BridgeRouter and route the message
        usdcToken.safeTransfer(address(bridgeRouter), usdcAmount);

        BridgeRouter.CrossChainMessage memory message = BridgeRouter.CrossChainMessage({
            donor: donor,
            fundraiserId: fundraiserId,
            action: BridgeRouter.Action(action),
            usdcAmount: usdcAmount,
            sourceChainId: SOLANA_BRIDGE_CHAIN_ID,
            protocol: BridgeRouter.BridgeProtocol.Wormhole
        });

        bridgeRouter.routeMessage(message);

        // 8. Update statistics
        totalVAAsProcessed++;
        totalVolumeUSDC += usdcAmount;

        emit VAAProcessed(
            vm.hash,
            vm.emitterChainId,
            donor,
            fundraiserId,
            action,
            usdcAmount
        );
    }

    /**
     * @notice Process a mock/simplified VAA for testnet use
     * @dev Skips VAA verification - for testing only. Protected by onlyOwner.
     * @param donor Donor address
     * @param fundraiserId Target fundraiser ID
     * @param action 0=Donate, 1=Stake, 2=WealthBuild
     * @param usdcAmount Amount of USDC (must be pre-transferred to this contract)
     */
    function processTestMessage(
        address donor,
        uint256 fundraiserId,
        uint8 action,
        uint256 usdcAmount
    )
        external
        onlyOwner
        nonReentrant
        whenNotPaused
    {
        require(action <= 2, "Invalid action");
        require(usdcAmount > 0, "Zero amount");

        // Transfer USDC to BridgeRouter
        usdcToken.safeTransfer(address(bridgeRouter), usdcAmount);

        BridgeRouter.CrossChainMessage memory message = BridgeRouter.CrossChainMessage({
            donor: donor,
            fundraiserId: fundraiserId,
            action: BridgeRouter.Action(action),
            usdcAmount: usdcAmount,
            sourceChainId: SOLANA_BRIDGE_CHAIN_ID,
            protocol: BridgeRouter.BridgeProtocol.Wormhole
        });

        bridgeRouter.routeMessage(message);

        totalVAAsProcessed++;
        totalVolumeUSDC += usdcAmount;
    }

    // ============ Admin Functions ============

    /**
     * @notice Register a Wormhole emitter for a chain
     * @param chainId Wormhole chain ID
     * @param emitterAddress The emitter address in bytes32 format
     */
    function registerEmitter(uint16 chainId, bytes32 emitterAddress) external onlyOwner {
        registeredEmitters[chainId] = emitterAddress;
        emit EmitterRegistered(chainId, emitterAddress);
    }

    function setWormholeCore(address _core) external onlyOwner {
        wormholeCoreBridge = IWormholeCoreBridge(_core);
        emit WormholeCoreUpdated(_core);
    }

    function setBridgeRouter(address _router) external onlyOwner {
        bridgeRouter = BridgeRouter(payable(_router));
        emit BridgeRouterUpdated(_router);
    }

    function setSwapAdapter(address _adapter) external onlyOwner {
        swapAdapter = ISwapAdapter(_adapter);
        emit SwapAdapterUpdated(_adapter);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Emergency withdraw stuck tokens
     */
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransfer(owner(), balance);
        }
    }

    receive() external payable {}
}
