# Blockchain Configuration

This directory contains configuration for the blockchain integration services.

## Environment Variables

Add these to your `.env` file:

### Required

```bash
# Default chain ID for blockchain operations
DEFAULT_CHAIN_ID=31337

# RPC URLs for supported networks
STATUS_L2_RPC_URL=https://rpc.testnet.status.im
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
```

### Contract Addresses (Status L2 Testnet)

```bash
# Core contracts
FUNDRAISER_FACTORY_ADDRESS=0x...
FBT_ADDRESS=0x...
IMPACT_DAO_POOL_ADDRESS=0x...
WEALTH_BUILDING_ADDRESS=0x...
PLATFORM_TREASURY_ADDRESS=0x...

# Token contracts
USDC_ADDRESS=0x...
AUSDC_ADDRESS=0x...
AAVE_POOL_ADDRESS=0x...
RECEIPT_OFT_ADDRESS=0x...  # Optional
```

### Backend Wallet (Optional - for server-side transactions)

```bash
# Private key for backend wallet (for creating fundraisers server-side)
# WARNING: Never commit this to version control!
BACKEND_WALLET_PK=0x...
```

### Multi-chain Configuration

For each additional network, use the pattern `{NETWORK}_CONTRACT_NAME`:

```bash
# Sepolia
SEPOLIA_FUNDRAISER_FACTORY=0x...
SEPOLIA_FBT=0x...

# Polygon
POLYGON_FUNDRAISER_FACTORY=0x...
POLYGON_FBT=0x...

# Arbitrum
ARBITRUM_FUNDRAISER_FACTORY=0x...
ARBITRUM_FBT=0x...
```

## Deployment Configuration

The `deployments.ts` file contains:

1. **Network Configurations**: RPC URLs, chain IDs, explorer URLs, and native currency info
2. **Contract Addresses**: Deployed contract addresses per network
3. **Helper Functions**:
   - `getNetworkConfig(chainId)` - Get full network config
   - `getContractAddresses(chainId)` - Get contract addresses
   - `isChainSupported(chainId)` - Check if chain is supported

## Adding a New Network

1. Create a new `NetworkConfig` constant:

```typescript
export const NEW_NETWORK: NetworkConfig = {
  chainId: 12345,
  name: 'New Network',
  rpcUrl: process.env.NEW_NETWORK_RPC_URL || 'https://...',
  explorerUrl: 'https://explorer.newnetwork.io',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory: process.env.NEW_NETWORK_FUNDRAISER_FACTORY || '0x...',
    // ... other contracts
  },
  isTestnet: false,
  blockConfirmations: 32,
};
```

2. Add to `SUPPORTED_NETWORKS`:

```typescript
export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // ... existing networks
  12345: NEW_NETWORK,
};
```

## ABIs

The `abis/index.ts` file contains human-readable ABIs for all contracts:

- `FUNDRAISER_FACTORY_ABI` - Factory for creating fundraisers
- `FUNDRAISER_ABI` - Individual fundraiser contracts
- `STAKING_POOL_ABI` - Per-fundraiser staking pools
- `FUND_BRAVE_TOKEN_ABI` - FBT governance token
- `IMPACT_DAO_POOL_ABI` - Global staking pool
- `WEALTH_BUILDING_DONATION_ABI` - Endowment donations
- `PLATFORM_TREASURY_ABI` - Fee collection and distribution
- `ERC20_ABI` - Standard ERC20 interface

## Services

### ContractsService

Main service for contract interactions:

```typescript
// Get contract instance
const factory = contractsService.getFundraiserFactory(chainId);

// Get contract with signer (for write operations)
const factoryWithSigner = contractsService.getFundraiserFactoryWithSigner(chainId);

// Parse transaction logs
const parsed = contractsService.parseFundraiserFactoryLogs(receipt.logs);

// Wait for transaction
const receipt = await contractsService.waitForTransaction(txHash, chainId);
```

### FundraiserBlockchainService

Creates fundraisers on-chain:

```typescript
// Create and save to database
const fundraiser = await service.createFundraiserWithBlockchain(userId, input);

// Sync data from chain to database
const synced = await service.syncFundraiserFromBlockchain({ fundraiserId, chainId });
```

### DonationBlockchainService

Verifies and records donations:

```typescript
// Verify transaction
const result = await service.verifyTransaction({ txHash, chainId });

// Record donation from transaction
const donation = await service.recordDonationFromTransaction(input, userId);
```

### StakingBlockchainService

Verifies and records stakes:

```typescript
// Record stake from transaction
const stake = await service.recordStakeFromTransaction(input, userId);

// Get live pool data
const poolData = await service.getStakingPoolBlockchainData(poolAddress, chainId);
```
