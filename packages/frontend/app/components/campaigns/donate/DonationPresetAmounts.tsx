"use client";

import { Check } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import type { DonationPresetAmountsProps } from "@/types/donation";

/**
 * DonationPresetAmounts - Quick-select preset donation amount buttons
 * Displays a responsive grid of predefined donation amounts
 */
export default function DonationPresetAmounts({
  presetAmounts,
  selectedPreset,
  onPresetClick,
}: DonationPresetAmountsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {presetAmounts.map((val) => (
        <button
          key={val}
          onClick={() => onPresetClick(val)}
          className={cn(
            "h-[60px] sm:h-[70px] lg:h-[78px] px-4 lg:px-6 rounded-[20px] border font-semibold text-base lg:text-lg transition-all duration-200 relative overflow-hidden group",
            selectedPreset === val
              ? "border-soft-purple-500 bg-gradient-to-r from-primary-500/20 to-soft-purple-500/20 scale-[1.02]"
              : "border-border-default hover:border-border-subtle hover:bg-surface-overlay"
          )}
        >
          {/* Selected indicator */}
          {selectedPreset === val && (
            <div className="absolute top-2 right-2">
              <Check className="w-4 h-4 text-soft-purple-500" />
            </div>
          )}
          <span
            className={cn(
              "transition-all",
              selectedPreset === val && "text-soft-purple-400"
            )}
          >
            {val} USD
          </span>
        </button>
      ))}
    </div>
  );
}
