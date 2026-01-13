"use client";

import React, { useState } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "@/app/components/ui/icons";
import OnboardingNavButtons from "@/app/components/onboarding/OnboardingNavButtons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { EASE } from "@/lib/constants/animation";

/**
 * Interest category definition
 */
interface InterestCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Custom SVG icons for interest categories
 * Hand-crafted for FundBrave design system
 */

// Medical & Health - Heart with pulse
const MedicalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

// Emergency Relief - Alert triangle with exclamation
const EmergencyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Education - Graduation cap
const EducationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2.21 2.69 4 6 4s6-1.79 6-4v-5" />
  </svg>
);

// Community - Group of people
const CommunityIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// Creative Projects - Palette
const CreativeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

// Animals & Pets - Paw print
const AnimalsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="4" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="20" cy="16" r="2" />
    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
  </svg>
);

// Environment - Leaf
const EnvironmentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Nonprofits - Building
const NonprofitIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

// Memorials - Candle flame
const MemorialIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2c.5 0 1 .5 1 1v1c0 .5-.5 1-1 1s-1-.5-1-1V3c0-.5.5-1 1-1z" />
    <path d="M12 6c1.5 0 3 1 3 3 0 1.5-1 3-3 3s-3-1.5-3-3c0-2 1.5-3 3-3z" />
    <rect x="9" y="12" width="6" height="10" rx="1" />
  </svg>
);

// Sports & Teams - Trophy
const SportsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

// Faith & Religion - Church/cross
const FaithIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v4" />
    <path d="M8 6h8" />
    <path d="M12 6v16" />
    <path d="M5 22h14" />
    <path d="M5 22v-7a7 7 0 0 1 14 0v7" />
  </svg>
);

// Travel & Adventure - Plane
const TravelIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);

/**
 * Interest categories from PRODUCT_SPEC
 * Grid layout: 3 columns desktop, 2 columns tablet, 1 column mobile
 */
const INTEREST_CATEGORIES: InterestCategory[] = [
  { id: "medical", label: "Medical & Health", icon: <MedicalIcon /> },
  { id: "emergency", label: "Emergency Relief", icon: <EmergencyIcon /> },
  { id: "education", label: "Education", icon: <EducationIcon /> },
  { id: "community", label: "Community", icon: <CommunityIcon /> },
  { id: "creative", label: "Creative Projects", icon: <CreativeIcon /> },
  { id: "animals", label: "Animals & Pets", icon: <AnimalsIcon /> },
  { id: "environment", label: "Environment", icon: <EnvironmentIcon /> },
  { id: "nonprofit", label: "Nonprofits", icon: <NonprofitIcon /> },
  { id: "memorial", label: "Memorials", icon: <MemorialIcon /> },
  { id: "sports", label: "Sports & Teams", icon: <SportsIcon /> },
  { id: "faith", label: "Faith & Religion", icon: <FaithIcon /> },
  { id: "travel", label: "Travel & Adventure", icon: <TravelIcon /> },
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

// Icon container animation for selection glow
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

/**
 * Interests Step Component
 *
 * Motion (Framer Motion) controls:
 * - Card entrance stagger animation
 * - Selection state transitions (scale, glow, checkmark)
 * - Hover and tap feedback
 *
 * Features:
 * - Multi-select with spring animations
 * - Glow effect on selected cards
 * - Staggered entrance animation
 * - Skip option (step is optional)
 * - 44px touch targets for accessibility
 *
 * Respects prefers-reduced-motion for accessibility
 */
const Interests: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(interestId)) {
        newSet.delete(interestId);
      } else {
        // Maximum 12 interests as per spec
        if (newSet.size < 12) {
          newSet.add(interestId);
        }
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call to save interests
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);

    if (onNext) {
      onNext();
    }
  };

  const handleSkip = () => {
    if (onNext) {
      onNext();
    }
  };

  // Animation settings based on motion preference
  const staggerDelay = prefersReducedMotion ? 0 : 0.04;
  const initialDelay = prefersReducedMotion ? 0 : 0.1;

  return (
    <div className="flex flex-col w-full max-w-[700px] px-4 overflow-y-auto scrollbar-hidden">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-6"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.15 : 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-foreground tracking-wide">
          What interests you?
        </h2>
        <p className="text-text-secondary text-lg">
          Select categories you care about to personalize your feed
        </p>
      </motion.div>

      {/* Interests Grid - Staggered animation with enhanced selection feedback */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {INTEREST_CATEGORIES.map((interest, index) => {
          const isSelected = selectedInterests.has(interest.id);
          return (
            <motion.button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-colors min-h-[100px] ${
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
                      scale: 1.03,
                      boxShadow: isSelected
                        ? "0 0 35px 5px rgba(139, 92, 246, 0.35)"
                        : "0 4px 20px 0 rgba(0, 0, 0, 0.15)",
                    }
              }
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
            >
              {/* Checkmark badge - AnimatePresence for smooth enter/exit */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon container with glow on selection */}
              <motion.div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? "bg-purple-500/25 text-purple-600 dark:text-purple-300"
                    : "bg-purple-100 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400"
                }`}
                variants={prefersReducedMotion ? undefined : iconContainerVariants}
                animate={isSelected ? "selected" : "unselected"}
              >
                {interest.icon}
              </motion.div>

              <span
                className={`text-sm font-medium leading-tight ${
                  isSelected
                    ? "text-purple-700 dark:text-purple-200"
                    : "text-foreground"
                }`}
              >
                {interest.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected count with hint */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-text-secondary">
          {selectedInterests.size === 0
            ? "Select at least 3 interests for better recommendations"
            : `${selectedInterests.size} interest${selectedInterests.size > 1 ? "s" : ""} selected`}
        </p>
        {selectedInterests.size > 0 && selectedInterests.size < 3 && (
          <p className="text-text-tertiary text-sm mt-1">
            We recommend selecting at least 3
          </p>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <OnboardingNavButtons
        onBack={onBack}
        onNext={handleSubmit}
        isLoading={isLoading}
        nextLabel={selectedInterests.size === 0 ? "Skip" : "Continue"}
      />

      {/* Skip link for accessibility */}
      {selectedInterests.size > 0 && (
        <motion.button
          onClick={handleSkip}
          className="mt-4 text-text-tertiary hover:text-text-secondary text-sm underline-offset-4 hover:underline transition-colors min-h-[44px] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Skip this step
        </motion.button>
      )}
    </div>
  );
};

export default Interests;
