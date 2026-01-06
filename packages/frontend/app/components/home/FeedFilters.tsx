"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { FeedFiltersProps, FeedFilter } from "@/app/types/home";

/**
 * FeedFilters - Filter tabs for the home feed
 * Based on Figma design:
 * - Tab buttons: Popular, Recent, Most viewed
 * - Animated underline indicator
 * - Spring animation for tab switching
 */

const FILTER_OPTIONS: { value: FeedFilter; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "recent", label: "Recent" },
  { value: "most_viewed", label: "Most viewed" },
];

export function FeedFilters({
  activeFilter,
  onChange,
  className,
}: FeedFiltersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<FeedFilter, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  // Update indicator position when active filter changes
  useEffect(() => {
    const activeButton = buttonRefs.current.get(activeFilter);
    const container = containerRef.current;

    if (activeButton && container) {
      const buttonRect = activeButton.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left,
      });
    }
  }, [activeFilter]);

  const setButtonRef = useCallback(
    (filter: FeedFilter) => (el: HTMLButtonElement | null) => {
      if (el) {
        buttonRefs.current.set(filter, el);
      } else {
        buttonRefs.current.delete(filter);
      }
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center gap-2 border-b border-white/10 pb-0",
        className
      )}
    >
      {/* Tab Buttons */}
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          ref={setButtonRef(option.value)}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative px-4 py-3 min-h-11 text-sm font-medium transition-colors",
            activeFilter === option.value
              ? "text-white"
              : "text-white/50 hover:text-white/70"
          )}
        >
          {option.label}
        </button>
      ))}

      {/* Animated Indicator */}
      <motion.div
        className="absolute bottom-0 h-[2px] bg-gradient-to-r from-primary-500 to-soft-purple-500 rounded-full"
        initial={false}
        animate={{
          width: indicatorStyle.width,
          x: indicatorStyle.left,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      />
    </div>
  );
}

export default FeedFilters;
