// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Fundraiser } from "../Fundraiser.sol";

/**
 * @title FundraiserFactoryLib
 * @author FundBrave Team
 * @notice Library containing helper functions for FundraiserFactory
 * @dev Extracted to reduce FundraiserFactory contract size below EIP-170 limit (24 KiB)
 *
 * This library contains:
 * - Validation logic for fundraiser parameters
 * - Search/query helper functions
 * - View function utilities
 */
library FundraiserFactoryLib {
    // ============ Custom Errors ============

    /// @notice Thrown when name length is invalid (empty or > 100 chars)
    error InvalidNameLength();

    /// @notice Thrown when images array is invalid (empty or > 10)
    error InvalidImagesCount();

    /// @notice Thrown when categories array is invalid (empty or > 5)
    error InvalidCategoriesCount();

    /// @notice Thrown when description length is invalid (empty or > 5000 chars)
    error InvalidDescriptionLength();

    /// @notice Thrown when beneficiary address is zero
    error InvalidBeneficiary();

    /// @notice Thrown when goal is outside allowed range
    error GoalOutsideRange();

    /// @notice Thrown when duration is outside allowed range
    error DurationOutsideRange();

    /// @notice Thrown when category does not exist
    error InvalidCategory();

    /// @notice Thrown when offset is out of bounds
    error OffsetOutOfBounds();

    /// @notice Thrown when category does not exist for search
    error CategoryDoesNotExist();

    // ============ Validation Functions ============

    /**
     * @notice Validates fundraiser creation parameters
     * @dev Reverts with custom errors if validation fails
     * @param name Fundraiser name
     * @param images Array of image URLs
     * @param categories Array of categories
     * @param description Fundraiser description
     * @param beneficiary Beneficiary address
     * @param goal Funding goal in USDC
     * @param durationInDays Campaign duration in days
     * @param minGoal Minimum allowed goal
     * @param maxGoal Maximum allowed goal
     * @param minDurationDays Minimum duration in days
     * @param maxDurationDays Maximum duration in days
     * @param categoryExists Mapping to check if category exists
     */
    function validateFundraiserParams(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        address beneficiary,
        uint256 goal,
        uint256 durationInDays,
        uint256 minGoal,
        uint256 maxGoal,
        uint256 minDurationDays,
        uint256 maxDurationDays,
        mapping(string => bool) storage categoryExists
    ) internal view {
        uint256 nameLen = bytes(name).length;
        if (nameLen == 0 || nameLen > 100) revert InvalidNameLength();

        uint256 imagesLen = images.length;
        if (imagesLen == 0 || imagesLen > 10) revert InvalidImagesCount();

        uint256 categoriesLen = categories.length;
        if (categoriesLen == 0 || categoriesLen > 5) revert InvalidCategoriesCount();

        uint256 descLen = bytes(description).length;
        if (descLen == 0 || descLen > 5000) revert InvalidDescriptionLength();

        if (beneficiary == address(0)) revert InvalidBeneficiary();

        if (goal < minGoal || goal > maxGoal) revert GoalOutsideRange();

        if (durationInDays < minDurationDays || durationInDays > maxDurationDays) {
            revert DurationOutsideRange();
        }

        for (uint256 i = 0; i < categoriesLen;) {
            if (!categoryExists[categories[i]]) revert InvalidCategory();
            unchecked { ++i; }
        }
    }

    // ============ Search Helper Functions ============

    /**
     * @notice Counts fundraisers matching a category
     * @param fundraisers Array of fundraiser contracts
     * @param category Category to search for
     * @return count Number of matching fundraisers
     */
    function countByCategory(
        Fundraiser[] storage fundraisers,
        string memory category
    ) internal view returns (uint256 count) {
        bytes32 categoryHash = keccak256(bytes(category));
        uint256 len = fundraisers.length;

        for (uint256 i = 0; i < len;) {
            string[] memory cats = fundraisers[i].getCategories();
            uint256 catsLen = cats.length;
            for (uint256 j = 0; j < catsLen;) {
                if (keccak256(bytes(cats[j])) == categoryHash) {
                    unchecked { ++count; }
                    break;
                }
                unchecked { ++j; }
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Finds fundraisers matching a category
     * @param fundraisers Array of fundraiser contracts
     * @param category Category to search for
     * @param resultCount Expected result count (from countByCategory)
     * @return results Array of matching fundraisers
     */
    function findByCategory(
        Fundraiser[] storage fundraisers,
        string memory category,
        uint256 resultCount
    ) internal view returns (Fundraiser[] memory results) {
        results = new Fundraiser[](resultCount);
        bytes32 categoryHash = keccak256(bytes(category));
        uint256 len = fundraisers.length;
        uint256 currentIndex;

        for (uint256 i = 0; i < len;) {
            string[] memory cats = fundraisers[i].getCategories();
            uint256 catsLen = cats.length;
            for (uint256 j = 0; j < catsLen;) {
                if (keccak256(bytes(cats[j])) == categoryHash) {
                    results[currentIndex] = fundraisers[i];
                    unchecked { ++currentIndex; }
                    break;
                }
                unchecked { ++j; }
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Counts fundraisers matching a region
     * @param fundraisers Array of fundraiser contracts
     * @param region Region to search for
     * @return count Number of matching fundraisers
     */
    function countByRegion(
        Fundraiser[] storage fundraisers,
        string memory region
    ) internal view returns (uint256 count) {
        bytes32 regionHash = keccak256(bytes(region));
        uint256 len = fundraisers.length;

        for (uint256 i = 0; i < len;) {
            if (keccak256(bytes(fundraisers[i].region())) == regionHash) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Finds fundraisers matching a region
     * @param fundraisers Array of fundraiser contracts
     * @param region Region to search for
     * @param resultCount Expected result count (from countByRegion)
     * @return results Array of matching fundraisers
     */
    function findByRegion(
        Fundraiser[] storage fundraisers,
        string memory region,
        uint256 resultCount
    ) internal view returns (Fundraiser[] memory results) {
        results = new Fundraiser[](resultCount);
        bytes32 regionHash = keccak256(bytes(region));
        uint256 len = fundraisers.length;
        uint256 currentIndex;

        for (uint256 i = 0; i < len;) {
            if (keccak256(bytes(fundraisers[i].region())) == regionHash) {
                results[currentIndex] = fundraisers[i];
                unchecked { ++currentIndex; }
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Counts active fundraisers
     * @param fundraisers Array of fundraiser contracts
     * @param activeFundraisers Mapping of active status by ID
     * @return count Number of active fundraisers
     */
    function countActive(
        Fundraiser[] storage fundraisers,
        mapping(uint256 => bool) storage activeFundraisers
    ) internal view returns (uint256 count) {
        uint256 len = fundraisers.length;
        for (uint256 i = 0; i < len;) {
            if (activeFundraisers[i]) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Gets active fundraisers array
     * @param fundraisers Array of fundraiser contracts
     * @param activeFundraisers Mapping of active status by ID
     * @param activeCount Number of active fundraisers
     * @return active Array of active fundraiser contracts
     */
    function getActive(
        Fundraiser[] storage fundraisers,
        mapping(uint256 => bool) storage activeFundraisers,
        uint256 activeCount
    ) internal view returns (Fundraiser[] memory active) {
        active = new Fundraiser[](activeCount);
        uint256 len = fundraisers.length;
        uint256 currentIndex;

        for (uint256 i = 0; i < len;) {
            if (activeFundraisers[i]) {
                active[currentIndex] = fundraisers[i];
                unchecked { ++currentIndex; }
            }
            unchecked { ++i; }
        }
    }

    // ============ Pagination Helper ============

    /**
     * @notice Calculates pagination size
     * @param totalCount Total number of items
     * @param offset Starting offset
     * @param limit Requested limit
     * @param maxLimit Maximum allowed limit
     * @return size Actual page size to return
     */
    function calculatePageSize(
        uint256 totalCount,
        uint256 offset,
        uint256 limit,
        uint256 maxLimit
    ) internal pure returns (uint256 size) {
        if (offset > totalCount) revert OffsetOutOfBounds();

        size = totalCount - offset;
        if (size > limit) size = limit;
        if (size > maxLimit) size = maxLimit;
    }
}
