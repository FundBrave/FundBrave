# FundBrave Deployment Scripts

This directory contains deployment scripts for the FundBrave smart contracts.

## Supported Networks

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| StatusL2 Testnet | 1660990954 | https://public.sepolia.rpc.status.network | https://sepoliascan.status.network |
| Ethereum Sepolia | 11155111 | Via Infura | https://sepolia.etherscan.io |
| Polygon Mumbai | 80001 | Via Alchemy | https://mumbai.polygonscan.com |
| Avalanche Fuji | 43113 | Public | https://testnet.snowtrace.io |

## Prerequisites

1. **Environment Setup**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env with your private key
   # PRIVATE_KEY=your_private_key_here (without 0x prefix)
   ```

2. **Fund your wallet**
   - Ensure your deployer wallet has sufficient native tokens (ETH for StatusL2 Testnet)
   - For StatusL2 Testnet, you may need to use a faucet or bridge from Sepolia

3. **Compile contracts**
   ```bash
   npm run compile
   ```

## Deployment Commands

### Full Deployment (Recommended)

Deploy all contracts in the correct order with automatic configuration:

```bash
# StatusL2 Testnet
npm run deploy:statusl2

# Other networks
npm run deploy:sepolia
npm run deploy:mumbai
npm run deploy:fuji
```

### Individual Contract Deployment

Deploy contracts one at a time (for debugging or partial deployments):

```bash
# 1. FundBraveToken (FBT) - Governance token
npm run deploy:statusl2:fbt

# 2. Fundraiser Implementation - Template for cloning
npm run deploy:statusl2:fundraiser

# 3. StakingPool Implementation - Template for cloning
npm run deploy:statusl2:stakingpool

# 4. WealthBuildingDonation - 80/20 donation mechanism
npm run deploy:statusl2:wbd

# 5. PlatformTreasury - Fee collection and distribution
npm run deploy:statusl2:treasury

# 6. FundraiserFactory - Main factory contract
npm run deploy:statusl2:factory
```

## Contract Verification

After deployment, verify contracts on the block explorer:

```bash
npm run verify:statusl2
```

## Deployment Order

Contracts must be deployed in a specific order due to dependencies:

1. **FundBraveToken** - No dependencies
2. **Fundraiser Implementation** - No dependencies
3. **StakingPool Implementation** - No dependencies
4. **WealthBuildingDonation** - Needs: Aave addresses (can be placeholders)
5. **PlatformTreasury** - Needs: FBT, WealthBuildingDonation
6. **FundraiserFactory** - Needs: Fundraiser impl, StakingPool impl, PlatformTreasury

## Deployment Output

Deployment addresses are saved to:
```
packages/contracts/deployments/{network}.json
```

Example output:
```json
{
  "network": "statusL2Testnet",
  "contracts": {
    "FundBraveToken": {
      "address": "0x...",
      "implementationAddress": "0x...",
      "txHash": "0x...",
      "isProxy": true
    },
    "FundraiserFactory": {
      "address": "0x...",
      "txHash": "0x...",
      "constructorArgs": [...]
    }
  }
}
```

## Contract Architecture

```
FundraiserFactory (main entry point)
├── Fundraiser Implementation (cloned for each campaign)
├── StakingPool Implementation (cloned for each campaign)
├── FundBraveToken (FBT) - governance token
├── WealthBuildingDonation - 80/20 donation split
└── PlatformTreasury - fee collection
```

### Key Relationships

- **FundraiserFactory** clones Fundraiser and StakingPool for each campaign
- **FBT** is used for governance and rewards
- **WealthBuildingDonation** handles the 80/20 donation split with Aave yield
- **PlatformTreasury** collects 2% platform fees and distributes to FBT stakers

## Configuration

### Network-Specific Addresses

Edit `scripts/deploy/config.js` to update network-specific addresses:

```javascript
statusL2Testnet: {
  usdc: "0x...",      // USDC token address
  weth: "0x...",      // WETH token address
  aavePool: "0x...",  // Aave V3 Pool address
  aUsdc: "0x...",     // Aave aUSDC address
  stakingPoolType: 0, // 0 = Aave, 1 = Morpho
}
```

### Placeholder Addresses

For testnets without full DeFi infrastructure (like Aave), the scripts use placeholder addresses. The contracts will deploy successfully but yield-generating features will not work until real addresses are configured.

## Troubleshooting

### "Insufficient funds"
- Ensure your wallet has enough native tokens for gas
- For StatusL2 Testnet, bridge ETH from Sepolia

### "Transaction underpriced"
- Increase gas price in hardhat.config.js
- Or wait and retry during lower network congestion

### "Contract verification failed"
- Wait a few minutes for the explorer to index the transaction
- Run `npm run verify:statusl2` again

### "Timeout"
- Increase timeout in hardhat.config.js
- Check network RPC endpoint status

## Post-Deployment Setup

After deployment, the master script automatically:

1. Sets FBT token address in FundraiserFactory
2. Sets WealthBuildingDonation in FundraiserFactory
3. Sets PlatformTreasury in FundraiserFactory
4. Authorizes FundraiserFactory as a vester in FBT
5. Authorizes FundraiserFactory as a fee sender in PlatformTreasury
6. Updates PlatformTreasury reference in WealthBuildingDonation

### Manual Configuration (if needed)

If post-deployment configuration fails, run these transactions manually:

```javascript
// On FundraiserFactory
factory.setFBT(fbtAddress);
factory.setWealthBuildingDonation(wbdAddress);
factory.setPlatformTreasury(treasuryAddress);

// On FundBraveToken
fbt.setAuthorizedVester(factoryAddress, true);

// On PlatformTreasury
treasury.authorizeFeeSender(factoryAddress);

// On WealthBuildingDonation
wbd.setPlatformTreasury(treasuryAddress);
```

## Security Notes

- **NEVER** commit your private key to version control
- Use a dedicated deployment wallet, not your main wallet
- Test deployments on testnets before mainnet
- Consider using a hardware wallet for mainnet deployments
- Review all constructor arguments before deployment
