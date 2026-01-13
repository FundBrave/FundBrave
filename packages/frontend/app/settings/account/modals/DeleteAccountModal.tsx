"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { deleteAccountSchema, type DeleteAccountFormData } from "../schemas";

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
  alertTriangle: (
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
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  trash: (
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
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

export interface DeleteAccountModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** User's email for display */
  userEmail: string;
  /** Handler for account deletion */
  onSubmit: (data: DeleteAccountFormData) => Promise<void>;
}

/**
 * Consequences of account deletion
 */
const deletionConsequences = [
  "All your campaigns will be permanently deleted",
  "Your donation history will be anonymized",
  "Your profile and all associated data will be removed",
  "This action cannot be undone after 30 days",
];

/**
 * DeleteAccountModal - Modal for account deletion with double confirmation
 *
 * Features:
 * - Lists consequences of deletion
 * - Requires password confirmation
 * - Requires typing "DELETE" to confirm
 * - 30-day soft delete period explained
 * - Focus trap within modal
 * - Escape key closes modal
 * - Animated transitions
 *
 * Based on PHASE2_UX_SPECS.md Section 3.1
 */
export function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
  onSubmit,
}: DeleteAccountModalProps) {
  // Form state
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof DeleteAccountFormData, string>>>({});

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs for focus management and animations
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);

  // Focus trap - capture initial focus
  useEffect(() => {
    if (isOpen) {
      const previouslyFocused = document.activeElement as HTMLElement;

      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

      return () => {
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
      setPassword("");
      setConfirmation("");
      setErrors({});
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
    const result = deleteAccountSchema.safeParse({ password, confirmation });

    if (!result.success) {
      const newErrors: Partial<Record<keyof DeleteAccountFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof DeleteAccountFormData;
        newErrors[path] = issue.message;

        // Shake the appropriate input
        if (path === "password") shakeInput(passwordRef);
        if (path === "confirmation") shakeInput(confirmationRef);
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
      await onSubmit({ password, confirmation });
      // The page will redirect after successful deletion
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete account. Please try again.";
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

  // Check if DELETE is typed correctly
  const isDeleteTyped = confirmation === "DELETE";

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
              "border border-destructive/30",
              "shadow-2xl shadow-black/20",
              "max-h-[90vh] overflow-y-auto scrollbar-hidden"
            )}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-destructive/20 sticky top-0 bg-background z-10">
              <div className="flex items-center gap-3">
                <span className="text-destructive">{icons.alertTriangle}</span>
                <h2
                  id="delete-account-title"
                  className="text-lg font-semibold text-destructive"
                >
                  Delete Account
                </h2>
              </div>
              <button
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Warning message */}
                <div
                  id="delete-account-description"
                  className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-sm text-foreground mb-3">
                    You are about to permanently delete your account{" "}
                    <strong className="text-destructive">{userEmail}</strong>. This will:
                  </p>
                  <ul className="space-y-2">
                    {deletionConsequences.map((consequence, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <span className="text-destructive mt-0.5">{icons.trash}</span>
                        <span>{consequence}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Soft delete info */}
                <div className="p-3 rounded-lg bg-surface-sunken border border-white/10">
                  <p className="text-xs text-text-secondary">
                    <strong className="text-foreground">30-day grace period:</strong> Your account will be deactivated immediately, but permanently deleted after 30 days. You can reactivate by logging in within this period.
                  </p>
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

                {/* Password input */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="delete-password" className="text-sm font-medium text-foreground">
                    Enter your password
                  </Label>
                  <input
                    ref={(el) => {
                      passwordRef.current = el;
                      if (firstInputRef.current === null) {
                        firstInputRef.current = el;
                      }
                    }}
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "delete-password-error" : undefined}
                    className={cn(
                      "w-full bg-surface-sunken rounded-xl px-4 py-3",
                      "text-foreground placeholder:text-text-tertiary",
                      "border outline-none",
                      "focus:ring-2 focus:ring-destructive/50 focus:border-destructive/50",
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
                        id="delete-password-error"
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

                {/* Confirmation input */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="delete-confirmation" className="text-sm font-medium text-foreground">
                    Type <span className="font-mono text-destructive">DELETE</span> to confirm
                  </Label>
                  <input
                    ref={confirmationRef}
                    id="delete-confirmation"
                    type="text"
                    value={confirmation}
                    onChange={(e) => {
                      setConfirmation(e.target.value.toUpperCase());
                      setErrors((prev) => ({ ...prev, confirmation: undefined }));
                    }}
                    placeholder="DELETE"
                    autoComplete="off"
                    aria-invalid={!!errors.confirmation}
                    aria-describedby={errors.confirmation ? "delete-confirmation-error" : undefined}
                    className={cn(
                      "w-full bg-surface-sunken rounded-xl px-4 py-3",
                      "text-foreground placeholder:text-text-tertiary font-mono",
                      "border outline-none",
                      "focus:ring-2 focus:ring-destructive/50 focus:border-destructive/50",
                      "transition-all duration-200",
                      "min-h-[44px]",
                      errors.confirmation
                        ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
                        : isDeleteTyped
                          ? "border-destructive/50"
                          : "border-white/10"
                    )}
                  />
                  <AnimatePresence>
                    {errors.confirmation && (
                      <motion.p
                        id="delete-confirmation-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-destructive"
                        role="alert"
                      >
                        {errors.confirmation}
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
                    variant="destructive"
                    loading={isSubmitting}
                    loadingText="Deleting..."
                    disabled={!isDeleteTyped || !password}
                  >
                    Delete Account
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DeleteAccountModal;
