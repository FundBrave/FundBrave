"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { PasswordStrengthMeter } from "@/app/components/ui/form/PasswordStrengthMeter";
import { changePasswordSchema, type ChangePasswordFormData } from "../schemas";

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
  lock: (
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
  eye: (
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
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
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
};

/**
 * PasswordInput - Reusable password input with visibility toggle
 *
 * IMPORTANT: This component is defined outside of ChangePasswordModal to prevent
 * the component from being recreated on every parent re-render, which would cause
 * the input to lose focus when typing.
 */
interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  autoComplete: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, Omit<PasswordInputProps, 'inputRef'>>(
  ({ id, value, onChange, placeholder, show, onToggleShow, error, autoComplete }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={cn(
          "w-full bg-surface-sunken rounded-xl px-4 py-3 pr-12",
          "text-foreground placeholder:text-text-tertiary",
          "border outline-none",
          "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
          "transition-all duration-200",
          "min-h-[44px]",
          error
            ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
            : "border-white/10"
        )}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2",
          "p-1.5 rounded-lg",
          "text-text-tertiary hover:text-foreground",
          "hover:bg-surface-overlay",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? icons.eyeOff : icons.eye}
      </button>
    </div>
  )
);

PasswordInput.displayName = "PasswordInput";

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

export interface ChangePasswordModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Handler for password change submission */
  onSubmit: (data: ChangePasswordFormData) => Promise<void>;
}

/**
 * ChangePasswordModal - Modal for changing user password
 *
 * Features:
 * - Current password verification
 * - New password with strength meter
 * - Confirm password matching
 * - Password visibility toggle
 * - Focus trap within modal
 * - Escape key closes modal
 * - Animated transitions
 *
 * Based on PHASE2_UX_SPECS.md Section 3.1
 */
export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  // Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordFormData, string>>>({});

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs for focus management and animations
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setShowSuccess(false);
      setSubmitError(null);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
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
    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const newErrors: Partial<Record<keyof ChangePasswordFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ChangePasswordFormData;
        newErrors[path] = issue.message;

        // Shake the appropriate input
        if (path === "currentPassword") shakeInput(currentPasswordRef);
        if (path === "newPassword") shakeInput(newPasswordRef);
        if (path === "confirmPassword") shakeInput(confirmPasswordRef);
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
      await onSubmit({ currentPassword, newPassword, confirmPassword });
      setShowSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password. Please try again.";
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
              "shadow-2xl shadow-black/20",
              "max-h-[90vh] overflow-y-auto scrollbar-hidden"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-background z-10">
              <div className="flex items-center gap-3">
                <span className="text-primary">{icons.lock}</span>
                <h2
                  id="change-password-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Change Password
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
                        Password Changed
                      </h3>
                      <p className="text-sm text-text-secondary max-w-xs">
                        Your password has been updated successfully. All other sessions have been signed out for security.
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

                    {/* Current password */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="current-password" className="text-sm font-medium text-foreground">
                        Current Password
                      </Label>
                      <PasswordInput
                        ref={(el) => {
                          currentPasswordRef.current = el;
                          if (firstInputRef.current === null) {
                            firstInputRef.current = el;
                          }
                        }}
                        id="current-password"
                        value={currentPassword}
                        onChange={(value) => {
                          setCurrentPassword(value);
                          setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                        }}
                        placeholder="Enter your current password"
                        show={showCurrentPassword}
                        onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
                        error={errors.currentPassword}
                        autoComplete="current-password"
                      />
                      <AnimatePresence>
                        {errors.currentPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-xs text-destructive"
                            role="alert"
                          >
                            {errors.currentPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* New password */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                        New Password
                      </Label>
                      <PasswordInput
                        ref={newPasswordRef}
                        id="new-password"
                        value={newPassword}
                        onChange={(value) => {
                          setNewPassword(value);
                          setErrors((prev) => ({ ...prev, newPassword: undefined }));
                        }}
                        placeholder="Enter your new password"
                        show={showNewPassword}
                        onToggleShow={() => setShowNewPassword(!showNewPassword)}
                        error={errors.newPassword}
                        autoComplete="new-password"
                      />
                      <AnimatePresence>
                        {errors.newPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-xs text-destructive"
                            role="alert"
                          >
                            {errors.newPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Password strength meter */}
                      <PasswordStrengthMeter
                        password={newPassword}
                        showRequirements={true}
                        className="mt-2"
                      />
                    </div>

                    {/* Confirm password */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                        Confirm New Password
                      </Label>
                      <PasswordInput
                        ref={confirmPasswordRef}
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(value) => {
                          setConfirmPassword(value);
                          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }}
                        placeholder="Confirm your new password"
                        show={showConfirmPassword}
                        onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                        error={errors.confirmPassword}
                        autoComplete="new-password"
                      />
                      <AnimatePresence>
                        {errors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-xs text-destructive"
                            role="alert"
                          >
                            {errors.confirmPassword}
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
                        loadingText="Changing..."
                      >
                        Change Password
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

export default ChangePasswordModal;
