/**
 * Zod validation schemas for onboarding steps
 *
 * These schemas define the validation rules for each onboarding step's form data.
 * They are used with react-hook-form for form validation.
 */

import { z } from "zod";

/**
 * Email verification schema
 * Used in the VerifyEmail step for OTP code validation
 */
export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

/**
 * Profile details schema
 * Used in the ProfileDetails step for user profile information
 */
export const profileDetailsSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores allowed"
    )
    .transform((val) => val.toLowerCase()),
  email: z.string().email("Please enter a valid email"),
  birthdate: z.string().optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
});

export type ProfileDetailsFormData = z.infer<typeof profileDetailsSchema>;

/**
 * Goals selection schema
 * Used in the Goals step for user intent selection
 */
export const goalsSchema = z.object({
  goals: z
    .array(z.string())
    .min(1, "Please select at least one goal")
    .max(6, "Maximum 6 goals can be selected"),
});

export type GoalsFormData = z.infer<typeof goalsSchema>;

/**
 * Interests selection schema
 * Used in the Interests step for category selection
 */
export const interestsSchema = z.object({
  interests: z
    .array(z.string())
    .max(12, "Maximum 12 interests can be selected")
    .default([]),
});

export type InterestsFormData = z.infer<typeof interestsSchema>;

/**
 * Valid interest category IDs
 */
export const VALID_INTEREST_IDS = [
  "medical",
  "emergency",
  "education",
  "community",
  "creative",
  "animals",
  "environment",
  "nonprofit",
  "memorial",
  "sports",
  "faith",
  "travel",
] as const;

export type InterestId = (typeof VALID_INTEREST_IDS)[number];

/**
 * Interests selection schema with validated IDs
 */
export const interestsSchemaStrict = z.object({
  interests: z
    .array(z.enum(VALID_INTEREST_IDS))
    .max(12, "Maximum 12 interests can be selected")
    .default([]),
});

export type InterestsFormDataStrict = z.infer<typeof interestsSchemaStrict>;

/**
 * Connect wallet schema
 * Used in the ConnectWallet step for wallet connection state
 */
export const connectWalletSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address")
    .optional()
    .nullable(),
  walletProvider: z
    .enum(["metamask", "coinbase", "walletconnect"])
    .optional()
    .nullable(),
  isConnected: z.boolean().default(false),
  skipped: z.boolean().default(false),
});

export type ConnectWalletFormData = z.infer<typeof connectWalletSchema>;

/**
 * Follow suggestions schema
 * Used in the FollowSuggestions step for tracking followed users
 */
export const followSuggestionsSchema = z.object({
  followedUserIds: z.array(z.string()).default([]),
  skipped: z.boolean().default(false),
});

export type FollowSuggestionsFormData = z.infer<typeof followSuggestionsSchema>;

/**
 * Social profile schema
 * Used in the SocialProfile step for social media handles
 */
export const socialProfileSchema = z.object({
  twitter: z
    .string()
    .regex(/^[a-zA-Z0-9_]{1,15}$/, "Invalid Twitter handle")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .regex(/^[a-zA-Z0-9_.]{1,30}$/, "Invalid Instagram handle")
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  tiktok: z
    .string()
    .regex(/^[a-zA-Z0-9_.]{1,24}$/, "Invalid TikTok handle")
    .optional()
    .or(z.literal("")),
  github: z
    .string()
    .regex(/^[a-zA-Z0-9-]{1,39}$/, "Invalid GitHub username")
    .optional()
    .or(z.literal("")),
});

export type SocialProfileFormData = z.infer<typeof socialProfileSchema>;

/**
 * Complete onboarding data schema
 * Aggregates all step data into a single schema
 */
export const completeOnboardingSchema = z.object({
  // Step 1: Email verification
  emailVerified: z.boolean().default(false),

  // Step 2: Profile details
  profile: profileDetailsSchema.optional(),

  // Step 3: Goals
  goals: goalsSchema.optional(),

  // Step 4: Interests
  interests: interestsSchema.optional(),

  // Step 5: Wallet connection
  wallet: connectWalletSchema.optional(),

  // Step 6: Follow suggestions
  follows: followSuggestionsSchema.optional(),

  // Step 7: Social profile
  socialProfile: socialProfileSchema.optional(),

  // Metadata
  completedAt: z.string().datetime().optional(),
  completedSteps: z.array(z.string()).default([]),
});

export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

/**
 * Validate a single step's data
 */
export function validateStep<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Get error messages from Zod validation result
 */
export function getErrorMessages(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
