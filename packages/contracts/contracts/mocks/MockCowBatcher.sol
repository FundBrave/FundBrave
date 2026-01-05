// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockCowBatcher
 * @notice Mock CoW Protocol batcher for testing
 */
contract MockCowBatcher {
    address public immutable USDC;

    constructor(address _usdc) {
        USDC = _usdc;
    }

    function sell(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 minBuyAmount,
        uint32,
        bytes32,
        uint256
    ) external returns (uint256) {
        // Simple mock: return minBuyAmount
        // In real implementation, would execute swap
        require(buyToken == USDC, "Only USDC supported");

        // Transfer sell token from sender
        IERC20(sellToken).transferFrom(msg.sender, address(this), sellAmount);

        // Return minimum expected amount
        return minBuyAmount;
    }
}
