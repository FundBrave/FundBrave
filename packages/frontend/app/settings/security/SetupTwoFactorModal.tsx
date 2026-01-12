"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { OTPInput } from "@/app/components/ui/form/OTPInput";
import type { BackupCode } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  x: (
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
  check: (
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  copy: (
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  download: (
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

/**
 * Modal animation variants
 */
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

type SetupStep = "method" | "setup" | "verify" | "backup-codes";

export interface SetupTwoFactorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when setup is complete */
  onComplete: () => Promise<void>;
}

/**
 * Mock API function to generate TOTP secret
 */
async function generateTotpSecret(): Promise<{
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In production, this would call the backend API
  const secret = "JBSWY3DPEHPK3PXP";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/FundBrave:user@example.com?secret=${secret}&issuer=FundBrave`;

  return {
    secret,
    qrCodeUrl,
    manualEntryKey: secret.match(/.{1,4}/g)?.join(" ") || secret,
  };
}

/**
 * Mock API function to verify TOTP code
 */
async function verifyTotpCode(code: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In production, this would call the backend API
  // For development, accept "123456" as valid
  return code === "123456";
}

/**
 * Mock API function to generate backup codes
 */
async function generateBackupCodes(): Promise<BackupCode[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate 10 random backup codes
  const codes: BackupCode[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const formatted = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
    codes.push({
      code: formatted,
      used: false,
    });
  }

  return codes;
}

/**
 * SetupTwoFactorModal - Multi-step wizard for setting up 2FA
 *
 * Steps:
 * 1. Choose method (Authenticator/SMS/Hardware Key)
 * 2. Setup (QR code for authenticator)
 * 3. Verify (Enter 6-digit code)
 * 4. Backup codes (Save recovery codes)
 *
 * Based on PHASE2_UX_SPECS.md Section 4.1
 */
export function SetupTwoFactorModal({
  isOpen,
  onClose,
  onComplete,
}: SetupTwoFactorModalProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("method");
  const [selectedMethod, setSelectedMethod] = useState<"authenticator" | "sms">("authenticator");
  const [totpSecret, setTotpSecret] = useState<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("method");
      setSelectedMethod("authenticator");
      setTotpSecret(null);
      setVerificationCode("");
      setBackupCodes([]);
      setError(null);
      setBackupCodesSaved(false);
      setCopiedCode(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleMethodNext = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedMethod === "authenticator") {
        const secret = await generateTotpSecret();
        setTotpSecret(secret);
        setCurrentStep("setup");
      } else {
        // SMS setup would go here
        setError("SMS setup not yet implemented");
      }
    } catch (err) {
      setError("Failed to generate secret. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupNext = () => {
    setCurrentStep("verify");
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyTotpCode(verificationCode);

      if (isValid) {
        const codes = await generateBackupCodes();
        setBackupCodes(codes);
        setCurrentStep("backup-codes");
      } else {
        setError("Invalid verification code. Please try again.");
        setVerificationCode("");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!backupCodesSaved) {
      setError("Please confirm that you've saved your backup codes");
      return;
    }

    setIsLoading(true);
    try {
      await onComplete();
      onClose();
    } catch (err) {
      setError("Failed to complete setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    const codesText = backupCodes.map((c) => c.code).join("\n");
    await navigator.clipboard.writeText(codesText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.map((c) => c.code).join("\n");
    const blob = new Blob([`FundBrave Backup Codes\n\n${codesText}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fundbrave-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full max-w-lg",
              "bg-background rounded-2xl",
              "border border-white/10",
              "shadow-2xl shadow-black/20",
              "max-h-[90vh] overflow-y-auto scrollbar-hidden"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-2fa-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-background z-10">
              <div className="flex items-center gap-3">
                <span className="text-primary">{icons.smartphone}</span>
                <h2
                  id="setup-2fa-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Set Up Two-Factor Authentication
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg",
                  "text-text-tertiary hover:text-foreground",
                  "hover:bg-surface-overlay",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-label="Close modal"
              >
                {icons.x}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step 1: Choose Method */}
              {currentStep === "method" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      Choose your authentication method
                    </h3>
                    <p className="text-sm text-text-secondary">
                      We recommend using an authenticator app for the best security.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setSelectedMethod("authenticator")}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border transition-all",
                        "text-left hover:border-primary/50",
                        selectedMethod === "authenticator"
                          ? "border-primary bg-primary/5"
                          : "border-white/10 bg-surface-sunken/30"
                      )}
                    >
                      <div className="mt-0.5">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            selectedMethod === "authenticator"
                              ? "border-primary bg-primary"
                              : "border-white/30"
                          )}
                        >
                          {selectedMethod === "authenticator" && (
                            <span className="text-white">{icons.check}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            Authenticator App
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          Use Google Authenticator, Authy, or similar apps. Works offline and is more secure than SMS.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedMethod("sms")}
                      disabled
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border transition-all opacity-50 cursor-not-allowed",
                        "text-left",
                        "border-white/10 bg-surface-sunken/30"
                      )}
                    >
                      <div className="mt-0.5">
                        <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground mb-1">
                          SMS (Coming Soon)
                        </h4>
                        <p className="text-xs text-text-secondary">
                          Receive verification codes via text message.
                        </p>
                      </div>
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleMethodNext}
                      loading={isLoading}
                      loadingText="Setting up..."
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Setup (QR Code) */}
              {currentStep === "setup" && totpSecret && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      Scan QR code
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Open your authenticator app and scan this QR code.
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center p-6 bg-white rounded-xl">
                    <img
                      src={totpSecret.qrCodeUrl}
                      alt="QR Code for two-factor authentication"
                      className="w-48 h-48"
                    />
                  </div>

                  {/* Manual Entry */}
                  <div className="p-4 rounded-xl bg-surface-sunken/30 border border-white/10">
                    <p className="text-xs font-medium text-text-secondary mb-2">
                      Can't scan? Enter this code manually:
                    </p>
                    <code className="block font-mono text-sm text-foreground break-all">
                      {totpSecret.manualEntryKey}
                    </code>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("method")}
                    >
                      Back
                    </Button>
                    <Button variant="primary" onClick={handleSetupNext}>
                      I've Scanned the Code
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Verify */}
              {currentStep === "verify" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      Verify your setup
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Enter the 6-digit code from your authenticator app.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <OTPInput
                      value={verificationCode}
                      onChange={setVerificationCode}
                      onComplete={handleVerify}
                      error={error || undefined}
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep("setup");
                        setError(null);
                      }}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleVerify}
                      loading={isLoading}
                      loadingText="Verifying..."
                      disabled={verificationCode.length !== 6}
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Backup Codes */}
              {currentStep === "backup-codes" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      Save your backup codes
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Store these codes in a safe place. You can use them to access your account if you lose your device.
                    </p>
                  </div>

                  {/* Backup Codes List */}
                  <div className="p-4 rounded-xl bg-surface-sunken/30 border border-white/10">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="p-2 rounded bg-background text-foreground text-center"
                        >
                          {code.code}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBackupCodes}
                      className="flex items-center gap-2"
                    >
                      {icons.copy}
                      {copiedCode ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadBackupCodes}
                      className="flex items-center gap-2"
                    >
                      {icons.download}
                      Download
                    </Button>
                  </div>

                  {/* Confirmation Checkbox */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupCodesSaved}
                      onChange={(e) => setBackupCodesSaved(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-yellow-400 bg-transparent checked:bg-yellow-500 cursor-pointer"
                    />
                    <span className="text-sm text-yellow-400">
                      I've saved these codes in a safe place
                    </span>
                  </label>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="primary"
                      onClick={handleComplete}
                      loading={isLoading}
                      loadingText="Completing..."
                      disabled={!backupCodesSaved}
                    >
                      Complete Setup
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SetupTwoFactorModal;
