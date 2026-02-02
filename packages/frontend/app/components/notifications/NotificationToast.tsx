"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { X } from "@/app/components/ui/icons";
import { Avatar } from "@/app/components/ui/Avatar";
import { NotificationIcon } from "./NotificationIcon";
import { useNotificationToast, useMarkAsRead } from "@/app/provider/NotificationProvider";
import type { Notification } from "./schemas";

/**
 * Get navigation URL for notification
 */
function getNotificationUrl(notification: Notification): string {
  if (notification.target?.url) {
    return notification.target.url;
  }

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
 * Truncate message for toast
 */
function truncateMessage(message: string, maxLength = 60): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength).trim() + "...";
}

interface NotificationToastItemProps {
  notification: Notification;
  onDismiss: () => void;
}

/**
 * Single toast notification item
 */
function NotificationToastItem({
  notification,
  onDismiss,
}: NotificationToastItemProps) {
  const { markAsRead } = useMarkAsRead();
  const url = getNotificationUrl(notification);

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onDismiss();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
      }}
      className={cn(
        "relative w-full max-w-[360px]",
        "bg-background rounded-xl shadow-xl",
        "border border-border-default",
        "overflow-hidden"
      )}
    >
      <Link
        href={url}
        onClick={handleClick}
        className="flex items-start gap-3 p-4 hover:bg-surface-sunken transition-colors"
      >
        {/* Icon with avatar */}
        <div className="relative shrink-0">
          <NotificationIcon type={notification.type} size="sm" />
          {notification.actor && (
            <div className="absolute -bottom-0.5 -right-0.5 border-2 border-background rounded-full">
              <Avatar
                src={notification.actor.avatar}
                alt={notification.actor.name}
                fallback={notification.actor.name.charAt(0)}
                size="sm"
                className="size-4"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">
            {truncateMessage(notification.message)}
          </p>
          <p className="text-xs text-text-tertiary mt-1">Just now</p>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className={cn(
            "shrink-0 size-6 flex items-center justify-center rounded-full",
            "hover:bg-surface-overlay transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          aria-label="Dismiss notification"
        >
          <X size={14} className="text-text-tertiary" />
        </button>
      </Link>

      {/* Progress bar for auto-dismiss */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
        className="absolute bottom-0 left-0 h-0.5 bg-primary-500/50"
      />
    </motion.div>
  );
}

/**
 * NotificationToast Component
 *
 * Container for toast notifications that appear in real-time.
 * Features:
 * - Stacked toast display (max 3 visible)
 * - Auto-dismiss after 5 seconds
 * - Click to navigate to source
 * - Manual dismiss
 * - Animated entrance/exit
 */
export function NotificationToast() {
  const { toasts, dismissToast } = useNotificationToast();

  // Only show the most recent 3 toasts
  const visibleToasts = (toasts || []).slice(-3);

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-[200]",
        "flex flex-col gap-2",
        "pointer-events-none"
      )}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToastItem
              notification={toast.notification}
              onDismiss={() => dismissToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>

      {/* Screen reader announcement */}
      <div className="sr-only">
        {toasts && toasts.length > 0 && (
          <span>
            New notification: {toasts[toasts.length - 1]?.notification.message}
          </span>
        )}
      </div>
    </div>
  );
}

export default NotificationToast;
