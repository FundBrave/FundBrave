"use client";

import React, { useState } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Rocket,
  Users,
  Gift,
  Globe,
  Sparkles,
  Check,
} from "@/app/components/ui/icons";
import OnboardingNavButtons from "@/app/components/onboarding/OnboardingNavButtons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { EASE } from "@/lib/constants/animation";

interface GoalOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: "raise-funds",
    title: "Raise Funds",
    description: "Launch campaigns for personal or organizational causes",
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    id: "support-causes",
    title: "Support Causes",
    description: "Donate to campaigns and make a difference",
    icon: <Heart className="w-6 h-6" />,
  },
  {
    id: "build-community",
    title: "Build Community",
    description: "Connect with like-minded donors and fundraisers",
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: "earn-rewards",
    title: "Earn Rewards",
    description: "Get NFT badges and recognition for contributions",
    icon: <Gift className="w-6 h-6" />,
  },
  {
    id: "global-impact",
    title: "Global Impact",
    description: "Support international causes and projects",
    icon: <Globe className="w-6 h-6" />,
  },
  {
    id: "explore-defi",
    title: "Explore DeFi",
    description: "Learn and participate in decentralized finance",
    icon: <Sparkles className="w-6 h-6" />,
  },
];

// Spring transition for card selection feedback
const cardSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 20,
};

// Checkmark animation variants
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

// Icon container animation for selection
const iconContainerVariants = {
  unselected: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(139, 92, 246, 0)",
  },
  selected: {
    scale: 1.05,
    boxShadow: "0 0 20px 4px rgba(139, 92, 246, 0.4)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

const Goals: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const toggleGoal = (goalId: string) => {
    setError(null);
    setSelectedGoals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedGoals.size === 0) {
      setError("Please select at least one goal");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    if (onNext) {
      onNext();
    }
  };

  // Animation settings based on motion preference
  const staggerDelay = prefersReducedMotion ? 0 : 0.05;
  const initialDelay = prefersReducedMotion ? 0 : 0.1;

  return (
    <div className="flex flex-col w-full max-w-[600px] px-4 overflow-y-auto scrollbar-hidden">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-foreground tracking-wide">
          What do you hope to achieve?
        </h2>
        <p className="text-text-secondary text-lg">
          Select all that apply to personalize your experience
        </p>
      </motion.div>

      {/* Goals Grid - Staggered animation with enhanced selection feedback */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {GOAL_OPTIONS.map((goal, index) => {
          const isSelected = selectedGoals.has(goal.id);
          return (
            <motion.button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`relative flex flex-col gap-3 p-5 rounded-2xl text-left transition-colors ${
                isSelected
                  ? "bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-300 dark:from-purple-800/50 dark:to-purple-900/40 dark:border-purple-400/30"
                  : "bg-surface-elevated border border-border-default hover:border-purple-400/25 dark:bg-gradient-to-br dark:from-[#1a1525] dark:to-[#13101d]"
              }`}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              animate={{
                opacity: 1,
                y: 0,
                // Glow effect on selected cards
                boxShadow: isSelected
                  ? "0 0 30px 0 rgba(139, 92, 246, 0.25)"
                  : "0 0 0 0 rgba(139, 92, 246, 0)",
              }}
              transition={{
                delay: initialDelay + index * staggerDelay,
                ...cardSpring,
                boxShadow: { duration: 0.3, ease: EASE.organic },
              }}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: 1.02,
                      boxShadow: isSelected
                        ? "0 0 35px 5px rgba(139, 92, 246, 0.35)"
                        : "0 4px 20px 0 rgba(0, 0, 0, 0.15)",
                    }
              }
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            >
              {/* Checkmark badge - AnimatePresence for smooth enter/exit */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon container with glow on selection */}
              <motion.div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? "bg-purple-500/25 text-purple-600 dark:text-purple-300"
                    : "bg-purple-100 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400"
                }`}
                variants={prefersReducedMotion ? undefined : iconContainerVariants}
                animate={isSelected ? "selected" : "unselected"}
              >
                {goal.icon}
              </motion.div>

              <div className="flex flex-col gap-1">
                <h3 className="text-foreground font-semibold text-lg">
                  {goal.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {goal.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          className="text-red-400 text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

      {/* Selected count */}
      <motion.p
        className="text-text-secondary text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {selectedGoals.size === 0
          ? "No goals selected"
          : `${selectedGoals.size} goal${selectedGoals.size > 1 ? "s" : ""} selected`}
      </motion.p>

      {/* Navigation Buttons */}
      <OnboardingNavButtons
        onBack={onBack}
        onNext={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Goals;
