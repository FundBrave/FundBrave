"use client";

import React from "react";
import { motion } from "motion/react";
import { useOnboarding } from "@/app/provider/OnboardingContext";
import { StepItem } from "./StepItem";
import { ConnectingLine } from "./ConnectingLine";
import Image from "next/image";

// Staggered reveal animation variants
const stepsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const stepItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.32, 0.72, 0, 1], // Organic flow easing
    },
  },
};

/**
 * Desktop sidebar component that displays all onboarding steps
 * with connecting lines and staggered reveal animations on initial mount
 */
export const OnboardingAside = () => {
  const { steps, currentStepIndex } = useOnboarding();

  return (
    <aside
      className="hidden md:flex w-full md:w-1/3 bg-neutral-dark-500/50 p-6 md:p-12 flex-col justify-between relative md:rounded-l-2xl isolate"
      style={{
        background: "linear-gradient(to bottom, var(--primary-500) 0%, var(--neutral-dark-500) 50%)",
        transformOrigin: "top",
      }}
    >
      {/* Logo and brand */}
      <div>
        <motion.div
          className="flex items-center gap-3 text-white mb-8 md:mb-16"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="w-10 h-10 rounded-lg relative">
            <Image
              src={"/Funbrave_icon_dark.png"}
              alt="FundBrave logo"
              fill
              className="w-[150px]"
            />
          </div>
          <span className="text-2xl font-bold">FundBrave</span>
        </motion.div>

        {/* Steps with connecting lines - staggered reveal cascade */}
        <motion.div
          className="relative"
          variants={stepsContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => {
            const status =
              currentStepIndex > index
                ? "completed"
                : currentStepIndex === index
                ? "active"
                : currentStepIndex + 1 === index
                ? "next"
                : "inactive";

            return (
              <motion.div key={step.slug} variants={stepItemVariants}>
                <StepItem {...step} status={status} index={index} />

                {/* Render connecting line between steps */}
                <ConnectingLine
                  index={index}
                  totalSteps={steps.length}
                  currentStepIndex={currentStepIndex}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Footer link - Mobile-first: min-h-11 for 44px touch target, active state for mobile */}
      <motion.div
        className="text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <a
          href="/"
          className="hover:text-white transition-colors inline-flex items-center gap-2"
        >
          <span>&larr;</span>
          <span>Back to home</span>
        </a>
      </motion.div>
    </aside>
  );
};
