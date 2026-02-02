"use client";

import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StakingStatsProps {
  totalValueLocked: number;
  estimatedAPY: number;
  totalStakers: number;
  className?: string;
}

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  valueClassName?: string;
  tooltip?: string;
}

function StatCard({ label, value, subtext, valueClassName, tooltip }: StatCardProps) {
  return (
    <div className="bg-surface-elevated border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-sm text-text-tertiary">{label}</div>
        {tooltip && (
          <div className="group relative">
            <InfoIcon className="w-4 h-4 text-text-tertiary cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-elevated border border-white/10 rounded-lg text-xs text-foreground w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className={cn("text-3xl font-bold", valueClassName)}>{value}</div>
      <div className="text-xs text-text-secondary mt-1">{subtext}</div>
    </div>
  );
}

/**
 * StakingStats - Displays key staking pool metrics
 * Shows TVL, APY, and total stakers with tooltips for education
 */
export default function StakingStats({
  totalValueLocked,
  estimatedAPY,
  totalStakers,
  className,
}: StakingStatsProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      <StatCard
        label="Total Value Locked"
        value={`$${totalValueLocked.toLocaleString()}`}
        subtext="USDC"
        valueClassName="text-foreground"
        tooltip="The total amount of USDC currently staked in this pool by all participants."
      />
      <StatCard
        label="Estimated APY"
        value={`${estimatedAPY}%`}
        subtext="Annual yield"
        valueClassName="text-primary"
        tooltip="Annual Percentage Yield - the estimated yearly return on your staked assets. APY may vary based on pool performance."
      />
      <StatCard
        label="Total Stakers"
        value={totalStakers.toString()}
        subtext="Participants"
        valueClassName="text-foreground"
        tooltip="The number of unique wallets currently staking in this pool."
      />
    </div>
  );
}
