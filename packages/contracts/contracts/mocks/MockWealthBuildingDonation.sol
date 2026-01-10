// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockWealthBuildingDonation
 * @notice Mock WealthBuildingDonation for testing PlatformTreasury
 */
contract MockWealthBuildingDonation {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;

    mapping(uint256 => address) public fundraiserBeneficiary;
    mapping(address => mapping(uint256 => uint256)) public endowmentPrincipal;
    mapping(address => mapping(uint256 => uint256)) public lifetimeYield;

    constructor(address _usdc) {
        USDC = IERC20(_usdc);
    }

    function donate(
        address donor,
        uint256 fundraiserId,
        uint256 amount,
        address beneficiary
    ) external returns (uint256 directAmount, uint256 endowmentAmount) {
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // 78% direct, 20% endowment, 2% platform fee (for simplicity)
        directAmount = (amount * 7800) / 10000;
        endowmentAmount = (amount * 2000) / 10000;

        // Track endowment
        endowmentPrincipal[donor][fundraiserId] += endowmentAmount;

        // Return direct amount to beneficiary
        USDC.safeTransfer(beneficiary, directAmount);

        return (directAmount, endowmentAmount);
    }

    function harvestYield(address donor, uint256 fundraiserId) external {
        // Mock: do nothing, yield already tracked
    }

    function getPendingYield(
        address donor,
        uint256 fundraiserId
    ) external view returns (uint256 causeYield, uint256 donorYield) {
        // Mock: return zero
        return (0, 0);
    }

    function getEndowmentInfo(
        address donor,
        uint256 fundraiserId
    ) external view returns (
        uint256 principal,
        uint256 _lifetimeYield,
        uint256,
        uint256,
        uint256
    ) {
        principal = endowmentPrincipal[donor][fundraiserId];
        _lifetimeYield = lifetimeYield[donor][fundraiserId];
        return (principal, _lifetimeYield, 0, 0, 0);
    }

    function registerFundraiser(uint256 fundraiserId, address beneficiary) external {
        fundraiserBeneficiary[fundraiserId] = beneficiary;
    }
}
