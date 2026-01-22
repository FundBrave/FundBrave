/**
 * useCreateCampaign Hook
 * Hook for creating campaigns via FundraiserFactory contract and GraphQL
 */

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FUNDRAISER_FACTORY_ABI } from '@/app/lib/contracts/abis';
import { CONTRACT_ADDRESSES, CHAIN_ID } from '@/app/lib/contracts/config';
import { useCreateFundraiserMutation } from '@/app/generated/graphql';
import type { CampaignCreateInput } from '@/app/types/campaign';

export function useCreateCampaign() {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [createFundraiserMutation] = useCreateFundraiserMutation();

  const createCampaign = async (input: CampaignCreateInput) => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convert duration from days to seconds
      const durationInSeconds = BigInt(input.duration * 24 * 60 * 60);

      // Call smart contract
      writeContract({
        address: CONTRACT_ADDRESSES.fundraiserFactory,
        abi: FUNDRAISER_FACTORY_ABI,
        functionName: 'createFundraiser',
        args: [
          address,
          input.title,
          input.description,
          input.goal,
          durationInSeconds,
          input.category,
        ],
        chainId: CHAIN_ID,
      });

      // Note: We'll handle the backend API call after transaction confirmation
      // The calling component should use isSuccess and hash to trigger this
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  const saveCampaignToBackend = async (
    onChainId: number,
    input: CampaignCreateInput,
    transactionHash: string
  ) => {
    if (!address) return null;

    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + input.duration);

      const result = await createFundraiserMutation({
        variables: {
          input: {
            name: input.title,
            description: input.description,
            goalAmount: input.goal.toString(),
            deadline: deadline.toISOString(),
            categories: [input.category],
            beneficiary: address,
            currency: 'USDC',
            images: input.imageUrl ? [input.imageUrl] : [],
            region: undefined,
            milestones: [],
          },
          onChainId,
          txHash: transactionHash,
        },
      });

      if (!result.data?.createFundraiser) {
        throw new Error('Failed to save campaign to backend');
      }

      setIsProcessing(false);
      return result.data.createFundraiser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save campaign';
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  };

  return {
    createCampaign,
    saveCampaignToBackend,
    isProcessing: isProcessing || isWritePending || isConfirming,
    isSuccess,
    hash,
    error: error || (writeError?.message ?? null),
  };
}
