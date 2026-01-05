"use client";

import React, { useState } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion } from "motion/react";
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

const Goals: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col w-full max-w-[600px] px-4 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-white tracking-wide">
          What do you hope to achieve?
        </h2>
        <p className="text-[#b5b5b5] text-lg">
          Select all that apply to personalize your experience
        </p>
      </motion.div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {GOAL_OPTIONS.map((goal, index) => {
          const isSelected = selectedGoals.has(goal.id);
          return (
            <motion.button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`relative flex flex-col gap-3 p-5 rounded-2xl text-left transition-all ${
                isSelected
                  ? "bg-gradient-to-br from-purple-800/50 to-purple-900/40 border border-purple-400/30"
                  : "bg-gradient-to-br from-[#1a1525] to-[#13101d] border border-white/10 hover:border-purple-400/25"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? "bg-purple-500/25 text-purple-300"
                    : "bg-purple-900/20 text-purple-400"
                }`}
              >
                {goal.icon}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-semibold text-lg">
                  {goal.title}
                </h3>
                <p className="text-[#a8a8a8] text-sm leading-relaxed">
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
        className="text-[#b5b5b5] text-center mb-6"
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
