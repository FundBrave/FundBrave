// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISwapAdapter.sol";
import "../interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UniswapAdapter
 * @dev Implements our ISwapAdapter for a standard Uniswap V2 router.
 *      Includes slippage protection to prevent sandwich attacks.
 */
contract UniswapAdapter is ISwapAdapter, Ownable {
    using SafeERC20 for IERC20;

    // --- Custom Errors ---
    error SlippageTooHigh(uint256 amountOut, uint256 minExpected);
    error InvalidSlippageTolerance();

    IUniswapRouter public immutable uniswapRouter;
    address public immutable USDT;
    address public immutable WETH;

    /**
     * @notice Default slippage tolerance in basis points (e.g., 500 = 5%)
     * @dev This protects against sandwich attacks and price manipulation
     */
    uint256 public defaultSlippageBps = 500; // 5% default slippage tolerance

    uint256 public constant MAX_SLIPPAGE_BPS = 1000; // 10% max slippage
    uint256 public constant BPS_DENOMINATOR = 10000;

    event SlippageToleranceUpdated(uint256 oldSlippage, uint256 newSlippage);

    constructor(address _router, address _usdt, address _weth, address _owner) Ownable(_owner) {
        uniswapRouter = IUniswapRouter(_router);
        USDT = _usdt;
        WETH = _weth;
    }

    /**
     * @notice Updates the default slippage tolerance
     * @param _slippageBps New slippage tolerance in basis points (max 1000 = 10%)
     * @dev Only callable by owner. Lower values provide more protection but may cause
     *      transactions to fail in volatile markets.
     */
    function setDefaultSlippage(uint256 _slippageBps) external onlyOwner {
        if (_slippageBps > MAX_SLIPPAGE_BPS) revert InvalidSlippageTolerance();
        uint256 oldSlippage = defaultSlippageBps;
        defaultSlippageBps = _slippageBps;
        emit SlippageToleranceUpdated(oldSlippage, _slippageBps);
    }

    /**
     * @notice Swaps an ERC20 token to USDT with default slippage protection
     * @param tokenIn Address of the input token
     * @param amountIn Amount of input tokens to swap
     * @return amountOut Amount of USDT received
     */
    function swapToUSDT(address tokenIn, uint256 amountIn)
        external
        returns (uint256 amountOut)
    {
        return swapToUSDTWithSlippage(tokenIn, amountIn, defaultSlippageBps);
    }

    /**
     * @notice Swaps an ERC20 token to USDT with custom slippage protection
     * @param tokenIn Address of the input token
     * @param amountIn Amount of input tokens to swap
     * @param slippageBps Slippage tolerance in basis points (e.g., 500 = 5%)
     * @return amountOut Amount of USDT received
     * @dev Uses getAmountsOut to calculate expected output and applies slippage tolerance.
     *      This protects against sandwich attacks and front-running.
     */
    function swapToUSDTWithSlippage(
        address tokenIn,
        uint256 amountIn,
        uint256 slippageBps
    ) public returns (uint256 amountOut) {
        if (tokenIn == USDT) return amountIn;
        if (slippageBps > MAX_SLIPPAGE_BPS) revert InvalidSlippageTolerance();

        // 1. Pull tokens from the CALLER (our Factory/Bridge)
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // 2. Approve the *real* router
        IERC20(tokenIn).forceApprove(address(uniswapRouter), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = USDT;

        // 3. Get expected output amount from Uniswap
        uint256[] memory expectedAmounts = uniswapRouter.getAmountsOut(amountIn, path);
        uint256 expectedOutput = expectedAmounts[1];

        // 4. Calculate minimum output with slippage protection
        uint256 amountOutMin = (expectedOutput * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;

        // 5. Swap with slippage protection. Send proceeds back to the CALLER
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        amountOut = amounts[1];

        // Verify output meets minimum (redundant but explicit safety check)
        if (amountOut < amountOutMin) revert SlippageTooHigh(amountOut, amountOutMin);

        return amountOut;
    }

    /**
     * @notice Swaps native ETH to USDT with slippage protection
     * @return amountOut Amount of USDT received
     */
    function swapNativeToUSDT()
        external
        payable
        returns (uint256 amountOut)
    {
        return swapNativeToUSDTWithSlippage(defaultSlippageBps);
    }

    /**
     * @notice Swaps native ETH to USDT with custom slippage protection
     * @param slippageBps Slippage tolerance in basis points
     * @return amountOut Amount of USDT received
     */
    function swapNativeToUSDTWithSlippage(uint256 slippageBps)
        public
        payable
        returns (uint256 amountOut)
    {
        if (slippageBps > MAX_SLIPPAGE_BPS) revert InvalidSlippageTolerance();

        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = USDT;

        // Get expected output amount from Uniswap
        uint256[] memory expectedAmounts = uniswapRouter.getAmountsOut(msg.value, path);
        uint256 expectedOutput = expectedAmounts[1];

        // Calculate minimum output with slippage protection
        uint256 amountOutMin = (expectedOutput * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;

        // Swap with slippage protection. Send proceeds back to the CALLER
        uint256[] memory amounts = uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        amountOut = amounts[1];

        // Verify output meets minimum
        if (amountOut < amountOutMin) revert SlippageTooHigh(amountOut, amountOutMin);

        return amountOut;
    }
}