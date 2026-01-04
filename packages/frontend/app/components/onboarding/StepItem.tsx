"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check } from "@/app/components/ui/icons";
import { ComponentType } from "react";

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
 * Active state features a breathing glow effect instead of scale pulse
 */
export const StepItem = ({ Icon, title, subtitle, status }: StepItemProps) => {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isInactive = status === "inactive";
  const isNext = status === "next";

  return (
    <div className="flex items-center gap-4 rounded-lg transition-all duration-300">
      {/* Animated circle with icon - breathing glow when active */}
      <motion.div
        className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        animate={{
          backgroundColor: isCompleted
            ? "#8B5CF6"
            : isActive
            ? "#8B5CF6"
            : "#1e293b",
          borderWidth: isInactive || isNext ? 2 : 0,
          borderColor: isInactive || isNext ? "#475569" : "transparent",
          // Breathing glow effect for active state
          boxShadow: isActive
            ? [
                "0 0 0 0 rgba(139, 92, 246, 0)",
                "0 0 20px 8px rgba(139, 92, 246, 0.4)",
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
              <Check className="w-6 h-6 text-white" />
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
                className={`w-5 h-5 ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Step text content */}
      <motion.div
        animate={{
          color: isActive || isCompleted ? "#ffffff" : "#9ca3af",
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
      className="relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      animate={{
        backgroundColor: isCompleted
          ? "#8B5CF6"
          : isActive
          ? "#8B5CF6"
          : "#1e293b",
        borderWidth: isInactive || isNext ? 2 : 0,
        borderColor: isInactive || isNext ? "#475569" : "transparent",
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
              className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
