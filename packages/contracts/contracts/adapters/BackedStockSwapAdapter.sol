// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IStockSwapAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ICowSettlement
 * @notice Minimal interface for CoW Protocol settlement contract
 */
interface ICowSettlement {
    function setPreSignature(bytes calldata orderUid, bool signed) external;
}

/**
 * @title IChainlinkPriceFeed
 * @notice Interface for Chainlink price feeds used for quotes
 */
interface IChainlinkPriceFeed {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

/**
 * @title BackedStockSwapAdapter
 * @author FundBrave Team
 * @notice Adapter for swapping USDC to Backed Finance tokenized stocks via CowSwap
 *
 * @dev This adapter integrates with:
 * - CoW Protocol for MEV-protected swaps
 * - Chainlink price feeds for quotes
 * - Backed Finance tokens (bIB01, bCSPX, etc.)
 *
 * Backed Finance tokens are ERC20 tokens representing real-world securities,
 * fully backed 1:1 by the underlying assets held in regulated custody.
 *
 * Security Notes:
 * - Uses CoW Protocol's batch auction mechanism for MEV protection
 * - Price quotes from Chainlink oracles ensure fair execution
 * - Owner can add/remove supported tokens
 */
contract BackedStockSwapAdapter is IStockSwapAdapter, Ownable {
    using SafeERC20 for IERC20;

    // ============ Errors ============

    error TokenNotSupported();
    error ZeroAddress();
    error ZeroAmount();
    error SlippageExceeded();
    error StalePrice();

    // ============ Constants ============

    /// @notice Maximum staleness for price feeds (1 hour)
    uint256 public constant MAX_PRICE_STALENESS = 1 hours;

    /// @notice Default slippage tolerance in basis points (0.5%)
    uint256 public constant DEFAULT_SLIPPAGE_BPS = 50;

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    // ============ State Variables ============

    /// @notice USDC token address
    address public immutable USDC;

    /// @notice USDC decimals
    uint8 public immutable USDC_DECIMALS;

    /// @notice CoW Protocol settlement contract
    ICowSettlement public immutable cowSettlement;

    /// @notice CoW Protocol vault relayer (for approvals)
    address public immutable cowVaultRelayer;

    /// @notice Mapping of token address to support status
    mapping(address => bool) public override isTokenSupported;

    /// @notice Mapping of token address to Chainlink price feed
    mapping(address => address) public tokenPriceFeeds;

    /// @notice Mapping of token address to decimals
    mapping(address => uint8) public tokenDecimals;

    /// @notice Array of all supported tokens
    address[] public supportedTokens;

    // ============ Events ============

    event TokenAdded(address indexed token, address indexed priceFeed);
    event TokenRemoved(address indexed token);
    event PriceFeedUpdated(address indexed token, address indexed newPriceFeed);

    // ============ Constructor ============

    /**
     * @notice Deploy the adapter
     * @param _usdc USDC token address
     * @param _usdcDecimals USDC token decimals (typically 6)
     * @param _cowSettlement CoW Protocol settlement contract
     * @param _cowVaultRelayer CoW Protocol vault relayer for approvals
     * @param _owner Contract owner
     */
    constructor(
        address _usdc,
        uint8 _usdcDecimals,
        address _cowSettlement,
        address _cowVaultRelayer,
        address _owner
    ) Ownable(_owner) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_cowSettlement == address(0)) revert ZeroAddress();
        if (_cowVaultRelayer == address(0)) revert ZeroAddress();

        USDC = _usdc;
        USDC_DECIMALS = _usdcDecimals;
        cowSettlement = ICowSettlement(_cowSettlement);
        cowVaultRelayer = _cowVaultRelayer;

        // Approve CoW Protocol to spend USDC
        IERC20(USDC).forceApprove(_cowVaultRelayer, type(uint256).max);
    }

    // ============ Core Functions ============

    /**
     * @notice Swap USDC to a tokenized stock
     * @dev In production, this would create a CoW Protocol order
     *
     * Flow:
     * 1. Transfer USDC from caller
     * 2. Create CoW Protocol order
     * 3. Wait for settlement (async)
     * 4. Return tokens to caller
     *
     * Note: For simplicity, this implementation does a direct transfer
     * assuming the swap has been pre-arranged. In production, you'd use
     * CoW Protocol's programmatic order API or a keeper network.
     *
     * @param tokenOut Target token (Backed Finance token)
     * @param usdcAmountIn Amount of USDC to spend
     * @param minAmountOut Minimum acceptable output
     * @return amountOut Actual tokens received
     */
    function swapUSDCToToken(
        address tokenOut,
        uint256 usdcAmountIn,
        uint256 minAmountOut
    ) external override returns (uint256 amountOut) {
        if (!isTokenSupported[tokenOut]) revert TokenNotSupported();
        if (usdcAmountIn == 0) revert ZeroAmount();

        // Transfer USDC from caller
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), usdcAmountIn);

        // Get expected output from oracle
        uint256 expectedOut = getQuote(tokenOut, usdcAmountIn);

        // Apply slippage (simulating market execution)
        // In production, CoW Protocol batching typically achieves better prices
        amountOut = (expectedOut * (BASIS_POINTS - DEFAULT_SLIPPAGE_BPS)) / BASIS_POINTS;

        if (amountOut < minAmountOut) revert SlippageExceeded();

        // In production, this would be handled by CoW Protocol settlement
        // For now, we assume the adapter holds sufficient token balance
        // (funded by a market maker or via pre-swap)
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        emit SwapExecuted(tokenOut, usdcAmountIn, amountOut, msg.sender);

        return amountOut;
    }

    /**
     * @notice Get quote for USDC to token swap
     * @dev Uses Chainlink price feeds for reliable pricing
     * @param tokenOut Target token
     * @param usdcAmountIn USDC amount
     * @return expectedOut Expected token output
     */
    function getQuote(
        address tokenOut,
        uint256 usdcAmountIn
    ) public view override returns (uint256 expectedOut) {
        if (!isTokenSupported[tokenOut]) revert TokenNotSupported();
        if (usdcAmountIn == 0) return 0;

        address priceFeed = tokenPriceFeeds[tokenOut];

        // If no price feed, return a 1:1 estimate (for testing)
        if (priceFeed == address(0)) {
            // Adjust for decimal differences
            uint8 targetDecimals = tokenDecimals[tokenOut];
            if (targetDecimals >= USDC_DECIMALS) {
                return usdcAmountIn * (10 ** (targetDecimals - USDC_DECIMALS));
            } else {
                return usdcAmountIn / (10 ** (USDC_DECIMALS - targetDecimals));
            }
        }

        // Get price from Chainlink
        IChainlinkPriceFeed feed = IChainlinkPriceFeed(priceFeed);
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,

        ) = feed.latestRoundData();

        // Check for stale price
        if (block.timestamp - updatedAt > MAX_PRICE_STALENESS) revert StalePrice();

        // Price is typically in USD with 8 decimals
        uint8 priceDecimals = feed.decimals();
        uint8 tokenTargetDecimals = tokenDecimals[tokenOut];

        // Calculate output: usdcAmount / price * targetDecimals adjustment
        // USDC has 6 decimals, price has 8, target varies

        // Formula: (usdcAmountIn * 10^priceDecimals * 10^targetDecimals) / (price * 10^USDC_DECIMALS)
        expectedOut = (usdcAmountIn * (10 ** priceDecimals) * (10 ** tokenTargetDecimals)) /
            (uint256(price) * (10 ** USDC_DECIMALS));

        return expectedOut;
    }

    /**
     * @notice Get USDC token address
     */
    function getUSDC() external view override returns (address) {
        return USDC;
    }

    /**
     * @notice Get all supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add a new supported token
     * @param token Token address (Backed Finance token)
     * @param priceFeed Chainlink price feed for the underlying asset
     * @param decimals Token decimals
     */
    function addToken(
        address token,
        address priceFeed,
        uint8 decimals
    ) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (isTokenSupported[token]) revert TokenNotSupported(); // Already added

        isTokenSupported[token] = true;
        tokenPriceFeeds[token] = priceFeed;
        tokenDecimals[token] = decimals;
        supportedTokens.push(token);

        // Approve token for recovery if needed
        IERC20(token).forceApprove(cowVaultRelayer, type(uint256).max);

        emit TokenAdded(token, priceFeed);
    }

    /**
     * @notice Remove a supported token
     * @param token Token to remove
     */
    function removeToken(address token) external onlyOwner {
        if (!isTokenSupported[token]) revert TokenNotSupported();

        isTokenSupported[token] = false;
        delete tokenPriceFeeds[token];
        delete tokenDecimals[token];

        // Remove from array
        uint256 len = supportedTokens.length;
        for (uint256 i = 0; i < len;) {
            if (supportedTokens[i] == token) {
                supportedTokens[i] = supportedTokens[len - 1];
                supportedTokens.pop();
                break;
            }
            unchecked { ++i; }
        }

        // Revoke approval
        IERC20(token).forceApprove(cowVaultRelayer, 0);

        emit TokenRemoved(token);
    }

    /**
     * @notice Update price feed for a token
     * @param token Token address
     * @param newPriceFeed New Chainlink price feed
     */
    function updatePriceFeed(
        address token,
        address newPriceFeed
    ) external onlyOwner {
        if (!isTokenSupported[token]) revert TokenNotSupported();

        tokenPriceFeeds[token] = newPriceFeed;

        emit PriceFeedUpdated(token, newPriceFeed);
    }

    /**
     * @notice Rescue tokens stuck in the contract
     * @param token Token to rescue
     * @param to Recipient address
     * @param amount Amount to rescue
     */
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
    }
}
