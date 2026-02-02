"use client";

import { cn } from "@/lib/utils";

interface StakingTabsProps {
  activeTab: "stake" | "unstake";
  onTabChange: (tab: "stake" | "unstake") => void;
  hasStake: boolean;
}

/**
 * StakingTabs - Tab switcher for stake/unstake actions
 */
export default function StakingTabs({
  activeTab,
  onTabChange,
  hasStake,
}: StakingTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        type="button"
        onClick={() => onTabChange("stake")}
        className={cn(
          "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
          activeTab === "stake"
            ? "bg-primary text-white"
            : "bg-surface-overlay text-text-secondary hover:bg-surface-sunken"
        )}
        aria-pressed={activeTab === "stake"}
      >
        Stake
      </button>
      <button
        type="button"
        onClick={() => onTabChange("unstake")}
        disabled={!hasStake}
        className={cn(
          "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
          activeTab === "unstake"
            ? "bg-primary text-white"
            : "bg-surface-overlay text-text-secondary hover:bg-surface-sunken",
          !hasStake && "opacity-50 cursor-not-allowed"
        )}
        aria-pressed={activeTab === "unstake"}
        aria-label={!hasStake ? "You need to stake first before you can unstake" : "Unstake"}
      >
        Unstake
      </button>
    </div>
  );
}
