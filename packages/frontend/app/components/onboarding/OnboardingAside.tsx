"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/provider/OnboardingContext";
import { StepItem } from "./StepItem";
import { ConnectingLine } from "./ConnectingLine";
import Image from "next/image";
import { EASE_ORGANIC } from "@/lib/constants/animation";
import { authApi } from "@/lib/api/auth";
import { LogOut } from "lucide-react";

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
      ease: EASE_ORGANIC,
    },
  },
};

/**
 * Sign Out Button Component
 * Logs the user out and redirects to /auth
 */
const SignOutButton = () => {
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
      className="min-h-11 px-2 -mx-2 rounded-lg flex items-center gap-2 transition-colors text-destructive hover:text-destructive/90 active:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Sign out of your account"
    >
      <LogOut className="w-4 h-4" aria-hidden="true" />
      <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
    </button>
  );
};

/**
 * Desktop sidebar component that displays all onboarding steps
 * with connecting lines and staggered reveal animations on initial mount
 */
export const OnboardingAside = () => {
  const { steps, currentStepIndex } = useOnboarding();

  return (
    <aside
      className="hidden md:flex w-full md:w-1/3 p-6 md:py-8 md:px-12 flex-col justify-between relative md:rounded-l-2xl isolate onboarding-aside-gradient overflow-y-auto scrollbar-hidden"
    >
      {/* Logo and brand */}
      <div>
        <motion.div
          className="flex items-center gap-3 text-foreground mb-8 md:mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_ORGANIC }}
        >
          <div className="w-10 h-10 rounded-lg relative">
            {/* Light mode: gradient icon (visible on light bg) */}
            <Image
              src={"/Fundbrave_icon-gradient.png"}
              alt="FundBrave logo"
              fill
              className="object-contain dark:hidden"
            />
            {/* Dark mode: light icon (visible on dark bg) */}
            <Image
              src={"/Fundbrave_icon_light.png"}
              alt="FundBrave logo"
              fill
              className="object-contain hidden dark:block"
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

      {/* Footer links - Mobile-first: min-h-11 for 44px touch target, active state for mobile */}
      <motion.div
        className="text-muted-foreground text-sm space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <a
          href="/"
          className="min-h-11 px-2 -mx-2 rounded-lg inline-flex items-center gap-2 transition-colors hover:text-foreground active:text-foreground active:bg-foreground/10"
        >
          <span>&larr;</span>
          <span>Back to home</span>
        </a>

        <SignOutButton />
      </motion.div>
    </aside>
  );
};
