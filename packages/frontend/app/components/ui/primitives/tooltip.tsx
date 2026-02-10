"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FundBrave Tooltip Primitive
 *
 * A lightweight tooltip with hover delay, keyboard accessibility,
 * and smooth fade animation. Uses local state instead of Radix.
 */

const sideStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
} as const;

const arrowStyles = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-foreground border-x-transparent border-b-transparent",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-b-foreground border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-foreground border-y-transparent border-r-transparent",
  right:
    "right-full top-1/2 -translate-y-1/2 border-r-foreground border-y-transparent border-l-transparent",
} as const;

type Side = keyof typeof sideStyles;

export interface TooltipProps {
  /** Tooltip text content */
  content: string;
  /** Trigger element */
  children: React.ReactNode;
  /** Which side the tooltip appears on */
  side?: Side;
  /** Delay in ms before showing the tooltip */
  delayMs?: number;
  /** Additional class names for the tooltip container */
  className?: string;
}

function Tooltip({
  content,
  children,
  side = "top",
  delayMs = 200,
  className,
}: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = React.useId();

  const show = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);

  const hide = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* Trigger */}
      <div aria-describedby={visible ? tooltipId : undefined}>
        {children}
      </div>

      {/* Tooltip */}
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[var(--z-tooltip)]",
          "whitespace-nowrap rounded-[var(--radius-sm)] px-2 py-1",
          "bg-foreground text-background text-xs font-medium",
          "transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
          sideStyles[side],
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        {content}
        {/* Arrow */}
        <span
          className={cn(
            "absolute h-0 w-0 border-4",
            arrowStyles[side]
          )}
          aria-hidden="true"
        />
      </span>
    </div>
  );
}

Tooltip.displayName = "Tooltip";

export { Tooltip };
