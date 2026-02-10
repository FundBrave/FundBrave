import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * FundBrave Divider Primitive
 *
 * A visual separator for breaking up sections of content.
 * Supports horizontal/vertical orientation, style variants, and an optional label.
 * Follows the same CVA + forwardRef pattern as Button.
 */

const dividerVariants = cva(
  // Base styles — intentionally empty; orientation determines layout
  "",
  {
    variants: {
      orientation: {
        horizontal: "w-full",
        vertical: "h-full",
      },
      variant: {
        default: "bg-[var(--border-subtle)]",
        emphasis: "bg-[var(--border-emphasis)]",
        gradient: "",
      },
    },
    compoundVariants: [
      // Horizontal dimensions
      {
        orientation: "horizontal",
        className: "h-px",
      },
      // Vertical dimensions
      {
        orientation: "vertical",
        className: "w-px",
      },
      // Gradient needs specific directional classes
      {
        variant: "gradient",
        orientation: "horizontal",
        className:
          "bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent",
      },
      {
        variant: "gradient",
        orientation: "vertical",
        className:
          "bg-gradient-to-b from-transparent via-[var(--color-primary)] to-transparent",
      },
    ],
    defaultVariants: {
      orientation: "horizontal",
      variant: "default",
    },
  }
);

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {
  /** Text label centered on the divider (e.g. "OR") */
  label?: string;
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = "horizontal", variant, label, ...props }, ref) => {
    const resolvedOrientation = orientation ?? "horizontal";

    // Label variant: two lines with text in between
    if (label && resolvedOrientation === "horizontal") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation={resolvedOrientation}
          className={cn("flex w-full items-center gap-3", className)}
          {...props}
        >
          <div
            className={cn(
              dividerVariants({ orientation: resolvedOrientation, variant }),
              "flex-1"
            )}
          />
          <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
            {label}
          </span>
          <div
            className={cn(
              dividerVariants({ orientation: resolvedOrientation, variant }),
              "flex-1"
            )}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={resolvedOrientation}
        className={cn(
          dividerVariants({ orientation: resolvedOrientation, variant }),
          className
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = "Divider";

export { Divider, dividerVariants };
