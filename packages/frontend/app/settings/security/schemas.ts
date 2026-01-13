import { z } from "zod";

/**
 * Security Settings Validation Schemas
 *
 * Based on PHASE2_UX_SPECS.md Section 4
 * All validation rules follow the spec requirements
 */

/**
 * Two-Factor Authentication Verification Schema
 * Validates 6-digit numeric OTP codes
 */
export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
});

export type TwoFactorVerifyFormData = z.infer<typeof twoFactorVerifySchema>;

/**
 * SMS Setup Schema
 * Validates phone number with international format
 */
export const smsSetupSchema = z.object({
  phoneNumber: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Please enter a valid phone number with country code"
    ),
});

export type SmsSetupFormData = z.infer<typeof smsSetupSchema>;

/**
 * Disable Two-Factor Authentication Schema
 * Requires password and current 2FA code for security
 */
export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z
    .string()
    .length(6, "Enter your 2FA code")
    .regex(/^\d+$/, "Code must be numeric"),
});

export type DisableTwoFactorFormData = z.infer<typeof disableTwoFactorSchema>;

/**
 * Two-Factor Authentication Method Types
 */
export type TwoFactorMethod = "totp" | "sms" | "hardware";

export interface TwoFactorStatus {
  enabled: boolean;
  method?: TwoFactorMethod;
  phoneNumberLast4?: string; // For SMS method
  backupCodesRemaining?: number;
}

/**
 * Backup Code Interface
 */
export interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

/**
 * Session Interface
 */
export interface Session {
  id: string;
  deviceType: "desktop" | "mobile" | "tablet";
  deviceName: string; // "Chrome on macOS"
  browser: string;
  os: string;
  location: {
    city: string;
    country: string;
    countryCode: string;
  };
  ipAddress: string; // Partially masked: "192.168.xxx.xxx"
  isCurrent: boolean;
  lastActiveAt: Date;
  createdAt: Date;
}

/**
 * Login Attempt Interface
 */
export interface LoginAttempt {
  id: string;
  success: boolean;
  failureReason?: "wrong_password" | "wrong_2fa" | "account_locked";
  deviceName: string;
  browser: string;
  os: string;
  location: {
    city: string;
    country: string;
  };
  ipAddress: string; // Partially masked
  timestamp: Date;
}

/**
 * Security Recommendation Interface
 */
export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  actionUrl: string;
  priority: "critical" | "high" | "medium" | "low";
  isComplete: boolean;
}

/**
 * Security State Interface
 */
export interface SecurityState {
  twoFactorEnabled: boolean;
  twoFactorMethod?: TwoFactorMethod;
  recoveryEmailSet: boolean;
  passwordAgeInDays: number;
  emailVerified: boolean;
}

/**
 * Generate security recommendations based on account state
 */
export function getSecurityRecommendations(
  state: SecurityState
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  // Critical: Enable 2FA
  if (!state.twoFactorEnabled) {
    recommendations.push({
      id: "enable-2fa",
      title: "Enable two-factor authentication",
      description: "Add an extra layer of security to your account",
      action: "Enable 2FA",
      actionUrl: "#2fa-section",
      priority: "critical",
      isComplete: false,
    });
  }

  // Critical: Verify email
  if (!state.emailVerified) {
    recommendations.push({
      id: "verify-email",
      title: "Verify your email address",
      description: "Confirm your email to secure account recovery",
      action: "Verify Email",
      actionUrl: "/settings/account",
      priority: "critical",
      isComplete: false,
    });
  }

  // High: Add recovery email
  if (!state.recoveryEmailSet) {
    recommendations.push({
      id: "recovery-email",
      title: "Add a recovery email",
      description: "Recover your account if you lose access",
      action: "Add Email",
      actionUrl: "/settings/account",
      priority: "high",
      isComplete: false,
    });
  }

  // Medium: Update old password
  if (state.passwordAgeInDays > 90) {
    recommendations.push({
      id: "update-password",
      title: "Update your password",
      description: `Your password is ${state.passwordAgeInDays} days old`,
      action: "Change Password",
      actionUrl: "/settings/account",
      priority: "medium",
      isComplete: false,
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Priority badge colors
 */
export const priorityConfig: Record<
  SecurityRecommendation["priority"],
  { bgColor: string; textColor: string }
> = {
  critical: {
    bgColor: "bg-destructive/20",
    textColor: "text-destructive",
  },
  high: {
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-400",
  },
  medium: {
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  low: {
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
  },
};
