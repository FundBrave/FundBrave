/**
 * Zod validation schemas for Campaign Creation wizard
 *
 * These schemas define the validation rules for each step of the campaign creation flow.
 * They follow the specifications from PHASE3_UX_SPECS.md and are designed to be used
 * with react-hook-form or standalone validation.
 */

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};

export const BENEFICIARY_TYPES = ["self", "individual", "organization"] as const;
export type BeneficiaryType = (typeof BENEFICIARY_TYPES)[number];

export const RELATIONSHIP_OPTIONS = [
  "Family Member",
  "Friend",
  "Colleague",
  "Community Member",
  "Other",
] as const;

export const CAMPAIGN_CATEGORIES = [
  "Education",
  "Medical",
  "Emergency",
  "Community",
  "Environment",
  "Technology",
  "Creative",
  "Sports",
  "Animals",
  "Other",
] as const;

export const DURATION_PRESETS = [7, 14, 30, 60, 90] as const;
export type DurationPreset = (typeof DURATION_PRESETS)[number];

export const GOAL_AMOUNT_PRESETS = [1000, 5000, 10000, 25000] as const;

// ============================================================================
// Step 1: Campaign Basics Schema
// ============================================================================

export const campaignBasicsSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(80, "Title must be under 80 characters")
    .trim(),
  category: z
    .string()
    .min(1, "Please select a category")
    .refine(
      (val) => CAMPAIGN_CATEGORIES.includes(val as (typeof CAMPAIGN_CATEGORIES)[number]),
      "Please select a valid category"
    ),
  goalAmount: z
    .number()
    .min(100, "Minimum goal is $100")
    .max(10_000_000, "Maximum goal is $10,000,000"),
  currency: z.enum(CURRENCIES).default("USD"),
});

export type CampaignBasicsFormData = z.infer<typeof campaignBasicsSchema>;

// ============================================================================
// Step 2: Campaign Story Schema
// ============================================================================

// YouTube/Vimeo URL regex patterns
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
const VIMEO_REGEX = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/;

export const campaignStorySchema = z.object({
  description: z
    .string()
    .min(100, "Description must be at least 100 characters")
    .max(10000, "Description must be under 10,000 characters")
    .trim(),
  coverImage: z
    .object({
      file: z.instanceof(File).optional().nullable(),
      preview: z.string().optional().nullable(),
      url: z.string().url().optional().nullable(),
    })
    .optional()
    .nullable(),
  galleryImages: z
    .array(
      z.object({
        file: z.instanceof(File).optional().nullable(),
        preview: z.string().optional().nullable(),
        url: z.string().url().optional().nullable(),
      })
    )
    .max(10, "Maximum 10 gallery images allowed")
    .default([]),
  videoUrl: z
    .string()
    .url("Please enter a valid URL")
    .refine(
      (url) => YOUTUBE_REGEX.test(url) || VIMEO_REGEX.test(url),
      "Only YouTube and Vimeo URLs are supported"
    )
    .optional()
    .or(z.literal("")),
});

export type CampaignStoryFormData = z.infer<typeof campaignStorySchema>;

// ============================================================================
// Step 3: Campaign Details Schema
// ============================================================================

// Ethereum wallet address regex (0x + 40 hex characters)
const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Tax ID/EIN format (XX-XXXXXXX)
const TAX_ID_REGEX = /^\d{2}-\d{7}$/;

export const campaignDetailsSchema = z
  .object({
    // Duration
    duration: z
      .number()
      .min(7, "Minimum duration is 7 days")
      .max(365, "Maximum duration is 365 days"),
    customEndDate: z.date().optional().nullable(),
    isCustomDuration: z.boolean().default(false),

    // Beneficiary
    beneficiaryType: z.enum(BENEFICIARY_TYPES),
    beneficiaryName: z
      .string()
      .max(100, "Name must be under 100 characters")
      .optional()
      .or(z.literal("")),
    beneficiaryRelationship: z
      .string()
      .optional()
      .or(z.literal("")),
    organizationTaxId: z
      .string()
      .regex(TAX_ID_REGEX, "Please enter a valid Tax ID (XX-XXXXXXX)")
      .optional()
      .or(z.literal("")),

    // Wallet
    walletAddress: z
      .string()
      .regex(WALLET_ADDRESS_REGEX, "Please enter a valid Ethereum wallet address (0x + 40 hex characters)")
      .or(z.literal("")),

    // Privacy
    showDonorNames: z.boolean().default(true),
    showDonationAmounts: z.boolean().default(true),
    allowAnonymousDonations: z.boolean().default(true),

    // Terms
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms to continue",
    }),
  })
  .superRefine((data, ctx) => {
    // Beneficiary name is required for individual and organization types
    if (data.beneficiaryType === "individual" || data.beneficiaryType === "organization") {
      if (!data.beneficiaryName || data.beneficiaryName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Beneficiary name is required",
          path: ["beneficiaryName"],
        });
      }
    }

    // Relationship is required for individual type
    if (data.beneficiaryType === "individual") {
      if (!data.beneficiaryRelationship || data.beneficiaryRelationship.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select your relationship to the beneficiary",
          path: ["beneficiaryRelationship"],
        });
      }
    }

    // Tax ID is optional but must be valid if provided for organization type
    if (data.beneficiaryType === "organization" && data.organizationTaxId) {
      if (!TAX_ID_REGEX.test(data.organizationTaxId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid Tax ID (XX-XXXXXXX)",
          path: ["organizationTaxId"],
        });
      }
    }

    // Custom end date validation
    if (data.isCustomDuration) {
      if (!data.customEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select an end date",
          path: ["customEndDate"],
        });
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minDate = new Date(today);
        minDate.setDate(minDate.getDate() + 7);
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 365);

        if (data.customEndDate < minDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date must be at least 7 days from now",
            path: ["customEndDate"],
          });
        }
        if (data.customEndDate > maxDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date cannot be more than 365 days from now",
            path: ["customEndDate"],
          });
        }
      }
    }

    // Wallet address is required
    if (!data.walletAddress || data.walletAddress.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wallet address is required",
        path: ["walletAddress"],
      });
    }
  });

export type CampaignDetailsFormData = z.infer<typeof campaignDetailsSchema>;

// ============================================================================
// Complete Campaign Schema (merged)
// ============================================================================

export const campaignCreateSchema = z.object({
  // Step 1: Basics
  basics: campaignBasicsSchema,
  // Step 2: Story
  story: campaignStorySchema,
  // Step 3: Details
  details: campaignDetailsSchema,
});

export type CampaignCreateFormData = z.infer<typeof campaignCreateSchema>;

// ============================================================================
// Flat Form Schema (for simpler state management)
// ============================================================================

/**
 * Flat form data structure for the current page implementation
 * This matches the existing CampaignFormData interface
 */
export const campaignFormSchema = z
  .object({
    // Step 1: Basics
    title: z
      .string()
      .min(10, "Title must be at least 10 characters")
      .max(80, "Title must be under 80 characters"),
    category: z.string().min(1, "Please select a category"),
    goalAmount: z.string().min(1, "Goal amount is required"),
    currency: z.enum(CURRENCIES).default("USD"),

    // Step 2: Story
    description: z
      .string()
      .min(100, "Description must be at least 100 characters")
      .max(10000, "Description must be under 10,000 characters"),
    imageFile: z.instanceof(File).optional().nullable(),
    imagePreview: z.string().optional().nullable(),
    galleryImages: z
      .array(
        z.object({
          file: z.instanceof(File).optional().nullable(),
          preview: z.string().optional().nullable(),
        })
      )
      .max(10)
      .default([]),
    videoUrl: z.string().optional().or(z.literal("")),

    // Step 3: Details
    duration: z.string().min(1, "Please select a duration"),
    isCustomDuration: z.boolean().default(false),
    customEndDate: z.date().optional().nullable(),
    beneficiaryType: z.enum(BENEFICIARY_TYPES).default("self"),
    beneficiaryName: z.string().optional().or(z.literal("")),
    beneficiaryRelationship: z.string().optional().or(z.literal("")),
    organizationTaxId: z.string().optional().or(z.literal("")),
    beneficiaryWallet: z.string().min(1, "Wallet address is required"),
    showDonorNames: z.boolean().default(true),
    showDonationAmounts: z.boolean().default(true),
    allowAnonymousDonations: z.boolean().default(true),
    acceptTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Goal amount validation
    const amount = parseFloat(data.goalAmount);
    if (isNaN(amount) || amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid amount",
        path: ["goalAmount"],
      });
    } else if (amount < 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimum goal is $100",
        path: ["goalAmount"],
      });
    } else if (amount > 10_000_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum goal is $10,000,000",
        path: ["goalAmount"],
      });
    }

    // Wallet address validation
    if (data.beneficiaryWallet && !WALLET_ADDRESS_REGEX.test(data.beneficiaryWallet)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid Ethereum wallet address (0x + 40 hex characters)",
        path: ["beneficiaryWallet"],
      });
    }

    // Beneficiary name required for non-self types
    if (
      (data.beneficiaryType === "individual" || data.beneficiaryType === "organization") &&
      (!data.beneficiaryName || data.beneficiaryName.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Beneficiary name is required",
        path: ["beneficiaryName"],
      });
    }

    // Relationship required for individual type
    if (
      data.beneficiaryType === "individual" &&
      (!data.beneficiaryRelationship || data.beneficiaryRelationship.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select your relationship",
        path: ["beneficiaryRelationship"],
      });
    }

    // Tax ID validation for organization
    if (data.beneficiaryType === "organization" && data.organizationTaxId) {
      if (!TAX_ID_REGEX.test(data.organizationTaxId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid Tax ID (XX-XXXXXXX)",
          path: ["organizationTaxId"],
        });
      }
    }

    // Terms acceptance
    if (!data.acceptTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the terms to continue",
        path: ["acceptTerms"],
      });
    }

    // Video URL validation (if provided)
    if (data.videoUrl && data.videoUrl.trim().length > 0) {
      try {
        new URL(data.videoUrl);
        if (!YOUTUBE_REGEX.test(data.videoUrl) && !VIMEO_REGEX.test(data.videoUrl)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Only YouTube and Vimeo URLs are supported",
            path: ["videoUrl"],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid URL",
          path: ["videoUrl"],
        });
      }
    }
  });

export type CampaignFormData = z.infer<typeof campaignFormSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate a specific step of the campaign form
 */
export function validateStep(
  step: number,
  data: Partial<CampaignFormData>
): { success: true } | { success: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1: // Basics
      if (!data.title?.trim()) {
        errors.title = "Campaign title is required";
      } else if (data.title.length < 10) {
        errors.title = "Title must be at least 10 characters";
      } else if (data.title.length > 80) {
        errors.title = "Title must be under 80 characters";
      }
      if (!data.category) {
        errors.category = "Please select a category";
      }
      if (!data.goalAmount) {
        errors.goalAmount = "Goal amount is required";
      } else {
        const amount = parseFloat(data.goalAmount);
        if (isNaN(amount) || amount <= 0) {
          errors.goalAmount = "Please enter a valid amount";
        } else if (amount < 100) {
          errors.goalAmount = "Minimum goal is $100";
        } else if (amount > 10_000_000) {
          errors.goalAmount = "Maximum goal is $10,000,000";
        }
      }
      break;

    case 2: // Story
      if (!data.description?.trim()) {
        errors.description = "Campaign description is required";
      } else if (data.description.length < 100) {
        errors.description = "Description must be at least 100 characters";
      } else if (data.description.length > 10000) {
        errors.description = "Description must be under 10,000 characters";
      }
      if (data.videoUrl && data.videoUrl.trim().length > 0) {
        try {
          new URL(data.videoUrl);
          if (!YOUTUBE_REGEX.test(data.videoUrl) && !VIMEO_REGEX.test(data.videoUrl)) {
            errors.videoUrl = "Only YouTube and Vimeo URLs are supported";
          }
        } catch {
          errors.videoUrl = "Please enter a valid URL";
        }
      }
      break;

    case 3: // Details
      if (!data.duration) {
        errors.duration = "Please select a campaign duration";
      }
      if (data.beneficiaryType === "individual" || data.beneficiaryType === "organization") {
        if (!data.beneficiaryName?.trim()) {
          errors.beneficiaryName = "Beneficiary name is required";
        }
      }
      if (data.beneficiaryType === "individual" && !data.beneficiaryRelationship) {
        errors.beneficiaryRelationship = "Please select your relationship";
      }
      if (data.beneficiaryType === "organization" && data.organizationTaxId) {
        if (!TAX_ID_REGEX.test(data.organizationTaxId)) {
          errors.organizationTaxId = "Please enter a valid Tax ID (XX-XXXXXXX)";
        }
      }
      if (!data.beneficiaryWallet?.trim()) {
        errors.beneficiaryWallet = "Wallet address is required";
      } else if (!WALLET_ADDRESS_REGEX.test(data.beneficiaryWallet)) {
        errors.beneficiaryWallet = "Please enter a valid Ethereum wallet address";
      }
      if (!data.acceptTerms) {
        errors.acceptTerms = "You must accept the terms to continue";
      }
      break;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true };
}

/**
 * Format goal amount with locale-appropriate separators
 */
export function formatGoalAmount(amount: number | string, currency: Currency = "USD"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "";

  const locales: Record<Currency, string> = {
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
  };

  return numAmount.toLocaleString(locales[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Parse a formatted goal amount string back to a number
 */
export function parseGoalAmount(formattedAmount: string): number {
  // Remove currency symbols, commas, spaces, and other non-numeric characters except decimal point
  const cleanedAmount = formattedAmount.replace(/[^0-9.]/g, "");
  return parseFloat(cleanedAmount) || 0;
}

/**
 * Calculate the end date from a duration in days
 */
export function calculateEndDate(durationDays: number): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

/**
 * Calculate duration in days from an end date
 */
export function calculateDuration(endDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  return WALLET_ADDRESS_REGEX.test(address);
}

/**
 * Truncate wallet address for display
 */
export function truncateWalletAddress(address: string, chars = 6): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
