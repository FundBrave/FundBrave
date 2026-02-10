import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * FundBrave Textarea Primitive
 *
 * A multi-line text input with variant styles, error states, and optional
 * character count. Follows the same CVA + forwardRef pattern as Button.
 */

const textareaVariants = cva(
  // Base styles
  [
    "flex w-full resize-y rounded-[var(--radius-lg)] text-white",
    "placeholder:text-[var(--text-tertiary)]",
    "transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
    "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: "border border-[var(--border-default)] bg-transparent",
        filled:
          "border border-transparent bg-[var(--surface-sunken)]",
      },
      size: {
        sm: "min-h-[80px] px-3 py-2 text-sm",
        md: "min-h-[120px] px-4 py-3 text-base",
        lg: "min-h-[160px] px-4 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  /** Whether the textarea is in an error state */
  error?: boolean;
  /** Error message displayed below the textarea */
  errorMessage?: string;
  /** Maximum character count (displays counter when provided) */
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      error,
      errorMessage,
      maxLength,
      value,
      defaultValue,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      id,
      ...props
    },
    ref
  ) => {
    const errorId = errorMessage && id ? `${id}-error` : undefined;

    // Derive current length for the character counter.
    // Works with both controlled and uncontrolled usage: controlled values
    // take precedence, then defaultValue, falling back to empty string.
    const currentLength =
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
          ? defaultValue.length
          : 0;

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            id={id}
            ref={ref}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={ariaInvalid ?? (error ? true : undefined)}
            aria-describedby={
              [ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined
            }
            className={cn(
              textareaVariants({ variant, size }),
              error &&
                "border-destructive focus:ring-destructive/30 focus:border-destructive",
              className
            )}
            {...props}
          />
          {maxLength !== undefined && (
            <span
              className="pointer-events-none absolute bottom-2 right-3 text-xs text-[var(--text-tertiary)]"
              aria-live="polite"
            >
              {currentLength}/{maxLength}
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

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
