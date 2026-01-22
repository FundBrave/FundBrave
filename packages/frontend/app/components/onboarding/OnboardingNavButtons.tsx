"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ArrowRight } from "@/app/components/ui/icons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";

interface OnboardingNavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  loadingLabel?: string;
  backLabel?: string;
  animationDelay?: number;
  /** Show arrow icon on next button */
  showArrow?: boolean;
  /** Disable the next button */
  disabled?: boolean;
}

// Spring transition for snappy tactile feedback
const buttonSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

// Loading spinner animation variants
const spinnerVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -90 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: { duration: 0.15 },
  },
};

// Label animation variants
const labelVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

// Arrow animation variants
const arrowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 },
  },
  hover: {
    x: 4,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
};

/**
 * Shared navigation buttons for onboarding steps.
 *
 * Motion (Framer Motion) controls:
 * - Button entrance animations
 * - Hover/tap states (lift effect, scale)
 * - Loading state transition (spinner + label swap)
 * - Arrow icon animation on hover
 *
 * Features:
 * - 44px minimum touch targets for mobile accessibility
 * - Tactile feedback with lift effect on hover
 * - Spring-based tap response
 * - Smooth loading state with AnimatePresence
 *
 * Respects prefers-reduced-motion for accessibility
 */
const OnboardingNavButtons: React.FC<OnboardingNavButtonsProps> = ({
  onBack,
  onNext,
  isLoading = false,
  nextLabel = "Next",
  loadingLabel = "Saving...",
  backLabel = "Back",
  animationDelay = 0.6,
  showArrow = false,
  disabled = false,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Simplified animations for reduced motion
  const getHoverAnimation = (isNext: boolean) => {
    if (prefersReducedMotion) return {};

    return isNext
      ? {
          y: -2,
          boxShadow: "0px 8px 25px 0px rgba(69, 12, 240, 0.5)",
        }
      : {
          y: -1,
          backgroundColor: "rgba(69,12,240,0.15)",
          boxShadow: "0px 10px 35px 0px rgba(29,5,82,0.45)",
        };
  };

  const getTapAnimation = () => {
    if (prefersReducedMotion) return {};
    return { scale: 0.97, y: 0 };
  };

  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full"
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: animationDelay,
        duration: prefersReducedMotion ? 0.15 : 0.4,
      }}
    >
      {/* Back button */}
      {onBack && (
        <motion.button
          onClick={onBack}
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[180px] min-h-[44px] h-14 px-10 py-4 bg-[rgba(69,12,240,0.1)] border border-primary rounded-[20px] text-foreground font-semibold text-base tracking-wide backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: "0px 8px 30px 0px rgba(29,5,82,0.35)",
          }}
          whileHover={getHoverAnimation(false)}
          whileTap={getTapAnimation()}
          transition={buttonSpring}
        >
          {backLabel}
        </motion.button>
      )}

      {/* Next/Submit button with loading state */}
      {onNext && (
        <motion.button
          onClick={onNext}
          disabled={isLoading || disabled}
          className="relative w-full sm:w-auto sm:min-w-[180px] min-h-[44px] h-14 px-8 py-4 rounded-[20px] text-white font-semibold text-lg tracking-wide disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
          style={{
            background: (isLoading || disabled)
              ? "linear-gradient(97deg, #3d0ad6 0%, #b76ef0 100%)"
              : "linear-gradient(97deg, #450CF0 0%, #CD82FF 100%)",
            boxShadow: "0px 3px 3px 0px rgba(254,254,254,0.25)",
          }}
          whileHover={(isLoading || disabled) ? {} : getHoverAnimation(true)}
          whileTap={(isLoading || disabled) ? {} : getTapAnimation()}
          transition={buttonSpring}
          animate={{
            opacity: isLoading ? 0.85 : 1,
          }}
        >
          {/* Loading shimmer effect */}
          {isLoading && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 -translate-x-full"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              }}
              animate={{
                x: ["0%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}

          {/* Content with AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="loading"
                className="flex items-center gap-2"
                variants={prefersReducedMotion ? undefined : labelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.span
                  variants={prefersReducedMotion ? undefined : spinnerVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative"
                >
                  {/* Outer glow ring */}
                  {!prefersReducedMotion && (
                    <motion.span
                      className="absolute inset-[-4px] rounded-full bg-white/20"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                  <Loader2 className="w-5 h-5 animate-spin" />
                </motion.span>
                <span>{loadingLabel}</span>
              </motion.span>
            ) : (
              <motion.span
                key="label"
                className="flex items-center gap-2"
                variants={prefersReducedMotion ? undefined : labelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <span>{nextLabel}</span>
                {showArrow && (
                  <motion.span
                    variants={prefersReducedMotion ? undefined : arrowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </motion.div>
  );
};

export default OnboardingNavButtons;
