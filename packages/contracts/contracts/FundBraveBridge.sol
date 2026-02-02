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
 * @notice Sends Tokens + Data (Action: Donate/Stake) across chains.
 * @dev Implements OApp for messaging.
 */
contract FundBraveBridge is OApp, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using OptionsBuilder for bytes;

    ISwapAdapter public immutable swapAdapter;
    IERC20 public immutable usdcToken;
    address public immutable localFundraiserFactory;

    // Mapping of Chain ID (LayerZero EID) to Factory Address on that chain
    mapping(uint32 => address) public peerFactories;

    // Statistics
    uint256 public totalCrossChainTx;
    uint256 public totalCrossChainVolumeUSDC;

    event CrossChainActionSent(uint32 indexed dstEid, bytes32 guid, uint256 amountUSDC, uint8 action);
    event CrossChainActionReceived(uint32 indexed srcEid, address indexed donor, uint256 amount);
    event PeerFactorySet(uint32 indexed eid, address factory);
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
    }

    // --- Main User Function ---

    function sendCrossChainAction(
        uint32 _dstEid,
        uint256 _fundraiserId,
        uint8 _action, // 0=Donate, 1=Stake
        address _tokenIn,
        uint256 _amountIn
    ) external payable nonReentrant whenNotPaused {
        require(_amountIn > 0, "Amount must be > 0");
        
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
        // Uses OptionsBuilder manually
        bytes memory _options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200000, 0);

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

    function quoteCrossChainAction(
        uint32 _dstEid,
        uint256 _fundraiserId,
        uint8 _action,
        uint256 _usdcAmount
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory _payload = abi.encode(msg.sender, _fundraiserId, _action, _usdcAmount);
        bytes memory _options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200000, 0);
        
        MessagingFee memory fee = _quote(_dstEid, _payload, _options, false);
        return (fee.nativeFee, fee.lzTokenFee);
    }

    // --- Internal LayerZero Handler ---

    /**
     * @notice Handles incoming cross-chain messages from LayerZero
     * @dev Computes a secure message hash including source chain ID to prevent replay attacks.
     *      The message hash is verified by the factory to ensure message integrity.
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

        usdcToken.safeTransfer(localFundraiserFactory, amount);

        // Compute message hash for replay attack protection
        // Includes source chain ID (srcEid) and destination chain ID (block.chainid)
        bytes32 messageHash = keccak256(abi.encodePacked(
            donor,
            fundraiserId,
            amount,
            _origin.srcEid,
            block.chainid,
            action
        ));

        bool success;
        if (action == 0) {
            // Call secure donation handler with message hash
            (success, ) = localFundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainDonation(address,uint256,uint256,bytes32,uint32)",
                    donor, fundraiserId, amount, messageHash, _origin.srcEid
                )
            );
        } else {
            // Call secure stake handler with message hash
            (success, ) = localFundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainStake(address,uint256,uint256,bytes32,uint32)",
                    donor, fundraiserId, amount, messageHash, _origin.srcEid
                )
            );
        }

        require(success, "Factory execution failed");
        emit CrossChainActionReceived(_origin.srcEid, donor, amount);
    }

    // --- Admin & Safety Functions ---

    function setPeerFactory(uint32 _eid, address _factory) external onlyOwner {
        peerFactories[_eid] = _factory;
        emit PeerFactorySet(_eid, _factory);
    }

    function emergencyWithdraw(address _token) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(address(this).balance);
            emit EmergencyWithdraw(address(0), address(this).balance, owner());
        } else {
            uint256 balance = IERC20(_token).balanceOf(address(this));
            IERC20(_token).safeTransfer(owner(), balance);
            emit EmergencyWithdraw(_token, balance, owner());
        }
    }

    /**
     * @notice Pause the bridge in case of emergency
     * @dev Only owner can pause. Prevents new cross-chain transactions.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the bridge after emergency is resolved
     * @dev Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}