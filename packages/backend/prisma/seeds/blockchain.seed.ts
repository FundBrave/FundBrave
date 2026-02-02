import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Base Sepolia Testnet Configuration
 */
const BASE_SEPOLIA_CHAIN = {
  id: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
  isActive: true,
};

/**
 * Deployed Contract Addresses on Base Sepolia
 */
const BASE_SEPOLIA_CONTRACTS = [
  {
    contractName: 'FundBraveToken',
    contractAddress: '0xE42A6ff84160Ac399607667C32392378Bbb270E0',
    version: '1.0.0',
  },
  {
    contractName: 'FundraiserImplementation',
    contractAddress: '0xf79732B4D25521F2C8d8619c568C065fBf69bc9e',
    version: '1.0.0',
  },
  {
    contractName: 'StakingPoolImplementation',
    contractAddress: '0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8',
    version: '1.0.0',
  },
  {
    contractName: 'WealthBuildingDonation',
    contractAddress: '0x8DcC63E7Df76ece01c186568E269a2cF3aC8A886',
    version: '1.0.0',
  },
  {
    contractName: 'PlatformTreasury',
    contractAddress: '0x664AbB27C9c3d287117676c77B6A1c88B831D836',
    version: '1.0.0',
  },
  {
    contractName: 'FundraiserFactory',
    contractAddress: '0x7253b4E79cc708873b83Bb3C3F50F3e81b21819c',
    version: '1.0.0',
  },
];

/**
 * Supported Tokens on Base Sepolia
 */
const BASE_SEPOLIA_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native token
    isActive: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Circle's USDC on Base Sepolia
    isActive: true,
  },
  {
    symbol: 'FBT',
    name: 'FundBrave Token',
    decimals: 18,
    address: '0xE42A6ff84160Ac399607667C32392378Bbb270E0',
    isActive: true,
  },
];

/**
 * Seed Base Sepolia chain configuration
 */
export async function seedBaseSepolia(): Promise<void> {
  console.log('Seeding Base Sepolia blockchain configuration...\n');

  try {
    // 1. Create or update the supported chain
    const chain = await prisma.supportedChain.upsert({
      where: { id: BASE_SEPOLIA_CHAIN.id },
      update: {
        name: BASE_SEPOLIA_CHAIN.name,
        rpcUrl: BASE_SEPOLIA_CHAIN.rpcUrl,
        explorerUrl: BASE_SEPOLIA_CHAIN.explorerUrl,
        isActive: BASE_SEPOLIA_CHAIN.isActive,
      },
      create: {
        id: BASE_SEPOLIA_CHAIN.id,
        name: BASE_SEPOLIA_CHAIN.name,
        rpcUrl: BASE_SEPOLIA_CHAIN.rpcUrl,
        explorerUrl: BASE_SEPOLIA_CHAIN.explorerUrl,
        isActive: BASE_SEPOLIA_CHAIN.isActive,
      },
    });

    console.log(`  [OK] Created/Updated chain: ${chain.name} (ID: ${chain.id})`);

    // 2. Create or update contract registry entries
    console.log('\n  Registering contracts...');
    for (const contract of BASE_SEPOLIA_CONTRACTS) {
      const registered = await prisma.contractRegistry.upsert({
        where: {
          chainId_contractName: {
            chainId: BASE_SEPOLIA_CHAIN.id,
            contractName: contract.contractName,
          },
        },
        update: {
          contractAddress: contract.contractAddress.toLowerCase(),
          version: contract.version,
          isActive: true,
        },
        create: {
          chainId: BASE_SEPOLIA_CHAIN.id,
          contractName: contract.contractName,
          contractAddress: contract.contractAddress.toLowerCase(),
          version: contract.version,
          isActive: true,
        },
      });

      console.log(
        `    [OK] ${registered.contractName}: ${registered.contractAddress}`,
      );
    }

    // 3. Create or update supported tokens
    console.log('\n  Registering tokens...');
    for (const token of BASE_SEPOLIA_TOKENS) {
      const registered = await prisma.supportedToken.upsert({
        where: {
          chainId_symbol: {
            chainId: BASE_SEPOLIA_CHAIN.id,
            symbol: token.symbol,
          },
        },
        update: {
          name: token.name,
          decimals: token.decimals,
          address: token.address.toLowerCase(),
          isActive: token.isActive,
        },
        create: {
          chainId: BASE_SEPOLIA_CHAIN.id,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          address: token.address.toLowerCase(),
          isActive: token.isActive,
        },
      });

      console.log(`    [OK] ${registered.symbol}: ${registered.address}`);
    }

    // 4. Initialize blockchain sync records for each contract
    console.log('\n  Initializing blockchain sync records...');
    for (const contract of BASE_SEPOLIA_CONTRACTS) {
      // Skip implementation contracts - they don't emit events directly
      if (
        contract.contractName === 'FundraiserImplementation' ||
        contract.contractName === 'StakingPoolImplementation'
      ) {
        continue;
      }

      const sync = await prisma.blockchainSync.upsert({
        where: {
          chainId_contractAddress: {
            chainId: BASE_SEPOLIA_CHAIN.id,
            contractAddress: contract.contractAddress.toLowerCase(),
          },
        },
        update: {
          chainName: BASE_SEPOLIA_CHAIN.name,
          contractName: contract.contractName,
          status: 'SYNCING',
        },
        create: {
          chainId: BASE_SEPOLIA_CHAIN.id,
          chainName: BASE_SEPOLIA_CHAIN.name,
          contractAddress: contract.contractAddress.toLowerCase(),
          contractName: contract.contractName,
          lastBlock: 0, // Will be updated when indexer starts
          status: 'SYNCING',
        },
      });

      console.log(
        `    [OK] Sync record for ${sync.contractName} (last block: ${sync.lastBlock})`,
      );
    }

    console.log('\n[SUCCESS] Base Sepolia blockchain configuration seeded!\n');
  } catch (error) {
    console.error('[ERROR] Failed to seed Base Sepolia configuration:', error);
    throw error;
  }
}

/**
 * Additional supported chains (can be expanded)
 */
const ADDITIONAL_CHAINS = [
  {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    isActive: false, // Not deployed yet
  },
  {
    id: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    isActive: true,
  },
];

/**
 * Seed all supported chains (without contracts for chains without deployments)
 */
export async function seedAllChains(): Promise<void> {
  console.log('Seeding all supported chains...\n');

  for (const chain of ADDITIONAL_CHAINS) {
    try {
      const created = await prisma.supportedChain.upsert({
        where: { id: chain.id },
        update: {
          name: chain.name,
          rpcUrl: chain.rpcUrl,
          explorerUrl: chain.explorerUrl,
          isActive: chain.isActive,
        },
        create: {
          id: chain.id,
          name: chain.name,
          rpcUrl: chain.rpcUrl,
          explorerUrl: chain.explorerUrl,
          isActive: chain.isActive,
        },
      });

      console.log(
        `  [OK] Created/Updated chain: ${created.name} (ID: ${created.id}, Active: ${created.isActive})`,
      );
    } catch (error) {
      console.error(`  [ERROR] Failed to seed chain ${chain.name}:`, error);
    }
  }

  console.log('\n[SUCCESS] All chains seeded!\n');
}

/**
 * Main function to run blockchain seeding independently
 */
async function main(): Promise<void> {
  console.log('========================================');
  console.log('   FundBrave Blockchain Configuration  ');
  console.log('========================================\n');

  try {
    // Seed all chains first
    await seedAllChains();

    // Then seed Base Sepolia with full configuration
    await seedBaseSepolia();

    // Print summary
    const chainCount = await prisma.supportedChain.count();
    const contractCount = await prisma.contractRegistry.count();
    const tokenCount = await prisma.supportedToken.count();
    const syncCount = await prisma.blockchainSync.count();

    console.log('========================================');
    console.log('            Summary                     ');
    console.log('========================================');
    console.log(`  Supported Chains: ${chainCount}`);
    console.log(`  Registered Contracts: ${contractCount}`);
    console.log(`  Supported Tokens: ${tokenCount}`);
    console.log(`  Sync Records: ${syncCount}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Fatal error during blockchain seeding:', error);
    throw error;
  }
}

// Allow running directly or importing
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { main as seedBlockchainConfig };
