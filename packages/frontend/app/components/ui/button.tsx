import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/**
 * FundBrave Unified Button Component
 * 
 * Consolidated from DesignButton with Figma design mappings.
 * Variants: primary (gradient), secondary (glass), tertiary (ghost), destructive, outline
 * Sizes: sm (36h), md (48h), lg (56h), xl (60h), icon
 */

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap rounded-[20px] font-alt font-semibold tracking-[0.04em] text-base leading-6 transition-all duration-[var(--duration-fast)] ease-[var(--ease-snappy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        // Primary: Brand gradient with glow
        primary: cn(
          "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)]",
          "text-white shadow-[0_8px_30px_0_rgba(97,36,243,0.35)]",
          "hover:brightness-110 active:brightness-95"
        ),
        // Secondary: Frosted glass with border
        secondary: cn(
          "backdrop-blur-[18px] bg-[rgba(69,12,240,0.10)]",
          "relative text-white",
          "before:absolute before:inset-0 before:rounded-[20px] before:border before:border-[var(--color-primary)] before:shadow-[0_8px_30px_0_rgba(29,5,82,0.35)] before:pointer-events-none",
          "hover:bg-[rgba(69,12,240,0.14)] active:bg-[rgba(69,12,240,0.18)]"
        ),
        // Tertiary: Gradient text only (ghost/link style)
        tertiary: cn(
          "relative text-transparent bg-clip-text",
          "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)]",
          "hover:opacity-90 active:opacity-80"
        ),
        // Destructive: Error/Delete actions
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline: Bordered transparent
        outline:
          "border border-border-default bg-transparent text-foreground dark:text-white hover:bg-surface-overlay",
        // Ghost: No background until hover
        ghost: "text-foreground dark:text-white hover:bg-accent hover:text-accent-foreground",
        // Link: Text only with underline
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-11 px-[18px] py-2.5 text-sm",
        md: "h-12 px-6 py-3",
        lg: "h-14 px-8 py-4",
        xl: "h-[60px] px-[38px] py-[18px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child component (for Link wrapping) */
  asChild?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Text to show when loading */
  loadingText?: string;
  /** Make button full width */
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText = "Please wait...",
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // For asChild, we can't show loading state properly
    if (asChild) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size }),
            fullWidth && "w-full",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-live="polite"
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" color="white" aria-hidden="true" />
            <span>{loadingText}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
