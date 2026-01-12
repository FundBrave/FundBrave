import { z } from "zod";

/**
 * Notification Types Schema
 * Defines all supported notification types in FundBrave
 */
export const notificationTypeSchema = z.enum([
  "new_follower",
  "like_post",
  "like_comment",
  "comment",
  "reply",
  "mention",
  "donation",
  "campaign_milestone",
  "campaign_update",
  "system",
  // Additional types from spec
  "donation_received",
  "follow_back",
  "comment_reply",
  "comment_like",
  "milestone",
  "campaign_ending",
  "campaign_funded",
]);

/**
 * Actor Schema - The user who performed the action
 */
export const notificationActorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  avatar: z.string().url().optional(),
});

/**
 * Target Schema - The entity the notification relates to
 */
export const notificationTargetSchema = z.object({
  type: z.enum(["campaign", "comment", "user", "donation", "post"]),
  id: z.string().uuid(),
  title: z.string().optional(),
  image: z.string().url().optional(),
  url: z.string().optional(),
});

/**
 * Single Notification Schema
 */
export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().optional(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(), // ISO datetime string
  actor: notificationActorSchema.optional(),
  target: notificationTargetSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Notification Query Schema - For fetching notifications
 */
export const notificationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  unreadOnly: z.boolean().default(false),
});

/**
 * Notification Preferences Schema
 */
export const notificationPreferencesSchema = z.object({
  inApp: z.object({
    donations: z.boolean().default(true),
    followers: z.boolean().default(true),
    comments: z.boolean().default(true),
    campaignUpdates: z.boolean().default(true),
    milestones: z.boolean().default(true),
    mentions: z.boolean().default(true),
    likes: z.boolean().default(true),
  }),
  email: z.object({
    donations: z.boolean().default(true),
    weeklyDigest: z.boolean().default(true),
    campaignUpdates: z.boolean().default(true),
    marketing: z.boolean().default(false),
  }),
  push: z.object({
    enabled: z.boolean().default(false),
  }),
});

/**
 * Notifications API Response Schema
 */
export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number(),
  cursor: z.string().optional(),
  hasMore: z.boolean(),
});

// TypeScript Types
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationActor = z.infer<typeof notificationActorSchema>;
export type NotificationTarget = z.infer<typeof notificationTargetSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;

/**
 * Time grouping for notifications
 */
export type NotificationTimeGroup = "today" | "yesterday" | "this_week" | "earlier";

/**
 * Grouped notifications by time
 */
export interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  this_week: Notification[];
  earlier: Notification[];
}
