/**
 * Notification Settings Page
 *
 * Route: /settings/notifications
 *
 * Features:
 * - Email notification preferences
 * - Toggle for each notification category
 * - Frequency options
 * - Unsubscribe from all option
 * - Mobile-responsive layout with 44px touch targets
 *
 * Based on PHASE4_UX_SPECS.md Section 5: Notifications - Email
 */

"use client";

import React from "react";
import { EmailPreferencesForm } from "./EmailPreferencesForm";
import { useEmailPreferences } from "@/app/hooks/useEmailPreferences";

/**
 * NotificationSettingsPage
 *
 * Main page component for notification preferences.
 * Integrates with useEmailPreferences hook for state management.
 */
export default function NotificationSettingsPage() {
  const {
    preferences,
    email,
    isLoading,
    isSaving,
    error,
    updatePreference,
    unsubscribeFromAll,
  } = useEmailPreferences();

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">
          Notification Settings
        </h2>
        <p className="text-text-secondary">
          Manage your email notification preferences
        </p>
      </header>

      {/* In-App Notifications Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            In-App Notifications
          </h3>
          <p className="text-xs text-text-secondary">
            Get notified about activity on FundBrave
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground mb-1">
                Coming Soon
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                In-app notification preferences will be available in the next update.
                You&apos;ll be able to customize push notifications, sound alerts, and
                notification badges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Email Notifications Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Email Notifications
          </h3>
          <p className="text-xs text-text-secondary">
            Choose which emails you want to receive
          </p>
        </div>

        {/* Email Preferences Form */}
        <EmailPreferencesForm
          preferences={preferences}
          email={email}
          isLoading={isLoading}
          isSaving={isSaving}
          error={error}
          onUpdatePreference={updatePreference}
          onUnsubscribeAll={unsubscribeFromAll}
        />
      </section>

      {/* Help Text */}
      <footer className="pt-6 border-t border-white/10">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            About Email Notifications
          </h4>
          <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
            <p>
              We send emails to keep you informed about important activity on your
              FundBrave account. You can customize which emails you receive, but some
              notifications like donation receipts are required for legal and security
              reasons.
            </p>
            <p>
              Changes to your email preferences take effect immediately. If you
              unsubscribe from marketing emails, you&apos;ll still receive essential
              account-related emails.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
