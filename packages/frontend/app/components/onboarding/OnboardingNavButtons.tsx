"use client";

import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "@/app/components/ui/icons";

interface OnboardingNavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  loadingLabel?: string;
  backLabel?: string;
  animationDelay?: number;
}

// Spring transition for snappy tactile feedback
const buttonSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

/**
 * Shared navigation buttons for onboarding steps.
 * Eliminates duplicated button styling across ProfileDetail, SocialProfile, Goals, etc.
 * Features tactile feedback with lift effect on hover and spring tap response.
 */
const OnboardingNavButtons: React.FC<OnboardingNavButtonsProps> = ({
  onBack,
  onNext,
  isLoading = false,
  nextLabel = "Next",
  loadingLabel = "Saving...",
  backLabel = "Back",
  animationDelay = 0.6,
}) => {
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      {onBack && (
        <motion.button
          onClick={onBack}
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[180px] min-h-[44px] h-14 px-10 py-4 bg-[rgba(69,12,240,0.1)] border border-primary rounded-[20px] text-foreground font-semibold text-base tracking-wide backdrop-blur-md disabled:opacity-50"
          style={{
            boxShadow: "0px 8px 30px 0px rgba(29,5,82,0.35)",
          }}
          whileHover={{
            y: -1,
            backgroundColor: "rgba(69,12,240,0.15)",
            boxShadow: "0px 10px 35px 0px rgba(29,5,82,0.45)",
          }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={buttonSpring}
        >
          {backLabel}
        </motion.button>
      )}
      {onNext && (
        <motion.button
          onClick={onNext}
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[180px] min-h-[44px] h-14 px-8 py-4 rounded-[20px] text-white font-semibold text-lg tracking-wide disabled:opacity-70 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(97deg, #450CF0 0%, #CD82FF 100%)",
            boxShadow: "0px 3px 3px 0px rgba(254,254,254,0.25)",
          }}
          whileHover={{
            y: -2,
            boxShadow: "0px 8px 25px 0px rgba(69, 12, 240, 0.5)",
          }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={buttonSpring}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {loadingLabel}
            </>
          ) : (
            nextLabel
          )}
        </motion.button>
      )}
    </motion.div>
  );
};

export default OnboardingNavButtons;
