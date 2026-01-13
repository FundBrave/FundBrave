import { z } from "zod";

/**
 * Account Settings Validation Schemas
 *
 * Based on PHASE2_UX_SPECS.md Section 3.3
 * All validation rules follow the spec requirements
 */

/**
 * Change Email Schema
 * Requires new email and current password for verification
 */
export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required to change email"),
});

export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

/**
 * Change Password Schema
 * Enforces strong password requirements with confirmation matching
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Delete Account Schema
 * Requires password and typing "DELETE" for confirmation
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z.string().refine((val) => val === "DELETE", {
    message: 'Please type "DELETE" to confirm',
  }),
});

export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

/**
 * Password Strength Levels
 * Used for visual password strength indicator
 */
export type PasswordStrength = "weak" | "fair" | "good" | "strong";

/**
 * Calculate password strength based on multiple criteria
 * Returns a strength level for visual feedback
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";

  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character type checks
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 4) return "fair";
  if (score <= 5) return "good";
  return "strong";
}

/**
 * Password strength configuration for UI
 */
export const strengthConfig: Record<
  PasswordStrength,
  { color: string; label: string; width: string }
> = {
  weak: {
    color: "var(--destructive)",
    label: "Weak",
    width: "25%",
  },
  fair: {
    color: "#f59e0b",
    label: "Fair",
    width: "50%",
  },
  good: {
    color: "var(--purple-500)",
    label: "Good",
    width: "75%",
  },
  strong: {
    color: "#22c55e",
    label: "Strong",
    width: "100%",
  },
};

/**
 * Password requirements for display
 */
export const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

/**
 * OAuth Provider types
 */
export type OAuthProvider = "google" | "apple" | "twitter" | "discord" | "github";

export interface ConnectedAccount {
  provider: OAuthProvider;
  connected: boolean;
  email?: string;
  connectedAt?: Date;
  isPrimary?: boolean;
}

/**
 * Account Info types
 */
export interface AccountInfo {
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  lastLoginLocation?: string;
  accountStatus: "active" | "suspended" | "pending_verification";
  passwordLastChangedAt?: Date;
}
