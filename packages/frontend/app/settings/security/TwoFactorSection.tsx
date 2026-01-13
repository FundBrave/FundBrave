"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { SetupTwoFactorModal } from "./SetupTwoFactorModal";
import type { TwoFactorStatus } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  shield: (
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
  alertCircle: (
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
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export interface TwoFactorSectionProps {
  /** Current 2FA status */
  status: TwoFactorStatus;
  /** Callback to enable 2FA */
  onEnable: () => Promise<void>;
  /** Callback to disable 2FA */
  onDisable: () => Promise<void>;
  /** Callback to regenerate backup codes */
  onRegenerateBackupCodes?: () => Promise<void>;
}

/**
 * TwoFactorSection - Manage two-factor authentication settings
 *
 * Features:
 * - Display current 2FA status
 * - Enable/disable 2FA
 * - Show backup codes remaining
 * - Regenerate backup codes
 *
 * Based on PHASE2_UX_SPECS.md Section 4.1
 */
export function TwoFactorSection({
  status,
  onEnable,
  onDisable,
  onRegenerateBackupCodes,
}: TwoFactorSectionProps) {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleEnable = () => {
    setIsSetupModalOpen(true);
  };

  const handleSetupComplete = async () => {
    await onEnable();
    setIsSetupModalOpen(false);
  };

  const handleDisable = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return;
    }

    setIsDisabling(true);
    try {
      await onDisable();
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!onRegenerateBackupCodes) return;

    if (!confirm("This will invalidate your existing backup codes. Are you sure?")) {
      return;
    }

    setIsRegenerating(true);
    try {
      await onRegenerateBackupCodes();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <section
        id="2fa-section"
        className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30"
      >
        {/* Section Header */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
          <span className="text-primary">{icons.shield}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {/* Status Display */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "text-sm font-medium",
                  status.enabled ? "text-foreground" : "text-text-secondary"
                )}>
                  Status
                </span>
                {status.enabled ? (
                  <span className="security-badge-enabled flex items-center gap-1.5">
                    <span className="text-green-400">{icons.checkCircle}</span>
                    Enabled
                  </span>
                ) : (
                  <span className="security-badge-disabled flex items-center gap-1.5">
                    <span className="text-yellow-400">{icons.alertCircle}</span>
                    Disabled
                  </span>
                )}
              </div>

              {status.enabled && (
                <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
                  <p>
                    Method:{" "}
                    <span className="text-foreground">
                      {status.method === "totp"
                        ? "Authenticator App"
                        : status.method === "sms"
                        ? "SMS"
                        : "Hardware Key"}
                    </span>
                  </p>
                  {status.method === "sms" && status.phoneNumberLast4 && (
                    <p>
                      Phone: <span className="text-foreground">••• {status.phoneNumberLast4}</span>
                    </p>
                  )}
                  {status.backupCodesRemaining !== undefined && (
                    <p>
                      Backup codes remaining:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          status.backupCodesRemaining < 3
                            ? "text-yellow-400"
                            : "text-foreground"
                        )}
                      >
                        {status.backupCodesRemaining} / 10
                      </span>
                    </p>
                  )}
                </div>
              )}

              {!status.enabled && (
                <p className="text-sm text-text-secondary">
                  Protect your account with an additional security layer. We recommend using an authenticator app.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 min-w-[140px]">
              {status.enabled ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisable}
                    loading={isDisabling}
                    loadingText="Disabling..."
                    className="w-full"
                  >
                    Disable 2FA
                  </Button>
                  {onRegenerateBackupCodes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerateBackupCodes}
                      loading={isRegenerating}
                      loadingText="Generating..."
                      className="w-full"
                    >
                      Regenerate Codes
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleEnable}
                  className="w-full"
                >
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Setup Modal */}
      <SetupTwoFactorModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onComplete={handleSetupComplete}
      />
    </>
  );
}

export default TwoFactorSection;
