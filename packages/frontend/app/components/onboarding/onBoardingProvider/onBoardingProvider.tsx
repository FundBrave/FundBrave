"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";

import { ONBOARDING_STEPS } from "../../../../lib/onboarding-steps";
import { useRouter, usePathname } from "next/navigation";

type OnboardingProviderProps = {
  children: ReactNode;
};

type OnboardingContextValue = {
  currentStepSlug: string;
  currentStepIndex: number;
  isAnimatedLine: boolean;
  setIsAnimatedLine: (v: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStepIndex: (i: number) => void;
};

export const OnboardingContext = createContext<
  OnboardingContextValue | undefined
>(undefined);

export const OnboardingContextProvider = ({
  children,
}: OnboardingProviderProps) => {
  const router = useRouter();
  const pathName = usePathname();

  const fallbackStepSlug = ONBOARDING_STEPS[0]?.slug ?? "";

  const segments = (pathName ?? "").split("/").filter(Boolean);
  const currentStepSlug = segments.at(-1) ?? fallbackStepSlug;

  // track the line to be animated omo
  const [isAnimatedLine, setIsAnimatedLine] = useState<boolean>(false);

  // const [currentStep, setCurrentStep] = useState<string>( ONBOARDING_STEPS[0]?.slug );

  // Determine the current step index based on the URL slug
  // If no match is found, default to the first step (index 0)
  const goToStepIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= ONBOARDING_STEPS.length) return;
      const step = ONBOARDING_STEPS[index];
      if (!step?.slug) return;
      router.push(`/onboarding/${step.slug}`);
    },
    [router]
  );

  const currentStepIndex = Math.max(
    0,
    ONBOARDING_STEPS.findIndex((step) => step.slug === currentStepSlug)
  );

  const nextStep = useCallback(() => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setIsAnimatedLine(true);
    }

    const timer = setTimeout(() => {
      goToStepIndex(currentStepIndex + 1);
      setIsAnimatedLine(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [currentStepIndex, goToStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStepIndex]);

  const optimizedValue = useMemo(
    () => ({
      currentStepSlug,
      currentStepIndex,
      isAnimatedLine,
      setIsAnimatedLine,
      nextStep,
      prevStep,
      goToStepIndex,
    }),
    [
      currentStepSlug,
      currentStepIndex,
      isAnimatedLine,
      nextStep,
      prevStep,
      goToStepIndex,
    ]
  );

  return (
    <OnboardingContext.Provider value={optimizedValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
