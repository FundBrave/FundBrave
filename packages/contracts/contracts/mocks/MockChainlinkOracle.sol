// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockChainlinkOracle
 * @notice Mock Chainlink price feed for testing
 */
contract MockChainlinkOracle {
    uint8 public decimals;
    int256 private latestAnswer;
    uint256 private updatedAt;
    uint80 private roundId;
    uint80 private answeredInRound;
    bool private isStale;

    constructor(uint8 _decimals) {
        decimals = _decimals;
        roundId = 1;
        answeredInRound = 1;
        updatedAt = block.timestamp;
        isStale = false;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80,
            int256 answer,
            uint256,
            uint256,
            uint80
        )
    {
        return (
            roundId,
            latestAnswer,
            block.timestamp,
            updatedAt,
            isStale ? answeredInRound - 1 : answeredInRound
        );
    }

    function setLatestAnswer(int256 _answer) external {
        latestAnswer = _answer;
        roundId++;
        answeredInRound = roundId;
        updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }

    function setStaleData(bool _isStale) external {
        isStale = _isStale;
    }
}
