"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import { NotificationIcon } from "./NotificationIcon";
import { Trash2 } from "@/app/components/ui/icons";
import type { Notification } from "./schemas";
import { useMarkAsRead, useNotificationContext } from "@/app/provider/NotificationProvider";

/**
 * Format relative time from date string
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays === 1) {
    return "1d";
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Get navigation URL for notification
 */
function getNotificationUrl(notification: Notification): string {
  if (notification.target?.url) {
    return notification.target.url;
  }

  // Fallback URLs based on notification type
  switch (notification.type) {
    case "new_follower":
    case "follow_back":
      return notification.actor
        ? `/profile/${notification.actor.username}`
        : "/notifications";
    case "donation":
    case "donation_received":
    case "campaign_milestone":
    case "milestone":
    case "campaign_update":
    case "campaign_ending":
    case "campaign_funded":
      return notification.target
        ? `/campaigns/${notification.target.id}`
        : "/campaigns";
    default:
      return "/notifications";
  }
}

/**
 * Truncate message to max length
 */
function truncateMessage(message: string, maxLength = 100): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength).trim() + "...";
}

interface NotificationItemProps {
  /** The notification data */
  notification: Notification;
  /** Additional CSS classes */
  className?: string;
  /** Callback when item is clicked */
  onClick?: () => void;
}

/**
 * NotificationItem Component
 *
 * Individual notification row with:
 * - Type-specific icon
 * - Actor avatar (if applicable)
 * - Message text (truncated)
 * - Relative timestamp
 * - Unread indicator (blue dot)
 * - Swipe to dismiss on mobile
 * - Click to navigate
 */
export function NotificationItem({
  notification,
  className,
  onClick,
}: NotificationItemProps) {
  const { markAsRead } = useMarkAsRead();
  const { deleteNotification, closePanel } = useNotificationContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Swipe gesture handling
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0],
    ["rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0)"]
  );
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -100) {
        setIsDeleting(true);
        deleteNotification(notification.id);
      }
    },
    [deleteNotification, notification.id]
  );

  const handleClick = useCallback(() => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onClick?.();
    closePanel();
  }, [notification.id, notification.isRead, markAsRead, onClick, closePanel]);

  const url = getNotificationUrl(notification);
  const relativeTime = formatRelativeTime(notification.createdAt);

  if (isDeleting) {
    return null;
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden">
      {/* Delete indicator background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-4"
        style={{ background }}
      >
        <motion.div style={{ opacity: deleteOpacity }}>
          <Trash2 size={20} className="text-red-500" />
        </motion.div>
      </motion.div>

      {/* Main content with swipe */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative"
      >
        <Link
          href={url}
          onClick={handleClick}
          className={cn(
            // Base layout
            "flex items-start gap-3 px-4 py-3 w-full",
            // Background and hover
            "bg-background",
            notification.isRead
              ? "hover:bg-surface-sunken"
              : "bg-primary-500/[0.03] hover:bg-primary-500/[0.06]",
            // Touch target
            "min-h-[64px]",
            // Focus styles
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
            // Transition
            "transition-colors duration-[var(--duration-fast)]",
            className
          )}
          aria-label={`${notification.message}. ${relativeTime}${notification.isRead ? "" : ". Unread"}`}
        >
          {/* Left side: Icon or Avatar */}
          <div className="relative shrink-0">
            {/* Type icon */}
            <NotificationIcon type={notification.type} size="md" />

            {/* Actor avatar overlay (if present) */}
            {notification.actor && (
              <div className="absolute -bottom-1 -right-1 border-2 border-background rounded-full">
                <Avatar
                  src={notification.actor.avatar}
                  alt={notification.actor.name}
                  fallback={notification.actor.name.charAt(0)}
                  size="sm"
                  className="size-5"
                />
              </div>
            )}
          </div>

          {/* Middle: Message content */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm leading-snug",
                notification.isRead ? "text-text-secondary" : "text-foreground"
              )}
            >
              {truncateMessage(notification.message)}
            </p>

            {/* Target title (if different from message) */}
            {notification.target?.title && (
              <p className="text-xs text-text-tertiary mt-0.5 truncate">
                {notification.target.title}
              </p>
            )}
          </div>

          {/* Right side: Time and unread indicator */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-text-tertiary whitespace-nowrap">
              {relativeTime}
            </span>

            {/* Unread indicator */}
            {!notification.isRead && (
              <span
                className="size-2 rounded-full bg-primary-500"
                aria-hidden="true"
              />
            )}
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

export default NotificationItem;
