import { z } from 'zod';

/**
 * Schema for follow/unfollow actions
 * Validates the target user ID and action type
 */
export const followActionSchema = z.object({
  targetUserId: z
    .string()
    .uuid('Invalid user ID'),

  action: z
    .enum(['follow', 'unfollow']),
});

/**
 * Schema for fetching followers or following lists
 * Supports pagination with cursor and optional search
 */
export const followListQuerySchema = z.object({
  userId: z
    .string()
    .uuid('Invalid user ID'),

  type: z
    .enum(['followers', 'following']),

  cursor: z
    .string()
    .optional(),

  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20),

  search: z
    .string()
    .max(100)
    .optional(),
});

/**
 * Schema for user suggestion requests
 * Used for "Who to Follow" and sidebar suggestions
 */
export const userSuggestionSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(5),

  excludeIds: z
    .array(z.string().uuid())
    .optional(),

  source: z
    .enum(['sidebar', 'discover', 'profile'])
    .default('sidebar'),
});

// Type exports
export type FollowAction = z.infer<typeof followActionSchema>;
export type FollowListQuery = z.infer<typeof followListQuerySchema>;
export type UserSuggestion = z.infer<typeof userSuggestionSchema>;

// Response types based on API spec
export interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
  isFollowedBy: boolean; // Whether target follows current user (mutual)
}

export interface UserSuggestionResponse {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  isVerified: boolean;
  followerCount: number;
  isFollowing: boolean;
  mutualFollowers: {
    count: number;
    sample: Array<{ id: string; name: string; avatar: string }>;
  };
  reason: 'mutual_followers' | 'similar_interests' | 'popular' | 'recent_donors';
}

export interface FollowListUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  isVerified: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  mutualFollowers?: {
    count: number;
    sample: Array<{ id: string; name: string }>;
  };
}

export interface FollowListResponse {
  users: FollowListUser[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}
