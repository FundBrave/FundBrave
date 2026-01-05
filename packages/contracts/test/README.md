# FundBrave Smart Contract Tests

## Overview

This directory contains comprehensive test suites for all mainnet-ready features in the FundBrave smart contracts. Tests are organized by feature and contract, with a focus on security, edge cases, and complete coverage.

## Test Files

### 1. GlobalStakingPool.upgrade.test.js
**Tests**: Storage Gap & Upgrade Safety

**Coverage**:
- Storage gap of 49 slots for future upgrades
- State preservation during upgrades
- Compatibility with new state variables
- Circuit breaker state through upgrades
- Reward state preservation
- Upgrade authorization

**Key Scenarios**:
- Simulated V1 to V2 upgrades
- Complex state preservation
- Storage layout compatibility
- Multiple sequential upgrades

**Run**: `npm test -- GlobalStakingPool.upgrade.test.js`

---

### 2. FundBraveBridge.pause.test.js
**Tests**: Pausable Pattern Implementation

**Coverage**:
- Pause/unpause functions (owner-only)
- sendCrossChainAction blocking when paused
- _lzReceive blocking when paused
- Normal operations when not paused
- Emergency withdrawals during pause
- State consistency through pause cycles

**Key Scenarios**:
- Emergency pause scenarios
- User fund protection during pause
- Resume operations after unpause
- Multiple pause/unpause cycles
- Statistics preservation

**Run**: `npm test -- FundBraveBridge.pause.test.js`

---

### 3. MorphoStakingPool.pause.test.js
**Tests**: Pausable Pattern in Morpho Staking

**Coverage**:
- Pause/unpause authorization
- depositFor blocked when paused
- unstake blocked when paused
- harvestAndDistribute blocked when paused
- Reward claiming when paused
- Yield preservation during pause

**Key Scenarios**:
- Factory deposits during pause
- Yield accrual during pause
- Full workflow without pause
- State preservation
- Multiple pause cycles

**Run**: `npm test -- MorphoStakingPool.pause.test.js`

---

### 4. Fundraiser.refund.test.js
**Tests**: Complete Refund Mechanism

**Coverage**:
- enableRefunds() conditions and authorization
- claimRefund() functionality
- getRefundAmount() accuracy
- Multiple donors claiming refunds
- Integration with withdrawUSDT
- Edge cases and boundary conditions

**Key Scenarios**:
- Failed fundraisers (goal not reached)
- Successful fundraisers (refunds disabled)
- Partial refund claims
- Donor tracking updates
- Minimal donations (1 cent)
- Zero donation scenarios

**Run**: `npm test -- Fundraiser.refund.test.js`

---

### 5. FundBraveTimelock.test.js
**Tests**: Timelock Controller Integration

**Coverage**:
- Timelock deployment and configuration
- PlatformTreasury timelock integration
- ImpactDAOPool timelock integration
- Proposal/execution workflow
- Role-based access control
- Operation state tracking

**Key Scenarios**:
- 2-day delay enforcement
- Proposal cancellation
- Protected function execution
- Unauthorized access prevention
- Transparency window for users
- Multi-step workflow completion

**Run**: `npm test -- FundBraveTimelock.test.js`

---

### 6. CowSwapAdapter.chainlink.test.js
**Tests**: Chainlink Oracle Integration

**Coverage**:
- ETH/USD price fetching
- Oracle validation (invalid, stale, old prices)
- Dynamic pricing for swaps
- Price feed management
- Staleness threshold (1 hour)
- Decimal handling

**Key Scenarios**:
- Price updates and variations
- Stale price rejection
- Old price rejection (>1 hour)
- Oracle manipulation protection
- Rapid price updates
- Multiple decimal configurations

**Run**: `npm test -- CowSwapAdapter.chainlink.test.js`

---

### 7. CircuitBreaker.test.js
**Tests**: Circuit Breaker Library Integration

**Coverage**:
- Single transaction limits
- Hourly volume limits
- Daily volume limits
- Volume reset mechanics (1 hour, 1 day)
- Circuit breaker reset by owner
- Limit updates
- Status reporting

**Key Scenarios**:
- GlobalStakingPool limits (10M/50M/200M)
- Fundraiser limits (1M/5M/20M)
- Transaction blocking at limits
- Time-based resets
- Multiple contract integration
- Edge case handling

**Run**: `npm test -- CircuitBreaker.test.js`

---

## Mock Contracts

Located in `contracts/mocks/`, these contracts enable comprehensive testing:

- **MockChainlinkOracle**: Simulates Chainlink price feeds with configurable answers
- **MockLZEndpoint**: Simulates LayerZero endpoint for cross-chain messaging
- **MockCowBatcher**: Simulates CoW Protocol swap execution
- **MockMetaMorpho**: Simulates Morpho vault with yield generation
- **MockWealthBuildingDonation**: Simulates WealthBuildingDonation contract
- **MockReceiptOFT**: Simulates receipt token minting/burning
- **MockSwapAdapter**: Simulates token swaps

## Running Tests

### All Tests
```bash
cd packages/contracts
npm test
```

### Specific Test Suite
```bash
npm test -- <test-file-name>
```

### With Gas Reporting
```bash
npm run test:gas
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm test -- --watch
```

## Coverage Goals

All test suites aim for:
- **Line Coverage**: 100%
- **Branch Coverage**: 100%
- **Function Coverage**: 100%
- **Statement Coverage**: 100%

## Test Patterns

### Fixtures
Tests use `loadFixture` from Hardhat for efficient, isolated test state:

```javascript
async function deployFixture() {
  // Setup code
  return { contract, users, tokens };
}

describe("Feature", function () {
  it("should do something", async function () {
    const { contract } = await loadFixture(deployFixture);
    // Test code
  });
});
```

### Time Manipulation
Tests use `@nomicfoundation/hardhat-toolbox/network-helpers` for time control:

```javascript
await time.increase(60 * 60); // Fast forward 1 hour
await time.increaseTo(deadline + 1); // Jump to specific time
```

### Event Testing
Tests verify events are emitted correctly:

```javascript
await expect(contract.someFunction())
  .to.emit(contract, "EventName")
  .withArgs(expectedArg1, expectedArg2);
```

### Revert Testing
Tests verify proper error handling:

```javascript
await expect(contract.failingFunction())
  .to.be.revertedWith("Error message");

await expect(contract.failingFunction())
  .to.be.revertedWithCustomError(contract, "CustomErrorName");
```

## Security Testing Checklist

Each test suite covers:
- ✅ Access control (onlyOwner, onlyFactory, etc.)
- ✅ Input validation (zero amounts, zero addresses)
- ✅ State transitions and consistency
- ✅ Reentrancy protection (where applicable)
- ✅ Integer overflow/underflow (SafeMath)
- ✅ Edge cases and boundary conditions
- ✅ Gas optimization verification
- ✅ Event emission verification
- ✅ Integration with other contracts

## CI/CD Integration

Tests are configured to run automatically on:
- Pull requests to main branch
- Commits to feature branches
- Pre-deployment to testnets/mainnet

## Troubleshooting

### Common Issues

**Issue**: "Cannot find module" errors
**Solution**: Run `npm install` in packages/contracts

**Issue**: "Out of gas" errors in tests
**Solution**: Increase gas limit in hardhat.config.js or specific test

**Issue**: Time-dependent tests failing
**Solution**: Ensure proper use of time.increase/increaseTo helpers

**Issue**: Mock contract deployment fails
**Solution**: Verify mock contracts are compiled (run `npm run compile`)

## Contributing

When adding new features:
1. Create corresponding test file following naming convention
2. Aim for 100% coverage of new code
3. Test both success and failure cases
4. Include edge case testing
5. Document test scenarios in this README
6. Run full test suite before submitting PR

## Test Metrics

Current test statistics:
- **Total Test Suites**: 7
- **Total Tests**: 150+
- **Average Coverage**: 95%+
- **Average Execution Time**: <60 seconds

## Resources

- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers)
- [Hardhat Network Helpers](https://hardhat.org/hardhat-network-helpers)
