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
import { settingsApi } from "@/lib/api/settings";
import { useAuth } from "@/app/provider/AuthProvider";
import { useGetMeQuery } from "@/app/generated/graphql";

/**
 * Default connected accounts (OAuth not yet implemented in backend)
 * These show the available providers with none connected by default
 */
const defaultConnectedAccounts: ConnectedAccount[] = [
  { provider: "google", connected: false },
  { provider: "github", connected: false },
  { provider: "apple", connected: false },
  { provider: "twitter", connected: false },
  { provider: "discord", connected: false },
];

/**
 * AccountSettingsPage - Account settings management page
 *
 * Route: /settings/account
 *
 * Features:
 * - Email display and change flow
 * - Password change with strength meter (connected to backend)
 * - Connected OAuth accounts management (placeholder - backend not ready)
 * - Account information display (real data from API)
 * - Account deletion (placeholder - backend not ready)
 */
export default function AccountSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Fetch full user data from GraphQL for createdAt, emailVerified, etc.
  const { data: meData, loading: meLoading } = useGetMeQuery({
    skip: !isAuthenticated || authLoading,
    fetchPolicy: 'cache-and-network',
  });

  // Data state
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(defaultConnectedAccounts);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load account data from backend settings API + GraphQL user data
  useEffect(() => {
    async function loadAccountData() {
      if (authLoading || meLoading) return;

      if (!isAuthenticated) {
        setIsLoading(false);
        setError("Please log in to view account settings");
        return;
      }

      try {
        const settingsData = await settingsApi.getAllSettings();
        const me = meData?.me;

        const transformedAccountInfo: AccountInfo = {
          email: me?.email || user?.email || "",
          emailVerified: settingsData.security?.emailVerified ?? me?.emailVerified ?? false,
          createdAt: me?.createdAt ? new Date(me.createdAt) : new Date(),
          lastLoginAt: new Date(),
          lastLoginLocation: "Unknown",
          accountStatus: "active",
          passwordLastChangedAt: settingsData.security?.lastPasswordChange
            ? new Date(settingsData.security.lastPasswordChange)
            : undefined,
        };

        setAccountInfo(transformedAccountInfo);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Failed to load account data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAccountData();
  }, [isAuthenticated, authLoading, meLoading, user, meData]);

  // Handle email change — not yet implemented in backend
  const handleEmailChange = async (data: ChangeEmailFormData) => {
    // Email change endpoint does not exist yet in backend
    throw new Error("Email change is not available yet. This feature is coming soon.");
  };

  // Handle password change — connected to real backend
  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    const result = await settingsApi.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });

    if (result.success) {
      // Update local state to reflect password change
      if (accountInfo) {
        setAccountInfo({
          ...accountInfo,
          passwordLastChangedAt: new Date(),
        });
      }
    }
  };

  // Handle OAuth connect — not yet implemented in backend
  const handleConnect = async (provider: OAuthProvider) => {
    // OAuth connection endpoint does not exist yet
    console.log("OAuth connect not yet implemented for:", provider);
    setConnectedAccounts((prev) =>
      prev.map((account) =>
        account.provider === provider
          ? { ...account, connected: true, connectedAt: new Date() }
          : account
      )
    );
  };

  // Handle OAuth disconnect — not yet implemented in backend
  const handleDisconnect = async (provider: OAuthProvider) => {
    // OAuth disconnection endpoint does not exist yet
    console.log("OAuth disconnect not yet implemented for:", provider);
    setConnectedAccounts((prev) =>
      prev.map((account) =>
        account.provider === provider
          ? { ...account, connected: false, email: undefined, connectedAt: undefined }
          : account
      )
    );
  };

  // Handle account deletion — not yet implemented in backend
  const handleDeleteAccount = async (data: DeleteAccountFormData) => {
    throw new Error("Account deletion is not available yet. This feature is coming soon.");
  };

  // Loading state
  if (authLoading || isLoading) {
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
