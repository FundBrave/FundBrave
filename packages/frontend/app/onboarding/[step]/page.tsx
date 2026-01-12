"use client";

import { motion, AnimatePresence, Variants } from "motion/react";
import { notFound } from "next/navigation";
import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";
import { useOnboarding } from "@/app/provider/OnboardingContext";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";

import { use } from "react";

interface OnboardingStepPageProps {
  params: Promise<{
    step: string;
  }>;
}

/**
 * Direction-aware page transition variants
 * The `custom` prop receives direction: 1 (forward) or -1 (backward)
 * This creates natural slide animations that match navigation direction
 */
const pageVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
    scale: 0.98,
    filter: "blur(4px)",
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -40 : 40,
    scale: 0.98,
    filter: "blur(4px)",
  }),
};

/**
 * Reduced motion variants - instant transitions for accessibility
 */
const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Transition configuration - gentler entrance, faster exit
const pageTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
  opacity: { duration: 0.25 },
  filter: { duration: 0.3 },
};

// Instant transition for reduced motion
const reducedMotionTransition = {
  duration: 0.15,
};

export default function OnboardingStepPage({
  params,
}: OnboardingStepPageProps) {
  const { step: stepSlug } = use(params);
  const { nextStep, prevStep, direction } = useOnboarding();
  const prefersReducedMotion = useReducedMotion();

  // Find the step details by slug
  const stepDetails = ONBOARDING_STEPS.find((s) => s.slug === stepSlug);

  // Redirect to 404 if the step slug is invalid
  if (!stepDetails) {
    notFound();
  }

  const { Component } = stepDetails;

  // Select variants and transition based on motion preference
  const variants = prefersReducedMotion ? reducedMotionVariants : pageVariants;
  const transition = prefersReducedMotion
    ? reducedMotionTransition
    : pageTransition;

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepSlug}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
        className="w-full h-full flex items-center justify-center"
        style={{
          transformOrigin: "top",
        }}
      >
        <Component onNext={nextStep} onBack={prevStep} />
      </motion.div>
    </AnimatePresence>
  );
}
