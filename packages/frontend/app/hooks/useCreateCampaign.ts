/**
 * useCreateCampaign Hook
 * Manages the full campaign creation flow with dual-path support:
 *
 * Web3 path (wallet connected):
 *   1. Call FundraiserFactory.createFundraiser() on-chain via user's wallet
 *   2. Wait for transaction confirmation
 *   3. Extract onChainId from FundraiserCreated event logs
 *   4. Save campaign to backend via GraphQL mutation
 *
 * Web2 path (no wallet / gasless):
 *   1. Call createFundraiserGasless GraphQL mutation
 *   2. Backend wallet pays gas and calls createFundraiserFor() on-chain
 *   3. Campaign is owned by user's managed wallet address on-chain
 *   4. Returns completed campaign from backend
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { decodeEventLog } from 'viem';
import { FUNDRAISER_FACTORY_ABI } from '@/app/lib/contracts/abis';
import { CONTRACTS, BASE_SEPOLIA_ADDRESSES, BASE_SEPOLIA_CHAIN_ID } from '@/app/lib/contracts/config';
import { useCreateFundraiserMutation, useCreateFundraiserGaslessMutation } from '@/app/generated/graphql';
import type { CampaignCreateInput } from '@/app/types/campaign';

// Use env-based address with fallback to hardcoded Base Sepolia address
const FACTORY_ADDRESS = CONTRACTS.FACTORY_ADDRESS || BASE_SEPOLIA_ADDRESSES.fundraiserFactory;

export type CreateCampaignStep =
  | 'idle'
  | 'uploading'
  | 'confirming_wallet'
  | 'mining'
  | 'submitting'        // Gasless: backend is processing
  | 'saving_backend'
  | 'success'
  | 'error';

interface CreateCampaignState {
  step: CreateCampaignStep;
  error: string | null;
  txHash: string | null;
  onChainId: number | null;
  campaignId: string | null; // Backend campaign ID
  isGasless: boolean;        // Whether this was a gasless creation
}

export function useCreateCampaign() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [state, setState] = useState<CreateCampaignState>({
    step: 'idle',
    error: null,
    txHash: null,
    onChainId: null,
    campaignId: null,
    isGasless: false,
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
  const [createFundraiserGaslessMutation] = useCreateFundraiserGaslessMutation();

  // ============================================
  // Web3 path effects (wallet-signed transaction)
  // ============================================

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
          isGasless: false,
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

  // ============================================
  // Gasless path (backend-relayed transaction)
  // ============================================

  const createCampaignGasless = useCallback(
    async (input: CampaignCreateInput) => {
      setState({
        step: 'submitting',
        error: null,
        txHash: null,
        onChainId: null,
        campaignId: null,
        isGasless: true,
      });

      try {
        // Calculate deadline from duration
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + input.duration);

        const result = await createFundraiserGaslessMutation({
          variables: {
            input: {
              name: input.title,
              description: input.description,
              goalAmount: input.goal.toString(),
              deadline: deadline.toISOString(),
              categories: input.categories,
              beneficiary: input.beneficiary || undefined,
              currency: 'USDC',
              images: input.images,
              region: input.region || undefined,
              milestones: [],
            },
          },
        });

        if (!result.data?.createFundraiserGasless) {
          throw new Error('Failed to create campaign. Please try again.');
        }

        const campaign = result.data.createFundraiserGasless;

        setState({
          step: 'success',
          error: null,
          txHash: campaign.txHash || null,
          onChainId: campaign.onChainId ?? null,
          campaignId: campaign.id,
          isGasless: true,
        });
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message.includes('Backend wallet not configured')
            ? 'Gasless creation is temporarily unavailable. Please connect a wallet to create your campaign.'
            : err.message.slice(0, 200)
          : 'Failed to create campaign';
        setState(prev => ({
          ...prev,
          step: 'error',
          error: errorMessage,
        }));
      }
    },
    [createFundraiserGaslessMutation]
  );

  // ============================================
  // Main createCampaign — auto-selects path
  // ============================================

  /**
   * Create a campaign. Automatically chooses the right path:
   * - If wallet is connected → Web3 path (user signs tx)
   * - If no wallet → Gasless path (backend relays tx)
   */
  const createCampaign = useCallback(
    async (input: CampaignCreateInput) => {
      if (isConnected && address) {
        // Web3 path: user signs transaction directly
        resetWrite();
        setState({
          step: 'confirming_wallet',
          error: null,
          txHash: null,
          onChainId: null,
          campaignId: null,
          isGasless: false,
        });

        setPendingInput(input);

        try {
          writeContract({
            address: FACTORY_ADDRESS,
            abi: FUNDRAISER_FACTORY_ABI,
            functionName: 'createFundraiser',
            args: [
              input.title,
              input.images,
              input.categories,
              input.description,
              input.region || '',
              input.beneficiary,
              input.goal,
              BigInt(input.duration),
            ],
            chainId: BASE_SEPOLIA_CHAIN_ID,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initiate transaction';
          setState(prev => ({ ...prev, step: 'error', error: errorMessage }));
          setPendingInput(null);
        }
      } else {
        // Web2/Gasless path: backend relays transaction
        await createCampaignGasless(input);
      }
    },
    [isConnected, address, writeContract, resetWrite, createCampaignGasless]
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
      isGasless: false,
    });
  }, [resetWrite]);

  return {
    createCampaign,
    createCampaignGasless,
    reset,
    step: state.step,
    error: state.error,
    txHash: state.txHash,
    onChainId: state.onChainId,
    campaignId: state.campaignId,
    isGasless: state.isGasless,
    isProcessing: !['idle', 'success', 'error'].includes(state.step),
    /** Whether the user has a connected external wallet (web3 path available) */
    hasWallet: isConnected && !!address,
  };
}
