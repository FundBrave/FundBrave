"use client";

import React from "react";
import { motion } from "motion/react";
import { useOnboarding } from "@/app/provider/OnboardingContext";
import { MobileStepItem } from "./StepItem";
import { ConnectingLineHorizontal } from "./ConnectingLine";
import Image from "next/image";

// Staggered reveal animation variants for mobile
const stepsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const stepItemVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.32, 0.72, 0, 1], // Organic flow easing
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.32, 0.72, 0, 1],
    },
  },
};

/**
 * Mobile header component with horizontal progress indicator
 * Shows current step and progress through all steps
 * Features staggered reveal animation on initial mount
 */
interface MobileProgressHeaderProps {
  showLogo?: boolean;
}

export const MobileProgressHeader = ({ showLogo = false }: MobileProgressHeaderProps) => {
  const { steps, currentStepIndex } = useOnboarding();

  return (
    <div className="md:hidden w-full bg-neutral-dark-500/50 p-6 rounded-t-2xl isolate">
      {/* Logo - conditionally rendered */}
      {showLogo && (
        <motion.div
          className="flex items-center gap-3 text-white mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          <Image
            src={"/Fundbrave_icon_light.png"}
            alt="FundBrave logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-xl font-bold">FundBrave</span>
        </motion.div>
      )}

      {/* Horizontal step indicators - staggered reveal cascade */}
      <motion.div
        className="flex items-center"
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
            <React.Fragment key={step.slug}>
              <motion.div variants={stepItemVariants}>
                <MobileStepItem Icon={step.Icon} status={status} />
              </motion.div>

              {/* Connecting line */}
              <ConnectingLineHorizontal
                index={index}
                totalSteps={steps.length}
                currentStepIndex={currentStepIndex}
              />
            </React.Fragment>
          );
        })}
      </motion.div>

      {/* Current step title - with staggered text reveal */}
      <motion.div
        className="mt-4 text-center"
        variants={textVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        <p className="text-white font-semibold">
          {steps[currentStepIndex].title}
        </p>
        <p className="text-muted-foreground text-sm">
          {steps[currentStepIndex].subtitle}
        </p>
      </motion.div>
    </div>
  );
};
