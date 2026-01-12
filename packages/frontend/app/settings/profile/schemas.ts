import { z } from "zod";

/**
 * Profile Settings Validation Schema
 *
 * Based on PHASE2_UX_SPECS.md Section 2.3
 * All validation rules follow the spec requirements
 */
export const profileSettingsSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be under 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Only letters, numbers, spaces, hyphens, and underscores allowed"
    ),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores allowed"
    )
    .transform((val) => val.toLowerCase()),

  bio: z
    .string()
    .max(280, "Bio must be under 280 characters")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  location: z
    .string()
    .max(100, "Location must be under 100 characters")
    .optional()
    .or(z.literal("")),

  socialLinks: z
    .object({
      twitter: z
        .string()
        .regex(/^[a-zA-Z0-9_]{0,15}$/, "Invalid Twitter handle")
        .optional()
        .or(z.literal("")),
      instagram: z
        .string()
        .regex(/^[a-zA-Z0-9_.]{0,30}$/, "Invalid Instagram handle")
        .optional()
        .or(z.literal("")),
      linkedin: z
        .string()
        .url("Please enter a valid LinkedIn URL")
        .optional()
        .or(z.literal("")),
      github: z
        .string()
        .regex(/^[a-zA-Z0-9-]{0,39}$/, "Invalid GitHub username")
        .optional()
        .or(z.literal("")),
    })
    .optional(),

  isPublicProfile: z.boolean().default(true),
  showDonationHistory: z.boolean().default(false),
  showSupportedCampaigns: z.boolean().default(true),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;

/**
 * Username availability check schema
 * Used for the debounced API call
 */
export const usernameCheckSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores allowed"
    ),
});

export type UsernameCheckData = z.infer<typeof usernameCheckSchema>;

/**
 * Avatar upload validation
 */
export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be under 5MB")
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(
          file.type
        ),
      "Please upload JPG, PNG, or GIF"
    ),
});

export type AvatarUploadData = z.infer<typeof avatarUploadSchema>;

/**
 * Default form values
 */
export const defaultProfileSettings: ProfileSettingsFormData = {
  displayName: "",
  username: "",
  bio: "",
  website: "",
  location: "",
  socialLinks: {
    twitter: "",
    instagram: "",
    linkedin: "",
    github: "",
  },
  isPublicProfile: true,
  showDonationHistory: false,
  showSupportedCampaigns: true,
};
