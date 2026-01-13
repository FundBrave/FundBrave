"use client";

import { useState, useCallback, useMemo, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "@/app/components/ui/icons";
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  GOAL_AMOUNT_PRESETS,
  type Currency,
  formatGoalAmount,
} from "./schemas";

// ============================================================================
// Types
// ============================================================================

interface GoalAmountInputProps {
  /** Current amount value as string */
  value: string;
  /** Current currency */
  currency: Currency;
  /** Callback when amount changes */
  onValueChange: (value: string) => void;
  /** Callback when currency changes */
  onCurrencyChange: (currency: Currency) => void;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Optional class name for the container */
  className?: string;
}

// ============================================================================
// Currency Dropdown
// ============================================================================

interface CurrencyDropdownProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  disabled?: boolean;
  buttonId: string;
  listboxId: string;
}

function CurrencyDropdown({
  value,
  onChange,
  disabled,
  buttonId,
  listboxId,
}: CurrencyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback(
    (currency: Currency) => {
      onChange(currency);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = CURRENCIES.indexOf(value);
          const nextIndex =
            e.key === "ArrowDown"
              ? (currentIndex + 1) % CURRENCIES.length
              : (currentIndex - 1 + CURRENCIES.length) % CURRENCIES.length;
          onChange(CURRENCIES[nextIndex]);
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    },
    [isOpen, value, onChange]
  );

  return (
    <div className="relative">
      <button
        id={buttonId}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={cn(
          "flex items-center gap-1 px-3 h-full min-h-[44px]",
          "bg-surface-sunken/50 border-r border-border-subtle",
          "text-sm font-medium text-foreground",
          "hover:bg-surface-sunken transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-inset",
          "rounded-l-xl",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span>{value}</span>
        <ChevronDown
          size={14}
          className={cn(
            "text-text-tertiary transition-transform duration-150",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown menu */}
            <motion.ul
              id={listboxId}
              role="listbox"
              aria-labelledby={buttonId}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute left-0 top-full mt-1 z-50",
                "min-w-[80px] py-1",
                "bg-surface-elevated border border-border-subtle rounded-lg",
                "shadow-lg"
              )}
            >
              {CURRENCIES.map((currency) => (
                <li key={currency}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={currency === value}
                    onClick={() => handleSelect(currency)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm",
                      "flex items-center justify-between gap-2",
                      "hover:bg-surface-sunken transition-colors",
                      "focus:outline-none focus:bg-surface-sunken",
                      currency === value && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <span>{currency}</span>
                    <span className="text-text-tertiary">{CURRENCY_SYMBOLS[currency]}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Preset Buttons
// ============================================================================

interface PresetButtonsProps {
  value: string;
  currency: Currency;
  onSelect: (amount: number) => void;
  disabled?: boolean;
}

function PresetButtons({ value, currency, onSelect, disabled }: PresetButtonsProps) {
  const currentAmount = parseFloat(value) || 0;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amount presets">
      {GOAL_AMOUNT_PRESETS.map((preset) => {
        const isSelected = currentAmount === preset;
        const formattedPreset = formatGoalAmount(preset, currency);

        return (
          <button
            key={preset}
            type="button"
            onClick={() => onSelect(preset)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              "px-4 py-2 min-h-[44px] min-w-[44px]",
              "text-sm font-medium rounded-full",
              "border transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
              isSelected
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-surface-sunken text-foreground border-border-subtle hover:border-primary/50 hover:bg-primary/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {formattedPreset}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function GoalAmountInput({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  error,
  disabled,
  className,
}: GoalAmountInputProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const currencyButtonId = `${id}-currency-button`;
  const currencyListboxId = `${id}-currency-listbox`;
  const errorId = `${id}-error`;
  const helpTextId = `${id}-help`;

  // Format the display value with commas
  const displayValue = useMemo(() => {
    if (!value) return "";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    // Only format if it's a clean number (no partial input like "1,00")
    if (value.includes(",") || value.endsWith(".")) return value;
    return numValue.toLocaleString("en-US");
  }, [value]);

  // Handle input change - only allow numbers
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Remove commas and other formatting
      const cleanValue = rawValue.replace(/[^0-9.]/g, "");
      // Prevent multiple decimal points
      const parts = cleanValue.split(".");
      const sanitizedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleanValue;
      onValueChange(sanitizedValue);
    },
    [onValueChange]
  );

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (amount: number) => {
      onValueChange(amount.toString());
    },
    [onValueChange]
  );

  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="font-medium text-sm sm:text-base text-foreground">
          Fundraising Goal
          <span className="text-destructive ml-1">*</span>
        </label>
      </div>

      {/* Input with currency selector */}
      <div
        className={cn(
          "flex items-stretch",
          "bg-surface-sunken rounded-xl",
          "border transition-all duration-200",
          hasError
            ? "border-destructive ring-2 ring-destructive/30"
            : "border-transparent focus-within:ring-2 focus-within:ring-primary/50"
        )}
      >
        {/* Currency dropdown */}
        <CurrencyDropdown
          value={currency}
          onChange={onCurrencyChange}
          disabled={disabled}
          buttonId={currencyButtonId}
          listboxId={currencyListboxId}
        />

        {/* Amount input */}
        <div className="flex-1 flex items-center">
          <span className="pl-3 text-text-tertiary text-lg">{CURRENCY_SYMBOLS[currency]}</span>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleInputChange}
            placeholder="10,000"
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={`${helpTextId}${hasError ? ` ${errorId}` : ""}`}
            className={cn(
              "flex-1 bg-transparent",
              "px-2 py-3 sm:py-4",
              "text-lg sm:text-xl font-semibold text-foreground",
              "placeholder:text-text-tertiary placeholder:font-normal",
              "outline-none",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
      </div>

      {/* Preset buttons */}
      <PresetButtons
        value={value}
        currency={currency}
        onSelect={handlePresetSelect}
        disabled={disabled}
      />

      {/* Help text */}
      <p id={helpTextId} className="text-xs text-text-tertiary">
        Set a realistic goal that covers your needs. Minimum $100, maximum $10,000,000.
      </p>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GoalAmountInput;
