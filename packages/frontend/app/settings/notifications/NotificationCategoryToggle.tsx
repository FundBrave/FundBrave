/**
 * NotificationCategoryToggle Component
 *
 * Reusable toggle row for notification preference settings.
 * Features:
 * - 44px minimum touch target for accessibility
 * - Loading state during API calls
 * - Locked state for required notifications
 * - Description text with proper hierarchy
 */

"use client";

import React from "react";
import { Toggle } from "@/app/components/ui/Toggle";
import { Lock } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

export interface NotificationCategoryToggleProps {
  /** Unique identifier for accessibility */
  id: string;
  /** Primary label text */
  label: string;
  /** Descriptive text explaining what this notification does */
  description: string;
  /** Current enabled/disabled state */
  checked: boolean;
  /** Callback when toggle changes */
  onChange: (checked: boolean) => void;
  /** Whether this preference is currently saving */
  isLoading?: boolean;
  /** Whether this preference cannot be disabled (e.g., donation receipts) */
  locked?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * NotificationCategoryToggle
 *
 * A row item for notification preference toggles with proper touch targets
 * and visual feedback.
 *
 * @example
 * <NotificationCategoryToggle
 *   id="donation-alerts"
 *   label="Donation Alerts"
 *   description="Email when you receive a donation"
 *   checked={preferences.donationAlerts}
 *   onChange={(checked) => updatePreference('donationAlerts', checked)}
 * />
 */
export function NotificationCategoryToggle({
  id,
  label,
  description,
  checked,
  onChange,
  isLoading = false,
  locked = false,
  className,
}: NotificationCategoryToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-xl transition-colors",
        "border border-white/10 bg-surface-sunken/30",
        "hover:bg-surface-overlay/50",
        "min-h-[76px]", // Ensures 44px+ touch target with padding
        locked && "opacity-75",
        className
      )}
    >
      {/* Label and Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <label
            htmlFor={id}
            className={cn(
              "text-sm font-medium text-foreground",
              locked ? "text-text-secondary" : "cursor-pointer"
            )}
          >
            {label}
          </label>
          {locked && (
            <Lock
              size={14}
              className="text-text-tertiary flex-shrink-0"
              aria-label="Required notification"
            />
          )}
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {/* Toggle Switch */}
      <div className="flex-shrink-0 min-h-[44px] flex items-center">
        {locked ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">Required</span>
            <div className="h-6 w-11 rounded-full bg-primary/50 flex items-center justify-end px-1">
              <div className="h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
        ) : (
          <Toggle
            id={id}
            checked={checked}
            onChange={onChange}
            disabled={isLoading || locked}
          />
        )}
      </div>
    </div>
  );
}

/**
 * NotificationCategoryToggleSkeleton
 *
 * Loading skeleton for NotificationCategoryToggle
 */
export function NotificationCategoryToggleSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-surface-sunken/30 min-h-[76px]">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-surface-sunken rounded animate-pulse" />
        <div className="h-3 w-full max-w-xs bg-surface-sunken rounded animate-pulse" />
      </div>
      <div className="h-6 w-11 bg-surface-sunken rounded-full animate-pulse" />
    </div>
  );
}
