import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * FundBrave Input Primitive
 *
 * A text input with variant styles, icon support, and error states.
 * Follows the same CVA + forwardRef pattern as Button.
 */

const inputVariants = cva(
  // Base styles
  [
    "flex w-full rounded-[var(--radius-lg)] text-white",
    "placeholder:text-[var(--text-tertiary)]",
    "transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
    "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ],
  {
    variants: {
      variant: {
        default: "border border-[var(--border-default)] bg-transparent",
        filled:
          "border border-transparent bg-[var(--surface-sunken)]",
        ghost:
          "border border-transparent bg-transparent focus:border-[var(--border-default)]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-12 px-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Icon rendered at the start (left) of the input */
  startIcon?: React.ReactNode;
  /** Icon rendered at the end (right) of the input */
  endIcon?: React.ReactNode;
  /** Whether the input is in an error state */
  error?: boolean;
  /** Error message displayed below the input */
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = "text",
      startIcon,
      endIcon,
      error,
      errorMessage,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      id,
      ...props
    },
    ref
  ) => {
    const errorId = errorMessage && id ? `${id}-error` : undefined;

    return (
      <div className="w-full">
        <div className="relative">
          {startIcon && (
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              aria-hidden="true"
            >
              {startIcon}
            </span>
          )}
          <input
            id={id}
            type={type}
            ref={ref}
            aria-invalid={ariaInvalid ?? (error ? true : undefined)}
            aria-describedby={
              [ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined
            }
            className={cn(
              inputVariants({ variant, size }),
              startIcon && "pl-10",
              endIcon && "pr-10",
              error &&
                "border-destructive focus:ring-destructive/30 focus:border-destructive",
              className
            )}
            {...props}
          />
          {endIcon && (
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              aria-hidden="true"
            >
              {endIcon}
            </span>
          )}
        </div>
        {error && errorMessage && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
