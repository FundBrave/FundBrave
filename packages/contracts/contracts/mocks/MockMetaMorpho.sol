// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockMetaMorpho
 * @notice Mock Morpho MetaMorpho vault for testing
 */
contract MockMetaMorpho {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    mapping(address => uint256) public shares;
    uint256 public totalShares;
    uint256 public totalAssets;

    constructor(address _asset) {
        asset = IERC20(_asset);
    }

    function deposit(uint256 assets, address receiver) external returns (uint256) {
        asset.safeTransferFrom(msg.sender, address(this), assets);

        uint256 sharesToMint = assets; // 1:1 for simplicity
        shares[receiver] += sharesToMint;
        totalShares += sharesToMint;
        totalAssets += assets;

        return sharesToMint;
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external returns (uint256) {
        require(shares[owner] >= assets, "Insufficient shares");

        shares[owner] -= assets;
        totalShares -= assets;
        totalAssets -= assets;

        asset.safeTransfer(receiver, assets);

        return assets;
    }

    function balanceOf(address account) external view returns (uint256) {
        return shares[account];
    }

    function previewRedeem(uint256 shareAmount) external view returns (uint256) {
        // Calculate proportional assets including yield
        if (totalShares == 0) return 0;
        return (shareAmount * totalAssets) / totalShares;
    }

    function generateYield(uint256 yieldAmount) external {
        // Simulate yield by increasing totalAssets without changing shares
        asset.transfer(address(this), yieldAmount);
        totalAssets += yieldAmount;
    }
}
