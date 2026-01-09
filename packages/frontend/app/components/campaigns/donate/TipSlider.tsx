"use client";

import type { TipSliderProps } from "@/types/donation";
import { TIP_SLIDER_CONFIG } from "@/lib/constants/donation";

/**
 * TipSlider - Custom slider for selecting tip percentage
 * Allows users to optionally tip FundBrave services
 */
export default function TipSlider({
  tipPercentage,
  tipAmount,
  onSliderChange,
  formatAmount,
}: TipSliderProps) {
  const { MIN, MAX } = TIP_SLIDER_CONFIG;
  const progressPercent = (tipPercentage / MAX) * 100;

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">
        Tip FundBrave Services
      </h3>
      <p className="text-foreground/80 text-sm sm:text-base leading-6 mb-3">
        FundBrave has a 0% platform fee for organisers. FundBrave will continue
        offering its services thanks to donors who leave an optional amount
        here:
      </p>

      {/* Slider Container */}
      <div className="relative pt-14 pb-4">
        {/* Slider Track Background */}
        <div className="relative h-2 bg-border-default rounded-full">
          {/* Filled Track */}
          <div
            className="absolute h-full bg-gradient-to-r from-primary-500 to-soft-purple-500 rounded-full transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Slider Thumb with Label */}
          <div
            className="absolute -top-[7px] -translate-x-1/2 transition-all duration-150"
            style={{ left: `${progressPercent}%` }}
          >
            {/* Tooltip/Label */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-sunken border border-border-default px-4 py-2 rounded-xl whitespace-nowrap shadow-lg">
              <span className="font-semibold text-foreground text-sm">
                USD {formatAmount(tipAmount, 2)}{" "}
                <span className="text-text-secondary">({tipPercentage}%)</span>
              </span>
              {/* Arrow */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-sunken border-r border-b border-border-default rotate-45" />
            </div>

            {/* Thumb Circle */}
            <div className="w-5 h-5 bg-soft-purple-500 rounded-full border-[3px] border-background shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" />
          </div>

          {/* Actual Range Input (overlays the track exactly) */}
          <input
            type="range"
            min={MIN}
            max={MAX}
            step="1"
            value={tipPercentage}
            onChange={onSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ margin: "-10px 0", height: "calc(100% + 20px)" }}
            aria-label="Tip percentage for FundBrave services"
          />
        </div>

        {/* Percentage markers */}
        <div className="flex justify-between mt-2 text-xs text-text-tertiary">
          <span>{MIN}%</span>
          <span>{MAX / 2}%</span>
          <span>{MAX}%</span>
        </div>
      </div>
    </div>
  );
}
