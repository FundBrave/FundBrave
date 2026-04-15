"use client";

import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Check } from "@/app/components/ui/icons";

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const announcerRef = useRef<HTMLDivElement>(null);

  // Announce step changes to screen readers
  useEffect(() => {
    if (announcerRef.current) {
      const currentStepData = steps[currentStep - 1];
      announcerRef.current.textContent = `Step ${currentStep} of ${steps.length}: ${currentStepData?.title}. ${currentStepData?.description}`;
    }
  }, [currentStep, steps]);

  return (
    <div className="w-full">
      {/* Screen reader announcement */}
      <div
        ref={announcerRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Desktop horizontal stepper */}
      <nav
        aria-label="Campaign creation progress"
        className="hidden md:block mb-8"
      >
        <ol
          className="flex items-center justify-between"
          role="list"
        >
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isClickable = onStepClick && currentStep > step.id;
            const StepIcon = step.icon;

            return (
              <li key={step.id} className="flex items-center flex-1">
                {/* Step circle */}
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.title}: ${step.description}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-background",
                    isCompleted && "bg-primary cursor-pointer hover:bg-primary-600",
                    isCurrent && "bg-brand-gradient shadow-lg shadow-primary/30",
                    !isCompleted && !isCurrent && "bg-surface-sunken border border-border-subtle",
                    isClickable && "cursor-pointer"
                  )}
                >
                  {isCompleted ? (
                    <Check size={20} className="text-white" aria-hidden="true" />
                  ) : (
                    <StepIcon
                      size={20}
                      className={cn(
                        isCurrent ? "text-white" : "text-text-tertiary"
                      )}
                      aria-hidden="true"
                    />
                  )}
                </button>

                {/* Step info */}
                <div className="ml-3 hidden lg:block">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-foreground" : "text-text-secondary"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-text-tertiary">{step.description}</p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className="flex-1 mx-4 h-0.5 bg-surface-sunken relative overflow-hidden"
                    aria-hidden="true"
                  >
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary"
                      initial={{ width: "0%" }}
                      animate={{
                        width: isCompleted ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile progress bar */}
      <div className="md:hidden mb-6" role="group" aria-label="Campaign creation progress">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-text-secondary">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div
          className="h-2 bg-surface-sunken rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Step ${currentStep} of ${steps.length}`}
        >
          <motion.div
            className="h-full bg-brand-gradient rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
