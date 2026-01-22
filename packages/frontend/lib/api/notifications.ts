/**
 * Notifications API Client
 * Handles all notification-related requests to the backend
 */

import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export interface Notification {
  id: string;
  userId: string;
  type: 'donation' | 'campaign_funded' | 'campaign_update' | 'follower' | 'comment' | 'reply' | 'mention';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedNotifications {
  notifications: Notification[];
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
    return apiClient.get<PaginatedNotifications>(
      `/api/notifications?limit=${limit}&offset=${offset}`
    );
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
