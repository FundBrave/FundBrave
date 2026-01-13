"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  UserRound,
  UsersRound,
  PencilLine,
  Rocket,
  Check,
  type IconComponent,
} from "@/app/components/ui/icons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { cn } from "../../../lib/utils";
import { EASE_ORGANIC, DURATION } from "@/lib/constants/animation";

type StepIndicatorProps = {
  /**
   * Index of the active step (zero-based). Defaults to the first node.
   */
  activeStep?: number;
  /**
   * Optional className so the indicator can adapt to different layouts.
   */
  className?: string;
};

const stepIcons: IconComponent[] = [
  Mail,
  UserRound,
  UsersRound,
  PencilLine,
  Rocket,
];

// Animation variants for step dots
const stepDotVariants = {
  inactive: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(139, 92, 246, 0)",
  },
  active: {
    scale: 1,
    boxShadow: [
      "0 0 0 0 rgba(139, 92, 246, 0)",
      "0 0 20px 8px rgba(139, 92, 246, 0.4)",
      "0 0 0 0 rgba(139, 92, 246, 0)",
    ],
  },
  completed: {
    scale: 1,
    boxShadow: "0 0 12px 2px rgba(139, 92, 246, 0.3)",
  },
};

// Checkmark animation - smooth scale + fade
const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// Icon animation variants
const iconVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// Connector line animation
const connectorVariants = {
  unfilled: {
    height: "0%",
    boxShadow: "0 0 0 0 rgba(139, 92, 246, 0)",
  },
  filled: {
    height: "100%",
    boxShadow: "0 0 14px rgba(124, 58, 237, 0.4)",
  },
};

/**
 * FundBrave onboarding step indicator with animated progress dots
 *
 * Motion (Framer Motion) controls:
 * - Step dot scale and boxShadow (pulse/glow)
 * - Icon enter/exit transitions
 * - Connector line height animation
 *
 * Respects prefers-reduced-motion for accessibility
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  activeStep = 0,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Get the animation state for a step
  const getStepState = (index: number) => {
    if (index < activeStep) return "completed";
    if (index === activeStep) return "active";
    return "inactive";
  };

  // Determine transition settings based on motion preference
  const getTransition = (isActive: boolean) => {
    if (prefersReducedMotion) {
      return { duration: 0.15 };
    }
    return {
      duration: DURATION.normal,
      ease: EASE_ORGANIC,
      boxShadow: isActive
        ? {
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          }
        : { duration: DURATION.medium },
    };
  };

  return (
    <motion.div
      className={cn(
        "flex w-11 flex-col items-center rounded-full bg-gradient-to-b from-primary-900/80 via-primary-950/90 to-background px-2 py-5",
        "shadow-[0_0_30px_rgba(76,29,149,0.35)]",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.4, ease: EASE_ORGANIC }}
    >
      {stepIcons.map((Icon, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        const stepState = getStepState(index);

        return (
          <React.Fragment key={Icon.displayName ?? index}>
            {/* Step dot with animated glow */}
            <motion.div
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full",
                !isActive && !isCompleted && "border border-border-subtle bg-surface-sunken",
                (isActive || isCompleted) && "border-transparent"
              )}
              style={{
                background: isActive || isCompleted
                  ? "linear-gradient(180deg, var(--color-purple-400) 0%, var(--color-primary) 50%, var(--color-primary-700) 100%)"
                  : undefined,
              }}
              variants={prefersReducedMotion ? undefined : stepDotVariants}
              animate={stepState}
              transition={getTransition(isActive)}
            >
              {/* Outer pulse ring for active state */}
              {isActive && !prefersReducedMotion && (
                <motion.div
                  className="absolute inset-[-6px] rounded-full bg-primary/25"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.1, 0.8],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Icon with AnimatePresence for smooth transitions */}
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="check"
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Check className="size-5 text-white" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`icon-${index}`}
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Icon
                      strokeWidth={isActive ? 1.8 : 1.6}
                      className={cn(
                        "size-5 transition-colors duration-300",
                        isActive ? "text-white" : "text-text-tertiary"
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Animated connector line */}
            {index < stepIcons.length - 1 && (
              <div className="relative flex flex-col items-center py-2">
                {/* Background line (unfilled state) */}
                <div
                  aria-hidden
                  className="absolute h-10 w-[2px] rounded-full"
                  style={{
                    background: "linear-gradient(180deg, rgba(107, 107, 107, 0.55) 0%, rgba(33, 20, 54, 0.55) 100%)",
                  }}
                />
                {/* Foreground line (filled state) - animates height */}
                <motion.div
                  aria-hidden
                  className="absolute top-0 w-[2px] rounded-full"
                  style={{
                    background: "linear-gradient(180deg, var(--color-primary-500) 0%, var(--color-primary-900) 100%)",
                    transformOrigin: "top",
                  }}
                  variants={connectorVariants}
                  initial="unfilled"
                  animate={isCompleted ? "filled" : "unfilled"}
                  transition={{
                    duration: prefersReducedMotion ? 0 : DURATION.slow,
                    ease: EASE_ORGANIC,
                    boxShadow: {
                      duration: prefersReducedMotion ? 0 : DURATION.medium,
                      delay: prefersReducedMotion ? 0 : 0.2,
                    },
                  }}
                />
                {/* Spacer to maintain layout */}
                <div className="h-10 w-[2px]" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </motion.div>
  );
};

export default StepIndicator;
