// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IMockERC20 {
    function mint(address to, uint256 amount) external;
    function decimals() external view returns (uint8);
}

/**
 * @title MockSwapAdapter
 * @notice Mock swap adapter for testing multi-currency donations/staking.
 * @dev Simulates token swaps at 1:1 ratio (adjusted for decimals).
 *      When a non-USDC token is swapped, this adapter:
 *      1. Takes the input token from the caller
 *      2. Mints equivalent USDC to the caller (since this is a test mock)
 *
 *      In production, this would route through Uniswap/1inch/CowSwap.
 */
contract MockSwapAdapter {
    using SafeERC20 for IERC20;

    address public immutable USDC;
    uint8 public immutable usdcDecimals;

    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _usdc) {
        USDC = _usdc;
        usdcDecimals = IMockERC20(_usdc).decimals();
    }

    /**
     * @notice Swaps any ERC20 token to USDC (mock: 1:1 ratio with decimal adjustment)
     * @param tokenIn Address of the input token
     * @param amountIn Amount of input token
     * @return usdcAmountOut Amount of USDC received
     */
    function swapToUSDT(address tokenIn, uint256 amountIn) external returns (uint256 usdcAmountOut) {
        // If already USDC, just return
        if (tokenIn == USDC) {
            return amountIn;
        }

        // Take input tokens from caller
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Calculate USDC output with decimal adjustment
        uint8 tokenDecimals = IMockERC20(tokenIn).decimals();
        if (tokenDecimals > usdcDecimals) {
            usdcAmountOut = amountIn / (10 ** (tokenDecimals - usdcDecimals));
        } else if (tokenDecimals < usdcDecimals) {
            usdcAmountOut = amountIn * (10 ** (usdcDecimals - tokenDecimals));
        } else {
            usdcAmountOut = amountIn;
        }

        require(usdcAmountOut > 0, "MockSwapAdapter: Zero output");

        // Mint equivalent USDC to caller (mock behavior)
        IMockERC20(USDC).mint(msg.sender, usdcAmountOut);

        emit SwapExecuted(tokenIn, USDC, amountIn, usdcAmountOut);
        return usdcAmountOut;
    }

    /**
     * @notice Swaps native ETH to USDC (mock: converts at 1 ETH = 2000 USDC for testing)
     * @return usdcAmountOut Amount of USDC received
     */
    function swapNativeToUSDT() external payable returns (uint256 usdcAmountOut) {
        require(msg.value > 0, "MockSwapAdapter: No ETH sent");

        // Mock rate: 1 ETH (18 decimals) = 2000 USDC (6 decimals)
        // This gives a realistic testing scenario
        usdcAmountOut = (msg.value * 2000) / 1e12; // Convert 18 dec to 6 dec with 2000x rate

        require(usdcAmountOut > 0, "MockSwapAdapter: Zero output");

        // Mint equivalent USDC to caller
        IMockERC20(USDC).mint(msg.sender, usdcAmountOut);

        emit SwapExecuted(address(0), USDC, msg.value, usdcAmountOut);
        return usdcAmountOut;
    }
}
