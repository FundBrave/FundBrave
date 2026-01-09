"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type ProfileTab = "posts" | "donations" | "campaigns" | "likes" | "comments";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

// Tab configuration with labels
const tabs: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "Post" },
  { id: "donations", label: "Donations" },
  { id: "campaigns", label: "Campaigns" },
  { id: "likes", label: "Likes" },
  { id: "comments", label: "Comments" },
];

/**
 * ProfileTabs - Tab navigation component for the profile page
 * Allows switching between different content sections (Posts, Donations, Campaigns, Likes, Comments)
 * Uses refs to dynamically position the indicator under the active tab
 */
export default function ProfileTabs({
  activeTab,
  onTabChange,
}: ProfileTabsProps) {
  const tabRefs = useRef<Map<ProfileTab, HTMLButtonElement>>(new Map());
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
  const setTabRef = (id: ProfileTab) => (el: HTMLButtonElement | null) => {
    if (el) {
      tabRefs.current.set(id, el);
    }
  };

  return (
    <div className="flex flex-col gap-3 px-6">
      {/* Tab Headers */}
      <div
        ref={containerRef}
        className="flex items-center justify-between w-full"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={setTabRef(tab.id)}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "font-medium text-base leading-6 tracking-wide transition-colors px-2",
              activeTab === tab.id
                ? "text-foreground"
                : "text-text-secondary hover:text-foreground/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Indicator Line */}
      <div className="relative h-px w-full">
        {/* Background Line */}
        <div className="absolute inset-0 bg-border-default" />

        {/* Active Indicator - dynamically positioned based on active tab button */}
        <div
          className="absolute h-[2px] -top-px transition-all duration-300 ease-out tab-indicator-gradient"
          style={{
            width: `${indicatorStyle.width}px`,
            left: `${indicatorStyle.left}px`,
          }}
        />
      </div>
    </div>
  );
}
