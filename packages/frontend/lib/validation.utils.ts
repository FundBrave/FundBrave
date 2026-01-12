/**
 * Form validation utilities for CreatePostPopup component using Zod
 */

import type {
  PostFormErrors,
  CampaignUpdateFormErrors,
} from "../app/components/ui/types/CreatePost.types";

import * as z from "zod";
import { email } from "zod/v4";

// Zod schemas for validation
export const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content is required")
    .min(10, "Post content must be at least 10 characters long")
    .max(5000, "Post content must be less than 5000 characters"),
});

export const campaignUpdateSchema = z.object({
  category: z.string().min(1, "Campaign category is required"),
  campaign: z.string().min(1, "Campaign selection is required"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters long")
    .max(200, "Title must be less than 200 characters"),
  update: z
    .string()
    .trim()
    .min(1, "Update content is required")
    .min(10, "Update content must be at least 10 characters long")
    .max(5000, "Update content must be less than 5000 characters"),
});

// Type inference from schemas
export type PostFormData = z.infer<typeof postSchema>;
export type CampaignUpdateFormData = z.infer<typeof campaignUpdateSchema>;

// Helper function to convert Zod errors to our error format
const convertZodErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    // Handle both nested paths and direct field names
    const fieldName =
      issue.path.length > 0 ? issue.path[issue.path.length - 1] : "unknown";
    errors[fieldName as string] = issue.message;
  });
  return errors;
};

// Validation functions that return our custom error types
export const validatePostForm = (content: string): PostFormErrors => {
  try {
    postSchema.parse({ content });
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = convertZodErrors(error);
      return {
        content: errors.content,
      };
    }
    return { content: "Validation error occurred" };
  }
};

export const validateCampaignUpdateForm = (data: {
  category: string;
  campaign: string;
  title: string;
  update: string;
}): CampaignUpdateFormErrors => {
  try {
    campaignUpdateSchema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = convertZodErrors(error);
      return {
        category: errors.category,
        campaign: errors.campaign,
        title: errors.title,
        update: errors.update,
      };
    }
    return {
      category: "Validation error occurred",
      campaign: "Validation error occurred",
      title: "Validation error occurred",
      update: "Validation error occurred",
    };
  }
};

// Safe parsing functions that return success/error results
export const safeValidatePost = (content: string) => {
  return postSchema.safeParse({ content });
};

export const safeValidateCampaignUpdate = (data: {
  category: string;
  campaign: string;
  title: string;
  update: string;
}) => {
  return campaignUpdateSchema.safeParse(data);
};

// Utility functions
export const isFormValid = (
  errors: PostFormErrors | CampaignUpdateFormErrors
): boolean => {
  return Object.keys(errors).length === 0;
};

export const getFirstError = (
  errors: PostFormErrors | CampaignUpdateFormErrors
): string | null => {
  const errorValues = Object.values(errors).filter(Boolean);
  return errorValues.length > 0 ? errorValues[0] : null;
};

// Validation constants for reuse
export const VALIDATION_LIMITS = {
  POST_CONTENT_MIN: 10,
  POST_CONTENT_MAX: 5000,
  TITLE_MIN: 5,
  TITLE_MAX: 200,
  UPDATE_CONTENT_MIN: 10,
  UPDATE_CONTENT_MAX: 5000,
} as const;

// Login form validation schema - accepts both username and email
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username or email is required")
    .refine(
      (value) => {
        // Check if it's a valid email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        // Check if it's a valid username
        const isUsername = /^[a-zA-Z0-9_]{3,}$/.test(value);
        return isEmail || isUsername;
      },
      {
        message: "Please enter a valid username or email address",
      }
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  keepLoggedIn: z.boolean().optional(),
});

// Sign-up form validation schema
export const signUpSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Please enter your Email"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    emailUpdate: z.boolean().optional(),
    referralCode: z.string().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // This shows the error on the confirmPassword field
  });
