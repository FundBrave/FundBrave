"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ChangePasswordModal } from "./modals/ChangePasswordModal";
import type { ChangePasswordFormData } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  lock: (
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export interface PasswordSectionProps {
  /** When the password was last changed */
  lastChangedAt?: Date;
  /** Handler for password change */
  onChangePassword: (data: ChangePasswordFormData) => Promise<void>;
  /** Additional className */
  className?: string;
}

/**
 * PasswordSection - Password management section
 *
 * Features:
 * - Shows when password was last changed
 * - Change password button opens modal
 * - Password strength requirements shown in modal
 *
 * Based on PHASE2_UX_SPECS.md Section 3.1
 */
export function PasswordSection({
  lastChangedAt,
  onChangePassword,
  className,
}: PasswordSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section
        className={cn(
          "p-6 rounded-2xl border border-white/10 bg-surface-sunken/30",
          className
        )}
        aria-labelledby="password-section-title"
      >
        {/* Section header */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
          <span className="text-text-tertiary">{icons.lock}</span>
          <h3
            id="password-section-title"
            className="text-sm font-medium text-text-secondary"
          >
            Password
          </h3>
        </div>

        {/* Content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-foreground text-sm">
              ************
            </span>
            {lastChangedAt && (
              <p className="text-xs text-text-tertiary">
                Last changed {formatDate(lastChangedAt)}
              </p>
            )}
            {!lastChangedAt && (
              <p className="text-xs text-text-tertiary">
                Set up a strong password to secure your account
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-center"
          >
            Change Password
          </Button>
        </div>
      </section>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onChangePassword}
      />
    </>
  );
}

export default PasswordSection;
