"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ThreadConnectorProps {
  children: ReactNode;
  replyCount: number;
  isExpanded?: boolean;
  className?: string;
}

/**
 * ThreadConnector - Visual line connecting nested replies
 * Displays a vertical line from parent avatar to child replies
 */
export function ThreadConnector({
  children,
  replyCount,
  isExpanded = false,
  className,
}: ThreadConnectorProps) {
  if (replyCount === 0) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical connector line */}
      <div
        className={cn(
          "absolute left-[19px] top-12 w-0.5 bg-border-subtle transition-opacity",
          isExpanded ? "opacity-100" : "opacity-50"
        )}
        style={{
          // Height calculated to span from parent avatar to last reply
          // Will be set dynamically based on children
          height: "calc(100% - 48px)",
        }}
        aria-hidden="true"
      />

      {children}
    </div>
  );
}

export default ThreadConnector;
