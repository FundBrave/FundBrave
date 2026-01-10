// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockReceiptOFT
 * @notice Mock receipt token for testing
 */
contract MockReceiptOFT {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function burn(address from, uint256 amount) external {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        totalSupply -= amount;
    }
}
