// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title FundBraveTimelock
 * @author FundBrave Team
 * @notice Time-locked controller for admin operations
 * @dev Delays critical admin functions by a specified timelock period (e.g., 48 hours)
 *
 * This contract wraps OpenZeppelin's TimelockController to provide:
 * - Delayed execution of sensitive operations (fee changes, yield split changes, etc.)
 * - Multi-sig support through proposer/executor roles
 * - Transparency for users to see pending changes before they take effect
 *
 * Recommended Usage:
 * 1. Deploy with appropriate minDelay (e.g., 48 hours = 172800 seconds for mainnet)
 * 2. Set this contract as the owner/admin of critical contracts (PlatformTreasury, ImpactDAOPool, etc.)
 * 3. Use schedule() to propose changes and execute() after the delay passes
 *
 * Security Considerations:
 * - minDelay should be long enough for users to react to malicious proposals
 * - proposers should be limited to trusted multisig wallets
 * - executors can be open (address(0)) to allow anyone to execute after delay
 */
contract FundBraveTimelock is TimelockController {
    /**
     * @notice Initializes the FundBraveTimelock contract
     * @param minDelay Minimum delay in seconds before operations can be executed
     *                 Recommended: 172800 (48 hours) for mainnet, 300 (5 min) for testnet
     * @param proposers Array of addresses that can schedule operations
     *                  Typically multisig wallets controlled by the team
     * @param executors Array of addresses that can execute scheduled operations
     *                  Use address(0) to allow anyone to execute after delay
     * @param admin Optional admin address that can grant/revoke roles
     *              Use address(0) to renounce admin privileges after setup
     *
     * @dev Role hierarchy:
     *      - PROPOSER_ROLE: Can schedule and cancel operations
     *      - EXECUTOR_ROLE: Can execute operations after delay
     *      - CANCELLER_ROLE: Can cancel pending operations (auto-granted to proposers)
     *      - DEFAULT_ADMIN_ROLE: Can grant/revoke roles (renounce after setup for security)
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}

    /**
     * @notice Returns the minimum delay before a proposal can be executed
     * @return delay The minimum delay in seconds
     */
    function getMinimumDelay() external view returns (uint256) {
        return getMinDelay();
    }

    /**
     * @notice Convenience function to check if an operation is pending
     * @param id The operation identifier (hash of the operation)
     * @return True if the operation is pending (scheduled but not executed)
     */
    function isPending(bytes32 id) external view returns (bool) {
        return isOperationPending(id);
    }

    /**
     * @notice Convenience function to check if an operation is ready to execute
     * @param id The operation identifier
     * @return True if the operation is ready (delay has passed)
     */
    function isReady(bytes32 id) external view returns (bool) {
        return isOperationReady(id);
    }

    /**
     * @notice Convenience function to check if an operation has been executed
     * @param id The operation identifier
     * @return True if the operation has been executed
     */
    function isExecuted(bytes32 id) external view returns (bool) {
        return isOperationDone(id);
    }
}
