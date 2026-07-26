/**
 * Password strength helpers.
 *
 * Extracted verbatim from packages/frontend/app/settings/account/schemas.ts
 * (only the pure, UI-facing pieces needed by PasswordStrengthMeter).
 */

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
