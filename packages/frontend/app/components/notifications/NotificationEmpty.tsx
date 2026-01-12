"use client";

import { cn } from "@/lib/utils";
import { Bell } from "@/app/components/ui/icons";

interface NotificationEmptyProps {
  /** Additional CSS classes */
  className?: string;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
}

/**
 * NotificationEmpty Component
 *
 * Empty state displayed when there are no notifications.
 * Features a sleeping bell illustration with helpful text.
 */
export function NotificationEmpty({
  className,
  title = "No notifications yet",
  description = "When you receive donations, follows, or comments, they'll appear here.",
}: NotificationEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      {/* Illustration - Bell with Zzz */}
      <div className="relative mb-6">
        {/* Main bell */}
        <div className="relative">
          <div className="size-20 rounded-full bg-surface-sunken flex items-center justify-center">
            <Bell size={40} className="text-text-tertiary" />
          </div>

          {/* Sleeping Zzz animation */}
          <div className="absolute -top-2 -right-2 flex flex-col items-start gap-0.5">
            <span
              className="text-text-tertiary text-xs font-bold opacity-40 animate-pulse"
              style={{ animationDelay: "0ms" }}
            >
              z
            </span>
            <span
              className="text-text-tertiary text-sm font-bold opacity-60 animate-pulse -ml-1"
              style={{ animationDelay: "200ms" }}
            >
              z
            </span>
            <span
              className="text-text-tertiary text-base font-bold opacity-80 animate-pulse -ml-2"
              style={{ animationDelay: "400ms" }}
            >
              z
            </span>
          </div>
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-foreground font-semibold text-base mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-[240px] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default NotificationEmpty;
