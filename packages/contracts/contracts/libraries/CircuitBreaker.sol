// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CircuitBreaker
 * @author FundBrave Team
 * @notice Library for implementing circuit breaker pattern to prevent large transactions
 * @dev Tracks transaction volumes and triggers when limits are exceeded
 *
 * This library helps protect against:
 * - Flash loan attacks draining pools
 * - Market manipulation through large transactions
 * - Runaway bugs causing excessive fund movements
 * - Sudden protocol exploits
 *
 * Usage:
 * 1. Add a BreakerConfig storage variable to your contract
 * 2. Call initialize() to set limits
 * 3. Call checkTransaction() before processing transactions
 * 4. Admin can call reset() to restore functionality after investigation
 */
library CircuitBreaker {
    // ============ Events ============

    /// @notice Emitted when circuit breaker is triggered
    event CircuitBreakerTriggered(string reason, uint256 amount, uint256 limit);

    /// @notice Emitted when circuit breaker is reset by admin
    event CircuitBreakerReset();

    /// @notice Emitted when circuit breaker limits are updated
    event CircuitBreakerLimitsUpdated(
        uint256 maxTransactionAmount,
        uint256 maxHourlyVolume,
        uint256 maxDailyVolume
    );

    // ============ Structs ============

    /**
     * @notice Configuration and state for the circuit breaker
     * @param maxTransactionAmount Maximum amount for a single transaction
     * @param maxHourlyVolume Maximum cumulative volume per hour
     * @param maxDailyVolume Maximum cumulative volume per day
     * @param currentHourVolume Volume processed in the current hour
     * @param currentDayVolume Volume processed in the current day
     * @param hourStartTime Timestamp when the current hour window started
     * @param dayStartTime Timestamp when the current day window started
     * @param triggered Whether the circuit breaker is currently triggered
     * @param lastTriggeredTime When the circuit breaker was last triggered
     */
    struct BreakerConfig {
        uint256 maxTransactionAmount;
        uint256 maxHourlyVolume;
        uint256 maxDailyVolume;
        uint256 currentHourVolume;
        uint256 currentDayVolume;
        uint256 hourStartTime;
        uint256 dayStartTime;
        bool triggered;
        uint256 lastTriggeredTime;
    }

    // ============ Core Functions ============

    /**
     * @notice Initialize circuit breaker with limits
     * @param config Storage reference to the breaker config
     * @param maxTransaction Maximum single transaction amount
     * @param maxHourly Maximum hourly volume
     * @param maxDaily Maximum daily volume
     */
    function initialize(
        BreakerConfig storage config,
        uint256 maxTransaction,
        uint256 maxHourly,
        uint256 maxDaily
    ) internal {
        require(maxTransaction > 0, "CB: maxTransaction must be > 0");
        require(maxHourly >= maxTransaction, "CB: maxHourly must be >= maxTransaction");
        require(maxDaily >= maxHourly, "CB: maxDaily must be >= maxHourly");

        config.maxTransactionAmount = maxTransaction;
        config.maxHourlyVolume = maxHourly;
        config.maxDailyVolume = maxDaily;
        config.hourStartTime = block.timestamp;
        config.dayStartTime = block.timestamp;
        config.triggered = false;
    }

    /**
     * @notice Check if a transaction should be allowed
     * @dev Call this before processing any transaction
     * @param config Storage reference to the breaker config
     * @param amount Transaction amount to check
     * @return allowed Whether the transaction is allowed
     */
    function checkTransaction(
        BreakerConfig storage config,
        uint256 amount
    ) internal returns (bool allowed) {
        // If already triggered, reject all transactions
        if (config.triggered) {
            return false;
        }

        // Reset time windows if needed
        _resetWindowsIfNeeded(config);

        // Check single transaction limit
        if (amount > config.maxTransactionAmount) {
            config.triggered = true;
            config.lastTriggeredTime = block.timestamp;
            emit CircuitBreakerTriggered(
                "Single transaction limit exceeded",
                amount,
                config.maxTransactionAmount
            );
            return false;
        }

        // Check hourly limit
        if (config.currentHourVolume + amount > config.maxHourlyVolume) {
            config.triggered = true;
            config.lastTriggeredTime = block.timestamp;
            emit CircuitBreakerTriggered(
                "Hourly volume limit exceeded",
                config.currentHourVolume + amount,
                config.maxHourlyVolume
            );
            return false;
        }

        // Check daily limit
        if (config.currentDayVolume + amount > config.maxDailyVolume) {
            config.triggered = true;
            config.lastTriggeredTime = block.timestamp;
            emit CircuitBreakerTriggered(
                "Daily volume limit exceeded",
                config.currentDayVolume + amount,
                config.maxDailyVolume
            );
            return false;
        }

        // Update volumes
        config.currentHourVolume += amount;
        config.currentDayVolume += amount;

        return true;
    }

    /**
     * @notice Reset the circuit breaker after investigation
     * @dev Should only be called by admin after verifying safety
     * @param config Storage reference to the breaker config
     */
    function reset(BreakerConfig storage config) internal {
        config.triggered = false;
        config.currentHourVolume = 0;
        config.currentDayVolume = 0;
        config.hourStartTime = block.timestamp;
        config.dayStartTime = block.timestamp;
        emit CircuitBreakerReset();
    }

    /**
     * @notice Update circuit breaker limits
     * @param config Storage reference to the breaker config
     * @param maxTransaction New maximum single transaction amount
     * @param maxHourly New maximum hourly volume
     * @param maxDaily New maximum daily volume
     */
    function updateLimits(
        BreakerConfig storage config,
        uint256 maxTransaction,
        uint256 maxHourly,
        uint256 maxDaily
    ) internal {
        require(maxTransaction > 0, "CB: maxTransaction must be > 0");
        require(maxHourly >= maxTransaction, "CB: maxHourly must be >= maxTransaction");
        require(maxDaily >= maxHourly, "CB: maxDaily must be >= maxHourly");

        config.maxTransactionAmount = maxTransaction;
        config.maxHourlyVolume = maxHourly;
        config.maxDailyVolume = maxDaily;

        emit CircuitBreakerLimitsUpdated(maxTransaction, maxHourly, maxDaily);
    }

    // ============ View Functions ============

    /**
     * @notice Check if circuit breaker is currently triggered
     * @param config Storage reference to the breaker config
     * @return True if triggered
     */
    function isTriggered(BreakerConfig storage config) internal view returns (bool) {
        return config.triggered;
    }

    /**
     * @notice Get remaining capacity for the current hour
     * @param config Storage reference to the breaker config
     * @return Remaining hourly capacity
     */
    function getRemainingHourlyCapacity(BreakerConfig storage config)
        internal
        view
        returns (uint256)
    {
        if (config.triggered) return 0;
        if (block.timestamp >= config.hourStartTime + 1 hours) {
            return config.maxHourlyVolume;
        }
        if (config.currentHourVolume >= config.maxHourlyVolume) return 0;
        return config.maxHourlyVolume - config.currentHourVolume;
    }

    /**
     * @notice Get remaining capacity for the current day
     * @param config Storage reference to the breaker config
     * @return Remaining daily capacity
     */
    function getRemainingDailyCapacity(BreakerConfig storage config)
        internal
        view
        returns (uint256)
    {
        if (config.triggered) return 0;
        if (block.timestamp >= config.dayStartTime + 1 days) {
            return config.maxDailyVolume;
        }
        if (config.currentDayVolume >= config.maxDailyVolume) return 0;
        return config.maxDailyVolume - config.currentDayVolume;
    }

    /**
     * @notice Get the maximum allowed transaction amount
     * @param config Storage reference to the breaker config
     * @return Maximum single transaction amount
     */
    function getMaxTransactionAmount(BreakerConfig storage config)
        internal
        view
        returns (uint256)
    {
        if (config.triggered) return 0;
        uint256 hourlyRemaining = getRemainingHourlyCapacity(config);
        uint256 dailyRemaining = getRemainingDailyCapacity(config);
        uint256 maxAllowed = config.maxTransactionAmount;

        // Return the minimum of all three limits
        if (hourlyRemaining < maxAllowed) maxAllowed = hourlyRemaining;
        if (dailyRemaining < maxAllowed) maxAllowed = dailyRemaining;

        return maxAllowed;
    }

    // ============ Internal Functions ============

    /**
     * @notice Reset time windows if enough time has passed
     * @param config Storage reference to the breaker config
     */
    function _resetWindowsIfNeeded(BreakerConfig storage config) private {
        // Reset hourly window
        if (block.timestamp >= config.hourStartTime + 1 hours) {
            config.currentHourVolume = 0;
            config.hourStartTime = block.timestamp;
        }

        // Reset daily window
        if (block.timestamp >= config.dayStartTime + 1 days) {
            config.currentDayVolume = 0;
            config.dayStartTime = block.timestamp;
        }
    }
}
