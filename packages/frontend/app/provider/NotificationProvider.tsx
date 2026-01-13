"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type {
  Notification,
  NotificationsResponse,
  GroupedNotifications,
  NotificationTimeGroup,
} from "@/app/components/notifications/schemas";

// Polling interval in milliseconds (30 seconds as per spec)
const POLLING_INTERVAL = 30000;

// Auto-dismiss toast after 5 seconds
const TOAST_AUTO_DISMISS = 5000;

/**
 * Toast notification interface
 */
interface NotificationToast {
  id: string;
  notification: Notification;
  createdAt: number;
}

/**
 * Notification Context State
 */
interface NotificationContextState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isPanelOpen: boolean;
  hasMore: boolean;
  cursor: string | null;
  toasts: NotificationToast[];

  // Actions
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  dismissToast: (id: string) => void;
  addToast: (notification: Notification) => void;

  // Grouped notifications
  groupedNotifications: GroupedNotifications;
}

const NotificationContext = createContext<NotificationContextState | undefined>(
  undefined
);

/**
 * Group notifications by time period
 */
function groupNotificationsByTime(
  notifications: Notification[]
): GroupedNotifications {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: GroupedNotifications = {
    today: [],
    yesterday: [],
    this_week: [],
    earlier: [],
  };

  for (const notification of notifications) {
    const createdAt = new Date(notification.createdAt);

    if (createdAt >= today) {
      groups.today.push(notification);
    } else if (createdAt >= yesterday) {
      groups.yesterday.push(notification);
    } else if (createdAt >= weekAgo) {
      groups.this_week.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  }

  return groups;
}

/**
 * Mock data generator for development
 */
function generateMockNotifications(): Notification[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "1",
      type: "donation",
      message: "John donated $50 to your campaign \"Help Build a School\"",
      isRead: false,
      createdAt: now.toISOString(),
      actor: {
        id: "user-1",
        name: "John Smith",
        username: "johnsmith",
        avatar: "/image.png",
      },
      target: {
        type: "campaign",
        id: "campaign-1",
        title: "Help Build a School",
        url: "/campaigns/campaign-1",
      },
    },
    {
      id: "2",
      type: "new_follower",
      message: "Sarah started following you",
      isRead: false,
      createdAt: oneHourAgo.toISOString(),
      actor: {
        id: "user-2",
        name: "Sarah Johnson",
        username: "sarahj",
        avatar: "/image.png",
      },
      target: {
        type: "user",
        id: "user-2",
        url: "/profile/sarahj",
      },
    },
    {
      id: "3",
      type: "comment",
      message: "Mike commented on your campaign: \"This is amazing!\"",
      isRead: false,
      createdAt: twoHoursAgo.toISOString(),
      actor: {
        id: "user-3",
        name: "Mike Davis",
        username: "miked",
        avatar: "/image.png",
      },
      target: {
        type: "campaign",
        id: "campaign-1",
        title: "Help Build a School",
        url: "/campaigns/campaign-1",
      },
    },
    {
      id: "4",
      type: "campaign_milestone",
      message: "Your campaign \"Medical Fund\" reached 50% of its goal!",
      isRead: true,
      createdAt: yesterday.toISOString(),
      target: {
        type: "campaign",
        id: "campaign-2",
        title: "Medical Fund",
        url: "/campaigns/campaign-2",
      },
    },
    {
      id: "5",
      type: "like_post",
      message: "Emma liked your post",
      isRead: true,
      createdAt: yesterday.toISOString(),
      actor: {
        id: "user-4",
        name: "Emma Wilson",
        username: "emmaw",
        avatar: "/image.png",
      },
      target: {
        type: "post",
        id: "post-1",
        url: "/p/post-1",
      },
    },
    {
      id: "6",
      type: "campaign_update",
      message: "Campaign \"Emergency Relief\" posted an update",
      isRead: true,
      createdAt: twoDaysAgo.toISOString(),
      target: {
        type: "campaign",
        id: "campaign-3",
        title: "Emergency Relief",
        url: "/campaigns/campaign-3",
      },
    },
    {
      id: "7",
      type: "mention",
      message: "Alex mentioned you in a comment",
      isRead: true,
      createdAt: weekAgo.toISOString(),
      actor: {
        id: "user-5",
        name: "Alex Brown",
        username: "alexb",
        avatar: "/image.png",
      },
      target: {
        type: "comment",
        id: "comment-1",
        url: "/p/post-2?comment=comment-1",
      },
    },
  ];
}

/**
 * NotificationProvider Component
 *
 * Provides global notification state and actions to the application.
 * Implements 30-second polling for unread count updates.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const previousUnreadCount = useRef(0);

  /**
   * Fetch unread count from API
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/notifications/unread-count');
      // const data = await response.json();
      // setUnreadCount(data.count);

      // Mock implementation
      const mockCount = notifications.filter((n) => !n.isRead).length;

      // Check if we have new notifications to show toast
      if (mockCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
        // Find the newest unread notification
        const newestUnread = notifications.find((n) => !n.isRead);
        if (newestUnread) {
          addToast(newestUnread);
        }
      }

      previousUnreadCount.current = mockCount;
      setUnreadCount(mockCount);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [notifications]);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async (reset = false) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const params = new URLSearchParams({
      //   limit: '20',
      //   ...(cursor && !reset ? { cursor } : {}),
      // });
      // const response = await fetch(`/api/notifications?${params}`);
      // const data: NotificationsResponse = await response.json();

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      const mockData = generateMockNotifications();

      if (reset) {
        setNotifications(mockData);
        setCursor(null);
      } else {
        setNotifications((prev) => [...prev, ...mockData]);
      }

      setHasMore(false); // Mock: no more data
      setUnreadCount(mockData.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (error) {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const previousNotifications = notifications;
    const previousCount = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/notifications/read-all', { method: 'PUT' });
    } catch (error) {
      // Revert on error
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
      console.error("Failed to mark all as read:", error);
    }
  }, [notifications, unreadCount]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (id: string) => {
    const previousNotifications = notifications;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Revert on error
      setNotifications(previousNotifications);
      console.error("Failed to delete notification:", error);
    }
  }, [notifications]);

  /**
   * Open notification panel
   */
  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    // Fetch fresh notifications when opening panel
    fetchNotifications(true);
  }, [fetchNotifications]);

  /**
   * Close notification panel
   */
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  /**
   * Toggle notification panel
   */
  const togglePanel = useCallback(() => {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }, [isPanelOpen, openPanel, closePanel]);

  /**
   * Add a toast notification
   */
  const addToast = useCallback((notification: Notification) => {
    const toast: NotificationToast = {
      id: `toast-${notification.id}-${Date.now()}`,
      notification,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(toast.id);
    }, TOAST_AUTO_DISMISS);
  }, []);

  /**
   * Dismiss a toast notification
   */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Group notifications by time period
   */
  const groupedNotifications = groupNotificationsByTime(notifications);

  /**
   * Poll for unread count every 30 seconds
   */
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  /**
   * Initial fetch of notifications
   */
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  /**
   * Close panel on escape key
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPanelOpen) {
        closePanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, closePanel]);

  const value: NotificationContextState = {
    notifications,
    unreadCount,
    isLoading,
    isPanelOpen,
    hasMore,
    cursor,
    toasts,
    openPanel,
    closePanel,
    togglePanel,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissToast,
    addToast,
    groupedNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }
  return context;
}

/**
 * Hook to get unread count only
 */
export function useUnreadCount() {
  const { unreadCount } = useNotificationContext();
  return unreadCount;
}

/**
 * Hook for notifications list
 */
export function useNotifications() {
  const {
    notifications,
    groupedNotifications,
    isLoading,
    hasMore,
    fetchNotifications,
  } = useNotificationContext();

  return {
    notifications,
    groupedNotifications,
    isLoading,
    hasMore,
    fetchMore: () => fetchNotifications(false),
    refresh: () => fetchNotifications(true),
  };
}

/**
 * Hook for mark as read actions
 */
export function useMarkAsRead() {
  const { markAsRead, markAllAsRead } = useNotificationContext();
  return { markAsRead, markAllAsRead };
}

/**
 * Hook for toast notifications
 */
export function useNotificationToast() {
  const { toasts, dismissToast, addToast } = useNotificationContext();
  return { toasts, dismissToast, addToast };
}
