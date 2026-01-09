"use client";

import { cn } from "@/lib/utils";
import type { CryptoSelectorProps } from "@/types/donation";

/**
 * CryptoSelector - Cryptocurrency selection buttons
 * Allows users to choose which cryptocurrency to donate with
 */
export default function CryptoSelector({
  cryptoOptions,
  selectedCrypto,
  cryptoAmount,
  amount,
  onCryptoSelect,
}: CryptoSelectorProps) {
  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold mb-3">
        Select cryptocurrency
      </h3>
      <div className="flex gap-2 sm:gap-3 flex-wrap">
        {cryptoOptions.map((crypto) => (
          <button
            key={crypto}
            onClick={() => onCryptoSelect(crypto)}
            className={cn(
              "px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border font-medium transition-all duration-200 text-sm sm:text-base",
              selectedCrypto === crypto
                ? "border-soft-purple-500 bg-soft-purple-500/20 text-soft-purple-400"
                : "border-border-default hover:border-foreground/30 text-text-secondary"
            )}
          >
            {crypto}
          </button>
        ))}
      </div>
      {amount > 0 && (
        <p className="text-text-secondary text-sm mt-3 animate-in fade-in duration-300">
          ≈ {cryptoAmount.toFixed(6)} {selectedCrypto}
        </p>
      )}
    </div>
  );
}
