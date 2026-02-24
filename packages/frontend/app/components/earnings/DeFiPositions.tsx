'use client'

import { useAccount, useReadContract } from 'wagmi'
import { Address, formatUnits } from 'viem'
import { TrendingUp, Coins, ArrowRight, RefreshCw, Heart } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  FUNDRAISER_ABI,
  FUNDRAISER_FACTORY_ABI,
  STAKING_POOL_ABI,
  WEALTH_BUILDING_DONATION_ABI,
} from '@/app/lib/contracts/abis'
import { CONTRACTS, formatUSDC } from '@/app/lib/contracts/config'

/**
 * Campaign position data from the GraphQL API
 */
interface CampaignPosition {
  id: string
  title: string
  onChainId: number
  stakingPoolAddr?: string
}

interface DeFiPositionsProps {
  /** List of campaigns the user has interacted with */
  campaigns: CampaignPosition[]
  className?: string
}

/**
 * DeFiPositions — Shows aggregated staking & wealth building positions
 * across all campaigns the user has interacted with.
 *
 * Renders per-campaign position cards and a total summary at the top.
 */
export function DeFiPositions({ campaigns, className }: DeFiPositionsProps) {
  const { address } = useAccount()

  if (!address || campaigns.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">My Positions</h3>
        <span className="text-xs text-text-tertiary">On-chain data</span>
      </div>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <CampaignPositionCard
            key={campaign.id}
            campaign={campaign}
            userAddress={address}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual campaign position card showing staking + wealth building data.
 * Only renders if the user has at least one active position.
 */
function CampaignPositionCard({
  campaign,
  userAddress,
}: {
  campaign: CampaignPosition
  userAddress: Address
}) {
  const stakingPoolAddress = campaign.stakingPoolAddr as Address | undefined

  // ===== Fundraiser address lookup (for direct donation reads) =====
  const { data: fundraiserAddress } = useReadContract({
    address: CONTRACTS.FACTORY_ADDRESS,
    abi: FUNDRAISER_FACTORY_ABI,
    functionName: 'getFundraiserById',
    args: [BigInt(campaign.onChainId)],
    query: {
      staleTime: Infinity,
    },
  })

  const validFundraiserAddr = fundraiserAddress && fundraiserAddress !== '0x0000000000000000000000000000000000000000'
    ? fundraiserAddress as Address
    : undefined

  // ===== Direct Donation reads =====
  const { data: donorDonationAmount } = useReadContract({
    address: validFundraiserAddr,
    abi: FUNDRAISER_ABI,
    functionName: 'donorDonations',
    args: [userAddress],
    query: {
      enabled: !!validFundraiserAddr,
      refetchInterval: 15000,
    },
  })

  const { data: campaignTotalDonations } = useReadContract({
    address: validFundraiserAddr,
    abi: FUNDRAISER_ABI,
    functionName: 'totalDonations',
    query: {
      enabled: !!validFundraiserAddr,
      refetchInterval: 15000,
    },
  })

  const { data: campaignGoal } = useReadContract({
    address: validFundraiserAddr,
    abi: FUNDRAISER_ABI,
    functionName: 'goal',
    query: {
      enabled: !!validFundraiserAddr,
      staleTime: Infinity,
    },
  })

  // ===== Staking reads =====
  const { data: stakerPrincipal } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'stakerPrincipal',
    args: [userAddress],
    query: {
      enabled: !!stakingPoolAddress,
      refetchInterval: 15000,
    },
  })

  const { data: earnedUSDC } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'earnedUSDC',
    args: [userAddress],
    query: {
      enabled: !!stakingPoolAddress,
      refetchInterval: 15000,
    },
  })

  const { data: claimableYield } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'claimableYield',
    args: [userAddress],
    query: {
      enabled: !!stakingPoolAddress,
      refetchInterval: 15000,
    },
  })

  // ===== Wealth Building reads =====
  const { data: endowmentInfo } = useReadContract({
    address: CONTRACTS.WEALTH_BUILDING_ADDRESS,
    abi: WEALTH_BUILDING_DONATION_ABI,
    functionName: 'getEndowmentInfo',
    args: [userAddress, BigInt(campaign.onChainId)],
    query: {
      enabled: !!CONTRACTS.WEALTH_BUILDING_ADDRESS,
      refetchInterval: 15000,
    },
  })

  // Parse data
  const donated = donorDonationAmount as bigint | undefined
  const totalRaised = campaignTotalDonations as bigint | undefined
  const goal = campaignGoal as bigint | undefined
  const staked = stakerPrincipal as bigint | undefined
  const earned = earnedUSDC as bigint | undefined
  const claimable = claimableYield as bigint | undefined
  const endowment = endowmentInfo as {
    principal: bigint
    lifetimeYield: bigint
    causeYieldPaid: bigint
    donorStockValue: bigint
    lastHarvestTime: bigint
  } | undefined

  const hasDonation = donated && donated > 0n
  const hasStake = staked && staked > 0n
  const hasEndowment = endowment && endowment.principal > 0n

  // Don't render card if no positions
  if (!hasDonation && !hasStake && !hasEndowment) return null

  return (
    <div className="bg-surface-elevated/60 border border-border-default rounded-xl p-4 hover:border-primary/20 transition-colors">
      {/* Campaign header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground truncate max-w-[70%]">
          {campaign.title}
        </h4>
        <Link
          href={`/campaigns/${campaign.id}`}
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 shrink-0"
        >
          View <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-2.5">
        {/* Direct donation position */}
        {hasDonation && (
          <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
            <div className="p-1.5 bg-green-500/20 rounded-md shrink-0 mt-0.5">
              <Heart size={14} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-300 mb-1.5">Direct Donation</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-text-tertiary">Your Donation</p>
                  <p className="text-xs font-semibold">{formatUSDC(donated!)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Total Raised</p>
                  <p className="text-xs font-semibold text-green-400">
                    {totalRaised ? formatUSDC(totalRaised) : '$0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Goal</p>
                  <p className="text-xs font-semibold text-emerald-400">
                    {goal ? formatUSDC(goal) : '—'}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              {goal && goal > 0n && totalRaised !== undefined && (
                <div className="mt-2">
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Number((totalRaised * 100n) / goal))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {Math.min(100, Number((totalRaised * 100n) / goal))}% funded
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staking position */}
        {hasStake && (
          <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <div className="p-1.5 bg-blue-500/20 rounded-md shrink-0 mt-0.5">
              <Coins size={14} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-300 mb-1.5">Staking</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-text-tertiary">Staked</p>
                  <p className="text-xs font-semibold">{formatUSDC(staked!)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Earned</p>
                  <p className="text-xs font-semibold text-green-400">
                    {earned ? formatUSDC(earned) : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Claimable</p>
                  <p className="text-xs font-semibold text-blue-400">
                    {claimable ? formatUSDC(claimable) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wealth building position */}
        {hasEndowment && (
          <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
            <div className="p-1.5 bg-purple-500/20 rounded-md shrink-0 mt-0.5">
              <TrendingUp size={14} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-purple-300 mb-1.5">Wealth Building</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-text-tertiary">Endowment</p>
                  <p className="text-xs font-semibold">{formatUSDC(endowment!.principal)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Yield</p>
                  <p className="text-xs font-semibold text-green-400">
                    {formatUSDC(endowment!.lifetimeYield)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Stock Value</p>
                  <p className="text-xs font-semibold text-purple-400">
                    {formatUSDC(endowment!.donorStockValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeFiPositions
