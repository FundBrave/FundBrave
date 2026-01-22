/**
 * Contract Interaction Hooks
 *
 * This module exports all contract interaction hooks for the FundBrave platform.
 * All hooks use wagmi v2 and viem for type-safe blockchain interactions.
 */

// Fundraiser hooks
export {
  useFundraiserDetails,
  useCreateFundraiser,
  useDonate,
  useWithdrawFunds,
  type FundraiserDetails,
} from './useFundraiser';

// FBT Token hooks
export {
  useFBTBalance,
  useFBTTotalSupply,
  useVotingPower,
  useTransferFBT,
  useApproveFBT,
  useFBTAllowance,
  useStakeFBT,
  useUnstakeFBT,
} from './useFBTToken';

// Staking Pool hooks
export {
  useStakedBalance,
  usePendingRewards,
  useTotalStaked,
  usePoolAPY,
  useStake,
  useUnstake,
  useClaimRewards,
  useStakingPoolData,
} from './useStakingPools';

// Governance hooks
export {
  useProposal,
  useHasVoted,
  useQuorum,
  useProposalCount,
  useCreateProposal,
  useVote,
  useExecuteProposal,
  useProposalWithVoteStatus,
  type Proposal,
} from './useGovernance';

// Contract addresses (to be configured per environment)
export const CONTRACT_ADDRESSES = {
  // Mainnet addresses (replace with actual deployed addresses)
  FUNDRAISER: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  FBT_TOKEN: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  GLOBAL_STAKING_POOL: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  DAO_STAKING_POOL: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  GOVERNANCE: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Testnet addresses (Sepolia, for example)
  TESTNET: {
    FUNDRAISER: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    FBT_TOKEN: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    GLOBAL_STAKING_POOL: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    DAO_STAKING_POOL: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    GOVERNANCE: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },

  // Local development addresses (Hardhat/Anvil)
  LOCAL: {
    FUNDRAISER: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
    FBT_TOKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
    GLOBAL_STAKING_POOL: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
    DAO_STAKING_POOL: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as `0x${string}`,
    GOVERNANCE: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as `0x${string}`,
  },
};

/**
 * Helper function to get contract addresses based on environment
 */
export function getContractAddresses(chainId: number) {
  // Mainnet
  if (chainId === 1) {
    return CONTRACT_ADDRESSES;
  }

  // Sepolia testnet
  if (chainId === 11155111) {
    return CONTRACT_ADDRESSES.TESTNET;
  }

  // Local development
  if (chainId === 31337 || chainId === 1337) {
    return CONTRACT_ADDRESSES.LOCAL;
  }

  // Default to local for unknown chains
  return CONTRACT_ADDRESSES.LOCAL;
}
