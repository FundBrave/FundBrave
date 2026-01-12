"use client";

import { useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Bell } from "@/app/components/ui/icons";
import { useNotificationContext } from "@/app/provider/NotificationProvider";

interface NotificationBellProps {
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * NotificationBell Component
 *
 * Bell icon with animated unread count badge.
 * Features:
 * - 44px touch target for accessibility
 * - Animated badge with pulse on new notifications
 * - Aria labels for screen readers
 * - Opens NotificationPanel on click
 */
export const NotificationBell = forwardRef<
  HTMLButtonElement,
  NotificationBellProps
>(function NotificationBell({ className, size = "md" }, ref) {
  const { unreadCount, isPanelOpen, togglePanel } = useNotificationContext();
  const previousCount = useRef(unreadCount);
  const hasNewNotification = useRef(false);

  // Track when we get new notifications
  useEffect(() => {
    if (unreadCount > previousCount.current) {
      hasNewNotification.current = true;
      // Reset after animation
      const timer = setTimeout(() => {
        hasNewNotification.current = false;
      }, 600);
      return () => clearTimeout(timer);
    }
    previousCount.current = unreadCount;
  }, [unreadCount]);

  // Format badge text
  const badgeText = unreadCount > 99 ? "99+" : unreadCount.toString();

  // Size-specific styles
  const sizeStyles = {
    sm: {
      button: "size-9",
      icon: 18,
      badge: "min-w-[16px] h-[16px] text-[10px] -top-1 -right-1",
    },
    md: {
      button: "size-11",
      icon: 20,
      badge: "min-w-[18px] h-[18px] text-[11px] -top-1 -right-0.5",
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <button
      ref={ref}
      onClick={togglePanel}
      className={cn(
        // Base styles - 44px minimum touch target
        "relative flex items-center justify-center rounded-full",
        "min-h-[44px] min-w-[44px]",
        currentSize.button,
        // Background
        "bg-surface-sunken",
        // Hover and active states
        "hover:bg-surface-overlay active:bg-surface-overlay active:scale-[0.98]",
        // Focus styles for accessibility
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        // Transition
        "transition-all duration-[var(--duration-fast)]",
        className
      )}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      aria-haspopup="true"
      aria-expanded={isPanelOpen}
    >
      {/* Bell Icon */}
      <motion.div
        animate={hasNewNotification.current ? { rotate: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Bell size={currentSize.icon} className="text-foreground/80" />
      </motion.div>

      {/* Unread Badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
            className={cn(
              // Position
              "absolute",
              currentSize.badge,
              // Layout
              "flex items-center justify-center",
              // Typography
              "font-semibold text-white",
              // Background
              "bg-red-500 rounded-full",
              // Padding for multi-digit
              unreadCount > 9 ? "px-1" : "px-0"
            )}
          >
            {/* Pulse animation for new notifications */}
            {hasNewNotification.current && (
              <motion.span
                className="absolute inset-0 rounded-full bg-red-500"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
            <span className="relative z-10">{badgeText}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
});

export default NotificationBell;
