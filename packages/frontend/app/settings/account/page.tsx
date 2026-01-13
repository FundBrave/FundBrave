"use client";

import React, { useState, useEffect } from "react";
import { EmailSection } from "./EmailSection";
import { PasswordSection } from "./PasswordSection";
import { ConnectedAccountsSection } from "./ConnectedAccountsSection";
import { AccountInfoSection } from "./AccountInfoSection";
import { DangerZoneSection } from "./DangerZoneSection";
import type {
  ChangeEmailFormData,
  ChangePasswordFormData,
  DeleteAccountFormData,
  ConnectedAccount,
  AccountInfo,
  OAuthProvider,
} from "./schemas";

/**
 * Mock API Functions
 *
 * These simulate the backend endpoints from PHASE2_UX_SPECS.md Section 3.7
 * Replace with actual API calls in production
 */

// Mock account data
const mockAccountInfo: AccountInfo = {
  email: "john.doe@example.com",
  emailVerified: true,
  createdAt: new Date("2024-06-15"),
  lastLoginAt: new Date(),
  lastLoginLocation: "San Francisco, CA",
  accountStatus: "active",
  passwordLastChangedAt: new Date("2024-11-20"),
};

// Mock connected accounts
const mockConnectedAccounts: ConnectedAccount[] = [
  {
    provider: "google",
    connected: true,
    email: "john.doe@gmail.com",
    connectedAt: new Date("2024-06-15"),
    isPrimary: true,
  },
  {
    provider: "github",
    connected: true,
    email: "johndoe",
    connectedAt: new Date("2024-08-10"),
    isPrimary: false,
  },
  {
    provider: "apple",
    connected: false,
  },
  {
    provider: "twitter",
    connected: false,
  },
  {
    provider: "discord",
    connected: false,
  },
];

/**
 * Simulates GET /api/users/me/account
 */
async function fetchAccountData(): Promise<{
  accountInfo: AccountInfo;
  connectedAccounts: ConnectedAccount[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    accountInfo: mockAccountInfo,
    connectedAccounts: mockConnectedAccounts,
  };
}

/**
 * Simulates PATCH /api/users/me/email
 */
async function changeEmail(data: ChangeEmailFormData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate validation errors
  if (data.password !== "password123") {
    throw new Error("Incorrect password");
  }

  if (data.newEmail === mockAccountInfo.email) {
    throw new Error("This email is already your current email");
  }

  console.log("Email change requested:", data.newEmail);
}

/**
 * Simulates PATCH /api/users/me/password
 */
async function changePassword(data: ChangePasswordFormData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate validation errors
  if (data.currentPassword !== "password123") {
    throw new Error("Current password is incorrect");
  }

  console.log("Password changed successfully");
}

/**
 * Simulates POST /api/auth/providers/{provider}
 */
async function connectProvider(provider: OAuthProvider): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("Connected provider:", provider);
}

/**
 * Simulates DELETE /api/auth/providers/{provider}
 */
async function disconnectProvider(provider: OAuthProvider): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Disconnected provider:", provider);
}

/**
 * Simulates DELETE /api/users/me
 */
async function deleteAccount(data: DeleteAccountFormData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate validation errors
  if (data.password !== "password123") {
    throw new Error("Incorrect password");
  }

  console.log("Account deletion requested");
  // In production, this would redirect to a goodbye page
}

/**
 * AccountSettingsPage - Account settings management page
 *
 * Route: /settings/account
 *
 * Features:
 * - Email display and change flow
 * - Password change with strength meter
 * - Connected OAuth accounts management
 * - Account information display
 * - Account deletion with confirmation
 *
 * API Endpoints (from PHASE2_UX_SPECS.md):
 * - GET /api/users/me/account - Fetch account data
 * - PATCH /api/users/me/email - Change email
 * - PATCH /api/users/me/password - Change password
 * - GET /api/auth/providers - List connected OAuth
 * - POST /api/auth/providers/{provider} - Connect OAuth
 * - DELETE /api/auth/providers/{provider} - Disconnect OAuth
 * - DELETE /api/users/me - Delete account (soft)
 */
export default function AccountSettingsPage() {
  // Data state
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadAccountData() {
      try {
        const data = await fetchAccountData();
        setAccountInfo(data.accountInfo);
        setConnectedAccounts(data.connectedAccounts);
      } catch {
        setError("Failed to load account data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAccountData();
  }, []);

  // Handle email change
  const handleEmailChange = async (data: ChangeEmailFormData) => {
    await changeEmail(data);
    // In production, this would update the email after verification
  };

  // Handle password change
  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    await changePassword(data);
    // Update password changed date
    if (accountInfo) {
      setAccountInfo({
        ...accountInfo,
        passwordLastChangedAt: new Date(),
      });
    }
  };

  // Handle OAuth connect
  const handleConnect = async (provider: OAuthProvider) => {
    await connectProvider(provider);
    // Update connected accounts
    setConnectedAccounts((prev) =>
      prev.map((account) =>
        account.provider === provider
          ? { ...account, connected: true, connectedAt: new Date() }
          : account
      )
    );
  };

  // Handle OAuth disconnect
  const handleDisconnect = async (provider: OAuthProvider) => {
    await disconnectProvider(provider);
    // Update connected accounts
    setConnectedAccounts((prev) =>
      prev.map((account) =>
        account.provider === provider
          ? { ...account, connected: false, email: undefined, connectedAt: undefined }
          : account
      )
    );
  };

  // Handle account deletion
  const handleDeleteAccount = async (data: DeleteAccountFormData) => {
    await deleteAccount(data);
    // In production, this would redirect to a goodbye page
    window.location.href = "/";
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
        {[1, 2, 3, 4, 5].map((i) => (
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
  if (error || !accountInfo) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground">
            Account Settings
          </h2>
          <p className="text-text-secondary">
            Manage your account preferences and security
          </p>
        </div>

        <div
          className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive"
          role="alert"
        >
          <p className="font-medium">Error loading account data</p>
          <p className="text-sm mt-1">{error || "Unknown error occurred"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Account Settings</h2>
        <p className="text-text-secondary">
          Manage your account preferences and security
        </p>
      </header>

      {/* Email Section */}
      <EmailSection
        email={accountInfo.email}
        isVerified={accountInfo.emailVerified}
        onChangeEmail={handleEmailChange}
      />

      {/* Password Section */}
      <PasswordSection
        lastChangedAt={accountInfo.passwordLastChangedAt}
        onChangePassword={handlePasswordChange}
      />

      {/* Connected Accounts Section */}
      <ConnectedAccountsSection
        accounts={connectedAccounts}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Account Info Section */}
      <AccountInfoSection accountInfo={accountInfo} />

      {/* Danger Zone Section */}
      <DangerZoneSection
        userEmail={accountInfo.email}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
