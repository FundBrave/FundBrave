"use client";

import React, { useState, useEffect } from "react";
import { TwoFactorSection } from "./TwoFactorSection";
import { ActiveSessionsSection } from "./ActiveSessionsSection";
import { LoginHistorySection } from "./LoginHistorySection";
import { SecurityRecommendations } from "./SecurityRecommendations";
import {
  getSecurityRecommendations,
  type TwoFactorStatus,
  type Session,
  type LoginAttempt,
  type SecurityState,
  type BackupCode,
} from "./schemas";
import { settingsApi } from "@/lib/api/settings";

/**
 * Mock API Functions
 *
 * These simulate the backend endpoints from PHASE2_UX_SPECS.md Section 4.6
 * Replace with actual API calls in production
 */

// Mock security data
const mockTwoFactorStatus: TwoFactorStatus = {
  enabled: false,
  method: undefined,
  backupCodesRemaining: undefined,
};

const mockSessions: Session[] = [
  {
    id: "session-1",
    deviceType: "desktop",
    deviceName: "Chrome on Windows",
    browser: "Chrome",
    os: "Windows 11",
    location: {
      city: "San Francisco",
      country: "United States",
      countryCode: "US",
    },
    ipAddress: "192.168.xxx.xxx",
    isCurrent: true,
    lastActiveAt: new Date(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: "session-2",
    deviceType: "mobile",
    deviceName: "Safari on iPhone",
    browser: "Safari",
    os: "iOS 17",
    location: {
      city: "New York",
      country: "United States",
      countryCode: "US",
    },
    ipAddress: "10.0.xxx.xxx",
    isCurrent: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
  },
  {
    id: "session-3",
    deviceType: "tablet",
    deviceName: "Chrome on iPad",
    browser: "Chrome",
    os: "iPadOS 17",
    location: {
      city: "Los Angeles",
      country: "United States",
      countryCode: "US",
    },
    ipAddress: "172.16.xxx.xxx",
    isCurrent: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
];

const mockLoginAttempts: LoginAttempt[] = [
  {
    id: "attempt-1",
    success: true,
    deviceName: "Chrome on Windows",
    browser: "Chrome",
    os: "Windows 11",
    location: {
      city: "San Francisco",
      country: "United States",
    },
    ipAddress: "192.168.xxx.xxx",
    timestamp: new Date(),
  },
  {
    id: "attempt-2",
    success: true,
    deviceName: "Safari on iPhone",
    browser: "Safari",
    os: "iOS 17",
    location: {
      city: "New York",
      country: "United States",
    },
    ipAddress: "10.0.xxx.xxx",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "attempt-3",
    success: false,
    failureReason: "wrong_password",
    deviceName: "Firefox on Windows",
    browser: "Firefox",
    os: "Windows 10",
    location: {
      city: "Unknown",
      country: "Unknown",
    },
    ipAddress: "45.xxx.xxx.xxx",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: "attempt-4",
    success: true,
    deviceName: "Chrome on iPad",
    browser: "Chrome",
    os: "iPadOS 17",
    location: {
      city: "Los Angeles",
      country: "United States",
    },
    ipAddress: "172.16.xxx.xxx",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
  },
  {
    id: "attempt-5",
    success: false,
    failureReason: "wrong_2fa",
    deviceName: "Chrome on macOS",
    browser: "Chrome",
    os: "macOS 14",
    location: {
      city: "Seattle",
      country: "United States",
    },
    ipAddress: "198.51.xxx.xxx",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
];

/**
 * Backend API Functions
 */
async function fetchSecurityData(): Promise<{
  twoFactorStatus: TwoFactorStatus;
  sessions: Session[];
  loginAttempts: LoginAttempt[];
  securityState: SecurityState;
}> {
  try {
    const [allSettings, apiSessions] = await Promise.all([
      settingsApi.getAllSettings(),
      settingsApi.getSessions(),
    ]);

    const twoFactorStatus: TwoFactorStatus = {
      enabled: allSettings.security.twoFactorEnabled,
      method: allSettings.security.twoFactorMethod,
      backupCodesRemaining: allSettings.security.twoFactorEnabled ? 10 : undefined,
    };

    const securityState: SecurityState = {
      twoFactorEnabled: allSettings.security.twoFactorEnabled,
      twoFactorMethod: allSettings.security.twoFactorMethod,
      recoveryEmailSet: false,
      passwordAgeInDays: 45,
      emailVerified: true,
    };

    // Transform API sessions to match local Session type (convert string to Date)
    const sessions: Session[] = apiSessions.map(session => ({
      ...session,
      lastActiveAt: new Date(session.lastActiveAt),
      createdAt: new Date(session.createdAt),
    }));

    // TODO: Fetch login attempts from backend
    const loginAttempts = mockLoginAttempts;

    return {
      twoFactorStatus,
      sessions,
      loginAttempts,
      securityState,
    };
  } catch (error) {
    console.error('Failed to fetch security data:', error);
    throw error;
  }
}

/**
 * Enable 2FA
 */
async function enableTwoFactor(): Promise<void> {
  await settingsApi.enable2FA();
}

/**
 * Disable 2FA
 */
async function disableTwoFactor(password: string = ''): Promise<void> {
  await settingsApi.disable2FA(password);
}

/**
 * Regenerate backup codes
 */
async function regenerateBackupCodes(): Promise<BackupCode[]> {
  const response = await settingsApi.regenerateBackupCodes();
  return response.codes.map(code => ({ code, used: false }));
}

/**
 * Revoke a session
 */
async function revokeSession(sessionId: string): Promise<void> {
  await settingsApi.revokeSession(sessionId);
}

/**
 * Revoke all other sessions
 */
async function revokeAllOtherSessions(): Promise<void> {
  await settingsApi.revokeAllOtherSessions();
}

/**
 * SecuritySettingsPage - Security management page
 *
 * Route: /settings/security
 *
 * Features:
 * - Two-factor authentication setup/management
 * - Active sessions list with revoke capability
 * - Login history (last 50 attempts)
 * - Security recommendations checklist
 *
 * API Endpoints (from PHASE2_UX_SPECS.md):
 * - GET /api/users/me/security - Fetch security overview
 * - POST /api/users/me/2fa/setup - Start 2FA setup
 * - POST /api/users/me/2fa/verify - Verify TOTP code
 * - GET /api/users/me/2fa/backup-codes - Get backup codes
 * - POST /api/users/me/2fa/backup-codes - Regenerate backup codes
 * - DELETE /api/users/me/2fa - Disable 2FA
 * - GET /api/users/me/sessions - List active sessions
 * - DELETE /api/users/me/sessions/{id} - Revoke session
 * - DELETE /api/users/me/sessions - Revoke all other sessions
 * - GET /api/users/me/login-history - Fetch login history
 */
export default function SecuritySettingsPage() {
  // Data state
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [securityState, setSecurityState] = useState<SecurityState | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadSecurityData() {
      try {
        const data = await fetchSecurityData();
        setTwoFactorStatus(data.twoFactorStatus);
        setSessions(data.sessions);
        setLoginAttempts(data.loginAttempts);
        setSecurityState(data.securityState);
      } catch {
        setError("Failed to load security data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSecurityData();
  }, []);

  // Handle 2FA enable
  const handleEnable2FA = async () => {
    await enableTwoFactor();
    // Update state
    setTwoFactorStatus({
      enabled: true,
      method: "totp",
      backupCodesRemaining: 10,
    });
    if (securityState) {
      setSecurityState({
        ...securityState,
        twoFactorEnabled: true,
        twoFactorMethod: "totp",
      });
    }
  };

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    await disableTwoFactor();
    // Update state
    setTwoFactorStatus({
      enabled: false,
      method: undefined,
      backupCodesRemaining: undefined,
    });
    if (securityState) {
      setSecurityState({
        ...securityState,
        twoFactorEnabled: false,
        twoFactorMethod: undefined,
      });
    }
  };

  // Handle regenerate backup codes
  const handleRegenerateBackupCodes = async () => {
    const codes = await regenerateBackupCodes();
    console.log("New backup codes:", codes);
    // Update state
    if (twoFactorStatus) {
      setTwoFactorStatus({
        ...twoFactorStatus,
        backupCodesRemaining: 10,
      });
    }
  };

  // Handle session revoke
  const handleRevokeSession = async (sessionId: string) => {
    await revokeSession(sessionId);
    // Update state
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  // Handle revoke all other sessions
  const handleRevokeAllOtherSessions = async () => {
    await revokeAllOtherSessions();
    // Update state
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        {/* Page Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-surface-sunken rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-surface-sunken rounded-lg animate-pulse" />
        </div>

        {/* Sections Skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30"
          >
            <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
              <div className="w-5 h-5 rounded bg-surface-sunken animate-pulse" />
              <div className="h-4 w-32 bg-surface-sunken rounded animate-pulse" />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <div className="h-5 w-40 bg-surface-sunken rounded animate-pulse" />
                <div className="h-4 w-56 bg-surface-sunken rounded animate-pulse" />
              </div>
              <div className="h-10 w-28 bg-surface-sunken rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error || !twoFactorStatus || !securityState) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground">
            Security Settings
          </h2>
          <p className="text-text-secondary">
            Manage your account security and authentication
          </p>
        </div>

        <div
          className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive"
          role="alert"
        >
          <p className="font-medium">Error loading security data</p>
          <p className="text-sm mt-1">{error || "Unknown error occurred"}</p>
        </div>
      </div>
    );
  }

  const recommendations = getSecurityRecommendations(securityState);

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Security Settings</h2>
        <p className="text-text-secondary">
          Manage your account security and authentication
        </p>
      </header>

      {/* Security Recommendations */}
      <SecurityRecommendations recommendations={recommendations} />

      {/* Two-Factor Authentication */}
      <TwoFactorSection
        status={twoFactorStatus}
        onEnable={handleEnable2FA}
        onDisable={handleDisable2FA}
        onRegenerateBackupCodes={handleRegenerateBackupCodes}
      />

      {/* Active Sessions */}
      <ActiveSessionsSection
        sessions={sessions}
        onRevokeSession={handleRevokeSession}
        onRevokeAllOtherSessions={handleRevokeAllOtherSessions}
      />

      {/* Login History */}
      <LoginHistorySection loginAttempts={loginAttempts} />
    </div>
  );
}
