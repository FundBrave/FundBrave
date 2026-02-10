"use client";

import { cn } from "@/lib/utils";
import { Check, Clock } from "lucide-react";

export interface StatusBadgeProps {
  /** Whether the component is built or planned */
  status: "built" | "planned";
  /** Additional className */
  className?: string;
}

const statusConfig = {
  built: {
    label: "Built",
    icon: Check,
    classes:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  planned: {
    label: "Planned",
    icon: Clock,
    classes:
      "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  },
} as const;

/**
 * StatusBadge -- displays a "Built" or "Planned" pill badge with an icon.
 * Used in the UI Library showcase pages to indicate component readiness.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.classes,
        className
      )}
      role="status"
      aria-label={`Component status: ${config.label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export default StatusBadge;
