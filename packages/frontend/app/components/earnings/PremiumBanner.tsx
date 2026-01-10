"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PremiumBanner - Promo component for premium subscription
 * Figma specs:
 * - Dark card with lightning icon
 * - "Reach more audience with premium" text
 * - "Try for NGN0" CTA button
 * - Subtle gradient background
 */

export interface PremiumBannerProps {
  onTryPremium?: () => void;
  className?: string;
}

export function PremiumBanner({ onTryPremium, className }: PremiumBannerProps) {
  const handleClick = () => {
    if (onTryPremium) {
      onTryPremium();
    } else {
      console.log("Premium banner clicked - placeholder action");
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-surface-elevated via-surface-elevated to-primary-900/30",
        "border border-border-default",
        "p-4",
        className
      )}
    >
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Lightning Icon */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <p className="text-sm text-text-secondary leading-snug mb-3">
            Reach more audience with premium
          </p>

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "bg-gradient-to-r from-primary-500 to-soft-purple-500",
              "text-white text-sm font-medium",
              "hover:brightness-110 transition-all",
              "shadow-lg shadow-primary-500/25"
            )}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Try for NGN0</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PremiumBanner;
