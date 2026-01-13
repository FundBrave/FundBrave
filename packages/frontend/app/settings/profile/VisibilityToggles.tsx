"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Inline SVG Icons - following NotFoundPage pattern
 */
const icons = {
  globe: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  heart: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  flag: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
};

export interface VisibilitySettings {
  isPublicProfile: boolean;
  showDonationHistory: boolean;
  showSupportedCampaigns: boolean;
}

export interface VisibilityTogglesProps {
  /** Current visibility settings */
  value: VisibilitySettings;
  /** Change handler */
  onChange: (value: VisibilitySettings) => void;
  /** Whether toggles are disabled */
  disabled?: boolean;
}

interface ToggleConfig {
  key: keyof VisibilitySettings;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const toggleConfigs: ToggleConfig[] = [
  {
    key: "isPublicProfile",
    icon: icons.globe,
    label: "Public Profile",
    description: "Allow anyone to view your profile and campaigns",
  },
  {
    key: "showDonationHistory",
    icon: icons.heart,
    label: "Show Donation History",
    description: "Display your donations on your public profile",
  },
  {
    key: "showSupportedCampaigns",
    icon: icons.flag,
    label: "Show Supported Campaigns",
    description: "Display campaigns you have supported",
  },
];

/**
 * Premium Toggle Switch Component
 *
 * A polished, iOS-inspired toggle with:
 * - 44px touch target (accessibility requirement)
 * - Spring physics for satisfying thumb movement
 * - Gradient track with glow effect when active
 * - Subtle hover and press states
 * - Accessible focus ring
 *
 * Animation ownership (Framer Motion only):
 * - x position: spring animation for thumb slide
 * - scale: press feedback
 * - boxShadow: glow effect on active state
 */

// Variants defined outside component for performance
const thumbVariants = {
  off: {
    x: 2,
    scale: 1,
  },
  on: {
    x: 22,
    scale: 1,
  },
  tap: {
    scale: 0.92,
  },
};

const trackVariants = {
  off: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)",
  },
  on: {
    background: "linear-gradient(135deg, var(--primary-500) 0%, var(--purple-500) 100%)",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1), 0 0 20px rgba(69,12,240,0.4), 0 0 40px rgba(135,98,250,0.2)",
  },
};

const glowVariants = {
  off: {
    opacity: 0,
    scale: 0.8,
  },
  on: {
    opacity: 1,
    scale: 1,
  },
};

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  id,
  labelId,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id: string;
  labelId: string;
}) {
  const state = checked ? "on" : "off";

  return (
    // Touch target wrapper - ensures 44px minimum
    <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
      <motion.button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        variants={trackVariants}
        initial={false}
        animate={state}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          background: { duration: 0.25, ease: "easeOut" },
          boxShadow: { duration: 0.3, ease: "easeOut" },
        }}
        className={cn(
          // Track sizing - 44x24 for premium iOS-like proportions
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center",
          "rounded-full",
          // Focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Disabled state
          disabled && "cursor-not-allowed opacity-40"
        )}
        style={{
          // Ensure the gradient CSS variables work
          ["--primary-500" as string]: "#450cf0",
          ["--purple-500" as string]: "#8762fa",
        }}
      >
        {/* Ambient glow layer (behind thumb) */}
        <motion.span
          variants={glowVariants}
          initial={false}
          animate={state}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 75% 50%, rgba(135,98,250,0.3) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Thumb */}
        <motion.span
          variants={thumbVariants}
          initial={false}
          animate={state}
          whileTap="tap"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.8,
          }}
          className={cn(
            "pointer-events-none absolute rounded-full",
            // Thumb size - 20x20 circular
            "h-5 w-5",
            // Shadow for depth
            "shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.1)]"
          )}
          style={{
            // Thumb styling with subtle gradient for premium feel
            background: checked
              ? "linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)"
              : "linear-gradient(180deg, #e8e8e8 0%, #d4d4d4 100%)",
          }}
          aria-hidden="true"
        >
          {/* Inner highlight for glass effect */}
          <span
            className="absolute inset-[1px] rounded-full opacity-60"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%)",
            }}
            aria-hidden="true"
          />
        </motion.span>
      </motion.button>
    </div>
  );
}

/**
 * VisibilityToggles - Privacy toggle group for profile settings
 *
 * Features:
 * - Optimistic UI updates
 * - Accessible toggle switches with proper ARIA
 * - Smooth spring animations
 * - 44px minimum touch targets
 */
export function VisibilityToggles({
  value,
  onChange,
  disabled = false,
}: VisibilityTogglesProps) {
  const handleToggleChange = (key: keyof VisibilitySettings) => {
    onChange({
      ...value,
      [key]: !value[key],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {toggleConfigs.map((config) => {
        const isChecked = value[config.key];
        const toggleId = `visibility-${config.key}`;
        const labelId = `${toggleId}-label`;

        return (
          <div
            key={config.key}
            className={cn(
              "flex items-start justify-between gap-4 p-4 rounded-xl",
              "bg-surface-sunken/30 border border-white/5",
              "transition-colors duration-200",
              "hover:bg-surface-sunken/50"
            )}
          >
            {/* Label and description */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-text-secondary mt-0.5 shrink-0">
                {config.icon}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <label
                  id={labelId}
                  htmlFor={toggleId}
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {config.label}
                </label>
                <p className="text-xs text-text-tertiary">{config.description}</p>
              </div>
            </div>

            {/* Toggle switch */}
            <ToggleSwitch
              id={toggleId}
              labelId={labelId}
              checked={isChecked}
              onChange={() => handleToggleChange(config.key)}
              disabled={disabled}
            />
          </div>
        );
      })}

      {/* Privacy note */}
      <p className="text-xs text-text-tertiary px-1">
        These settings control what information is visible on your public profile.
        Your email address is never shown publicly.
      </p>
    </div>
  );
}

export default VisibilityToggles;
