/**
 * useCreateCampaign Hook
 * Manages the full campaign creation flow:
 *   1. Call FundraiserFactory.createFundraiser() on-chain
 *   2. Wait for transaction confirmation
 *   3. Extract onChainId from FundraiserCreated event logs
 *   4. Save campaign to backend via GraphQL mutation
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { decodeEventLog } from 'viem';
import { FUNDRAISER_FACTORY_ABI } from '@/app/lib/contracts/abis';
import { CONTRACTS, BASE_SEPOLIA_ADDRESSES, BASE_SEPOLIA_CHAIN_ID } from '@/app/lib/contracts/config';
import { useCreateFundraiserMutation } from '@/app/generated/graphql';
import type { CampaignCreateInput } from '@/app/types/campaign';

// Use env-based address with fallback to hardcoded Base Sepolia address
const FACTORY_ADDRESS = CONTRACTS.FACTORY_ADDRESS || BASE_SEPOLIA_ADDRESSES.fundraiserFactory;

export type CreateCampaignStep =
  | 'idle'
  | 'uploading'
  | 'confirming_wallet'
  | 'mining'
  | 'saving_backend'
  | 'success'
  | 'error';

interface CreateCampaignState {
  step: CreateCampaignStep;
  error: string | null;
  txHash: string | null;
  onChainId: number | null;
  campaignId: string | null; // Backend campaign ID
}

export function useCreateCampaign() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [state, setState] = useState<CreateCampaignState>({
    step: 'idle',
    error: null,
    txHash: null,
    onChainId: null,
    campaignId: null,
  });

  // Store the input for use after tx confirmation
  const [pendingInput, setPendingInput] = useState<CampaignCreateInput | null>(null);

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isTxConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const [createFundraiserMutation] = useCreateFundraiserMutation();

  // Update step when write is pending
  useEffect(() => {
    if (isWritePending) {
      setState(prev => ({ ...prev, step: 'confirming_wallet' }));
    }
  }, [isWritePending]);

  // Update step when mining
  useEffect(() => {
    if (hash && isConfirming) {
      setState(prev => ({ ...prev, step: 'mining', txHash: hash }));
    }
  }, [hash, isConfirming]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      const message = writeError.message.includes('User rejected')
        ? 'Transaction rejected by user'
        : writeError.message.includes('insufficient funds')
          ? 'Insufficient funds for gas'
          : `Transaction failed: ${writeError.message.slice(0, 200)}`;
      setState(prev => ({ ...prev, step: 'error', error: message }));
    }
  }, [writeError]);

  // Handle successful transaction — extract onChainId and save to backend
  useEffect(() => {
    if (!isTxConfirmed || !receipt || !pendingInput || !hash) return;
    if (state.step === 'success' || state.step === 'saving_backend') return;

    const saveToBackend = async () => {
      setState(prev => ({ ...prev, step: 'saving_backend' }));

      try {
        // Extract onChainId from FundraiserCreated event logs
        let onChainId: number | null = null;

        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: FUNDRAISER_FACTORY_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === 'FundraiserCreated') {
              // The 'id' is the 3rd indexed arg (uint256)
              onChainId = Number((decoded.args as any).id);
              break;
            }
          } catch {
            // Not a FundraiserCreated event from our ABI, skip
          }
        }

        if (onChainId === null) {
          throw new Error('Could not extract campaign ID from transaction. The transaction may have failed silently.');
        }

        // Read the staking pool address from the factory contract
        let stakingPoolAddr: string | undefined;
        try {
          if (publicClient) {
            const poolAddr = await publicClient.readContract({
              address: FACTORY_ADDRESS,
              abi: FUNDRAISER_FACTORY_ABI,
              functionName: 'stakingPools',
              args: [BigInt(onChainId)],
            }) as string;
            if (poolAddr && poolAddr !== '0x0000000000000000000000000000000000000000') {
              stakingPoolAddr = poolAddr;
            }
          }
        } catch {
          // Non-critical — staking pool address can be read later
          console.warn('Could not read staking pool address from contract');
        }

        // Calculate deadline from duration
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + pendingInput.duration);

        // Save to backend via GraphQL
        const result = await createFundraiserMutation({
          variables: {
            input: {
              name: pendingInput.title,
              description: pendingInput.description,
              goalAmount: pendingInput.goal.toString(),
              deadline: deadline.toISOString(),
              categories: pendingInput.categories,
              beneficiary: pendingInput.beneficiary,
              currency: 'USDC',
              images: pendingInput.images,
              region: pendingInput.region || undefined,
              milestones: [],
            },
            onChainId,
            txHash: hash,
            stakingPoolAddr,
          },
        });

        if (!result.data?.createFundraiser) {
          throw new Error('Backend failed to save campaign. The on-chain campaign was created successfully.');
        }

        setState({
          step: 'success',
          error: null,
          txHash: hash,
          onChainId,
          campaignId: result.data.createFundraiser.id,
        });

        setPendingInput(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save campaign to backend';
        setState(prev => ({
          ...prev,
          step: 'error',
          error: errorMessage,
        }));
      }
    };

    saveToBackend();
  }, [isTxConfirmed, receipt, pendingInput, hash, createFundraiserMutation, state.step, publicClient]);

  /**
   * Create a campaign on-chain and save to backend.
   * The full flow is:
   *   1. writeContract → user confirms in wallet
   *   2. Wait for tx confirmation (useWaitForTransactionReceipt)
   *   3. Parse event logs for onChainId
   *   4. Call createFundraiserMutation to save in DB
   */
  const createCampaign = useCallback(
    async (input: CampaignCreateInput) => {
      if (!address) {
        setState(prev => ({ ...prev, step: 'error', error: 'Wallet not connected' }));
        return;
      }

      // Reset state
      resetWrite();
      setState({
        step: 'confirming_wallet',
        error: null,
        txHash: null,
        onChainId: null,
        campaignId: null,
      });

      // Store input for post-tx processing
      setPendingInput(input);

      try {
        // Call smart contract — 8 params matching Solidity createFundraiser
        writeContract({
          address: FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'createFundraiser',
          args: [
            input.title,                    // name: string
            input.images,                   // images: string[]
            input.categories,               // categories: string[]
            input.description,              // description: string
            input.region || '',             // region: string
            input.beneficiary,              // beneficiary: address
            input.goal,                     // goal: uint256
            BigInt(input.duration),          // durationInDays: uint256
          ],
          chainId: BASE_SEPOLIA_CHAIN_ID,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initiate transaction';
        setState(prev => ({ ...prev, step: 'error', error: errorMessage }));
        setPendingInput(null);
      }
    },
    [address, writeContract, resetWrite]
  );

  /**
   * Reset the hook to initial state (for retries or creating another campaign)
   */
  const reset = useCallback(() => {
    resetWrite();
    setPendingInput(null);
    setState({
      step: 'idle',
      error: null,
      txHash: null,
      onChainId: null,
      campaignId: null,
    });
  }, [resetWrite]);

  return {
    createCampaign,
    reset,
    step: state.step,
    error: state.error,
    txHash: state.txHash,
    onChainId: state.onChainId,
    campaignId: state.campaignId,
    isProcessing: !['idle', 'success', 'error'].includes(state.step),
  };
}
