"use client";

import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface OTPInputProps {
  /** Number of digits (default: 6) */
  length?: number;
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when all digits are entered */
  onComplete?: (value: string) => void;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Auto-focus first input */
  autoFocus?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * OTPInput - 6-digit one-time password input component
 *
 * Features:
 * - Auto-advance on digit entry
 * - Backspace moves to previous
 * - Paste support (auto-fill all)
 * - Arrow key navigation
 * - Only numeric input allowed
 * - Accessible with ARIA labels
 *
 * Based on PHASE2_UX_SPECS.md Section 4.3.2
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  autoFocus = false,
  className,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Check if complete
  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  // Get digit at index
  const getDigit = (index: number): string => {
    return value[index] || "";
  };

  // Handle input change
  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow numeric input
    const numericValue = inputValue.replace(/[^0-9]/g, "");
    if (numericValue.length === 0) return;

    // Get the last entered digit
    const digit = numericValue[numericValue.length - 1];

    // Update value
    const newValue =
      value.substring(0, index) + digit + value.substring(index + 1);
    onChange(newValue);

    // Move to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Backspace: clear current and move to previous
    if (e.key === "Backspace") {
      e.preventDefault();

      // Clear current digit
      const newValue =
        value.substring(0, index) + value.substring(index + 1);
      onChange(newValue);

      // Move to previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Arrow Left
    else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    // Arrow Right
    else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    // Delete: clear current
    else if (e.key === "Delete") {
      e.preventDefault();
      const newValue =
        value.substring(0, index) + value.substring(index + 1);
      onChange(newValue);
    }
  };

  // Handle paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData("text/plain");
    const numericData = pastedData.replace(/[^0-9]/g, "");

    if (numericData.length > 0) {
      // Take only the number of digits we need
      const newValue = numericData.substring(0, length);
      onChange(newValue);

      // Focus the next empty input or the last one
      const nextIndex = Math.min(newValue.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Handle focus
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // Select the content for easy replacement
    inputRefs.current[index]?.select();
  };

  // Handle blur
  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* OTP input boxes */}
      <div
        className="flex gap-2 sm:gap-3"
        role="group"
        aria-label="One-time password input"
      >
        {Array.from({ length }).map((_, index) => {
          const digit = getDigit(index);
          const isFilled = digit !== "";
          const isFocused = focusedIndex === index;

          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              disabled={disabled}
              aria-label={`Digit ${index + 1}`}
              aria-invalid={!!error}
              className={cn(
                // Base styles
                "w-12 h-14 text-center text-2xl font-bold rounded-xl",
                "bg-surface-sunken border border-white/10",
                "outline-none transition-all duration-150",
                // Focus state
                "focus:border-primary focus:ring-2 focus:ring-primary/50",
                // Filled state
                isFilled && !error && "border-primary/50",
                // Error state
                error && "border-destructive bg-destructive/5",
                // Disabled state
                disabled && "opacity-50 cursor-not-allowed",
                // Text color
                "text-foreground placeholder:text-text-tertiary"
              )}
            />
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p
          className="text-xs text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default OTPInput;
