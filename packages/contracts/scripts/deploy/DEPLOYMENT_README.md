# FundBrave Contract Deployment Guide

This guide explains how to deploy the remaining FundBrave contracts to Base Sepolia after the initial partial deployment.

## Current Deployment Status (Base Sepolia)

| Contract | Address | Status |
|----------|---------|--------|
| FundBraveToken (Proxy) | `0xE42A6ff84160Ac399607667C32392378Bbb270E0` | Deployed |
| FundBraveToken (Impl) | `0xcc8eC10b641d581c8D6ecA58287155bed3546a57` | Deployed |
| FundraiserImplementation | `0xf79732B4D25521F2C8d8619c568C065fBf69bc9e` | Deployed |
| StakingPoolImplementation | `0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8` | Deployed |
| WealthBuildingDonation | - | **PENDING** |
| PlatformTreasury | - | **PENDING** |
| FundraiserFactory | - | **PENDING** |

## Network Configuration (Base Sepolia)

- **Chain ID**: 84532
- **USDC**: `0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f`
- **WETH**: `0x4200000000000000000000000000000000000006`
- **Aave Pool**: `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27`
- **aUSDC**: `0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC`

## Problem

The original deployment scripts use `@openzeppelin/hardhat-upgrades` which performs ERC1967 proxy verification via RPC calls. These calls can fail on testnets with unreliable RPC endpoints, resulting in:

```
Error: Contract at [address] doesn't look like an ERC 1967 proxy with a logic contract address
```

## Solutions

### Option 1: Single Command Deployment (Recommended)

Deploy all remaining contracts with one command:

```bash
cd packages/contracts
npx hardhat run scripts/deploy/deployRemainingSimple.js --network baseSepolia
```

This script:
- Uses manual ERC1967 proxy deployment (bypasses hardhat-upgrades)
- Includes retry logic for unreliable RPC
- Automatically configures all contract relationships
- Provides detailed logging

### Option 2: Step-by-Step Deployment

Deploy contracts one at a time for maximum control:

```bash
# Step 1: Deploy WealthBuildingDonation
npx hardhat run scripts/deploy/04_deploy_WealthBuildingDonation_Manual.js --network baseSepolia

# Step 2: Deploy PlatformTreasury
npx hardhat run scripts/deploy/05_deploy_PlatformTreasury_Manual.js --network baseSepolia

# Step 3: Deploy FundraiserFactory
npx hardhat run scripts/deploy/06_deploy_FundraiserFactory_Manual.js --network baseSepolia

# Step 4: Configure all contracts
npx hardhat run scripts/deploy/07_configure_contracts.js --network baseSepolia
```

### Option 3: Using deployRemainingManual.js

Alternative script with more verbose logging:

```bash
npx hardhat run scripts/deploy/deployRemainingManual.js --network baseSepolia
```

## Script Descriptions

| Script | Description |
|--------|-------------|
| `deployRemainingSimple.js` | All-in-one deployment with hardcoded Base Sepolia config and retry logic |
| `deployRemainingManual.js` | Similar to above but uses network config from `config.js` |
| `04_deploy_WealthBuildingDonation_Manual.js` | Standalone WealthBuildingDonation deployment |
| `05_deploy_PlatformTreasury_Manual.js` | Standalone PlatformTreasury deployment |
| `06_deploy_FundraiserFactory_Manual.js` | Standalone FundraiserFactory deployment |
| `07_configure_contracts.js` | Links all contracts together post-deployment |

## How Manual UUPS Proxy Deployment Works

Instead of using `upgrades.deployProxy()`, we manually:

1. **Deploy the implementation contract**:
   ```javascript
   const implementation = await WealthBuildingDonation.deploy();
   ```

2. **Encode initialization data**:
   ```javascript
   const initData = implementation.interface.encodeFunctionData("initialize", [...args]);
   ```

3. **Deploy OpenZeppelin's ERC1967Proxy**:
   ```javascript
   const proxy = await ERC1967Proxy.deploy(implAddress, initData);
   ```

This bypasses the hardhat-upgrades plugin's verification calls while maintaining the same proxy architecture.

## Troubleshooting

### RPC Timeout Errors

If you encounter timeout errors, try:

1. **Use a different RPC endpoint** in `hardhat.config.js`:
   ```javascript
   baseSepolia: {
     url: "https://base-sepolia.g.alchemy.com/v2/YOUR_KEY",
     // or
     url: "https://sepolia.base.org",
   }
   ```

2. **Increase timeout** in `hardhat.config.js`:
   ```javascript
   baseSepolia: {
     timeout: 180000, // 3 minutes
   }
   ```

3. **Run scripts individually** with delays between them

### Insufficient Gas

Ensure your deployer wallet has sufficient ETH for gas:
- Recommended: At least 0.1 ETH
- Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia

### Nonce Issues

If transactions get stuck:

```bash
# Reset nonce in Hardhat
npx hardhat clean
```

Or specify nonce manually in the deployment script.

## Post-Deployment Verification

After deployment, verify contracts on Basescan:

```bash
# Verify implementation contracts
npx hardhat verify --network baseSepolia IMPLEMENTATION_ADDRESS

# Verify FundraiserFactory with constructor args
npx hardhat verify --network baseSepolia FACTORY_ADDRESS \
  "0xf79732B4D25521F2C8d8619c568C065fBf69bc9e" \
  "0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8" \
  "0x0000000000000000000000000000000000000000" \
  "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f" \
  "0x4200000000000000000000000000000000000006" \
  "PLATFORM_TREASURY_ADDRESS" \
  "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27" \
  "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC" \
  "0x0000000000000000000000000000000000000000" \
  0
```

## Deployed Addresses Log

After successful deployment, addresses will be saved to:
```
packages/contracts/deployments/baseSepolia.json
```

## Security Notes

1. **Private Key**: Ensure your `.env` file contains a valid `PRIVATE_KEY` and is not committed to version control
2. **Test Thoroughly**: These are testnet deployments - test all functionality before mainnet
3. **Proxy Admin**: For UUPS proxies, the contract owner is the upgrade admin - handle with care

## Support

If deployment fails:
1. Check the error message carefully
2. Verify your `.env` configuration
3. Ensure sufficient ETH balance
4. Try with a different RPC endpoint
5. Deploy contracts individually using the step-by-step approach
