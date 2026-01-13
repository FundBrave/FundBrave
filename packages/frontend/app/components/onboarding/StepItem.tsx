"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check } from "@/app/components/ui/icons";
import { ComponentType } from "react";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";

type StepStatus = "completed" | "active" | "inactive" | "next";

interface StepItemProps {
  Icon: ComponentType<{ className?: string; useGradient?: boolean }>;
  title: string;
  subtitle: string;
  status: StepStatus;
  index: number;
}

// Checkmark animation - clean scale + fade, no rotation
const checkmarkVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
};

const checkmarkTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 15,
};

/**
 * Step item component for desktop sidebar
 * Shows icon, title, subtitle, and visual state (inactive/active/completed)
 * Active state features a breathing glow effect (respects reduced motion preference)
 */
export const StepItem = ({ Icon, title, subtitle, status }: StepItemProps) => {
  const prefersReducedMotion = useReducedMotion();
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isInactive = status === "inactive";
  const isNext = status === "next";

  // Breathing glow animation - disabled for reduced motion
  const breathingGlow = !prefersReducedMotion && isActive
    ? [
        "0 0 0 0 rgba(139, 92, 246, 0)",
        "0 0 20px 8px rgba(139, 92, 246, 0.4)",
        "0 0 0 0 rgba(139, 92, 246, 0)",
      ]
    : isActive
      ? "0 0 15px 4px rgba(139, 92, 246, 0.3)" // Static glow for reduced motion
      : "0 0 0 0 rgba(139, 92, 246, 0)";

  return (
    <div className="flex items-center gap-3 rounded-lg transition-all duration-300">
      {/* Animated circle with icon - breathing glow when active */}
      <motion.div
        className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        animate={{
          backgroundColor: isCompleted
            ? "var(--color-primary)"
            : isActive
            ? "var(--color-primary)"
            : "var(--color-surface-sunken)",
          borderWidth: isInactive || isNext ? 2 : 0,
          borderColor: isInactive || isNext ? "var(--color-border-subtle)" : "transparent",
          // Breathing glow effect for active state (respects reduced motion)
          boxShadow: breathingGlow,
        }}
        transition={{
          duration: prefersReducedMotion ? 0.15 : 0.3,
          boxShadow: {
            repeat: !prefersReducedMotion && isActive ? Infinity : 0,
            duration: 2,
            ease: "easeInOut",
          },
        }}
      >
        {/* Show checkmark for completed steps, icon for others */}
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="check"
              variants={checkmarkVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={checkmarkTransition}
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon
                useGradient={isNext}
                className={`w-[18px] h-[18px] ${
                  isActive
                    ? "text-white"
                    : isNext
                      ? "text-primary"
                      : "text-text-tertiary"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Step text content */}
      <motion.div
        animate={{
          color: isActive || isCompleted ? "var(--color-foreground)" : "var(--color-text-tertiary)",
        }}
        transition={{ duration: 0.3 }}
      >
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs opacity-75">{subtitle}</p>
      </motion.div>
    </div>
  );
};

/**
 * Mobile step item component (circle only)
 * Compact version for mobile progress header
 * Features breathing glow effect on active state
 */
export const MobileStepItem = ({
  Icon,
  status,
}: Omit<StepItemProps, "title" | "subtitle" | "index">) => {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isInactive = status === "inactive";
  const isNext = status === "next";

  return (
    <motion.div
      className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      animate={{
        backgroundColor: isCompleted
          ? "var(--color-primary)"
          : isActive
          ? "var(--color-primary)"
          : "var(--color-surface-sunken)",
        borderWidth: isInactive || isNext ? 2 : 0,
        borderColor: isInactive || isNext ? "var(--color-border-subtle)" : "transparent",
        // Breathing glow effect for active state
        boxShadow: isActive
          ? [
              "0 0 0 0 rgba(139, 92, 246, 0)",
              "0 0 16px 6px rgba(139, 92, 246, 0.4)",
              "0 0 0 0 rgba(139, 92, 246, 0)",
            ]
          : "0 0 0 0 rgba(139, 92, 246, 0)",
      }}
      transition={{
        duration: 0.3,
        boxShadow: {
          repeat: isActive ? Infinity : 0,
          duration: 2,
          ease: "easeInOut",
        },
      }}
    >
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="check"
            variants={checkmarkVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={checkmarkTransition}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Icon
              useGradient={isNext}
              className={`w-4 h-4 ${
                isActive
                  ? "text-white"
                  : isNext
                    ? "text-primary"
                    : "text-text-tertiary"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
