// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Imports
import { OApp, Origin, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OAppSender.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ISwapAdapter.sol";

/**
 * @title FundBraveBridge (LayerZero V2 Edition)
 * @notice Sends Tokens + Data (Action: Donate/Stake/WealthBuild) across chains.
 * @dev Implements OApp for messaging. Supports EVM chains + RSK (Bitcoin L2).
 *      On the receiving side, routes through BridgeRouter when available,
 *      or directly to Factory for backwards compatibility.
 *
 * Supported chains via LayerZero V2:
 *   - Ethereum (EID 30101)
 *   - Polygon (EID 30109)
 *   - Arbitrum (EID 30110)
 *   - Optimism (EID 30111)
 *   - Base (EID 30184)
 *   - RSK/Rootstock (EID 30294) - Bitcoin L2
 */
contract FundBraveBridge is OApp, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using OptionsBuilder for bytes;

    ISwapAdapter public immutable swapAdapter;
    IERC20 public immutable usdcToken;
    address public localFundraiserFactory;

    /// @notice BridgeRouter for unified message routing (if set, routes through router)
    address public bridgeRouter;

    // Mapping of Chain ID (LayerZero EID) to Factory Address on that chain
    mapping(uint32 => address) public peerFactories;

    /// @notice Maps LayerZero EID to standard chain ID for BridgeRouter
    mapping(uint32 => uint256) public eidToChainId;

    // Statistics
    uint256 public totalCrossChainTx;
    uint256 public totalCrossChainVolumeUSDC;

    event CrossChainActionSent(uint32 indexed dstEid, bytes32 guid, uint256 amountUSDC, uint8 action);
    event CrossChainActionReceived(uint32 indexed srcEid, address indexed donor, uint256 amount);
    event PeerFactorySet(uint32 indexed eid, address factory);
    event BridgeRouterSet(address indexed router);
    event EidChainIdMapped(uint32 indexed eid, uint256 chainId);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);

    constructor(
        address _endpoint,
        address _swapAdapter,
        address _usdcToken,
        address _localFundraiserFactory,
        address _owner
    )
        Ownable(_owner)
        OApp(_endpoint, _owner)
    {
        require(_endpoint != address(0), "Invalid Endpoint");
        require(_swapAdapter != address(0), "Invalid Adapter");

        swapAdapter = ISwapAdapter(_swapAdapter);
        usdcToken = IERC20(_usdcToken);
        localFundraiserFactory = _localFundraiserFactory;

        // Initialize EID-to-ChainID mappings for known chains
        eidToChainId[30101] = 1;       // Ethereum
        eidToChainId[30109] = 137;     // Polygon
        eidToChainId[30110] = 42161;   // Arbitrum
        eidToChainId[30111] = 10;      // Optimism
        eidToChainId[30184] = 8453;    // Base
        eidToChainId[30294] = 30;      // RSK/Rootstock
        eidToChainId[40245] = 84532;   // Base Sepolia (testnet)
        eidToChainId[40294] = 31;      // RSK Testnet
    }

    // --- Main User Function ---

    /**
     * @notice Send a cross-chain action (Donate/Stake/WealthBuild)
     * @param _dstEid LayerZero destination endpoint ID
     * @param _fundraiserId Target fundraiser ID on destination chain
     * @param _action 0=Donate, 1=Stake, 2=WealthBuild
     * @param _tokenIn Address of the ERC20 token to send
     * @param _amountIn Amount of tokens to send
     */
    function sendCrossChainAction(
        uint32 _dstEid,
        uint256 _fundraiserId,
        uint8 _action, // 0=Donate, 1=Stake, 2=WealthBuild
        address _tokenIn,
        uint256 _amountIn
    ) external payable nonReentrant whenNotPaused {
        require(_amountIn > 0, "Amount must be > 0");
        require(_action <= 2, "Invalid action");

        // 1. Swap to USDC locally
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);

        uint256 usdcAmount;
        if (_tokenIn == address(usdcToken)) {
            usdcAmount = _amountIn;
        } else {
            IERC20(_tokenIn).forceApprove(address(swapAdapter), _amountIn);
            usdcAmount = swapAdapter.swapToUSDT(_tokenIn, _amountIn);
        }

        require(usdcAmount > 0, "Swap resulted in 0 USDC");

        // 2. Construct Payload
        bytes memory _payload = abi.encode(msg.sender, _fundraiserId, _action, usdcAmount);

        // 3. Generate Options (Gas limit for execution on destination)
        // WealthBuild action needs more gas due to additional WBD interaction
        uint128 gasLimit = _action == 2 ? 350000 : 200000;
        bytes memory _options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(gasLimit, 0);

        // 4. Quote and Check Fee
        MessagingFee memory fee = _quote(_dstEid, _payload, _options, false);
        require(msg.value >= fee.nativeFee, "Insufficient gas for LayerZero");

        // 5. Send LayerZero Message
        MessagingReceipt memory receipt = _lzSend(
            _dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        totalCrossChainTx++;
        totalCrossChainVolumeUSDC += usdcAmount;

        emit CrossChainActionSent(_dstEid, receipt.guid, usdcAmount, _action);
    }

    /**
     * @notice Send a cross-chain action with native currency (ETH/RBTC)
     * @param _dstEid LayerZero destination endpoint ID
     * @param _fundraiserId Target fundraiser ID on destination chain
     * @param _action 0=Donate, 1=Stake, 2=WealthBuild
     * @param _nativeAmount Amount of msg.value allocated to the swap (rest goes to LZ fee)
     */
    function sendCrossChainActionNative(
        uint32 _dstEid,
        uint256 _fundraiserId,
        uint8 _action,
        uint256 _nativeAmount
    ) external payable nonReentrant whenNotPaused {
        require(_nativeAmount > 0, "Amount must be > 0");
        require(_action <= 2, "Invalid action");
        require(msg.value > _nativeAmount, "Must send extra for LZ fee");

        // 1. Swap native to USDC
        uint256 usdcAmount = swapAdapter.swapNativeToUSDT{value: _nativeAmount}();
        require(usdcAmount > 0, "Swap resulted in 0 USDC");

        // 2. Construct Payload
        bytes memory _payload = abi.encode(msg.sender, _fundraiserId, _action, usdcAmount);

        // 3. Generate Options
        uint128 gasLimit = _action == 2 ? 350000 : 200000;
        bytes memory _options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(gasLimit, 0);

        // 4. Quote and check
        uint256 lzFee = msg.value - _nativeAmount;
        MessagingFee memory fee = _quote(_dstEid, _payload, _options, false);
        require(lzFee >= fee.nativeFee, "Insufficient gas for LayerZero");

        // 5. Send LayerZero Message
        MessagingReceipt memory receipt = _lzSend(
            _dstEid,
            _payload,
            _options,
            MessagingFee(lzFee, 0),
            payable(msg.sender)
        );

        totalCrossChainTx++;
        totalCrossChainVolumeUSDC += usdcAmount;

        emit CrossChainActionSent(_dstEid, receipt.guid, usdcAmount, _action);
    }

    function quoteCrossChainAction(
        uint32 _dstEid,
        uint256 _fundraiserId,
        uint8 _action,
        uint256 _usdcAmount
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory _payload = abi.encode(msg.sender, _fundraiserId, _action, _usdcAmount);
        uint128 gasLimit = _action == 2 ? 350000 : 200000;
        bytes memory _options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(gasLimit, 0);

        MessagingFee memory fee = _quote(_dstEid, _payload, _options, false);
        return (fee.nativeFee, fee.lzTokenFee);
    }

    // --- Internal LayerZero Handler ---

    /**
     * @notice Handles incoming cross-chain messages from LayerZero
     * @dev If bridgeRouter is set, routes through it for unified handling.
     *      Otherwise falls back to direct factory calls for backwards compatibility.
     * @param _origin Origin information containing source endpoint ID
     * @param _payload Encoded message containing donor, fundraiserId, action, and amount
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override whenNotPaused {
        (address donor, uint256 fundraiserId, uint8 action, uint256 amount) =
            abi.decode(_payload, (address, uint256, uint8, uint256));

        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance >= amount, "Bridge Insufficient Liquidity");

        // Route through BridgeRouter if available (supports WealthBuild + rate limiting)
        if (bridgeRouter != address(0)) {
            _routeViaBridgeRouter(donor, fundraiserId, action, amount, _origin.srcEid);
        } else {
            _routeDirectToFactory(donor, fundraiserId, action, amount, _origin.srcEid);
        }

        emit CrossChainActionReceived(_origin.srcEid, donor, amount);
    }

    /**
     * @dev Routes message through BridgeRouter for unified handling
     */
    function _routeViaBridgeRouter(
        address donor,
        uint256 fundraiserId,
        uint8 action,
        uint256 amount,
        uint32 srcEid
    ) internal {
        // Transfer USDC to BridgeRouter
        usdcToken.safeTransfer(bridgeRouter, amount);

        // Determine source chain ID from EID mapping
        uint256 sourceChainId = eidToChainId[srcEid];
        if (sourceChainId == 0) sourceChainId = uint256(srcEid); // Fallback

        // Construct and route message
        // We call routeMessage via low-level call to avoid import dependency
        (bool success, ) = bridgeRouter.call(
            abi.encodeWithSignature(
                "routeMessage((address,uint256,uint8,uint256,uint256,uint8))",
                donor,
                fundraiserId,
                action,     // Action enum
                amount,
                sourceChainId,
                uint8(0)    // BridgeProtocol.LayerZero
            )
        );
        require(success, "Router execution failed");
    }

    /**
     * @dev Direct routing to factory (backwards compatible path)
     */
    function _routeDirectToFactory(
        address donor,
        uint256 fundraiserId,
        uint8 action,
        uint256 amount,
        uint32 srcEid
    ) internal {
        usdcToken.safeTransfer(localFundraiserFactory, amount);

        bytes32 messageHash = keccak256(abi.encodePacked(
            donor,
            fundraiserId,
            amount,
            srcEid,
            block.chainid,
            action
        ));

        bool success;
        if (action == 0) {
            (success, ) = localFundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainDonation(address,uint256,uint256,bytes32,uint32)",
                    donor, fundraiserId, amount, messageHash, srcEid
                )
            );
        } else if (action == 1) {
            (success, ) = localFundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainStake(address,uint256,uint256,bytes32,uint32)",
                    donor, fundraiserId, amount, messageHash, srcEid
                )
            );
        } else if (action == 2) {
            (success, ) = localFundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainWealthBuilding(address,uint256,uint256,bytes32,uint32)",
                    donor, fundraiserId, amount, messageHash, srcEid
                )
            );
        }

        require(success, "Factory execution failed");
    }

    // --- Admin & Safety Functions ---

    function setPeerFactory(uint32 _eid, address _factory) external onlyOwner {
        peerFactories[_eid] = _factory;
        emit PeerFactorySet(_eid, _factory);
    }

    /**
     * @notice Set the BridgeRouter for unified message handling
     * @param _router Address of the BridgeRouter contract (or zero to disable)
     */
    function setBridgeRouter(address _router) external onlyOwner {
        bridgeRouter = _router;
        emit BridgeRouterSet(_router);
    }

    /**
     * @notice Set the local FundraiserFactory address
     */
    function setLocalFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Invalid factory");
        localFundraiserFactory = _factory;
    }

    /**
     * @notice Map a LayerZero EID to a standard chain ID
     * @param _eid LayerZero endpoint ID
     * @param _chainId Standard chain ID
     */
    function setEidChainId(uint32 _eid, uint256 _chainId) external onlyOwner {
        eidToChainId[_eid] = _chainId;
        emit EidChainIdMapped(_eid, _chainId);
    }

    function emergencyWithdraw(address _token) external onlyOwner {
        if (_token == address(0)) {
            uint256 bal = address(this).balance;
            payable(owner()).transfer(bal);
            emit EmergencyWithdraw(address(0), bal, owner());
        } else {
            uint256 balance = IERC20(_token).balanceOf(address(this));
            IERC20(_token).safeTransfer(owner(), balance);
            emit EmergencyWithdraw(_token, balance, owner());
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}
