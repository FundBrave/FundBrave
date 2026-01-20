/**
 * useDonate Hook
 * Hook for donating to campaigns via Fundraiser contract
 */

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { FUNDRAISER_ABI, ERC20_ABI } from '@/app/lib/contracts/abis';
import { CONTRACT_ADDRESSES, USDC_DECIMALS } from '@/app/lib/contracts/config';
import { apiClient } from '@/app/lib/api/client';
import type { Address } from 'viem';

export function useDonate(campaignAddress: Address) {
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

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.mockUsdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, campaignAddress] : undefined,
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
        args: [campaignAddress, amount],
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve USDC';
      setError(errorMessage);
      setIsProcessing(false);
      return false;
    }
  };

  const donate = async (amount: bigint, campaignId: string) => {
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
        address: campaignAddress,
        abi: FUNDRAISER_ABI,
        functionName: 'donateERC20',
        args: [CONTRACT_ADDRESSES.mockUsdc, amount],
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to donate';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  const saveDonationToBackend = async (
    campaignId: string,
    amount: bigint,
    transactionHash: string
  ) => {
    if (!address) return null;

    try {
      const response = await apiClient.createDonation({
        campaignId,
        donor: address,
        amount: amount.toString(),
        token: CONTRACT_ADDRESSES.mockUsdc,
        transactionHash,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save donation to backend');
      }

      setIsProcessing(false);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save donation';
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
    donate,
    approveUSDC,
    saveDonationToBackend,
    checkAllowance,
    isProcessing: isProcessing || isWritePending || isConfirming,
    isSuccess,
    hash,
    usdcBalance,
    needsApproval,
    error: error || (writeError?.message ?? null),
  };
}
