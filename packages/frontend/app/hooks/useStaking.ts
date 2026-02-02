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
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

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
      const errorMsg = 'Please connect your wallet before approving USDC.';
      setError(errorMsg);
      return false;
    }

    setIsProcessing(true);
    setError(null);
    setTxStatus("pending");

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.mockUsdc,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, amount],
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Unable to approve USDC: ${err.message}. Please try again.`
        : 'Failed to approve USDC. This is needed to allow the staking contract to access your tokens.';
      setError(errorMessage);
      setTxStatus("error");
      setIsProcessing(false);
      return false;
    }
  };

  const stake = async (amount: bigint, fundraiserId?: string) => {
    if (!address) {
      const errorMsg = 'Please connect your wallet to stake USDC.';
      setError(errorMsg);
      return null;
    }

    if (usdcBalance && amount > usdcBalance) {
      const balanceFormatted = Number(usdcBalance) / 1e6;
      const amountFormatted = Number(amount) / 1e6;
      setError(
        `Insufficient USDC balance. You need ${amountFormatted} USDC but only have ${balanceFormatted.toFixed(2)} USDC.`
      );
      return null;
    }

    const hasAllowance = await checkAllowance(amount);
    if (!hasAllowance) {
      setError('Please approve USDC first by clicking the "Approve USDC" button.');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setTxStatus("pending");

    try {
      writeContract({
        address: poolAddress,
        abi: STAKING_POOL_ABI,
        functionName: 'stake',
        args: [amount],
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Unable to stake: ${err.message}. Please check your wallet and try again.`
        : 'Failed to stake. Please ensure you have sufficient USDC and approved the contract.';
      setError(errorMessage);
      setTxStatus("error");
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

  // Handle transaction success
  useState(() => {
    if (isSuccess) {
      setTxStatus("success");
      setIsProcessing(false);
      setError(null);
    }
  });

  // Handle write errors
  useState(() => {
    if (writeError) {
      setTxStatus("error");
      setIsProcessing(false);

      // Parse common error messages for better UX
      let errorMsg = writeError.message;
      if (errorMsg.includes("user rejected")) {
        errorMsg = "Transaction was rejected. Please try again when you're ready.";
      } else if (errorMsg.includes("insufficient funds")) {
        errorMsg = "Insufficient funds to complete this transaction. Please check your wallet balance.";
      } else if (errorMsg.includes("gas")) {
        errorMsg = "Network fee (gas) estimation failed. Please try again or increase gas limit.";
      }

      setError(errorMsg);
    }
  });

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
    txStatus,
  };
}
