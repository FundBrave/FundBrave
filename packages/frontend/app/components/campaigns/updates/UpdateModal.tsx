"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "@/app/components/ui/icons";
import { trapFocus } from "@/app/lib/accessibility";
import { cn } from "@/lib/utils";
import { UpdateForm } from "./UpdateForm";
import type { CampaignUpdateData } from "./schemas";

export interface UpdateModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when form is submitted */
  onSubmit: (data: CampaignUpdateData) => Promise<void> | void;
  /** Initial values for editing */
  initialValues?: Partial<CampaignUpdateData>;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Modal title */
  title?: string;
}

/**
 * UpdateModal - Modal wrapper for the UpdateForm
 * Features:
 * - Accessible modal with ARIA attributes
 * - Focus trap for keyboard navigation
 * - Escape key to close
 * - Backdrop click to close
 * - Animated entrance/exit
 */
export function UpdateModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isLoading = false,
  title = "Post Campaign Update",
}: UpdateModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save focus and trap it when modal opens
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Trap focus in modal
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current);

        // Focus the close button initially
        const closeButton = modalRef.current.querySelector(
          'button[aria-label="Close modal"]'
        ) as HTMLElement;
        closeButton?.focus();

        return () => {
          cleanup();
          // Restore focus when modal closes
          previousFocusRef.current?.focus();
        };
      }
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          role="presentation"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-modal-title"
            className={cn(
              "relative w-full max-w-lg bg-background rounded-2xl",
              "max-h-[90vh] overflow-y-auto",
              "shadow-xl"
            )}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2
                id="update-modal-title"
                className="text-lg font-bold text-foreground font-[family-name:var(--font-family-gilgan)]"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full",
                  "text-text-secondary hover:text-foreground hover:bg-surface-overlay",
                  "transition-colors min-w-[44px] min-h-[44px]",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <UpdateForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialValues={initialValues}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpdateModal;
