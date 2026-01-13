"use client";

import { motion } from "motion/react";
import { EASE_ORGANIC, DURATION } from "@/lib/constants/animation";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";

interface ConnectingLineProps {
  index: number;
  totalSteps: number;
  currentStepIndex: number;
}

/**
 * Vertical connecting line component for desktop sidebar
 * Animates from top to bottom when the step is completed
 * Features glow effect during fill animation
 */
export const ConnectingLine = ({
  index,
  totalSteps,
  currentStepIndex,
}: ConnectingLineProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Don't render a line after the last step
  if (index >= totalSteps - 1) return null;

  // Determine if this line segment should be filled (step is completed)
  const isFilled = currentStepIndex > index;

  return (
    <div
      className="relative flex items-center -z-20"
      style={{ height: "28px", marginLeft: "19px" }}
    >
      {/* Background line (unfilled state) */}
      <div className="absolute w-0.5 h-full bg-slate-700 left-0 top-0" />

      {/* Animated foreground line (filled state) - grows from top to bottom */}
      <motion.div
        className="absolute w-0.5 left-0 top-0"
        style={{
          background: "linear-gradient(180deg, #450CF0 0%, #CD82FF 100%)",
          transformOrigin: "top",
        }}
        initial={{ height: "0%" }}
        animate={{
          height: isFilled ? "100%" : "0%",
          boxShadow: isFilled
            ? "0 0 12px 2px rgba(139, 92, 246, 0.5)"
            : "0 0 0 0 rgba(139, 92, 246, 0)",
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : DURATION.slow,
          ease: EASE_ORGANIC,
          boxShadow: {
            duration: prefersReducedMotion ? 0 : DURATION.medium,
            delay: prefersReducedMotion ? 0 : 0.2,
          },
        }}
      />
    </div>
  );
};

/**
 * Horizontal connecting line component for mobile header
 * Animates from left to right when the step is completed
 * Features glow effect during fill animation
 */
export const ConnectingLineHorizontal = ({
  index,
  totalSteps,
  currentStepIndex,
}: ConnectingLineProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Don't render a line after the last step
  if (index >= totalSteps - 1) return null;

  // Determine if this line segment should be filled (step is completed)
  const isFilled = currentStepIndex > index;

  return (
    <div
      className="relative flex items-center flex-1 -mx-1 -z-20 self-center"
      style={{ height: "2px" }}
    >
      {/* Background line (unfilled state) */}
      <div className="absolute h-0.5 w-full bg-slate-700 left-0 top-1/2 -translate-y-1/2" />

      {/* Animated foreground line (filled state) - grows from left to right */}
      <motion.div
        className="absolute h-0.5 left-0 top-1/2 -translate-y-1/2"
        style={{
          background: "linear-gradient(90deg, #450CF0 0%, #CD82FF 100%)",
          transformOrigin: "left",
        }}
        initial={{ width: "0%" }}
        animate={{
          width: isFilled ? "100%" : "0%",
          boxShadow: isFilled
            ? "0 0 10px 2px rgba(139, 92, 246, 0.5)"
            : "0 0 0 0 rgba(139, 92, 246, 0)",
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : DURATION.slow,
          ease: EASE_ORGANIC,
          boxShadow: {
            duration: prefersReducedMotion ? 0 : DURATION.medium,
            delay: prefersReducedMotion ? 0 : 0.2,
          },
        }}
      />
    </div>
  );
};
