/**
 * useStake Hook
 * Hook for staking to campaigns via StakingPool contract
 */

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { STAKING_POOL_ABI, ERC20_ABI } from '@/app/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/app/lib/contracts/config';
import { apiClient } from '@/app/lib/api/client';
import type { Address } from 'viem';

export function useStake(stakingPoolAddress: Address) {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

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

  // Check USDC allowance for staking pool
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.mockUsdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, stakingPoolAddress] : undefined,
  });

  // Get current stake
  const { data: currentStake } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'getStake',
    args: address ? [address] : undefined,
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
        args: [stakingPoolAddress, amount],
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve USDC';
      setError(errorMessage);
      setIsProcessing(false);
      return false;
    }
  };

  const stake = async (amount: bigint, campaignId: string) => {
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
        address: stakingPoolAddress,
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
    campaignId: string,
    amount: bigint,
    transactionHash: string
  ) => {
    if (!address) return null;

    try {
      const response = await apiClient.createStake({
        campaignId,
        staker: address,
        amount: amount.toString(),
        transactionHash,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save stake to backend');
      }

      setIsProcessing(false);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save stake';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  // Refetch allowance after approval success
  useEffect(() => {
    if (isSuccess && needsApproval) {
      refetchAllowance();
      setNeedsApproval(false);
    }
  }, [isSuccess, needsApproval, refetchAllowance]);

  return {
    stake,
    approveUSDC,
    saveStakeToBackend,
    checkAllowance,
    isProcessing: isProcessing || isWritePending || isConfirming,
    isSuccess,
    hash,
    usdcBalance,
    currentStake,
    needsApproval,
    error: error || (writeError?.message ?? null),
  };
}
