"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ChangeEmailModal } from "./modals/ChangeEmailModal";
import type { ChangeEmailFormData } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  mail: (
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
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/**
 * Mask email for display (e.g., j***@example.com)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  const firstChar = local[0];
  const masked = firstChar + "***";
  return `${masked}@${domain}`;
}

export interface EmailSectionProps {
  /** Current user email */
  email: string;
  /** Whether the email is verified */
  isVerified: boolean;
  /** Handler for email change */
  onChangeEmail: (data: ChangeEmailFormData) => Promise<void>;
  /** Additional className */
  className?: string;
}

/**
 * EmailSection - Email display and change section
 *
 * Features:
 * - Displays current email (masked)
 * - Verified/unverified badge
 * - Change email button opens modal
 *
 * Based on PHASE2_UX_SPECS.md Section 3.1
 */
export function EmailSection({
  email,
  isVerified,
  onChangeEmail,
  className,
}: EmailSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section
        className={cn(
          "p-6 rounded-2xl border border-white/10 bg-surface-sunken/30",
          className
        )}
        aria-labelledby="email-section-title"
      >
        {/* Section header */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
          <span className="text-text-tertiary">{icons.mail}</span>
          <h3
            id="email-section-title"
            className="text-sm font-medium text-text-secondary"
          >
            Email Address
          </h3>
        </div>

        {/* Content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-mono text-sm">
                {maskEmail(email)}
              </span>
              {isVerified && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                    "text-xs font-medium",
                    "bg-green-500/20 text-green-400"
                  )}
                >
                  {icons.check}
                  Verified
                </span>
              )}
              {!isVerified && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                    "text-xs font-medium",
                    "bg-yellow-500/20 text-yellow-400"
                  )}
                >
                  Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-text-tertiary">
              Your email is used for login and notifications
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-center"
          >
            Change Email
          </Button>
        </div>
      </section>

      {/* Change Email Modal */}
      <ChangeEmailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentEmail={maskEmail(email)}
        onSubmit={onChangeEmail}
      />
    </>
  );
}

export default EmailSection;
