// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockStockSwapAdapter
 * @notice Mock swap adapter for testing WealthBuildingDonation
 * @dev Simulates swapping USDC to tokenized stocks with 1:1 ratio adjusted for decimals
 */
contract MockStockSwapAdapter {
    using SafeERC20 for IERC20;

    address public immutable USDC;

    mapping(address => bool) public isTokenSupported;
    mapping(address => uint8) public tokenDecimals;
    address[] public supportedTokens;

    event SwapExecuted(
        address indexed tokenOut,
        uint256 usdcAmountIn,
        uint256 amountOut,
        address indexed recipient
    );

    constructor(address _usdc) {
        USDC = _usdc;
    }

    /**
     * @notice Add a supported token
     * @param token Token address
     * @param decimals Token decimals
     */
    function addSupportedToken(address token, uint8 decimals) external {
        if (!isTokenSupported[token]) {
            supportedTokens.push(token);
        }
        isTokenSupported[token] = true;
        tokenDecimals[token] = decimals;
    }

    /**
     * @notice Mock swap USDC to token
     * @dev Assumes 1:1 price ratio, adjusted for decimals
     * @param tokenOut Target token
     * @param usdcAmountIn USDC amount
     * @param minAmountOut Minimum output (slippage protection)
     * @return amountOut Amount of tokens returned
     */
    function swapUSDCToToken(
        address tokenOut,
        uint256 usdcAmountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(isTokenSupported[tokenOut], "Token not supported");
        require(usdcAmountIn > 0, "Zero amount");

        // Transfer USDC from caller
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), usdcAmountIn);

        // Calculate output based on decimals (1:1 ratio)
        // USDC has 6 decimals, stocks typically have 18
        uint8 usdcDecimals = 6;
        uint8 targetDecimals = tokenDecimals[tokenOut];

        if (targetDecimals >= usdcDecimals) {
            amountOut = usdcAmountIn * (10 ** (targetDecimals - usdcDecimals));
        } else {
            amountOut = usdcAmountIn / (10 ** (usdcDecimals - targetDecimals));
        }

        require(amountOut >= minAmountOut, "Slippage exceeded");

        // Transfer stock tokens to caller
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        emit SwapExecuted(tokenOut, usdcAmountIn, amountOut, msg.sender);

        return amountOut;
    }

    /**
     * @notice Get quote for swap
     * @param tokenOut Target token
     * @param usdcAmountIn USDC amount
     * @return expectedOut Expected output
     */
    function getQuote(
        address tokenOut,
        uint256 usdcAmountIn
    ) external view returns (uint256 expectedOut) {
        if (!isTokenSupported[tokenOut] || usdcAmountIn == 0) {
            return 0;
        }

        uint8 usdcDecimals = 6;
        uint8 targetDecimals = tokenDecimals[tokenOut];

        if (targetDecimals >= usdcDecimals) {
            expectedOut = usdcAmountIn * (10 ** (targetDecimals - usdcDecimals));
        } else {
            expectedOut = usdcAmountIn / (10 ** (usdcDecimals - targetDecimals));
        }

        return expectedOut;
    }

    /**
     * @notice Get USDC address
     */
    function getUSDC() external view returns (address) {
        return USDC;
    }

    /**
     * @notice Get supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
}
