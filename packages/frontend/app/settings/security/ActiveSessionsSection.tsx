"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import type { Session } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  monitor: (
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
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  smartphone: (
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
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  tablet: (
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
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  activity: (
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
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

/**
 * Format date as relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Active now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

/**
 * Get device icon based on type
 */
function getDeviceIcon(deviceType: Session["deviceType"]) {
  switch (deviceType) {
    case "mobile":
      return icons.smartphone;
    case "tablet":
      return icons.tablet;
    default:
      return icons.monitor;
  }
}

export interface ActiveSessionsSectionProps {
  /** List of active sessions */
  sessions: Session[];
  /** Callback to revoke a specific session */
  onRevokeSession: (sessionId: string) => Promise<void>;
  /** Callback to revoke all other sessions */
  onRevokeAllOtherSessions: () => Promise<void>;
}

/**
 * ActiveSessionsSection - Manage active login sessions
 *
 * Features:
 * - List all active sessions
 * - Show device, browser, location, last active
 * - Current session indicator
 * - Revoke individual sessions
 * - "Sign out all other devices" button
 *
 * Based on PHASE2_UX_SPECS.md Section 4.4
 */
export function ActiveSessionsSection({
  sessions,
  onRevokeSession,
  onRevokeAllOtherSessions,
}: ActiveSessionsSectionProps) {
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to sign out this device?")) {
      return;
    }

    setRevokingSessionId(sessionId);
    try {
      await onRevokeSession(sessionId);
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!confirm(`Sign out all ${otherSessions.length} other device(s)? You'll need to sign in again on those devices.`)) {
      return;
    }

    setIsRevokingAll(true);
    try {
      await onRevokeAllOtherSessions();
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <section className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-primary">{icons.activity}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Active Sessions
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              Manage devices where you're currently signed in
            </p>
          </div>
        </div>
        {otherSessions.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRevokeAllOtherSessions}
            loading={isRevokingAll}
            loadingText="Signing out..."
          >
            Sign Out All Others
          </Button>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex flex-col gap-3">
        {/* Current Session */}
        {currentSession && (
          <div className="session-card current p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div className="flex items-start gap-4">
              {/* Device Icon */}
              <div className="mt-1 text-primary">
                {getDeviceIcon(currentSession.deviceType)}
              </div>

              {/* Session Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      {currentSession.deviceName}
                    </h4>
                    <div className="flex flex-col gap-0.5 text-xs text-text-secondary">
                      <p>
                        {currentSession.location.city}, {currentSession.location.country}
                      </p>
                      <p>IP: {currentSession.ipAddress}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                    Current Session
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {formatRelativeTime(currentSession.lastActiveAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Sessions */}
        {otherSessions.map((session) => (
          <div
            key={session.id}
            className="session-card p-4 rounded-xl border border-white/10 bg-surface-sunken/30 transition-all duration-200 hover:border-white/20"
          >
            <div className="flex items-start gap-4">
              {/* Device Icon */}
              <div className="mt-1 text-text-tertiary">
                {getDeviceIcon(session.deviceType)}
              </div>

              {/* Session Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      {session.deviceName}
                    </h4>
                    <div className="flex flex-col gap-0.5 text-xs text-text-secondary">
                      <p>
                        {session.location.city}, {session.location.country}
                      </p>
                      <p>IP: {session.ipAddress}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    loading={revokingSessionId === session.id}
                    loadingText="Signing out..."
                    className="flex-shrink-0"
                  >
                    Sign Out
                  </Button>
                </div>
                <p className="text-xs text-text-tertiary">
                  Last active {formatRelativeTime(session.lastActiveAt)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-text-tertiary opacity-50">
              {icons.activity}
            </div>
            <p className="text-sm text-text-secondary">No active sessions</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ActiveSessionsSection;
