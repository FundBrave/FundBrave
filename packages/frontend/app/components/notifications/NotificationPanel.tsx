"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { X, Check, Settings, ChevronLeft } from "@/app/components/ui/icons";
import { Button } from "@/app/components/ui/button";
import { NotificationItem } from "./NotificationItem";
import { NotificationEmpty } from "./NotificationEmpty";
import { Loader2 } from "@/app/components/ui/icons";
import {
  useNotificationContext,
  useNotifications,
  useMarkAsRead,
} from "@/app/provider/NotificationProvider";

interface NotificationPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Time group labels
 */
const TIME_GROUP_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  earlier: "Earlier",
} as const;

/**
 * NotificationPanel Component
 *
 * Dropdown/slide-out panel showing notification list.
 * Features:
 * - Desktop: Dropdown aligned to bell (360px width, 480px max height)
 * - Mobile: Full-screen panel
 * - Tabs: All / Unread
 * - Time-grouped notifications
 * - Mark all as read action
 * - Infinite scroll
 * - Empty state
 */
export function NotificationPanel({ className }: NotificationPanelProps) {
  const { isPanelOpen, closePanel, unreadCount } = useNotificationContext();
  const { groupedNotifications, isLoading, hasMore, fetchMore } =
    useNotifications();
  const { markAllAsRead } = useMarkAsRead();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter notifications based on active tab
  const filteredGroups = activeTab === "unread"
    ? {
        today: groupedNotifications.today.filter((n) => !n.isRead),
        yesterday: groupedNotifications.yesterday.filter((n) => !n.isRead),
        this_week: groupedNotifications.this_week.filter((n) => !n.isRead),
        earlier: groupedNotifications.earlier.filter((n) => !n.isRead),
      }
    : groupedNotifications;

  // Check if there are any notifications
  const hasNotifications = Object.values(filteredGroups).some(
    (group) => group.length > 0
  );

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        // Don't close if clicking the bell button
        const target = event.target as HTMLElement;
        if (target.closest('[aria-label*="Notifications"]')) {
          return;
        }
        closePanel();
      }
    };

    if (isPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPanelOpen, closePanel]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchMore();
    }
  }, [isLoading, hasMore, fetchMore]);

  // Handle mark all as read
  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPanelOpen) return;

      if (e.key === "Escape") {
        closePanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, closePanel]);

  // Render notification groups
  const renderNotificationGroup = (
    groupKey: keyof typeof TIME_GROUP_LABELS,
    notifications: typeof filteredGroups.today
  ) => {
    if (notifications.length === 0) return null;

    return (
      <div key={groupKey}>
        {/* Group header */}
        <div className="px-4 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            {TIME_GROUP_LABELS[groupKey]}
          </h3>
        </div>

        {/* Notification items */}
        <div>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.15,
                delay: index * 0.03,
                ease: "easeOut",
              }}
            >
              <NotificationItem notification={notification} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[100] lg:hidden"
            onClick={closePanel}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            aria-modal="true"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.2,
              ease: [0.2, 0, 0, 1], // ease-snappy
            }}
            className={cn(
              // Desktop: Dropdown
              "hidden lg:block",
              "absolute top-full right-0 mt-2",
              "w-[360px] max-h-[480px]",
              "bg-background rounded-xl shadow-xl",
              "border border-border-default",
              "overflow-hidden",
              "z-[100]",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h2 className="font-semibold text-foreground">Notifications</h2>

              <div className="flex items-center gap-2">
                {/* Mark all as read */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1 min-h-[32px] px-2"
                    aria-label="Mark all as read"
                  >
                    <Check size={14} />
                    <span>Mark all read</span>
                  </button>
                )}

                {/* Settings link */}
                <Link
                  href="/settings/notifications"
                  onClick={closePanel}
                  className="size-8 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
                  aria-label="Notification settings"
                >
                  <Settings size={16} className="text-text-secondary" />
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-default">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  activeTab === "all"
                    ? "text-foreground border-b-2 border-primary-500"
                    : "text-text-secondary hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  activeTab === "unread"
                    ? "text-foreground border-b-2 border-primary-500"
                    : "text-text-secondary hover:text-foreground"
                )}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            {/* Scrollable content */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="overflow-y-auto max-h-[calc(480px-120px)] custom-scrollbar"
            >
              {/* Loading state */}
              {isLoading && !hasNotifications && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="text-primary-500 animate-spin" />
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !hasNotifications && (
                <NotificationEmpty
                  title={
                    activeTab === "unread"
                      ? "All caught up!"
                      : "No notifications yet"
                  }
                  description={
                    activeTab === "unread"
                      ? "You've read all your notifications."
                      : "When you receive donations, follows, or comments, they'll appear here."
                  }
                />
              )}

              {/* Notification groups */}
              {hasNotifications && (
                <>
                  {renderNotificationGroup("today", filteredGroups.today)}
                  {renderNotificationGroup("yesterday", filteredGroups.yesterday)}
                  {renderNotificationGroup("this_week", filteredGroups.this_week)}
                  {renderNotificationGroup("earlier", filteredGroups.earlier)}
                </>
              )}

              {/* Load more indicator */}
              {isLoading && hasNotifications && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="text-primary-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Footer */}
            <Link
              href="/notifications"
              onClick={closePanel}
              className="flex items-center justify-center py-3 border-t border-border-default text-sm font-medium text-primary-500 hover:text-primary-400 hover:bg-surface-sunken transition-colors"
            >
              View All Notifications
            </Link>
          </motion.div>

          {/* Mobile: Full screen panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className={cn(
              "lg:hidden",
              "fixed inset-0 top-16 z-[101]",
              "bg-background",
              "flex flex-col"
            )}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <div className="flex items-center gap-3">
                <button
                  onClick={closePanel}
                  className="size-10 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
                  aria-label="Close notifications"
                >
                  <ChevronLeft size={24} className="text-foreground" />
                </button>
                <h2 className="font-semibold text-foreground text-lg">
                  Notifications
                </h2>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-primary-500 hover:text-primary-400 font-medium px-3 py-1.5"
                  aria-label="Mark all as read"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Mobile Tabs */}
            <div className="flex border-b border-border-default">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  activeTab === "all"
                    ? "text-foreground border-b-2 border-primary-500"
                    : "text-text-secondary"
                )}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  activeTab === "unread"
                    ? "text-foreground border-b-2 border-primary-500"
                    : "text-text-secondary"
                )}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            {/* Mobile scrollable content */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto custom-scrollbar"
            >
              {isLoading && !hasNotifications && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="text-primary-500 animate-spin" />
                </div>
              )}

              {!isLoading && !hasNotifications && (
                <NotificationEmpty
                  title={
                    activeTab === "unread"
                      ? "All caught up!"
                      : "No notifications yet"
                  }
                  description={
                    activeTab === "unread"
                      ? "You've read all your notifications."
                      : "When you receive donations, follows, or comments, they'll appear here."
                  }
                />
              )}

              {hasNotifications && (
                <>
                  {renderNotificationGroup("today", filteredGroups.today)}
                  {renderNotificationGroup("yesterday", filteredGroups.yesterday)}
                  {renderNotificationGroup("this_week", filteredGroups.this_week)}
                  {renderNotificationGroup("earlier", filteredGroups.earlier)}
                </>
              )}

              {isLoading && hasNotifications && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="text-primary-500 animate-spin" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationPanel;
