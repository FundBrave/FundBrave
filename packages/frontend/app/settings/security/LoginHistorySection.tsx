"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { LoginAttempt } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  clock: (
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
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  checkCircle: (
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  xCircle: (
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
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

/**
 * Format timestamp
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return `Today at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else if (days === 1) {
    return `Yesterday at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

/**
 * Get failure reason description
 */
function getFailureReasonText(reason?: LoginAttempt["failureReason"]): string {
  switch (reason) {
    case "wrong_password":
      return "Incorrect password";
    case "wrong_2fa":
      return "Invalid 2FA code";
    case "account_locked":
      return "Account temporarily locked";
    default:
      return "Failed login attempt";
  }
}

type FilterStatus = "all" | "success" | "failed";

export interface LoginHistorySectionProps {
  /** List of login attempts (last 50) */
  loginAttempts: LoginAttempt[];
}

/**
 * LoginHistorySection - Display recent login attempts
 *
 * Features:
 * - Show success/failed login attempts
 * - Display device, location, timestamp
 * - Filter by status
 * - Show last 50 attempts
 *
 * Based on PHASE2_UX_SPECS.md Section 4.5
 */
export function LoginHistorySection({
  loginAttempts,
}: LoginHistorySectionProps) {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredAttempts =
    filter === "all"
      ? loginAttempts
      : loginAttempts.filter((attempt) =>
          filter === "success" ? attempt.success : !attempt.success
        );

  return (
    <section className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-primary">{icons.clock}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Login History
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              Recent login attempts to your account
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-primary/10 text-primary"
              : "bg-surface-sunken text-text-secondary hover:text-foreground"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("success")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "success"
              ? "bg-green-500/10 text-green-400"
              : "bg-surface-sunken text-text-secondary hover:text-foreground"
          )}
        >
          Successful
        </button>
        <button
          onClick={() => setFilter("failed")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "failed"
              ? "bg-destructive/10 text-destructive"
              : "bg-surface-sunken text-text-secondary hover:text-foreground"
          )}
        >
          Failed
        </button>
      </div>

      {/* Login History List */}
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto scrollbar-hidden">
        {filteredAttempts.map((attempt) => (
          <div
            key={attempt.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-surface-sunken/30 hover:bg-surface-sunken/50 transition-colors"
          >
            {/* Status Icon */}
            <div className="mt-0.5">
              {attempt.success ? (
                <span className="login-success">{icons.checkCircle}</span>
              ) : (
                <span className="login-failure">{icons.xCircle}</span>
              )}
            </div>

            {/* Attempt Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1">
                  <h4
                    className={cn(
                      "text-sm font-medium",
                      attempt.success ? "text-foreground" : "text-destructive"
                    )}
                  >
                    {attempt.success
                      ? "Successful login"
                      : getFailureReasonText(attempt.failureReason)}
                  </h4>
                  <div className="flex flex-col gap-0.5 text-xs text-text-secondary mt-1">
                    <p>
                      {attempt.deviceName} •{" "}
                      {attempt.location.city
                        ? `${attempt.location.city}, ${attempt.location.country}`
                        : "Unknown location"}
                    </p>
                    <p>IP: {attempt.ipAddress}</p>
                  </div>
                </div>
                <span className="text-xs text-text-tertiary flex-shrink-0">
                  {formatTimestamp(attempt.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredAttempts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-text-tertiary opacity-50">
              {icons.clock}
            </div>
            <p className="text-sm text-text-secondary">
              {filter === "all"
                ? "No login history available"
                : `No ${filter} login attempts`}
            </p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      {loginAttempts.length > 0 && (
        <p className="text-xs text-text-tertiary mt-4 pt-4 border-t border-white/5">
          Showing the last {loginAttempts.length} login attempt
          {loginAttempts.length !== 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
}

export default LoginHistorySection;
