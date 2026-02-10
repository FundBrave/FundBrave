import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * FundBrave Select Primitive
 *
 * A native HTML select wrapper with consistent styling, variant support,
 * and error states. Follows the same CVA + forwardRef pattern as Button.
 */

const selectVariants = cva(
  // Base styles
  [
    "flex w-full appearance-none rounded-[var(--radius-lg)] text-white",
    "bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat",
    // Chevron-down SVG as data URI (white, 16x16)
    "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.5)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
    "pr-10",
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
        sm: "h-9 pl-3 text-sm",
        md: "h-11 pl-4 text-base",
        lg: "h-12 pl-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  /** Whether the select is in an error state */
  error?: boolean;
  /** Error message displayed below the select */
  errorMessage?: string;
  /** Placeholder text shown as a disabled first option */
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      variant,
      size,
      error,
      errorMessage,
      placeholder,
      children,
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
        <select
          id={id}
          ref={ref}
          aria-invalid={ariaInvalid ?? (error ? true : undefined)}
          aria-describedby={
            [ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            selectVariants({ variant, size }),
            error &&
              "border-destructive focus:ring-destructive/30 focus:border-destructive",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
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

Select.displayName = "Select";

export { Select, selectVariants };
