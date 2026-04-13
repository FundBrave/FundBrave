/**
 * Notifications API Client
 * Handles all notification-related requests to the backend
 * Transforms backend DTOs to frontend Notification types
 */

import { apiClient } from './client';
import type { Notification } from '@/app/components/notifications/schemas';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Backend notification types → Frontend notification types mapping
const TYPE_MAP: Record<string, string> = {
  LIKE: 'like_post',
  COMMENT: 'comment',
  REPOST: 'like_post',
  FOLLOW: 'new_follower',
  MENTION: 'mention',
  DONATION_RECEIVED: 'donation',
  STAKE_RECEIVED: 'donation',
  GOAL_REACHED: 'campaign_milestone',
  MILESTONE_REACHED: 'campaign_milestone',
  MESSAGE: 'system',
  SYSTEM: 'system',
  YIELD_HARVESTED: 'system',
  STOCK_PURCHASED: 'system',
  FBT_VESTED: 'system',
  FBT_REWARD: 'system',
  DAO_VOTE_STARTED: 'system',
  DAO_VOTE_ENDED: 'system',
};

/**
 * Transform a single backend notification to frontend format
 */
function transformNotification(backendNotif: any): Notification {
  const frontendType = TYPE_MAP[backendNotif.type] || 'system';

  return {
    id: backendNotif.id,
    type: frontendType as any,
    title: backendNotif.title,
    message: backendNotif.message || '',
    isRead: backendNotif.read ?? false,
    createdAt: typeof backendNotif.createdAt === 'string'
      ? backendNotif.createdAt
      : new Date(backendNotif.createdAt).toISOString(),
    actor: backendNotif.actor
      ? {
          id: backendNotif.actor.id,
          name: backendNotif.actor.displayName || backendNotif.actor.username || 'Unknown',
          username: backendNotif.actor.username || '',
          avatar: backendNotif.actor.avatarUrl,
        }
      : undefined,
    target: backendNotif.entityId
      ? {
          type: (backendNotif.entityType || 'post') as any,
          id: backendNotif.entityId,
          url: backendNotif.entityType === 'post'
            ? `/p/${backendNotif.entityId}`
            : backendNotif.entityType === 'user'
            ? `/profile/${backendNotif.entityId}`
            : undefined,
        }
      : undefined,
    metadata: backendNotif.metadata,
  };
}

// Frontend paginated response
export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

// Response from backend
interface BackendPaginatedNotifications {
  items: any[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

class NotificationsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get paginated notifications
   */
  async getNotifications(limit = 20, offset = 0): Promise<PaginatedNotifications> {
    const data = await apiClient.get<BackendPaginatedNotifications>(
      `/api/notifications?limit=${limit}&offset=${offset}`
    );

    return {
      notifications: (data.items || []).map(transformNotification),
      total: data.total,
      unreadCount: data.unreadCount,
      hasMore: data.hasMore,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/api/notifications/unread/count');
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    return apiClient.put<{ success: boolean }>(
      `/api/notifications/${notificationId}/read`
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    return apiClient.post<{ success: boolean; count: number }>(
      '/api/notifications/read-all'
    );
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      `/api/notifications/${notificationId}`
    );
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<{ success: boolean; count: number }> {
    return apiClient.delete<{ success: boolean; count: number }>(
      '/api/notifications/all'
    );
  }
}

// Export singleton instance
export const notificationsApi = new NotificationsApiClient();
