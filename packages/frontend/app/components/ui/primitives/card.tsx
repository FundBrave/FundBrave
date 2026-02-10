import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * FundBrave Card Primitive
 *
 * A container component with variant styles and composable sub-components.
 * Follows the same CVA + forwardRef pattern as Button.
 */

const cardVariants = cva(
  // Base styles
  "rounded-[var(--radius-xl)] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-elevated)] border border-[var(--border-subtle)]",
        elevated:
          "bg-[var(--surface-elevated)] shadow-[var(--shadow-elevated)]",
        glass:
          "backdrop-blur-lg bg-white/5 border border-white/10",
        interactive: cn(
          "bg-[var(--surface-elevated)] border border-[var(--border-subtle)]",
          "cursor-pointer",
          "transition-[box-shadow,border-color] duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
          "hover:shadow-[var(--shadow-elevated)] hover:border-[var(--border-emphasis)]"
        ),
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-1.5 border-b border-[var(--border-subtle)] pb-4",
          className
        )}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex-1", className)} {...props} />
    );
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center border-t border-[var(--border-subtle)] pt-4",
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, cardVariants, CardHeader, CardContent, CardFooter };
