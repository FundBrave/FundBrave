"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * WithdrawModal - Confirmation modal for withdrawal action
 * Figma-aligned styling with backdrop blur and brand colors
 * Includes focus trapping for accessibility
 */

export interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  currency: string;
  isLoading?: boolean;
}

export function WithdrawModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currency,
  isLoading = false,
}: WithdrawModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap - keep focus within modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Close on escape
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [isOpen, onClose]
  );

  // Set up keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const formattedAmount = amount.toLocaleString();

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative z-10 w-full max-w-md",
          "bg-surface-elevated border border-border-default rounded-2xl",
          "shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2
            id="withdraw-modal-title"
            className="text-xl font-semibold text-foreground"
          >
            Confirm Withdrawal
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-overlay transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Alert Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-primary-400" />
            </div>
          </div>

          {/* Message */}
          <p className="text-center text-text-secondary mb-2">
            You are about to withdraw
          </p>
          <p className="text-center text-2xl font-bold text-foreground mb-4">
            {formattedAmount} {currency}
          </p>
          <p className="text-center text-sm text-text-secondary">
            This action will initiate a withdrawal request. Processing may take
            1-3 business days.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border-default">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isLoading}
            loadingText="Processing..."
            className="flex-1"
          >
            Confirm Withdrawal
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WithdrawModal;
