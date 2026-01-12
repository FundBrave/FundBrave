"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { changeEmailSchema, type ChangeEmailFormData } from "../schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  x: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  mail: (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/**
 * Modal animation variants
 */
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export interface ChangeEmailModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Current email (masked for display) */
  currentEmail: string;
  /** Handler for email change submission */
  onSubmit: (data: ChangeEmailFormData) => Promise<void>;
}

/**
 * ChangeEmailModal - Modal for changing user email
 *
 * Features:
 * - Two-step flow: enter new email -> verification sent
 * - Password confirmation required
 * - Focus trap within modal
 * - Escape key closes modal
 * - Animated transitions
 *
 * Based on PHASE2_UX_SPECS.md Section 3.1
 */
export function ChangeEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onSubmit,
}: ChangeEmailModalProps) {
  // Form state
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ChangeEmailFormData, string>>>({});

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs for focus management and animations
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus trap - capture initial focus
  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before modal opened
      const previouslyFocused = document.activeElement as HTMLElement;

      // Focus first input after animation
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

      return () => {
        // Return focus when modal closes
        previouslyFocused?.focus();
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNewEmail("");
      setPassword("");
      setErrors({});
      setShowSuccess(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  // Shake animation for error
  const shakeInput = useCallback((ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      gsap.to(ref.current, {
        keyframes: [
          { x: -6, duration: 0.05 },
          { x: 6, duration: 0.05 },
          { x: -4, duration: 0.05 },
          { x: 4, duration: 0.05 },
          { x: -2, duration: 0.05 },
          { x: 2, duration: 0.05 },
          { x: 0, duration: 0.05 },
        ],
        ease: "power2.inOut",
      });
    }
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const result = changeEmailSchema.safeParse({ newEmail, password });

    if (!result.success) {
      const newErrors: Partial<Record<keyof ChangeEmailFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ChangeEmailFormData;
        newErrors[path] = issue.message;

        // Shake the appropriate input
        if (path === "newEmail") shakeInput(emailInputRef);
        if (path === "password") shakeInput(passwordInputRef);
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSubmit({ newEmail, password });
      setShowSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change email. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full max-w-md",
              "bg-background rounded-2xl",
              "border border-white/10",
              "shadow-2xl shadow-black/20"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-email-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-primary">{icons.mail}</span>
                <h2
                  id="change-email-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Change Email
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg",
                  "text-text-tertiary hover:text-foreground",
                  "hover:bg-surface-overlay",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-label="Close modal"
              >
                {icons.x}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-4 py-8 text-center"
                  >
                    <div className="p-4 rounded-full bg-green-500/10">
                      <span className="text-green-400">{icons.check}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Verification Email Sent
                      </h3>
                      <p className="text-sm text-text-secondary max-w-xs">
                        Check your inbox at <strong className="text-foreground">{newEmail}</strong> and click the verification link to complete the change.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={onClose}
                      className="mt-4"
                    >
                      Done
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                  >
                    {/* Current email display */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-text-tertiary">Current Email</span>
                      <span className="text-sm text-text-secondary font-mono">
                        {currentEmail}
                      </span>
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {submitError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                        >
                          <p className="text-sm text-destructive">{submitError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* New email input */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="new-email" className="text-sm font-medium text-foreground">
                        New Email Address
                      </Label>
                      <input
                        ref={(el) => {
                          emailInputRef.current = el;
                          if (firstInputRef.current === null) {
                            firstInputRef.current = el;
                          }
                        }}
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => {
                          setNewEmail(e.target.value);
                          setErrors((prev) => ({ ...prev, newEmail: undefined }));
                        }}
                        placeholder="Enter your new email"
                        autoComplete="email"
                        aria-invalid={!!errors.newEmail}
                        aria-describedby={errors.newEmail ? "new-email-error" : undefined}
                        className={cn(
                          "w-full bg-surface-sunken rounded-xl px-4 py-3",
                          "text-foreground placeholder:text-text-tertiary",
                          "border outline-none",
                          "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                          "transition-all duration-200",
                          "min-h-[44px]",
                          errors.newEmail
                            ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
                            : "border-white/10"
                        )}
                      />
                      <AnimatePresence>
                        {errors.newEmail && (
                          <motion.p
                            id="new-email-error"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-xs text-destructive"
                            role="alert"
                          >
                            {errors.newEmail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Password input */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                        Confirm Password
                      </Label>
                      <input
                        ref={passwordInputRef}
                        id="confirm-password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        className={cn(
                          "w-full bg-surface-sunken rounded-xl px-4 py-3",
                          "text-foreground placeholder:text-text-tertiary",
                          "border outline-none",
                          "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                          "transition-all duration-200",
                          "min-h-[44px]",
                          errors.password
                            ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
                            : "border-white/10"
                        )}
                      />
                      <AnimatePresence>
                        {errors.password && (
                          <motion.p
                            id="password-error"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-xs text-destructive"
                            role="alert"
                          >
                            {errors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        loadingText="Sending..."
                      >
                        Send Verification
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ChangeEmailModal;
