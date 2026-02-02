/**
 * FundBrave Database Seed Exports
 *
 * This module exports all seed functions for use in the main seed.ts
 * and for independent execution.
 */

// User seeding
export { seedUsers, getSeededUsers } from './users.seed';
export type { SeededUser } from './users.seed';

// Campaign seeding (offline - fake tx hashes)
export { seedCampaigns } from './campaigns.seed';
export type { SeededCampaign } from './campaigns.seed';

// On-chain campaign seeding (creates real blockchain transactions)
export { seedOnChainCampaigns } from './campaigns-onchain.seed';
export type { SeededOnChainCampaign } from './campaigns-onchain.seed';

// Social content seeding
export { seedPosts, seedReposts } from './posts.seed';

// Interaction seeding
export { seedInteractions } from './interactions.seed';

// Blockchain configuration seeding
export {
  seedBaseSepolia,
  seedAllChains,
  seedBlockchainConfig,
} from './blockchain.seed';
