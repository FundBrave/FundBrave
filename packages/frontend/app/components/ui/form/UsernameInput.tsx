"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/**
 * Inline SVG Icons - following NotFoundPage pattern
 * Hand-crafted, optimized, accessible icons
 */
const icons = {
  check: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  loader: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};

export interface UsernameInputProps {
  /** Current username value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input ID for accessibility */
  id?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Validation error message */
  error?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Debounce delay in ms for availability check */
  debounceMs?: number;
  /** Function to check username availability - returns true if available */
  checkAvailability?: (username: string) => Promise<boolean>;
  /** Called when availability check completes */
  onAvailabilityChange?: (isAvailable: boolean | null) => void;
}

/**
 * UsernameInput - Username input with @ prefix and real-time availability check
 *
 * Features:
 * - @ prefix display
 * - Debounced availability check (300ms default)
 * - Loading, available, and taken states
 * - Error shake animation
 * - Meets 44px minimum touch target
 */
export function UsernameInput({
  value,
  onChange,
  id = "username",
  placeholder = "username",
  error,
  disabled = false,
  debounceMs = 300,
  checkAvailability,
  onAvailabilityChange,
}: UsernameInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Shake animation when error appears
  useEffect(() => {
    if (error && !prevErrorRef.current && containerRef.current) {
      gsap.to(containerRef.current, {
        keyframes: [
          { x: -8, duration: 0.06 },
          { x: 8, duration: 0.06 },
          { x: -6, duration: 0.06 },
          { x: 6, duration: 0.06 },
          { x: -3, duration: 0.06 },
          { x: 3, duration: 0.06 },
          { x: 0, duration: 0.06 },
        ],
        ease: "power2.inOut",
      });
    }
    prevErrorRef.current = error;
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      gsap.killTweensOf(containerRef.current);
    };
  }, []);

  // Debounced availability check
  const handleValueChange = useCallback(
    (newValue: string) => {
      // Transform to lowercase and remove invalid chars
      const sanitizedValue = newValue.toLowerCase().replace(/[^a-z0-9_]/g, "");
      onChange(sanitizedValue);

      // Reset availability state
      setIsAvailable(null);
      onAvailabilityChange?.(null);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Only check if value is valid length and we have a check function
      if (sanitizedValue.length >= 3 && checkAvailability) {
        setIsChecking(true);
        debounceTimerRef.current = setTimeout(async () => {
          try {
            const available = await checkAvailability(sanitizedValue);
            setIsAvailable(available);
            onAvailabilityChange?.(available);
          } catch {
            setIsAvailable(null);
            onAvailabilityChange?.(null);
          } finally {
            setIsChecking(false);
          }
        }, debounceMs);
      } else {
        setIsChecking(false);
      }
    },
    [onChange, checkAvailability, debounceMs, onAvailabilityChange]
  );

  // Determine status icon and color
  const getStatusDisplay = () => {
    if (isChecking) {
      return {
        icon: icons.loader,
        color: "text-text-tertiary",
        label: "Checking availability...",
      };
    }
    if (isAvailable === true) {
      return {
        icon: icons.check,
        color: "text-green-500",
        label: "Username available",
      };
    }
    if (isAvailable === false) {
      return {
        icon: icons.x,
        color: "text-destructive",
        label: "Username taken",
      };
    }
    return null;
  };

  const status = getStatusDisplay();
  const hasError = !!error || isAvailable === false;
  const errorMessage =
    error || (isAvailable === false ? "This username is already taken" : "");

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="relative">
        {/* @ prefix */}
        <span
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary select-none",
            "pointer-events-none"
          )}
          aria-hidden="true"
        >
          @
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
          autoComplete="username"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          className={cn(
            // Base styles
            "w-full bg-surface-sunken rounded-xl",
            "pl-8 pr-12 py-3",
            // Typography
            "text-foreground placeholder:text-text-tertiary",
            // Border and focus
            "border outline-none",
            "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
            // Transitions
            "transition-all duration-200",
            // Touch target (44px min height)
            "min-h-[44px]",
            // States
            hasError
              ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
              : "border-white/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Status indicator */}
        <AnimatePresence mode="wait">
          {status && (
            <motion.span
              key={isChecking ? "checking" : isAvailable ? "available" : "taken"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                status.color
              )}
              aria-label={status.label}
            >
              {status.icon}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-destructive"
            role="alert"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UsernameInput;
