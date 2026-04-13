// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BridgeRouter
 * @author FundBrave Team
 * @notice Unified entry point that routes cross-chain messages from both
 *         LayerZero (EVM chains + RSK) and Wormhole (Solana) to the FundraiserFactory.
 * @dev Implements rate limiting per chain, circuit breaker for emergency halts,
 *      and normalizes payloads from different bridge protocols to a common format.
 *
 * Architecture:
 *   LayerZero V2 (FundBraveBridge) ──→ BridgeRouter ──→ FundraiserFactory
 *   Wormhole (WormholeReceiver)    ──→ BridgeRouter ──→ FundraiserFactory
 */
contract BridgeRouter is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    /// @notice Cross-chain action types
    enum Action {
        Donate,        // 0
        Stake,         // 1
        WealthBuild    // 2
    }

    /// @notice Bridge protocol source
    enum BridgeProtocol {
        LayerZero,     // 0
        Wormhole       // 1
    }

    // ============ Structs ============

    /// @notice Normalized cross-chain message format
    struct CrossChainMessage {
        address donor;
        uint256 fundraiserId;
        Action action;
        uint256 usdcAmount;
        uint256 sourceChainId;
        BridgeProtocol protocol;
    }

    /// @notice Rate limit configuration per chain
    struct RateLimitConfig {
        uint256 maxAmountPerWindow;   // Max USDC amount per time window
        uint256 windowDuration;       // Time window in seconds
        uint256 currentWindowAmount;  // Amount processed in current window
        uint256 windowStart;          // Start of current window
        bool enabled;                 // Whether rate limiting is active for this chain
    }

    /// @notice Chain metadata
    struct ChainInfo {
        string name;
        BridgeProtocol protocol;
        bool supported;
    }

    // ============ State Variables ============

    /// @notice Address of the FundraiserFactory on Base
    address public fundraiserFactory;

    /// @notice USDC token on Base
    IERC20 public immutable usdcToken;

    /// @notice Authorized bridge senders (FundBraveBridge and WormholeReceiver)
    mapping(address => bool) public authorizedBridges;

    /// @notice Rate limit config per source chain ID
    mapping(uint256 => RateLimitConfig) public rateLimits;

    /// @notice Chain metadata registry
    mapping(uint256 => ChainInfo) public supportedChains;

    /// @notice Circuit breaker state
    bool public circuitBreakerTripped;

    /// @notice Total volume processed per chain
    mapping(uint256 => uint256) public chainVolume;

    /// @notice Total messages processed per chain
    mapping(uint256 => uint256) public chainMessageCount;

    /// @notice Global statistics
    uint256 public totalRoutedMessages;
    uint256 public totalRoutedVolumeUSDC;

    // ============ Events ============

    event MessageRouted(
        address indexed donor,
        uint256 indexed fundraiserId,
        Action action,
        uint256 usdcAmount,
        uint256 sourceChainId,
        BridgeProtocol protocol
    );
    event BridgeAuthorized(address indexed bridge, bool authorized);
    event ChainRegistered(uint256 indexed chainId, string name, BridgeProtocol protocol);
    event RateLimitSet(uint256 indexed chainId, uint256 maxAmount, uint256 windowDuration);
    event CircuitBreakerTripped(address indexed triggeredBy);
    event CircuitBreakerReset(address indexed resetBy);
    event FactoryUpdated(address indexed newFactory);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);

    // ============ Custom Errors ============

    error UnauthorizedBridge();
    error CircuitBreakerActive();
    error UnsupportedChain();
    error RateLimitExceeded();
    error InvalidFactory();
    error ZeroAmount();
    error FactoryCallFailed();

    // ============ Constructor ============

    constructor(
        address _usdcToken,
        address _fundraiserFactory,
        address _owner
    ) Ownable(_owner) {
        require(_usdcToken != address(0), "Invalid USDC");
        usdcToken = IERC20(_usdcToken);
        fundraiserFactory = _fundraiserFactory;

        // Register default supported chains
        _registerChain(84532, "Base Sepolia", BridgeProtocol.LayerZero);    // Base Sepolia testnet
        _registerChain(8453, "Base", BridgeProtocol.LayerZero);             // Base mainnet
        _registerChain(1, "Ethereum", BridgeProtocol.LayerZero);            // Ethereum
        _registerChain(137, "Polygon", BridgeProtocol.LayerZero);           // Polygon
        _registerChain(42161, "Arbitrum", BridgeProtocol.LayerZero);        // Arbitrum
        _registerChain(10, "Optimism", BridgeProtocol.LayerZero);           // Optimism
        _registerChain(30, "RSK", BridgeProtocol.LayerZero);                // RSK mainnet
        _registerChain(31, "RSK Testnet", BridgeProtocol.LayerZero);        // RSK testnet
        _registerChain(1399811149, "Solana", BridgeProtocol.Wormhole);      // Solana (Wormhole chain ID)
    }

    // ============ Modifiers ============

    modifier onlyAuthorizedBridge() {
        if (!authorizedBridges[msg.sender]) revert UnauthorizedBridge();
        _;
    }

    modifier circuitBreakerNotTripped() {
        if (circuitBreakerTripped) revert CircuitBreakerActive();
        _;
    }

    // ============ Core Routing Function ============

    /**
     * @notice Routes a cross-chain message to the FundraiserFactory
     * @dev Called by authorized bridges (FundBraveBridge or WormholeReceiver)
     *      USDC must already be transferred to this contract before calling.
     * @param message The normalized cross-chain message
     */
    function routeMessage(CrossChainMessage calldata message)
        external
        nonReentrant
        whenNotPaused
        onlyAuthorizedBridge
        circuitBreakerNotTripped
    {
        if (message.usdcAmount == 0) revert ZeroAmount();
        if (!supportedChains[message.sourceChainId].supported) revert UnsupportedChain();

        // Check rate limit
        _checkRateLimit(message.sourceChainId, message.usdcAmount);

        // Transfer USDC to factory
        usdcToken.safeTransfer(fundraiserFactory, message.usdcAmount);

        // Compute message hash for replay protection (handled by factory)
        bytes32 messageHash = keccak256(abi.encodePacked(
            message.donor,
            message.fundraiserId,
            message.usdcAmount,
            message.sourceChainId,
            block.chainid,
            uint8(message.action)
        ));

        // Route to appropriate factory handler
        bool success;
        if (message.action == Action.Donate) {
            (success, ) = fundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainDonation(address,uint256,uint256,bytes32,uint32)",
                    message.donor,
                    message.fundraiserId,
                    message.usdcAmount,
                    messageHash,
                    uint32(message.sourceChainId)
                )
            );
        } else if (message.action == Action.Stake) {
            (success, ) = fundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainStake(address,uint256,uint256,bytes32,uint32)",
                    message.donor,
                    message.fundraiserId,
                    message.usdcAmount,
                    messageHash,
                    uint32(message.sourceChainId)
                )
            );
        } else if (message.action == Action.WealthBuild) {
            (success, ) = fundraiserFactory.call(
                abi.encodeWithSignature(
                    "handleCrossChainWealthBuilding(address,uint256,uint256,bytes32,uint32)",
                    message.donor,
                    message.fundraiserId,
                    message.usdcAmount,
                    messageHash,
                    uint32(message.sourceChainId)
                )
            );
        }

        if (!success) revert FactoryCallFailed();

        // Update statistics
        chainVolume[message.sourceChainId] += message.usdcAmount;
        chainMessageCount[message.sourceChainId]++;
        totalRoutedMessages++;
        totalRoutedVolumeUSDC += message.usdcAmount;

        emit MessageRouted(
            message.donor,
            message.fundraiserId,
            message.action,
            message.usdcAmount,
            message.sourceChainId,
            message.protocol
        );
    }

    // ============ Rate Limiting ============

    /**
     * @dev Checks and updates rate limit for a source chain
     */
    function _checkRateLimit(uint256 chainId, uint256 amount) internal {
        RateLimitConfig storage config = rateLimits[chainId];
        if (!config.enabled) return;

        // Reset window if expired
        if (block.timestamp >= config.windowStart + config.windowDuration) {
            config.windowStart = block.timestamp;
            config.currentWindowAmount = 0;
        }

        if (config.currentWindowAmount + amount > config.maxAmountPerWindow) {
            revert RateLimitExceeded();
        }

        config.currentWindowAmount += amount;
    }

    /**
     * @notice Set rate limit for a chain
     * @param chainId Source chain ID
     * @param maxAmount Max USDC amount per window (6 decimals)
     * @param windowDuration Time window in seconds
     */
    function setRateLimit(
        uint256 chainId,
        uint256 maxAmount,
        uint256 windowDuration
    ) external onlyOwner {
        rateLimits[chainId] = RateLimitConfig({
            maxAmountPerWindow: maxAmount,
            windowDuration: windowDuration,
            currentWindowAmount: 0,
            windowStart: block.timestamp,
            enabled: maxAmount > 0
        });
        emit RateLimitSet(chainId, maxAmount, windowDuration);
    }

    // ============ Circuit Breaker ============

    /**
     * @notice Trip the circuit breaker - halts all message routing
     * @dev Can be called by owner in case of anomalous bridge activity
     */
    function tripCircuitBreaker() external onlyOwner {
        circuitBreakerTripped = true;
        emit CircuitBreakerTripped(msg.sender);
    }

    /**
     * @notice Reset the circuit breaker - resumes message routing
     * @dev Only owner can reset after investigation
     */
    function resetCircuitBreaker() external onlyOwner {
        circuitBreakerTripped = false;
        emit CircuitBreakerReset(msg.sender);
    }

    // ============ Admin Functions ============

    /**
     * @notice Authorize or deauthorize a bridge contract
     * @param bridge Address of the bridge contract
     * @param authorized Whether to authorize or deauthorize
     */
    function setAuthorizedBridge(address bridge, bool authorized) external onlyOwner {
        authorizedBridges[bridge] = authorized;
        emit BridgeAuthorized(bridge, authorized);
    }

    /**
     * @notice Register a new supported chain
     * @param chainId Chain ID to register
     * @param name Human-readable chain name
     * @param protocol Bridge protocol for this chain
     */
    function registerChain(
        uint256 chainId,
        string calldata name,
        BridgeProtocol protocol
    ) external onlyOwner {
        _registerChain(chainId, name, protocol);
    }

    function _registerChain(
        uint256 chainId,
        string memory name,
        BridgeProtocol protocol
    ) internal {
        supportedChains[chainId] = ChainInfo({
            name: name,
            protocol: protocol,
            supported: true
        });
        emit ChainRegistered(chainId, name, protocol);
    }

    /**
     * @notice Remove chain support
     */
    function removeChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId].supported = false;
    }

    /**
     * @notice Update the FundraiserFactory address
     */
    function setFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert InvalidFactory();
        fundraiserFactory = _factory;
        emit FactoryUpdated(_factory);
    }

    /**
     * @notice Emergency withdraw stuck tokens
     */
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            uint256 balance = address(this).balance;
            payable(owner()).transfer(balance);
            emit EmergencyWithdraw(address(0), balance, owner());
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransfer(owner(), balance);
            emit EmergencyWithdraw(token, balance, owner());
        }
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ============ View Functions ============

    /**
     * @notice Get chain info for a given chain ID
     */
    function getChainInfo(uint256 chainId)
        external
        view
        returns (string memory name, BridgeProtocol protocol, bool supported)
    {
        ChainInfo storage info = supportedChains[chainId];
        return (info.name, info.protocol, info.supported);
    }

    /**
     * @notice Get remaining rate limit for a chain in the current window
     */
    function getRemainingRateLimit(uint256 chainId) external view returns (uint256) {
        RateLimitConfig storage config = rateLimits[chainId];
        if (!config.enabled) return type(uint256).max;

        if (block.timestamp >= config.windowStart + config.windowDuration) {
            return config.maxAmountPerWindow;
        }

        if (config.currentWindowAmount >= config.maxAmountPerWindow) return 0;
        return config.maxAmountPerWindow - config.currentWindowAmount;
    }

    receive() external payable {}
}
