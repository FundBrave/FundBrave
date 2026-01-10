"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * StatsCard - Displays a metric card with GSAP count-up animation
 * Figma specs:
 * - Card: bg-neutral-dark-400, border-white/10, rounded-xl
 * - Title: 14px, text-white/60
 * - Value: 32px, font-bold, text-white
 * - Change: Green (+) or Red (-) with arrow icon
 * - Comparison text: 12px, text-white/50
 */

export interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number; // Percentage change (positive or negative)
  comparisonText: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  prefix = "$",
  suffix = "k",
  change,
  comparisonText,
  className,
}: StatsCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const isPositive = change >= 0;

  // GSAP count-up animation on mount
  useEffect(() => {
    const obj = { value: 0 };

    const tween = gsap.to(obj, {
      value: value,
      duration: 1.5,
      ease: "power2.out",
      delay: 0.2,
      onUpdate: () => {
        setDisplayValue(Math.round(obj.value * 100) / 100);
      },
    });

    return () => {
      tween.kill();
    };
  }, [value]);

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div
      className={cn(
        "bg-surface-elevated/80 border border-border-default rounded-xl p-5 flex flex-col gap-2",
        className
      )}
    >
      {/* Title */}
      <span className="text-sm text-text-secondary font-medium">{title}</span>

      {/* Value and Change Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Animated Value */}
        <span
          ref={valueRef}
          className="text-[28px] lg:text-[32px] font-bold text-foreground leading-tight"
        >
          {prefix}
          {formatNumber(displayValue)}
          {suffix}
        </span>

        {/* Change Badge */}
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-400" : "text-red-400"
          )}
        >
          <span>
            {isPositive ? "+" : ""}
            {change}%
          </span>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Comparison Text */}
      <span className="text-xs text-text-secondary">{comparisonText}</span>
    </div>
  );
}

export default StatsCard;
