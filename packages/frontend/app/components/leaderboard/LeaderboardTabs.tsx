"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { LeaderboardPeriod, LeaderboardTabsProps } from "@/app/types/leaderboard";

// Tab configuration
const tabs: { id: LeaderboardPeriod; label: string }[] = [
  { id: "all-time", label: "All Time" },
  { id: "monthly", label: "This Month" },
  { id: "weekly", label: "This Week" },
];

/**
 * LeaderboardTabs - Time period filter tabs for the leaderboard
 * Allows switching between All Time, This Month, and This Week rankings
 * Uses refs to dynamically position the animated indicator
 */
export function LeaderboardTabs({ activeTab, onTabChange }: LeaderboardTabsProps) {
  const tabRefs = useRef<Map<LeaderboardPeriod, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeButton = tabRefs.current.get(activeTab);
    const container = containerRef.current;

    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left,
      });
    }
  }, [activeTab]);

  // Set ref for each tab button
  const setTabRef = (id: LeaderboardPeriod) => (el: HTMLButtonElement | null) => {
    if (el) {
      tabRefs.current.set(id, el);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
      {/* Tab Headers */}
      <div
        ref={containerRef}
        className="flex items-center justify-center gap-1 xs:gap-2 sm:gap-4 md:gap-6"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={setTabRef(tab.id)}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "font-medium text-xs xs:text-sm sm:text-base leading-6 tracking-wide transition-all duration-200 px-2 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg",
              activeTab === tab.id
                ? "text-foreground bg-surface-overlay"
                : "text-text-secondary hover:text-foreground/70 hover:bg-surface-overlay/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Indicator Line */}
      <div className="relative h-px w-full max-w-[280px] xs:max-w-xs sm:max-w-md mx-auto">
        {/* Background Line */}
        <div className="absolute inset-0 bg-border-subtle rounded-full" />

        {/* Active Indicator */}
        <div
          className="absolute h-[2px] -top-px transition-all duration-300 ease-out rounded-full tab-indicator-gradient"
          style={{
            width: `${indicatorStyle.width}px`,
            left: `${indicatorStyle.left}px`,
          }}
        />
      </div>
    </div>
  );
}

export default LeaderboardTabs;
