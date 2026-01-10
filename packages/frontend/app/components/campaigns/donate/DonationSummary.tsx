"use client";

import { cn } from "@/lib/utils";
import type { DonationSummaryProps } from "@/types/donation";

/**
 * DonationSummary - Summary card showing donation breakdown
 * Displays donation amount, tip, and total with crypto conversion
 */
export default function DonationSummary({
  amount,
  tipAmount,
  totalAmount,
  cryptoAmount,
  selectedCrypto,
  animatingAmount,
  formatAmount,
}: DonationSummaryProps) {
  return (
    <div className="bg-surface-overlay rounded-2xl p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5">
        Your Donation
      </h3>

      <div className="space-y-3 sm:space-y-4">
        {/* Donation amount row */}
        <div className="flex justify-between text-base sm:text-lg">
          <span className="text-text-secondary">Your donation</span>
          <span
            className={cn(
              "font-medium transition-all duration-300",
              animatingAmount && "scale-110 text-soft-purple-400"
            )}
          >
            {formatAmount(amount)} USD
          </span>
        </div>

        {/* Tip amount row */}
        <div className="flex justify-between text-base sm:text-lg">
          <span className="text-text-secondary">FundBrave tip</span>
          <span className="font-medium">{formatAmount(tipAmount, 2)} USD</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-default my-4" />

        {/* Total due row */}
        <div className="flex justify-between text-lg sm:text-xl font-bold">
          <span className="text-foreground">Total due</span>
          <div className="text-right">
            <span
              className={cn(
                "block transition-all duration-300",
                animatingAmount && "text-soft-purple-400"
              )}
            >
              {formatAmount(totalAmount, 2)} USD
            </span>
            {amount > 0 && (
              <span className="text-sm text-text-tertiary font-normal">
                ≈ {cryptoAmount.toFixed(6)} {selectedCrypto}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
