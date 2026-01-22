import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Staking Pool ABI
const STAKING_POOL_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getStakedBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'getPendingRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'rewards', type: 'uint256' }],
  },
  {
    name: 'getTotalStaked',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'total', type: 'uint256' }],
  },
  {
    name: 'getAPY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'apy', type: 'uint256' }],
  },
] as const;

/**
 * Hook to get staked balance
 */
export function useStakedBalance(
  address: `0x${string}` | undefined,
  poolAddress: `0x${string}`
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: poolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'getStakedBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    staked: data || BigInt(0),
    stakedFormatted: data ? formatUnits(data, 18) : '0',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get pending rewards
 */
export function usePendingRewards(
  address: `0x${string}` | undefined,
  poolAddress: `0x${string}`
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: poolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    rewards: data || BigInt(0),
    rewardsFormatted: data ? formatUnits(data, 18) : '0',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get total staked in pool
 */
export function useTotalStaked(poolAddress: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: poolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'getTotalStaked',
  });

  return {
    totalStaked: data || BigInt(0),
    totalStakedFormatted: data ? formatUnits(data, 18) : '0',
    isLoading,
    error,
  };
}

/**
 * Hook to get pool APY
 */
export function usePoolAPY(poolAddress: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: poolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'getAPY',
  });

  // APY is usually returned as basis points (100 = 1%)
  const apyPercent = data ? Number(data) / 100 : 0;

  return {
    apy: data || BigInt(0),
    apyPercent,
    isLoading,
    error,
  };
}

/**
 * Hook to stake tokens
 */
export function useStake(poolAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = async (amount: string) => {
    const value = parseUnits(amount, 18);

    writeContract({
      address: poolAddress,
      abi: STAKING_POOL_ABI,
      functionName: 'stake',
      args: [value],
    });
  };

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to unstake tokens
 */
export function useUnstake(poolAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = async (amount: string) => {
    const value = parseUnits(amount, 18);

    writeContract({
      address: poolAddress,
      abi: STAKING_POOL_ABI,
      functionName: 'unstake',
      args: [value],
    });
  };

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to claim staking rewards
 */
export function useClaimRewards(poolAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = async () => {
    writeContract({
      address: poolAddress,
      abi: STAKING_POOL_ABI,
      functionName: 'claimRewards',
    });
  };

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Convenience hook that combines all staking data for a user
 */
export function useStakingPoolData(
  address: `0x${string}` | undefined,
  poolAddress: `0x${string}`
) {
  const { staked, stakedFormatted, isLoading: stakingLoading } = useStakedBalance(address, poolAddress);
  const { rewards, rewardsFormatted, isLoading: rewardsLoading } = usePendingRewards(address, poolAddress);
  const { totalStaked, totalStakedFormatted, isLoading: totalLoading } = useTotalStaked(poolAddress);
  const { apyPercent, isLoading: apyLoading } = usePoolAPY(poolAddress);

  return {
    staked,
    stakedFormatted,
    rewards,
    rewardsFormatted,
    totalStaked,
    totalStakedFormatted,
    apyPercent,
    isLoading: stakingLoading || rewardsLoading || totalLoading || apyLoading,
  };
}
