/**
 * Email Notification Types
 *
 * Type definitions for email notification preferences system.
 * Based on PHASE4_UX_SPECS.md Section 5: Notifications - Email
 */

/**
 * Email notification category enumeration
 */
export enum EmailNotificationCategory {
  // Account & Transactional (required, cannot be disabled)
  DONATION_RECEIPTS = 'donation_receipts',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',

  // Campaign Notifications
  DONATION_ALERTS = 'donation_alerts',
  CAMPAIGN_FUNDED = 'campaign_funded',
  CAMPAIGN_UPDATES = 'campaign_updates',

  // Social Notifications
  NEW_FOLLOWERS = 'new_followers',
  COMMENTS = 'comments',
  REPLIES = 'replies',
  MENTIONS = 'mentions',

  // Digest & Marketing
  WEEKLY_DIGEST = 'weekly_digest',
  MARKETING = 'marketing',
}

/**
 * Email frequency options
 */
export enum EmailFrequency {
  INSTANT = 'instant',
  DAILY_DIGEST = 'daily_digest',
  WEEKLY_DIGEST = 'weekly_digest',
  OFF = 'off',
}

/**
 * User's email notification preferences
 */
export interface EmailPreferences {
  // Campaign notifications
  donationAlerts: boolean;
  campaignFunded: boolean;
  campaignUpdates: boolean;

  // Social notifications
  newFollowers: boolean;
  comments: boolean;
  replies: boolean;
  mentions: boolean;

  // Digest & Marketing
  weeklyDigest: boolean;
  marketing: boolean;

  // Frequency settings (for notifications that support batching)
  frequency?: EmailFrequency;
}

/**
 * Grouped email preferences for UI display
 */
export interface EmailPreferenceGroup {
  id: string;
  title: string;
  description?: string;
  preferences: EmailPreferenceItem[];
}

/**
 * Individual preference item
 */
export interface EmailPreferenceItem {
  id: keyof EmailPreferences;
  label: string;
  description: string;
  enabled: boolean;
  locked?: boolean; // For required notifications
  category: EmailNotificationCategory;
}

/**
 * Default email preferences for new users
 */
export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  // Campaign notifications (ON by default)
  donationAlerts: true,
  campaignFunded: true,
  campaignUpdates: true,

  // Social notifications (OFF by default)
  newFollowers: false,
  comments: false,
  replies: false,
  mentions: false,

  // Digest (ON), Marketing (OFF)
  weeklyDigest: true,
  marketing: false,

  // Default frequency
  frequency: EmailFrequency.INSTANT,
};

/**
 * API request/response types
 */

export interface GetEmailPreferencesResponse {
  preferences: EmailPreferences;
  email: string;
}

export interface UpdateEmailPreferencesRequest {
  preferences: Partial<EmailPreferences>;
}

export interface UpdateEmailPreferencesResponse {
  preferences: EmailPreferences;
  success: boolean;
}

export interface UnsubscribeRequest {
  token: string;
  category?: EmailNotificationCategory;
  unsubscribeAll?: boolean;
}

export interface UnsubscribeResponse {
  success: boolean;
  unsubscribedCategories: EmailNotificationCategory[];
  message: string;
}
