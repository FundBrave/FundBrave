"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { WithdrawalStatus } from "@/app/types/earnings";

/**
 * StatusBadge - Displays Paid/Pending status with appropriate styling
 * Figma: Paid = green background, Pending = yellow/orange background
 */

const statusBadgeVariants = cva(
  // Base styles
  "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        Paid: "bg-green-500/20 text-green-400 border border-green-500/30",
        Pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      },
    },
    defaultVariants: {
      status: "Pending",
    },
  }
);

export interface StatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  status: WithdrawalStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {status}
    </span>
  );
}

export default StatusBadge;
