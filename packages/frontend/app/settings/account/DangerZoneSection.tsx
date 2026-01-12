"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { DeleteAccountModal } from "./modals/DeleteAccountModal";
import type { DeleteAccountFormData } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  alertTriangle: (
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
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  trash: (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
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

export interface DangerZoneSectionProps {
  /** User email for display in modal */
  userEmail: string;
  /** Handler for account deletion */
  onDeleteAccount: (data: DeleteAccountFormData) => Promise<void>;
  /** Additional className */
  className?: string;
}

/**
 * DangerZoneSection - Destructive account actions
 *
 * Features:
 * - Red-accented danger zone styling
 * - Delete account button
 * - Opens confirmation modal with double verification
 *
 * Based on PHASE2_UX_SPECS.md Section 3.1
 */
export function DangerZoneSection({
  userEmail,
  onDeleteAccount,
  className,
}: DangerZoneSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section
        className={cn(
          "p-6 rounded-2xl border border-destructive/30 bg-destructive/5",
          className
        )}
        aria-labelledby="danger-zone-title"
      >
        {/* Section header */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-destructive/20">
          <span className="text-destructive">{icons.alertTriangle}</span>
          <h3
            id="danger-zone-title"
            className="text-sm font-medium text-destructive"
          >
            Danger Zone
          </h3>
        </div>

        {/* Content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-foreground text-sm font-medium">
              Delete Account
            </span>
            <p className="text-xs text-text-secondary">
              Permanently delete your account and all associated data. This action cannot be undone after 30 days.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-center gap-2"
          >
            {icons.trash}
            Delete Account
          </Button>
        </div>
      </section>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userEmail={userEmail}
        onSubmit={onDeleteAccount}
      />
    </>
  );
}

export default DangerZoneSection;
