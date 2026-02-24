/**
 * Contract Deployment Addresses Configuration
 * Contains deployed contract addresses for each supported network
 */

export interface ContractAddresses {
  fundraiserFactory: string;
  fundBraveToken: string;
  impactDAOPool: string;
  wealthBuildingDonation: string;
  platformTreasury: string;
  usdc: string;
  aUsdc: string;
  aavePool: string;
  receiptOFT?: string;
  // Implementation contracts (for proxy patterns)
  fundraiserImplementation?: string;
  stakingPoolImplementation?: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: ContractAddresses;
  isTestnet: boolean;
  blockConfirmations: number;
}

// ==================== Network Configurations ====================

/**
 * Status L2 Testnet Configuration
 * Primary testnet for FundBrave development
 */
export const STATUS_L2_TESTNET: NetworkConfig = {
  chainId: 31337,
  name: 'Status L2 Testnet',
  rpcUrl: process.env.STATUS_L2_RPC_URL || 'https://rpc.testnet.status.im',
  explorerUrl: 'https://explorer.testnet.status.im',
  nativeCurrency: {
    name: 'Status Token',
    symbol: 'SNT',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory:
      process.env.FUNDRAISER_FACTORY_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    fundBraveToken:
      process.env.FBT_ADDRESS || '0x0000000000000000000000000000000000000000',
    impactDAOPool:
      process.env.IMPACT_DAO_POOL_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    wealthBuildingDonation:
      process.env.WEALTH_BUILDING_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    platformTreasury:
      process.env.PLATFORM_TREASURY_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    usdc:
      process.env.USDC_ADDRESS || '0x0000000000000000000000000000000000000000',
    aUsdc:
      process.env.AUSDC_ADDRESS || '0x0000000000000000000000000000000000000000',
    aavePool:
      process.env.AAVE_POOL_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    receiptOFT: process.env.RECEIPT_OFT_ADDRESS,
  },
  isTestnet: true,
  blockConfirmations: 2,
};

/**
 * Sepolia Testnet Configuration
 * Ethereum testnet for cross-chain testing
 */
export const SEPOLIA_TESTNET: NetworkConfig = {
  chainId: 11155111,
  name: 'Sepolia',
  rpcUrl:
    process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_API_KEY',
  explorerUrl: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SEP',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory:
      process.env.SEPOLIA_FUNDRAISER_FACTORY ||
      '0x0000000000000000000000000000000000000000',
    fundBraveToken:
      process.env.SEPOLIA_FBT || '0x0000000000000000000000000000000000000000',
    impactDAOPool:
      process.env.SEPOLIA_IMPACT_DAO_POOL ||
      '0x0000000000000000000000000000000000000000',
    wealthBuildingDonation:
      process.env.SEPOLIA_WEALTH_BUILDING ||
      '0x0000000000000000000000000000000000000000',
    platformTreasury:
      process.env.SEPOLIA_PLATFORM_TREASURY ||
      '0x0000000000000000000000000000000000000000',
    usdc:
      process.env.SEPOLIA_USDC || '0x0000000000000000000000000000000000000000',
    aUsdc:
      process.env.SEPOLIA_AUSDC || '0x0000000000000000000000000000000000000000',
    aavePool:
      process.env.SEPOLIA_AAVE_POOL ||
      '0x0000000000000000000000000000000000000000',
  },
  isTestnet: true,
  blockConfirmations: 3,
};

/**
 * Polygon Mainnet Configuration
 * Production network for FundBrave
 */
export const POLYGON_MAINNET: NetworkConfig = {
  chainId: 137,
  name: 'Polygon',
  rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory:
      process.env.POLYGON_FUNDRAISER_FACTORY ||
      '0x0000000000000000000000000000000000000000',
    fundBraveToken:
      process.env.POLYGON_FBT || '0x0000000000000000000000000000000000000000',
    impactDAOPool:
      process.env.POLYGON_IMPACT_DAO_POOL ||
      '0x0000000000000000000000000000000000000000',
    wealthBuildingDonation:
      process.env.POLYGON_WEALTH_BUILDING ||
      '0x0000000000000000000000000000000000000000',
    platformTreasury:
      process.env.POLYGON_PLATFORM_TREASURY ||
      '0x0000000000000000000000000000000000000000',
    usdc:
      process.env.POLYGON_USDC || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    aUsdc:
      process.env.POLYGON_AUSDC || '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
    aavePool:
      process.env.POLYGON_AAVE_POOL ||
      '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  isTestnet: false,
  blockConfirmations: 64,
};

/**
 * Arbitrum One Configuration
 * L2 network for lower fees
 */
export const ARBITRUM_ONE: NetworkConfig = {
  chainId: 42161,
  name: 'Arbitrum One',
  rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  explorerUrl: 'https://arbiscan.io',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory:
      process.env.ARBITRUM_FUNDRAISER_FACTORY ||
      '0x0000000000000000000000000000000000000000',
    fundBraveToken:
      process.env.ARBITRUM_FBT || '0x0000000000000000000000000000000000000000',
    impactDAOPool:
      process.env.ARBITRUM_IMPACT_DAO_POOL ||
      '0x0000000000000000000000000000000000000000',
    wealthBuildingDonation:
      process.env.ARBITRUM_WEALTH_BUILDING ||
      '0x0000000000000000000000000000000000000000',
    platformTreasury:
      process.env.ARBITRUM_PLATFORM_TREASURY ||
      '0x0000000000000000000000000000000000000000',
    usdc:
      process.env.ARBITRUM_USDC ||
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    aUsdc:
      process.env.ARBITRUM_AUSDC ||
      '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    aavePool:
      process.env.ARBITRUM_AAVE_POOL ||
      '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  isTestnet: false,
  blockConfirmations: 64,
};

/**
 * Local Development Configuration (Hardhat)
 */
export const LOCALHOST: NetworkConfig = {
  chainId: 31337,
  name: 'Localhost',
  rpcUrl: 'http://127.0.0.1:8545',
  explorerUrl: '',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory:
      process.env.LOCAL_FUNDRAISER_FACTORY ||
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    fundBraveToken:
      process.env.LOCAL_FBT || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    impactDAOPool:
      process.env.LOCAL_IMPACT_DAO_POOL ||
      '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    wealthBuildingDonation:
      process.env.LOCAL_WEALTH_BUILDING ||
      '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    platformTreasury:
      process.env.LOCAL_PLATFORM_TREASURY ||
      '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    usdc:
      process.env.LOCAL_USDC || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    aUsdc:
      process.env.LOCAL_AUSDC || '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    aavePool:
      process.env.LOCAL_AAVE_POOL ||
      '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  },
  isTestnet: true,
  blockConfirmations: 1,
};

/**
 * Base Sepolia Testnet Configuration
 * Primary testnet for FundBrave deployed contracts
 */
export const BASE_SEPOLIA_TESTNET: NetworkConfig = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory:
      process.env.BASE_SEPOLIA_FUNDRAISER_FACTORY ||
      '0xb89D6039dE729f6c951862EB177795Ac4aDfD2cd',
    fundBraveToken:
      process.env.BASE_SEPOLIA_FBT ||
      '0xE42A6ff84160Ac399607667C32392378Bbb270E0',
    impactDAOPool:
      process.env.BASE_SEPOLIA_IMPACT_DAO_POOL ||
      '0x0000000000000000000000000000000000000000', // Not deployed yet
    wealthBuildingDonation:
      process.env.BASE_SEPOLIA_WEALTH_BUILDING ||
      '0x34329F963C4C67BE258aD5ED4bB0769B81FD9034',
    platformTreasury:
      process.env.BASE_SEPOLIA_PLATFORM_TREASURY ||
      '0x664AbB27C9c3d287117676c77B6A1c88B831D836',
    usdc:
      process.env.BASE_SEPOLIA_USDC ||
      '0xf269f54304f8DB2dB613341CC7E189B02BEf98dE', // MockUSDC on Base Sepolia
    aUsdc:
      process.env.BASE_SEPOLIA_AUSDC ||
      '0x0000000000000000000000000000000000000000', // Aave aUSDC (if available on Base Sepolia)
    aavePool:
      process.env.BASE_SEPOLIA_AAVE_POOL ||
      '0x0000000000000000000000000000000000000000', // Aave Pool (if available on Base Sepolia)
    // Implementation contracts
    fundraiserImplementation:
      process.env.BASE_SEPOLIA_FUNDRAISER_IMPL ||
      '0xf79732B4D25521F2C8d8619c568C065fBf69bc9e',
    stakingPoolImplementation:
      process.env.BASE_SEPOLIA_STAKING_POOL_IMPL ||
      '0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8',
  },
  isTestnet: true,
  blockConfirmations: 2,
};

/**
 * Base Mainnet Configuration
 * Production network for FundBrave on Base
 */
export const BASE_MAINNET: NetworkConfig = {
  chainId: 8453,
  name: 'Base',
  rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  explorerUrl: 'https://basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  contracts: {
    fundraiserFactory:
      process.env.BASE_FUNDRAISER_FACTORY ||
      '0x0000000000000000000000000000000000000000',
    fundBraveToken:
      process.env.BASE_FBT || '0x0000000000000000000000000000000000000000',
    impactDAOPool:
      process.env.BASE_IMPACT_DAO_POOL ||
      '0x0000000000000000000000000000000000000000',
    wealthBuildingDonation:
      process.env.BASE_WEALTH_BUILDING ||
      '0x0000000000000000000000000000000000000000',
    platformTreasury:
      process.env.BASE_PLATFORM_TREASURY ||
      '0x0000000000000000000000000000000000000000',
    usdc:
      process.env.BASE_USDC || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Circle's USDC on Base
    aUsdc:
      process.env.BASE_AUSDC || '0x0000000000000000000000000000000000000000',
    aavePool:
      process.env.BASE_AAVE_POOL ||
      '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5', // Aave V3 Pool on Base
  },
  isTestnet: false,
  blockConfirmations: 12,
};

// ==================== Network Registry ====================

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // Only initialize networks we actually use to avoid RPC auth errors
  // Other networks can be re-enabled when contracts are deployed there
  // 31337: LOCALHOST,  // Commented out - not running local Hardhat node
  // 11155111: SEPOLIA_TESTNET,  // No contracts deployed
  // 137: POLYGON_MAINNET,  // 401 Unauthorized - no valid API key
  // 42161: ARBITRUM_ONE,  // No contracts deployed
  84532: BASE_SEPOLIA_TESTNET,  // Primary testnet - contracts deployed here
  // 8453: BASE_MAINNET,  // Enable when ready for production
};

// Default network for the application
// Changed default from 31337 (localhost) to 84532 (Base Sepolia) where contracts are deployed
export const DEFAULT_CHAIN_ID = parseInt(
  process.env.DEFAULT_CHAIN_ID || '84532',
);
export const DEFAULT_NETWORK =
  SUPPORTED_NETWORKS[DEFAULT_CHAIN_ID] || BASE_SEPOLIA_TESTNET;

/**
 * Get network configuration by chain ID
 */
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS[chainId];
}

/**
 * Get contract addresses for a chain
 */
export function getContractAddresses(
  chainId: number,
): ContractAddresses | undefined {
  const network = SUPPORTED_NETWORKS[chainId];
  return network?.contracts;
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in SUPPORTED_NETWORKS;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(SUPPORTED_NETWORKS).map(Number);
}

/**
 * Contract names for type safety
 */
export type ContractName = keyof ContractAddresses;

export const CONTRACT_NAMES: ContractName[] = [
  'fundraiserFactory',
  'fundBraveToken',
  'impactDAOPool',
  'wealthBuildingDonation',
  'platformTreasury',
  'usdc',
  'aUsdc',
  'aavePool',
  'receiptOFT',
  'fundraiserImplementation',
  'stakingPoolImplementation',
];
