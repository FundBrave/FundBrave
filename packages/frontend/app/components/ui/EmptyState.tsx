"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Icon to display */
  icon: React.ReactNode;
  /** Optional title text */
  title?: string;
  /** Message to display */
  message: string;
  /** Optional action button/link */
  action?: React.ReactNode;
  /** Additional className for container */
  className?: string;
}

/**
 * A reusable empty state component for displaying when there's no content.
 * Use this for empty lists, search results, or placeholder states.
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken">
        {icon}
      </div>
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      )}
      <p className="max-w-sm text-sm text-text-tertiary">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
