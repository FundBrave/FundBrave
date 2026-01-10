// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStockSwapAdapter
 * @author FundBrave Team
 * @notice Interface for swapping USDC to tokenized stocks (Backed Finance tokens)
 * @dev Implementations should integrate with DEX aggregators (CowSwap, 1inch) for best execution
 *
 * Backed Finance Tokens:
 * - bIB01: iShares $ Treasury Bond 0-1yr UCITS ETF
 * - bCSPX: iShares Core S&P 500 UCITS ETF
 * - bC3M: iShares $ Treasury Bond 0-3 month UCITS ETF
 * - bCOIN: Coinbase Global Inc.
 * - And more tokenized securities
 *
 * Usage:
 * 1. Approve adapter to spend USDC
 * 2. Call swapUSDCToToken with target stock and amount
 * 3. Receive tokenized stocks in return
 */
interface IStockSwapAdapter {
    // ============ Events ============

    /**
     * @notice Emitted when a swap is executed
     * @param tokenOut Target token received
     * @param usdcAmountIn USDC amount spent
     * @param amountOut Amount of target token received
     * @param recipient Address receiving the tokens
     */
    event SwapExecuted(
        address indexed tokenOut,
        uint256 usdcAmountIn,
        uint256 amountOut,
        address indexed recipient
    );

    // ============ Core Functions ============

    /**
     * @notice Swaps USDC to a target token (e.g., Backed Finance tokenized stocks)
     * @dev The adapter MUST be approved to spend USDC before calling
     * @param tokenOut The target token to receive (e.g., bCSPX, bIB01)
     * @param usdcAmountIn Amount of USDC to swap
     * @param minAmountOut Minimum amount of tokenOut to receive (slippage protection)
     * @return amountOut Actual amount of tokenOut received
     */
    function swapUSDCToToken(
        address tokenOut,
        uint256 usdcAmountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);

    /**
     * @notice Gets a quote for swapping USDC to a target token
     * @dev Returns expected output for slippage calculations
     * @param tokenOut The target token address
     * @param usdcAmountIn Amount of USDC to swap
     * @return expectedOut Expected amount of tokenOut (before slippage)
     */
    function getQuote(
        address tokenOut,
        uint256 usdcAmountIn
    ) external view returns (uint256 expectedOut);

    /**
     * @notice Checks if a token is supported for swaps
     * @param token The token address to check
     * @return True if token is supported
     */
    function isTokenSupported(address token) external view returns (bool);

    /**
     * @notice Gets the USDC token address used by this adapter
     * @return USDC token address
     */
    function getUSDC() external view returns (address);
}
