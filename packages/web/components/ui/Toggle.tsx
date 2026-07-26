"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
  /** Whether the toggle is checked/on */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Optional label text */
  label?: string;
  /** ID for accessibility */
  id?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Show On/Off text indicator */
  showIndicator?: boolean;
  /** Additional className for the container */
  className?: string;
}

/**
 * A reusable toggle switch component.
 * Follows accessibility best practices with proper ARIA attributes.
 */
export function Toggle({
  checked,
  onChange,
  label,
  id,
  disabled = false,
  showIndicator = false,
  className,
}: ToggleProps) {
  const labelId = id ? `${id}-label` : undefined;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {label && (
        <span className="text-sm text-text-secondary" id={labelId}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        {showIndicator && (
          <span className="text-sm text-text-tertiary">
            {checked ? "On" : "Off"}
          </span>
        )}
        <button
          type="button"
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelId}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background",
            checked ? "bg-primary-500" : "bg-surface-sunken",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
              checked ? "left-6" : "left-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}

export default Toggle;
