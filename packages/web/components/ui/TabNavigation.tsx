"use client";
import React from "react";
import { PostType } from "./types/CreatePost.types";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

// Tab Navigation Component
interface TabNavigationProps {
  activeTab: PostType;
  onTabChange: (tab: PostType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const postTabRef = React.useRef<HTMLButtonElement | null>(null);
  const campaignTabRef = React.useRef<HTMLButtonElement | null>(null);
  const [indicatorPosition, setIndicatorPosition] = React.useState(0);

  React.useEffect(() => {
    const activeRef = activeTab === "post" ? postTabRef : campaignTabRef;
    if (activeRef.current) {
      const { offsetLeft, offsetWidth } = activeRef.current;
      setIndicatorPosition(offsetLeft + offsetWidth / 2 - 100); // Center the indicator
    }
  }, [activeTab]);

  return (
    <div className="relative mt-6 sm:mt-8 lg:mt-[45px] mb-4 sm:mb-6 lg:mb-7 px-4 sm:px-0">
      <div className="flex items-center justify-center gap-8 sm:gap-16 md:gap-24 lg:gap-[166px] font-['Roboto'] font-medium text-[14px] sm:text-[16px] lg:text-[18px] tracking-[0.35px]">
        <button
          onClick={() => onTabChange("post")}
          ref={postTabRef}
          className={cn(
            "transition-colors whitespace-nowrap",
            activeTab === "post"
              ? "text-foreground/80"
              : "text-text-secondary hover:text-foreground/70"
          )}
        >
          <span className="hidden sm:inline">Create a post</span>
          <span className="sm:hidden">Post</span>
        </button>
        <button
          ref={campaignTabRef}
          onClick={() => onTabChange("campaign-update")}
          className={cn(
            "transition-colors whitespace-nowrap",
            activeTab === "campaign-update"
              ? "text-foreground/80"
              : "text-text-secondary hover:text-foreground/70"
          )}
        >
          <span className="hidden sm:inline">Create a campaign update</span>
          <span className="sm:hidden">Campaign</span>
        </button>
      </div>

      {/* Tab Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          <motion.div
            className={
              "absolute top-0 h-full w-[100px] sm:w-[150px] lg:w-[200px] bg-gradient-to-r from-purple-500 to-blue-500"
            }
            animate={{ x: indicatorPosition }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
