"use client";

import { motion } from "motion/react";
import { ArrowRight } from "@/app/components/ui/icons";
import type { DonationImpactPreviewProps } from "@/types/donation";

/**
 * DonationImpactPreview - Animated progress comparison
 * Shows the visual impact of the donation on campaign progress
 */
export default function DonationImpactPreview({
  currentProgress,
  newProgress,
  isMounted,
  amount,
}: DonationImpactPreviewProps) {
  // Only render on client and when there's an amount
  if (!isMounted || amount <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary-500/10 to-soft-purple-500/10 border border-border-default rounded-2xl p-5"
    >
      <p className="text-text-secondary text-sm mb-4 font-medium">
        Your donation impact:
      </p>
      <div className="flex items-center gap-4">
        {/* Current Progress */}
        <div className="flex-1">
          <div className="h-3 bg-surface-overlay rounded-full overflow-hidden">
            <div
              className="h-full bg-border-subtle rounded-full"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            Current: {currentProgress.toFixed(1)}%
          </p>
        </div>

        {/* Arrow */}
        <ArrowRight className="w-5 h-5 text-soft-purple-500 shrink-0" />

        {/* New Progress (Animated) */}
        <div className="flex-1">
          <div className="h-3 bg-surface-overlay rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-soft-purple-500 rounded-full"
              initial={{ width: `${currentProgress}%` }}
              animate={{ width: `${newProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-soft-purple-400 mt-2 font-medium">
            After: {newProgress.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Goal reached message */}
      {newProgress >= 100 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-soft-purple-400 text-sm mt-4 font-semibold"
        >
          🎉 This donation will help reach the goal!
        </motion.p>
      )}
    </motion.div>
  );
}
