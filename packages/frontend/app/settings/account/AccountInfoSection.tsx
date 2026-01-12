"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { AccountInfo } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  info: (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  calendar: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  mapPin: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date and time for display
 */
function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Account status badge component
 */
function StatusBadge({ status }: { status: AccountInfo["accountStatus"] }) {
  const config = {
    active: {
      label: "Active",
      className: "bg-green-500/20 text-green-400",
    },
    suspended: {
      label: "Suspended",
      className: "bg-destructive/20 text-destructive",
    },
    pending_verification: {
      label: "Pending Verification",
      className: "bg-yellow-500/20 text-yellow-400",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

export interface AccountInfoSectionProps {
  /** Account information */
  accountInfo: AccountInfo;
  /** Additional className */
  className?: string;
}

/**
 * AccountInfoSection - Read-only account information display
 *
 * Features:
 * - Account created date
 * - Last login date and location
 * - Account status badge
 *
 * Based on PHASE2_UX_SPECS.md Section 3.1
 */
export function AccountInfoSection({
  accountInfo,
  className,
}: AccountInfoSectionProps) {
  const { createdAt, lastLoginAt, lastLoginLocation, accountStatus } = accountInfo;

  return (
    <section
      className={cn(
        "p-6 rounded-2xl border border-white/10 bg-surface-sunken/30",
        className
      )}
      aria-labelledby="account-info-title"
    >
      {/* Section header */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
        <span className="text-text-tertiary">{icons.info}</span>
        <h3
          id="account-info-title"
          className="text-sm font-medium text-text-secondary"
        >
          Account Information
        </h3>
      </div>

      {/* Info rows */}
      <div className="flex flex-col">
        {/* Account created */}
        <div className="flex justify-between items-center py-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-text-tertiary">
            <span>{icons.calendar}</span>
            <span className="text-sm">Account created</span>
          </div>
          <span className="text-sm text-foreground">
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Last login */}
        {lastLoginAt && (
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-text-tertiary">
              <span>{icons.clock}</span>
              <span className="text-sm">Last login</span>
            </div>
            <span className="text-sm text-foreground">
              {formatDateTime(lastLoginAt)}
            </span>
          </div>
        )}

        {/* Last login location */}
        {lastLoginLocation && (
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-text-tertiary">
              <span>{icons.mapPin}</span>
              <span className="text-sm">Location</span>
            </div>
            <span className="text-sm text-foreground">
              {lastLoginLocation}
            </span>
          </div>
        )}

        {/* Account status */}
        <div className="flex justify-between items-center py-3">
          <span className="text-sm text-text-tertiary">Status</span>
          <StatusBadge status={accountStatus} />
        </div>
      </div>
    </section>
  );
}

export default AccountInfoSection;
