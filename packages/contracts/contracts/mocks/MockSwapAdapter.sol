// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockSwapAdapter
 * @notice Mock swap adapter for testing
 */
contract MockSwapAdapter {
    using SafeERC20 for IERC20;

    address public immutable USDC;

    constructor(address _usdc) {
        USDC = _usdc;
    }

    function swapToUSDT(address tokenIn, uint256 amountIn) external returns (uint256) {
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Return same amount for simplicity (1:1 swap)
        return amountIn;
    }

    function swapNativeToUSDT() external payable returns (uint256) {
        // Return msg.value as USDC amount (simplified)
        return msg.value / 1e12; // Convert 18 decimals to 6 decimals
    }
}
