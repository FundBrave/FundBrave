import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * FundBrave Progress Primitive
 *
 * A progress bar with variant styles, sizes, and indeterminate state.
 * Follows the same CVA + forwardRef pattern as Button.
 */

const progressVariants = cva(
  // Base track styles
  "w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const progressBarVariants = cva(
  // Base bar styles
  "h-full rounded-full transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[var(--color-primary)] to-[var(--purple-500)]",
        success: "bg-[var(--color-success)]",
        warning: "bg-[var(--color-warning)]",
        info: "bg-[var(--color-info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressBarVariants> {
  /** Current progress value (0 to max) */
  value: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Animated indeterminate loading state */
  indeterminate?: boolean;
  /** Accessible label for the progress bar */
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      variant,
      size,
      value,
      max = 100,
      showLabel = false,
      indeterminate = false,
      label,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        className={cn(
          "flex items-center gap-2",
          showLabel && "w-full"
        )}
      >
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          className={cn(
            progressVariants({ size }),
            "relative flex-1",
            className
          )}
          {...props}
        >
          <div
            className={cn(
              progressBarVariants({ variant }),
              indeterminate && "animate-progress-indeterminate absolute inset-y-0 w-1/3"
            )}
            style={
              indeterminate
                ? undefined
                : { width: `${percentage}%` }
            }
          >
            {showLabel && size === "lg" && !indeterminate && (
              <span className="flex h-full items-center justify-end pr-2 text-xs font-medium text-white">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
        {showLabel && size !== "lg" && !indeterminate && (
          <span className="shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress, progressVariants };
