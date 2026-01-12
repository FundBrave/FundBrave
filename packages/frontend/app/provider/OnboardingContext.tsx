"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useMemo, 
  useCallback,
  ReactNode 
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ONBOARDING_STEPS, OnboardingStep } from '@/lib/onboarding-steps';

interface OnboardingContextValue {
  currentStepSlug: string;
  currentStepIndex: number;
  steps: OnboardingStep[];
  nextStep: () => void;
  prevStep: () => void;
  isAnimatingLine: boolean;
  /** Direction of navigation: 1 for forward, -1 for backward */
  direction: 1 | -1;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const router = useRouter();
  const pathname = usePathname();

  // Track if we're animating the line - prevents premature icon animation
  const [isAnimatingLine, setIsAnimatingLine] = useState(false);

  // Track navigation direction: 1 for forward, -1 for backward
  const [direction, setDirection] = useState<1 | -1>(1);

  // Find the current step based on the URL pathname
  const currentPathSlug = pathname.split('/').pop() || ONBOARDING_STEPS[0].slug;
  const currentStepIndex = ONBOARDING_STEPS.findIndex(s => s.slug === currentPathSlug);
  
  // Fallback to first step if slug not found
  const safeCurrentIndex = currentStepIndex !== -1 ? currentStepIndex : 0;

  // Navigation function: Move to the next step
  const nextStep = useCallback(() => {
    if (safeCurrentIndex < ONBOARDING_STEPS.length - 1) {
      // Set direction to forward
      setDirection(1);
      // Start line animation
      setIsAnimatingLine(true);

      // Wait for line to fully animate (600ms) before changing step
      setTimeout(() => {
        const nextStepSlug = ONBOARDING_STEPS[safeCurrentIndex + 1].slug;
        router.push(`/onboarding/${nextStepSlug}`);
        setIsAnimatingLine(false);
      }, 600); // Match line animation duration
    }
  }, [safeCurrentIndex, router]);

  // Navigation function: Move to the previous step
  const prevStep = useCallback(() => {
    if (safeCurrentIndex > 0) {
      // Set direction to backward
      setDirection(-1);
      const prevStepSlug = ONBOARDING_STEPS[safeCurrentIndex - 1].slug;
      router.push(`/onboarding/${prevStepSlug}`);
    }
  }, [safeCurrentIndex, router]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<OnboardingContextValue>(() => ({
    currentStepSlug: currentPathSlug,
    currentStepIndex: safeCurrentIndex,
    steps: ONBOARDING_STEPS,
    nextStep,
    prevStep,
    isAnimatingLine,
    direction,
  }), [currentPathSlug, safeCurrentIndex, nextStep, prevStep, isAnimatingLine, direction]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook: Simplifies consuming the context in child components
export const useOnboarding = (): OnboardingContextValue => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
