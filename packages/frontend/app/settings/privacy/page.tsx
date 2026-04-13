"use client";

import React, { useState, useEffect, useCallback } from "react";
import { settingsApi, type PrivacySettings } from "@/lib/api/settings";
import { useAuth } from "@/app/provider/AuthProvider";

/**
 * Toggle switch component
 */
function ToggleSwitch({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${enabled ? "bg-primary" : "bg-white/20"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg
          ring-0 transition duration-200 ease-in-out
          ${enabled ? "translate-x-5" : "translate-x-1"}
        `}
      />
    </button>
  );
}

/**
 * Privacy toggle row
 */
function PrivacyToggle({
  title,
  description,
  enabled,
  onChange,
  saving,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={saving} />
    </div>
  );
}

/**
 * PrivacySettingsPage — real UI connected to backend
 *
 * Route: /settings/privacy
 *
 * Backend endpoints:
 *   GET  /api/settings/privacy
 *   PUT  /api/settings/privacy
 */
export default function PrivacySettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch privacy settings from backend
  useEffect(() => {
    async function load() {
      if (authLoading) return;
      if (!isAuthenticated) {
        setIsLoading(false);
        setError("Please log in to view privacy settings");
        return;
      }

      try {
        const data = await settingsApi.getPrivacySettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load privacy settings:", err);
        setError("Failed to load privacy settings. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isAuthenticated, authLoading]);

  // Update a single privacy setting
  const updateSetting = useCallback(
    async (key: keyof PrivacySettings, value: boolean) => {
      if (!settings) return;

      // Optimistic update
      const prev = settings;
      setSettings({ ...settings, [key]: value });
      setSaving(true);

      try {
        const updated = await settingsApi.updatePrivacy({ [key]: value });
        setSettings(updated);
      } catch (err) {
        // Revert on failure
        setSettings(prev);
        console.error("Failed to update privacy setting:", err);
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-surface-sunken rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-surface-sunken rounded-lg animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30"
          >
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center py-3">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-surface-sunken rounded animate-pulse" />
                    <div className="h-3 w-48 bg-surface-sunken rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-11 bg-surface-sunken rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error || !settings) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground">Privacy Settings</h2>
          <p className="text-text-secondary">
            Control your privacy and data preferences
          </p>
        </header>
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive" role="alert">
          <p className="font-medium">Error loading privacy settings</p>
          <p className="text-sm mt-1">{error || "Unknown error occurred"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Privacy Settings</h2>
        <p className="text-text-secondary">
          Control your privacy and data preferences
        </p>
      </header>

      {/* Profile Visibility */}
      <section className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
        <div className="flex items-center gap-4 pb-4 mb-2 border-b border-white/10">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-sm font-medium text-text-secondary">Profile Visibility</h3>
        </div>

        <PrivacyToggle
          title="Private Profile"
          description="When enabled, only approved followers can see your full profile"
          enabled={settings.isPrivate}
          onChange={(val) => updateSetting("isPrivate", val)}
          saving={saving}
        />
        <PrivacyToggle
          title="Show in Search Engines"
          description="Allow search engines like Google to index your profile"
          enabled={settings.showInSearchEngines}
          onChange={(val) => updateSetting("showInSearchEngines", val)}
          saving={saving}
        />
        <PrivacyToggle
          title="Show Online Status"
          description="Let others see when you're active on FundBrave"
          enabled={settings.showOnlineStatus}
          onChange={(val) => updateSetting("showOnlineStatus", val)}
          saving={saving}
        />
      </section>

      {/* Activity Visibility */}
      <section className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
        <div className="flex items-center gap-4 pb-4 mb-2 border-b border-white/10">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="text-sm font-medium text-text-secondary">Activity Visibility</h3>
        </div>

        <PrivacyToggle
          title="Show Wallet Balance"
          description="Display your wallet balance on your public profile"
          enabled={settings.showWalletBalance}
          onChange={(val) => updateSetting("showWalletBalance", val)}
          saving={saving}
        />
        <PrivacyToggle
          title="Show Donation History"
          description="Let others see campaigns you've donated to"
          enabled={settings.showDonationHistory}
          onChange={(val) => updateSetting("showDonationHistory", val)}
          saving={saving}
        />
        <PrivacyToggle
          title="Show Staking Activity"
          description="Display your staking positions publicly"
          enabled={settings.showStakingActivity}
          onChange={(val) => updateSetting("showStakingActivity", val)}
          saving={saving}
        />
      </section>

      {/* Communication */}
      <section className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
        <div className="flex items-center gap-4 pb-4 mb-2 border-b border-white/10">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-sm font-medium text-text-secondary">Communication</h3>
        </div>

        <PrivacyToggle
          title="Allow Messages from Anyone"
          description="Let anyone send you direct messages (disable to only receive from people you follow)"
          enabled={settings.allowMessagesFromAnyone}
          onChange={(val) => updateSetting("allowMessagesFromAnyone", val)}
          saving={saving}
        />
      </section>

      {/* Footer info */}
      <footer className="pt-2">
        <p className="text-xs text-text-tertiary">
          Changes are saved automatically. Privacy settings apply immediately across your profile.
        </p>
      </footer>
    </div>
  );
}
