"use client";

import React, { useEffect, useCallback, useState } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { PartyPopper } from "@/app/components/ui/icons";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { useRouter } from "next/navigation";
import { useOnboardingData } from "@/app/provider/OnboardingDataContext";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { EASE_ORGANIC } from "@/lib/constants/animation";
import { onboardingApi } from "@/lib/api/onboarding";

// Staggered text reveal variants
const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4,
    },
  },
};

const textItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_ORGANIC,
    },
  },
};

// Button container stagger
const buttonContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.7,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_ORGANIC,
    },
  },
};

// Spring transition for button interactions
const buttonSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

/**
 * Confetti celebration configuration
 * Uses FundBrave brand colors (purple gradient)
 */
const fireConfetti = () => {
  // FundBrave brand colors
  const brandColors = ["#450CF0", "#8B5CF6", "#CD82FF", "#A855F7", "#7C3AED"];

  // Initial burst from center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: brandColors,
    shapes: ["circle", "square"],
    scalar: 1.2,
  });

  // Left cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: brandColors,
      shapes: ["circle"],
    });
  }, 150);

  // Right cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: brandColors,
      shapes: ["circle"],
    });
  }, 300);

  // Final celebration burst
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 },
      colors: brandColors,
      startVelocity: 30,
      gravity: 0.8,
    });
  }, 500);
};

/**
 * Welcome/Success step component
 *
 * Motion (Framer Motion) controls:
 * - Component mount/unmount animations
 * - Text stagger reveals
 * - Button hover/tap states
 * - Radiating ring effects
 *
 * canvas-confetti handles:
 * - Celebration particle effects (independent of React lifecycle)
 *
 * Respects prefers-reduced-motion for accessibility
 */
const Welcome: React.FC<StepComponentProps> = ({ onBack }) => {
  const router = useRouter();
  const { data, markComplete } = useOnboardingData();
  const prefersReducedMotion = useReducedMotion();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fire confetti on mount (only if motion is allowed)
  useEffect(() => {
    if (!prefersReducedMotion) {
      // Slight delay to let the component animate in first
      const timer = setTimeout(() => {
        fireConfetti();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [prefersReducedMotion]);

  const handleGoHome = useCallback(async () => {
    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare onboarding data for submission
      const onboardingData = {
        profile: {
          username: data.profile.username,
          displayName: data.profile.fullName || data.profile.username,
          birthdate: data.profile.birthdate || undefined,
          bio: data.profile.bio || undefined,
          avatarUrl: data.profile.avatar || undefined, // Only if user uploaded one
        },
        goals: data.goals,
        interests: [], // Can be added later if needed
      };

      // Submit to backend
      await onboardingApi.completeOnboarding(onboardingData);

      // Fire one more confetti burst on completion
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.7 },
          colors: ["#450CF0", "#8B5CF6", "#CD82FF"],
        });
      }

      // Mark onboarding as complete and navigate to home
      markComplete();
      router.push("/");
    } catch (err) {
      setIsSubmitting(false);

      // User-friendly error message
      const errorMessage = err instanceof Error
        ? err.message
        : "Failed to complete onboarding. Please try again.";

      setError(errorMessage);
      console.error("Onboarding completion error:", err);
    }
  }, [isSubmitting, data, markComplete, router, prefersReducedMotion]);

  return (
    <motion.div
      className="text-center px-4"
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: prefersReducedMotion ? 0.15 : 0.4 }}
    >
      {/* Success animation with radiating rings */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
        {/* Radiating ring celebration effects - disabled for reduced motion */}
        {!prefersReducedMotion && [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-purple-500/30"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.8, 2.2],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Main icon circle */}
        <motion.div
          className="w-full h-full rounded-full flex items-center justify-center relative z-10"
          initial={{ scale: 0, rotate: prefersReducedMotion ? 0 : -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: prefersReducedMotion ? "tween" : "spring",
            stiffness: 200,
            damping: 15,
            duration: prefersReducedMotion ? 0.15 : undefined,
          }}
          style={{
            background: "linear-gradient(to right, var(--purple-600), var(--purple-400))",
          }}
        >
          <PartyPopper className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </motion.div>

        {/* Static glow for reduced motion users */}
        {prefersReducedMotion && (
          <div
            className="absolute inset-[-8px] rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
            }}
          />
        )}
      </div>

      {/* Staggered text reveals */}
      <motion.div
        variants={textContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-foreground mb-4"
          variants={textItemVariants}
        >
          You're all set!
        </motion.h2>
        <motion.p
          className="text-muted-foreground mb-8 text-sm md:text-base"
          variants={textItemVariants}
        >
          Welcome to FundBrave. You're ready to start your journey.
        </motion.p>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Final action buttons with stagger */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-center"
        variants={buttonContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {onBack && !isSubmitting && (
          <motion.button
            onClick={onBack}
            disabled={isSubmitting}
            className="py-3 px-6 min-h-[44px] bg-secondary rounded-lg text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            variants={buttonVariants}
            whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -1 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            transition={buttonSpring}
          >
            Back
          </motion.button>
        )}
        <motion.button
          onClick={handleGoHome}
          disabled={isSubmitting}
          className="py-3 px-6 min-h-[44px] rounded-lg text-white font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          variants={buttonVariants}
          whileHover={prefersReducedMotion || isSubmitting ? {} : {
            scale: 1.02,
            y: -2,
            boxShadow: "0 8px 25px rgba(139, 92, 246, 0.5)",
          }}
          whileTap={prefersReducedMotion || isSubmitting ? {} : { scale: 0.98 }}
          transition={buttonSpring}
          style={{
            background: "linear-gradient(97deg, var(--primary-500) 0%, var(--soft-purple-500) 100%)",
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Completing...</span>
            </>
          ) : (
            "Go to Home"
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Welcome;
