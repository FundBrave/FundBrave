"use client";

import { cn } from "@/lib/utils";

interface Staker {
  id: string;
  staker: {
    displayName?: string | null;
    username?: string | null;
    walletAddress: string;
  };
  amount: string;
  stakedAt: string;
}

interface RecentStakersListProps {
  stakes: Staker[];
  className?: string;
}

/**
 * RecentStakersList - Displays a list of recent stakers
 * Shows social proof and community participation
 */
export default function RecentStakersList({ stakes, className }: RecentStakersListProps) {
  if (stakes.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-surface-elevated border border-white/10 rounded-xl p-6", className)}>
      <h3 className="text-lg font-semibold mb-4">Recent Stakers</h3>
      <div className="space-y-3">
        {stakes.slice(0, 10).map((stake) => {
          const displayName = stake.staker.displayName || stake.staker.username || "Anonymous";
          const initial = displayName[0]?.toUpperCase() || "?";
          const stakedAmount = parseFloat(stake.amount);
          const stakedDate = new Date(stake.stakedAt);

          return (
            <div
              key={stake.id}
              className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {initial}
                </div>
                <div>
                  <div className="font-medium text-sm">{displayName}</div>
                  <div className="text-xs text-text-tertiary">
                    {stakedDate.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">
                  ${stakedAmount.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">USDC</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
