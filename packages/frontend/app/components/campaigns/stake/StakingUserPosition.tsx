"use client";

import { cn } from "@/lib/utils";

interface StakingUserPositionProps {
  stakedAmount: number;
  estimatedAPY: number;
  stakedDate: Date;
  className?: string;
}

/**
 * StakingUserPosition - Displays the user's current staking position
 * Shows staked amount, estimated yield, and stake date
 */
export default function StakingUserPosition({
  stakedAmount,
  estimatedAPY,
  stakedDate,
  className,
}: StakingUserPositionProps) {
  const estimatedYield = stakedAmount * estimatedAPY / 100;

  return (
    <div className={cn("bg-surface-elevated border border-white/10 rounded-xl p-6", className)}>
      <h3 className="text-lg font-semibold mb-4">Your Position</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-text-tertiary mb-1">Staked Amount</div>
          <div className="text-2xl font-bold text-foreground">
            ${stakedAmount.toLocaleString()}
          </div>
          <div className="text-xs text-text-secondary mt-1">USDC</div>
        </div>
        <div>
          <div className="text-sm text-text-tertiary mb-1">Estimated Annual Yield</div>
          <div className="text-2xl font-bold text-primary">
            ${estimatedYield.toFixed(2)}
          </div>
          <div className="text-xs text-text-secondary mt-1">at {estimatedAPY}% APY</div>
        </div>
        <div>
          <div className="text-sm text-text-tertiary mb-1">Staked Since</div>
          <div className="text-lg font-medium text-foreground">
            {stakedDate.toLocaleDateString()}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {Math.floor((Date.now() - stakedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
          </div>
        </div>
      </div>
    </div>
  );
}
