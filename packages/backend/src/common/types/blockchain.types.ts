/**
 * Blockchain-related type definitions
 * @module common/types/blockchain
 */

/**
 * Supported chain IDs mapped to chain names
 */
export enum ChainId {
  ETHEREUM = 1,
  SEPOLIA = 11155111,
  POLYGON = 137,
  MUMBAI = 80001,
  AVALANCHE = 43114,
  FUJI = 43113,
  ARBITRUM = 42161,
  ARBITRUM_SEPOLIA = 421614,
  OPTIMISM = 10,
  OPTIMISM_SEPOLIA = 11155420,
  BASE = 8453,
  BASE_SEPOLIA = 84532,
}

/**
 * Contract names for registry lookup
 */
export enum ContractName {
  IMPACT_DAO_POOL = 'ImpactDAOPool',
  WEALTH_BUILDING_DONATION = 'WealthBuildingDonation',
  PLATFORM_TREASURY = 'PlatformTreasury',
  FUND_BRAVE_TOKEN = 'FundBraveToken',
  STAKING_POOL = 'StakingPool',
  FUNDRAISER_FACTORY = 'FundraiserFactory',
  YIELD_DISTRIBUTOR = 'YieldDistributor',
  // Implementation contracts (for proxy patterns)
  FUNDRAISER_IMPLEMENTATION = 'FundraiserImplementation',
  STAKING_POOL_IMPLEMENTATION = 'StakingPoolImplementation',
}

/**
 * ImpactDAOPool event names
 */
export enum ImpactDAOPoolEvent {
  STAKED = 'Staked',
  UNSTAKED = 'Unstaked',
  YIELD_HARVESTED = 'YieldHarvested',
  YIELD_SPLIT_SET = 'YieldSplitSet',
  STAKER_YIELD_CLAIMED = 'StakerYieldClaimed',
  FBT_REWARD_PAID = 'FBTRewardPaid',
  REWARD_ADDED = 'RewardAdded',
}

/**
 * WealthBuildingDonation event names
 */
export enum WealthBuildingDonationEvent {
  DONATION_MADE = 'DonationMade',
  YIELD_HARVESTED = 'YieldHarvested',
  STOCK_PURCHASED = 'StockPurchased',
  STOCKS_CLAIMED = 'StocksClaimed',
  FUNDRAISER_REGISTERED = 'FundraiserRegistered',
  STOCK_ADDED = 'StockAdded',
  STOCK_REMOVED = 'StockRemoved',
}

/**
 * PlatformTreasury event names
 */
export enum PlatformTreasuryEvent {
  FEE_RECEIVED = 'FeeReceived',
  FEES_STAKED = 'FeesStaked',
  FBT_STAKED = 'FBTStaked',
  FBT_UNSTAKED = 'FBTUnstaked',
  YIELD_CLAIMED = 'YieldClaimed',
  YIELD_HARVESTED = 'YieldHarvested',
  YIELD_DISTRIBUTED = 'YieldDistributed',
}

/**
 * FundBraveToken event names
 */
export enum FundBraveTokenEvent {
  VESTING_SCHEDULE_CREATED = 'VestingScheduleCreated',
  VESTED_TOKENS_CLAIMED = 'VestedTokensClaimed',
  TOKENS_BURNED = 'TokensBurned',
  STAKE_BALANCE_UPDATED = 'StakeBalanceUpdated',
  MINTER_AUTHORIZATION_CHANGED = 'MinterAuthorizationChanged',
}

/**
 * StakingPool event names (enhanced)
 */
export enum StakingPoolEvent {
  STAKED = 'Staked',
  UNSTAKED = 'Unstaked',
  YIELD_SPLIT_SET = 'YieldSplitSet',
  YIELD_HARVESTED = 'YieldHarvested',
}

/**
 * Yield split configuration
 */
export interface YieldSplit {
  daoShare: number; // Basis points (0-10000)
  stakerShare: number; // Basis points
  platformShare: number; // Basis points
}

/**
 * Default yield split configuration (79% DAO, 19% staker, 2% platform)
 */
export const DEFAULT_YIELD_SPLIT: YieldSplit = {
  daoShare: 7900,
  stakerShare: 1900,
  platformShare: 200,
};

/**
 * Minimum platform share in basis points (2%)
 */
export const MIN_PLATFORM_SHARE = 200;

/**
 * Total basis points (100%)
 */
export const TOTAL_BASIS = 10000;

/**
 * WealthBuildingDonation split constants
 */
export const WEALTH_BUILDING_SPLITS = {
  DIRECT_SHARE_BPS: 8000, // 80%
  ENDOWMENT_SHARE_BPS: 2000, // 20%
  CAUSE_YIELD_BPS: 3000, // 30% of yield to cause
  DONOR_YIELD_BPS: 7000, // 70% of yield to donor
  PLATFORM_FEE_BPS: 200, // 2%
} as const;

/**
 * Vesting durations in seconds
 */
export const VESTING_DURATIONS = {
  DONATION_REWARD: 30 * 24 * 60 * 60, // 30 days
  ENGAGEMENT_REWARD: 7 * 24 * 60 * 60, // 7 days
} as const;

/**
 * Raw blockchain event data
 */
export interface BlockchainEventData {
  eventName: string;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  chainId: number;
  args: Record<string, unknown>;
  blockTimestamp: Date;
}

/**
 * ImpactDAOPool Staked event args
 */
export interface StakedEventArgs {
  staker: string;
  amount: bigint;
  split: {
    daoShare: number;
    stakerShare: number;
    platformShare: number;
  };
}

/**
 * ImpactDAOPool YieldHarvested event args
 */
export interface YieldHarvestedEventArgs {
  totalYield: bigint;
  daoShare: bigint;
  totalStakerShare: bigint;
  platformShare: bigint;
}

/**
 * WealthBuildingDonation DonationMade event args
 */
export interface DonationMadeEventArgs {
  donor: string;
  fundraiserId: bigint;
  totalAmount: bigint;
  directAmount: bigint;
  endowmentAmount: bigint;
  platformFee: bigint;
}

/**
 * StockPurchased event args
 */
export interface StockPurchasedEventArgs {
  donor: string;
  stockToken: string;
  usdcAmount: bigint;
  stockAmount: bigint;
}

/**
 * FBTStaked event args
 */
export interface FBTStakedEventArgs {
  staker: string;
  amount: bigint;
}

/**
 * VestingScheduleCreated event args
 */
export interface VestingScheduleCreatedEventArgs {
  recipient: string;
  scheduleId: bigint;
  amount: bigint;
  duration: bigint;
  startTime: bigint;
}

/**
 * TokensBurned event args
 */
export interface TokensBurnedEventArgs {
  account: string;
  amount: bigint;
}
