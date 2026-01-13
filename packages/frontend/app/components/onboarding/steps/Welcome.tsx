"use client";

import React, { useEffect, useCallback } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { PartyPopper } from "@/app/components/ui/icons";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { useRouter } from "next/navigation";
import { useOnboardingData } from "@/app/provider/OnboardingDataContext";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { EASE_ORGANIC } from "@/lib/constants/animation";

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
  const { markComplete } = useOnboardingData();
  const prefersReducedMotion = useReducedMotion();

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

  const handleGoHome = useCallback(() => {
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
  }, [markComplete, router, prefersReducedMotion]);

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

      {/* Final action buttons with stagger */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-center"
        variants={buttonContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {onBack && (
          <motion.button
            onClick={onBack}
            className="py-3 px-6 min-h-[44px] bg-secondary rounded-lg text-foreground font-semibold"
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
          className="py-3 px-6 min-h-[44px] rounded-lg text-white font-semibold"
          variants={buttonVariants}
          whileHover={prefersReducedMotion ? {} : {
            scale: 1.02,
            y: -2,
            boxShadow: "0 8px 25px rgba(139, 92, 246, 0.5)",
          }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          transition={buttonSpring}
          style={{
            background: "linear-gradient(97deg, var(--primary-500) 0%, var(--soft-purple-500) 100%)",
          }}
        >
          Go to Home
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Welcome;
