"use client";

import { motion, AnimatePresence } from "motion/react";
import { notFound } from "next/navigation";
import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";
import { useOnboarding } from "@/app/provider/OnboardingContext";

import { use } from "react";

interface OnboardingStepPageProps {
  params: Promise<{
    step: string;
  }>;
}

// Page transition variants with blur effect
// Faster exit, gentler entrance for smooth flow
const pageVariants = {
  initial: {
    opacity: 0,
    x: 60,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    x: -40,
    scale: 0.98,
    filter: "blur(4px)",
  },
};

// Transition configuration - gentler entrance, faster exit
const pageTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
  opacity: { duration: 0.25 },
  filter: { duration: 0.3 },
};

export default function OnboardingStepPage({
  params,
}: OnboardingStepPageProps) {
  const { step: stepSlug } = use(params);
  const { nextStep, prevStep } = useOnboarding();

  // Find the step details by slug
  const stepDetails = ONBOARDING_STEPS.find((s) => s.slug === stepSlug);

  // Redirect to 404 if the step slug is invalid
  if (!stepDetails) {
    notFound();
  }

  const { Component } = stepDetails;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepSlug}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="w-full h-full flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #09011A 0%, #09011A 50%)",
          transformOrigin: "top",
        }}
      >
        <Component onNext={nextStep} onBack={prevStep} />
      </motion.div>
    </AnimatePresence>
  );
}
