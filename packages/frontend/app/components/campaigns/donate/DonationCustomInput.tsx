"use client";

import { cn } from "@/lib/utils";
import type { DonationCustomInputProps } from "@/types/donation";

/**
 * DonationCustomInput - Custom amount input field for donations
 * Allows users to enter any donation amount with validation
 */
export default function DonationCustomInput({
  customAmount,
  error,
  onCustomAmountChange,
}: DonationCustomInputProps) {
  return (
    <div>
      <div
        className={cn(
          "relative h-[60px] sm:h-[70px] lg:h-[78px] border rounded-[20px] flex items-center px-4 sm:px-6 lg:px-8 transition-all duration-200",
          error
            ? "border-red-500/60 bg-red-500/5"
            : customAmount
            ? "border-soft-purple-500 bg-surface-overlay"
            : "border-border-default focus-within:border-border-subtle"
        )}
      >
        <span className="text-base lg:text-lg font-extrabold text-foreground absolute left-4 sm:left-6 lg:left-8">
          USD
        </span>
        <input
          type="number"
          value={customAmount}
          onChange={onCustomAmountChange}
          className="w-full bg-transparent text-right text-[24px] sm:text-[32px] lg:text-[40px] font-bold text-foreground focus:outline-none pr-12 sm:pr-16 lg:pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="Enter amount"
          aria-label="Custom donation amount in USD"
        />
        <span className="text-[24px] sm:text-[32px] lg:text-[40px] font-bold text-text-tertiary absolute right-4 sm:right-6 lg:right-8">
          .00
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-400 text-sm mt-2 animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
