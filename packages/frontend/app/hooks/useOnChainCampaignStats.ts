'use client'

/**
 * useOnChainCampaignStats Hook
 * Reads campaign stats (totalDonations, donorsCount) directly from the on-chain
 * Fundraiser contract. This ensures the displayed stats are always current,
 * even when the backend hasn't synced the latest on-chain state.
 *
 * No aggressive polling — data is cached and only refetched on demand
 * (e.g., after a donation via the returned `refetch` function).
 */

import { useReadContract } from 'wagmi'
import { formatUnits, Address } from 'viem'
import {
  FUNDRAISER_FACTORY_ABI,
  FUNDRAISER_ABI,
} from '@/app/lib/contracts/abis'
import { CONTRACTS, USDC_DECIMALS } from '@/app/lib/contracts/config'

interface OnChainCampaignStats {
  /** Amount raised in human-readable units (e.g., 150.5 for 150.5 USDC) */
  amountRaised: number
  /** Number of unique donors */
  donorsCount: number
  /** Goal amount in human-readable units */
  goal: number
  /** Whether the fundraiser address was successfully resolved */
  isLoaded: boolean
  /** Whether data is still loading */
  isLoading: boolean
  /** The on-chain fundraiser contract address */
  fundraiserAddress?: Address
  /** Refetch all on-chain stats (call after donation) */
  refetch: () => void
}

export function useOnChainCampaignStats(onChainId?: number): OnChainCampaignStats {
  const enabled = onChainId !== undefined && onChainId >= 0

  // Step 1: Get the Fundraiser contract address from the factory
  const { data: fundraiserAddress, isLoading: isLoadingAddress } = useReadContract({
    address: CONTRACTS.FACTORY_ADDRESS,
    abi: FUNDRAISER_FACTORY_ABI,
    functionName: 'getFundraiserById',
    args: enabled ? [BigInt(onChainId)] : undefined,
    query: {
      enabled,
      staleTime: Infinity, // Address never changes, cache forever
    },
  })

  const hasAddress = !!fundraiserAddress && fundraiserAddress !== '0x0000000000000000000000000000000000000000'

  // Step 2: Read totalDonations from the Fundraiser contract
  const { data: totalDonations, isLoading: isLoadingDonations, refetch: refetchDonations } = useReadContract({
    address: fundraiserAddress as Address,
    abi: FUNDRAISER_ABI,
    functionName: 'totalDonations',
    query: {
      enabled: hasAddress,
      staleTime: 60_000, // Cache for 60s, no aggressive polling
    },
  })

  // Step 3: Read donorsCount from the Fundraiser contract
  const { data: donorsCount, isLoading: isLoadingDonors, refetch: refetchDonors } = useReadContract({
    address: fundraiserAddress as Address,
    abi: FUNDRAISER_ABI,
    functionName: 'donorsCount',
    query: {
      enabled: hasAddress,
      staleTime: 60_000,
    },
  })

  // Step 4: Read goal from the Fundraiser contract
  const { data: goal, isLoading: isLoadingGoal } = useReadContract({
    address: fundraiserAddress as Address,
    abi: FUNDRAISER_ABI,
    functionName: 'goal',
    query: {
      enabled: hasAddress,
      staleTime: Infinity, // Goal never changes
    },
  })

  const isLoading = isLoadingAddress || (hasAddress && (isLoadingDonations || isLoadingDonors || isLoadingGoal))

  // Manual refetch function — call after a donation to update stats
  const refetch = () => {
    refetchDonations()
    refetchDonors()
  }

  return {
    amountRaised: totalDonations !== undefined
      ? parseFloat(formatUnits(totalDonations as bigint, USDC_DECIMALS))
      : 0,
    donorsCount: donorsCount !== undefined
      ? Number(donorsCount)
      : 0,
    goal: goal !== undefined
      ? parseFloat(formatUnits(goal as bigint, USDC_DECIMALS))
      : 0,
    isLoaded: hasAddress && totalDonations !== undefined,
    isLoading,
    fundraiserAddress: hasAddress ? fundraiserAddress as Address : undefined,
    refetch,
  }
}
