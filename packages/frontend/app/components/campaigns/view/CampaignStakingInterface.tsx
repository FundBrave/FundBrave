"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";
import { Button } from "@/app/components/ui/button";
import { useFundraiserStakes } from "@/app/hooks/useStaking";
import { Loader2 } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

interface CampaignStakingInterfaceProps {
  campaignId: string;
  stakingPoolAddress?: string;
  className?: string;
}

/**
 * CampaignStakingInterface - Displays staking pool stats for a specific campaign
 * Shows total staked, APY, stakers count, and CTA to stake page
 */
export function CampaignStakingInterface({
  campaignId,
  stakingPoolAddress,
  className,
}: CampaignStakingInterfaceProps) {
  const router = useRouter();
  const { stakes, total: totalStakers, isLoading } = useFundraiserStakes(campaignId);

  // Calculate pool stats
  const totalValueLocked = stakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);

  // Mock APY for now - would come from contract or backend
  const estimatedAPY = 8.5;

  if (isLoading) {
    return (
      <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // If no staking pool or no stakes, show minimal state
  if (!stakingPoolAddress && totalStakers === 0) {
    return null;
  }

  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Stake & Earn</h3>
          <p className="text-sm text-text-tertiary mt-1">
            Support this campaign and earn yield
          </p>
        </div>
        <div className="px-3 py-1 bg-primary/10 rounded-full">
          <span className="text-sm font-bold text-primary">{estimatedAPY}% APY</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Value Locked */}
        <div className="bg-surface-sunken rounded-lg p-4">
          <div className="text-xs text-text-tertiary mb-1">Total Staked</div>
          <div className="text-xl font-bold text-foreground">
            ${totalValueLocked.toLocaleString()}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">USDC</div>
        </div>

        {/* Total Stakers */}
        <div className="bg-surface-sunken rounded-lg p-4">
          <div className="text-xs text-text-tertiary mb-1">Stakers</div>
          <div className="text-xl font-bold text-foreground">{totalStakers}</div>
          <div className="text-xs text-text-secondary mt-0.5">
            {totalStakers === 1 ? "Participant" : "Participants"}
          </div>
        </div>
      </div>

      {/* Recent Stakers Preview */}
      {stakes.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-medium text-text-secondary mb-3">Recent Stakers</div>
          <div className="flex -space-x-2">
            {stakes.slice(0, 5).map((stake, index) => (
              <div
                key={stake.id}
                className="w-8 h-8 rounded-full bg-primary/20 border-2 border-surface-elevated flex items-center justify-center text-primary font-bold text-xs"
                style={{ zIndex: 5 - index }}
                title={stake.staker.displayName || stake.staker.username || "Anonymous"}
              >
                {(stake.staker.displayName || stake.staker.username || "?").charAt(0).toUpperCase()}
              </div>
            ))}
            {stakes.length > 5 && (
              <div
                className="w-8 h-8 rounded-full bg-surface-overlay border-2 border-surface-elevated flex items-center justify-center text-text-tertiary font-medium text-xs"
                style={{ zIndex: 0 }}
              >
                +{stakes.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefits List */}
      <div className="bg-surface-sunken rounded-lg p-4 mb-6">
        <div className="text-xs font-medium text-text-secondary mb-2">Staking Benefits</div>
        <ul className="space-y-1.5 text-xs text-text-tertiary">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>Earn {estimatedAPY}% annual yield on your USDC</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>Support the campaign you believe in</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>Unstake anytime with no lockup period</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span>Automatically compounded rewards</span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <Button
        onClick={() => router.push(`/campaigns/${campaignId}/stake`)}
        className="w-full"
        size="lg"
      >
        Stake & Earn Yield
      </Button>

      {/* Info Text */}
      <p className="text-xs text-text-tertiary text-center mt-3">
        A portion of staking yield supports the campaign creator
      </p>
    </div>
  );
}
