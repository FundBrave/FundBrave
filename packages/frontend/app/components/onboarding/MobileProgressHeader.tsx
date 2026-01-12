"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/provider/OnboardingContext";
import { MobileStepItem } from "./StepItem";
import { ConnectingLineHorizontal } from "./ConnectingLine";
import Image from "next/image";
import { EASE_ORGANIC } from "@/lib/constants/animation";
import { authApi } from "@/lib/api/auth";
import { LogOut } from "lucide-react";

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
      ease: EASE_ORGANIC,
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
      ease: EASE_ORGANIC,
    },
  },
};

/**
 * Sign Out Button Component for Mobile
 * Logs the user out and redirects to /auth
 */
const MobileSignOutButton = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      router.push("/auth");
    } catch (error) {
      console.error("Failed to sign out:", error);
      // Still redirect even if logout fails
      router.push("/auth");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoggingOut}
      className="p-2 rounded-lg transition-colors text-destructive hover:text-destructive/90 active:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Sign out of your account"
    >
      <LogOut className="w-5 h-5" aria-hidden="true" />
    </button>
  );
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
    <div className="md:hidden w-full bg-background/50 p-6 rounded-t-2xl isolate">
      {/* Header with logo and sign out */}
      <div className="flex items-center justify-between mb-6">
        {/* Logo - conditionally rendered */}
        {showLogo && (
          <motion.div
            className="flex items-center gap-3 text-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_ORGANIC }}
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

        {/* Sign Out Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_ORGANIC, delay: 0.1 }}
          className={showLogo ? "" : "ml-auto"}
        >
          <MobileSignOutButton />
        </motion.div>
      </div>

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
        <p className="text-foreground font-semibold">
          {steps[currentStepIndex].title}
        </p>
        <p className="text-muted-foreground text-sm">
          {steps[currentStepIndex].subtitle}
        </p>
      </motion.div>
    </div>
  );
};
