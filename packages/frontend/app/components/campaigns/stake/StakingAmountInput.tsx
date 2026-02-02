"use client";

import { cn } from "@/lib/utils";

interface StakingAmountInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxClick: () => void;
  balance?: string;
  label: string;
  placeholder?: string;
  error?: string | null;
  disabled?: boolean;
}

/**
 * StakingAmountInput - Amount input for staking operations
 * Displays balance and includes a MAX button for convenience
 */
export default function StakingAmountInput({
  value,
  onChange,
  onMaxClick,
  balance,
  label,
  placeholder = "0.00",
  error,
  disabled = false,
}: StakingAmountInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div
        className={cn(
          "relative h-[60px] sm:h-[70px] border rounded-[20px] flex items-center px-4 sm:px-6 transition-all duration-200",
          error
            ? "border-red-500/60 bg-red-500/5"
            : value
            ? "border-soft-purple-500 bg-surface-overlay"
            : "border-border-default focus-within:border-border-subtle",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="text-base lg:text-lg font-extrabold text-foreground">
          USDC
        </span>
        <input
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="flex-1 bg-transparent text-right text-[24px] sm:text-[32px] font-bold text-foreground focus:outline-none mx-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder={placeholder}
          aria-label={label}
        />
        <button
          type="button"
          onClick={onMaxClick}
          disabled={disabled}
          className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Set maximum amount"
        >
          MAX
        </button>
      </div>

      {/* Balance Display */}
      {balance && !error && (
        <div className="text-xs text-text-tertiary mt-2">
          Balance: {balance} USDC
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-400 text-sm mt-2 animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
