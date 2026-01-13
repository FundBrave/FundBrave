"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  getPasswordStrength,
  strengthConfig,
  passwordRequirements,
  type PasswordStrength,
} from "@/app/settings/account/schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  check: (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
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
      width="14"
      height="14"
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
};

export interface PasswordStrengthMeterProps {
  /** The password to evaluate */
  password: string;
  /** Whether to show the requirements list */
  showRequirements?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * PasswordStrengthMeter - Visual password strength indicator
 *
 * Features:
 * - Color-coded strength bar (weak/fair/good/strong)
 * - Animated bar width transitions
 * - Optional requirements checklist
 * - Real-time validation feedback
 *
 * Based on PHASE2_UX_SPECS.md Section 3.4
 */
export function PasswordStrengthMeter({
  password,
  showRequirements = true,
  className,
}: PasswordStrengthMeterProps) {
  const strength: PasswordStrength = getPasswordStrength(password);
  const config = strengthConfig[strength];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Strength bar container */}
      <div className="flex flex-col gap-2">
        <div
          className="h-1 w-full bg-surface-sunken rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={
            strength === "weak"
              ? 25
              : strength === "fair"
                ? 50
                : strength === "good"
                  ? 75
                  : 100
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${config.label}`}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: password ? config.width : "0%",
              backgroundColor: config.color,
            }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        </div>

        {/* Strength label */}
        <AnimatePresence mode="wait">
          {password && (
            <motion.div
              key={strength}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between"
            >
              <span className="text-xs text-text-tertiary">
                Password strength
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: config.color }}
              >
                {config.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Requirements list */}
      {showRequirements && password && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-1.5"
          aria-label="Password requirements"
        >
          {passwordRequirements.map((req) => {
            const isMet = req.test(password);

            return (
              <motion.li
                key={req.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                className={cn(
                  "flex items-center gap-2 text-xs transition-colors",
                  isMet ? "text-green-400" : "text-text-tertiary"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-4 h-4 rounded-full transition-colors",
                    isMet
                      ? "bg-green-500/20 text-green-400"
                      : "bg-surface-sunken text-text-tertiary"
                  )}
                >
                  {isMet ? icons.check : icons.x}
                </span>
                <span className={cn(isMet && "line-through opacity-70")}>
                  {req.label}
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
