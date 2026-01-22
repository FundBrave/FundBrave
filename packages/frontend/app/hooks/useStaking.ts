/**
 * useStaking Hooks
 * Hooks for staking operations via GraphQL and smart contracts
 */

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import {
  useGetFundraiserStakesQuery,
  useGetMyStakesQuery,
  useGetMyFbtStakeQuery,
  useGetMyImpactDaoStakeQuery,
  useRecordStakeMutation,
} from '@/app/generated/graphql';
import { STAKING_POOL_ABI, ERC20_ABI } from '@/app/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/app/lib/contracts/config';
import type { Address } from 'viem';

// Hook for fetching fundraiser staking pool stats
export function useFundraiserStakes(fundraiserId: string) {
  const { data, loading, error, refetch } = useGetFundraiserStakesQuery({
    variables: {
      fundraiserId,
      limit: 50,
      offset: 0,
    },
    skip: !fundraiserId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    stakes: data?.fundraiserStakes?.items || [],
    total: data?.fundraiserStakes?.total || 0,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching user's stakes across all campaigns
export function useMyStakes() {
  const { data, loading, error, refetch } = useGetMyStakesQuery({
    variables: {
      limit: 50,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  return {
    stakes: data?.myStakes?.items || [],
    total: data?.myStakes?.total || 0,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching user's FBT stake
export function useMyFBTStake() {
  const { data, loading, error, refetch } = useGetMyFbtStakeQuery({
    fetchPolicy: 'cache-and-network',
  });

  return {
    stake: data?.myFBTStake || null,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching user's Impact DAO stake
export function useMyImpactDAOStake() {
  const { data, loading, error, refetch } = useGetMyImpactDaoStakeQuery({
    fetchPolicy: 'cache-and-network',
  });

  return {
    stake: data?.myImpactDAOStake || null,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for staking to a pool
export function useStake(poolAddress: Address) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  const [recordStakeMutation] = useRecordStakeMutation();

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.mockUsdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.mockUsdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, poolAddress] : undefined,
  });

  const checkAllowance = async (amount: bigint) => {
    if (!allowance) {
      setNeedsApproval(true);
      return false;
    }

    const hasAllowance = allowance >= amount;
    setNeedsApproval(!hasAllowance);
    return hasAllowance;
  };

  const approveUSDC = async (amount: bigint) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsProcessing(true);
    setError(null);

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.mockUsdc,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, amount],
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve USDC';
      setError(errorMessage);
      setIsProcessing(false);
      return false;
    }
  };

  const stake = async (amount: bigint, fundraiserId?: string) => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    if (usdcBalance && amount > usdcBalance) {
      setError('Insufficient USDC balance');
      return null;
    }

    const hasAllowance = await checkAllowance(amount);
    if (!hasAllowance) {
      setError('Please approve USDC first');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      writeContract({
        address: poolAddress,
        abi: STAKING_POOL_ABI,
        functionName: 'stake',
        args: [amount],
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stake';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  const saveStakeToBackend = async (
    fundraiserId: string,
    amount: bigint,
    transactionHash: string,
    poolAddress: string
  ) => {
    if (!address) return null;

    try {
      const result = await recordStakeMutation({
        variables: {
          input: {
            fundraiserId,
            amount: amount.toString(),
            shares: amount.toString(), // TODO: Calculate actual shares based on pool ratio
            poolAddress,
            txHash: transactionHash,
            chainId: chainId,
          },
        },
      });

      if (!result.data?.recordStake) {
        throw new Error('Failed to save stake to backend');
      }

      setIsProcessing(false);
      return result.data.recordStake;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save stake';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  return {
    stake,
    approveUSDC,
    saveStakeToBackend,
    checkAllowance,
    isProcessing: isProcessing || isWritePending || isConfirming,
    isSuccess,
    hash,
    usdcBalance,
    needsApproval,
    error: error || (writeError?.message ?? null),
    refetchAllowance,
  };
}
