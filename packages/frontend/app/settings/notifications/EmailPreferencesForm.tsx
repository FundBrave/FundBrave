/**
 * EmailPreferencesForm Component
 *
 * Main form for managing email notification preferences.
 * Grouped by category: Account, Campaigns, Social, Marketing
 */

"use client";

import React, { useState } from "react";
import {
  NotificationCategoryToggle,
  NotificationCategoryToggleSkeleton,
} from "./NotificationCategoryToggle";
import type { EmailPreferences } from "@/app/types/email-notifications";
import { cn } from "@/lib/utils";

export interface EmailPreferencesFormProps {
  /** Current email preferences */
  preferences: EmailPreferences | null;
  /** User's email address */
  email: string | null;
  /** Whether preferences are loading */
  isLoading: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to update a single preference */
  onUpdatePreference: (key: keyof EmailPreferences, value: boolean) => Promise<void>;
  /** Callback to unsubscribe from all non-essential emails */
  onUnsubscribeAll: () => Promise<void>;
}

/**
 * Preference group configuration
 */
interface PreferenceGroupConfig {
  title: string;
  description: string;
  items: Array<{
    key: keyof EmailPreferences;
    label: string;
    description: string;
    locked?: boolean;
  }>;
}

const PREFERENCE_GROUPS: PreferenceGroupConfig[] = [
  {
    title: "Account",
    description: "Essential emails about your account",
    items: [
      {
        key: "donationAlerts",
        label: "Donation Receipts",
        description: "Required for all donations (cannot disable)",
        locked: true,
      },
    ],
  },
  {
    title: "Campaigns",
    description: "Updates about campaigns you support",
    items: [
      {
        key: "donationAlerts",
        label: "Donation Alerts",
        description: "Email when you receive a donation",
      },
      {
        key: "campaignFunded",
        label: "Campaign Funded",
        description: "When your campaign reaches its funding goal",
      },
      {
        key: "campaignUpdates",
        label: "Campaign Updates",
        description: "Updates from campaigns you follow",
      },
    ],
  },
  {
    title: "Social",
    description: "Activity from your FundBrave network",
    items: [
      {
        key: "newFollowers",
        label: "New Followers",
        description: "When someone starts following you",
      },
      {
        key: "comments",
        label: "Comments",
        description: "New comments on your campaigns",
      },
      {
        key: "replies",
        label: "Replies",
        description: "Replies to your comments",
      },
      {
        key: "mentions",
        label: "Mentions",
        description: "When someone mentions you in a comment",
      },
    ],
  },
  {
    title: "Digest & Marketing",
    description: "Summaries and promotional content",
    items: [
      {
        key: "weeklyDigest",
        label: "Weekly Digest",
        description: "Summary of your FundBrave activity every Sunday",
      },
      {
        key: "marketing",
        label: "Marketing & Announcements",
        description: "News, features, and promotional content",
      },
    ],
  },
];

/**
 * EmailPreferencesForm
 *
 * Form component for managing email notification preferences.
 * Features:
 * - Grouped by category
 * - 44px touch targets
 * - Loading and error states
 * - Unsubscribe from all option
 *
 * @example
 * <EmailPreferencesForm
 *   preferences={preferences}
 *   email={email}
 *   isLoading={isLoading}
 *   isSaving={isSaving}
 *   error={error}
 *   onUpdatePreference={updatePreference}
 *   onUnsubscribeAll={unsubscribeFromAll}
 * />
 */
export function EmailPreferencesForm({
  preferences,
  email,
  isLoading,
  isSaving,
  error,
  onUpdatePreference,
  onUnsubscribeAll,
}: EmailPreferencesFormProps) {
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);

  const handleUnsubscribeAll = async () => {
    try {
      await onUnsubscribeAll();
      setShowUnsubscribeConfirm(false);
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        {PREFERENCE_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <div className="space-y-1">
              <div className="h-5 w-32 bg-surface-sunken rounded animate-pulse" />
              <div className="h-4 w-64 bg-surface-sunken rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {group.items.map((_, itemIndex) => (
                <NotificationCategoryToggleSkeleton key={itemIndex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error && !preferences) {
    return (
      <div
        className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive"
        role="alert"
      >
        <p className="font-medium">Error loading preferences</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Email Address Display */}
      {email && (
        <div className="p-4 rounded-xl bg-surface-sunken/30 border border-white/10">
          <p className="text-xs text-text-tertiary mb-1">
            Emails sent to
          </p>
          <p className="text-sm font-medium text-foreground">{email}</p>
        </div>
      )}

      {/* Error Banner (non-fatal) */}
      {error && preferences && (
        <div
          className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-400"
          role="alert"
        >
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Preference Groups */}
      {PREFERENCE_GROUPS.map((group, groupIndex) => (
        <section key={groupIndex} className="space-y-4">
          {/* Group Header */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {group.title}
            </h3>
            <p className="text-xs text-text-secondary">{group.description}</p>
          </div>

          {/* Group Items */}
          <div className="space-y-3">
            {group.items
              .filter((item) => {
                // Skip duplicate "Donation Receipts" in Account group
                if (group.title === "Account" && item.locked) {
                  return true;
                }
                // Don't show donationAlerts in both Account and Campaigns
                if (group.title === "Campaigns" && item.key === "donationAlerts") {
                  return true; // Keep it in Campaigns only
                }
                return true;
              })
              .map((item) => {
                // For locked items in Account group, always show as enabled
                const prefValue = preferences?.[item.key];
                const checked = item.locked
                  ? true
                  : typeof prefValue === 'boolean' ? prefValue : false;

                return (
                  <NotificationCategoryToggle
                    key={item.key}
                    id={`email-${item.key}`}
                    label={item.label}
                    description={item.description}
                    checked={checked}
                    onChange={(value) => onUpdatePreference(item.key, value)}
                    isLoading={isSaving}
                    locked={item.locked}
                  />
                );
              })}
          </div>
        </section>
      ))}

      {/* Unsubscribe from All */}
      <div className="pt-6 border-t border-white/10">
        <div className="p-6 rounded-2xl bg-surface-sunken/30 border border-white/10 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Unsubscribe from All
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Stop receiving all non-essential emails. You&apos;ll still receive
              important emails like donation receipts, password resets, and security
              alerts.
            </p>
          </div>

          {!showUnsubscribeConfirm ? (
            <button
              type="button"
              onClick={() => setShowUnsubscribeConfirm(true)}
              disabled={isSaving}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                "border border-destructive/30 text-destructive",
                "hover:bg-destructive/10",
                "focus:outline-none focus:ring-2 focus:ring-destructive/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[44px]"
              )}
            >
              Unsubscribe from All Emails
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-amber-400">
                Are you sure? This will disable all non-essential email notifications.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUnsubscribeAll}
                  disabled={isSaving}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    "bg-destructive text-white",
                    "hover:bg-destructive/90",
                    "focus:outline-none focus:ring-2 focus:ring-destructive",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "min-h-[44px]"
                  )}
                >
                  {isSaving ? "Unsubscribing..." : "Yes, Unsubscribe"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnsubscribeConfirm(false)}
                  disabled={isSaving}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    "border border-white/10 text-foreground",
                    "hover:bg-surface-overlay",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "min-h-[44px]"
                  )}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
