import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";

/**
 * FundBrave Alert Primitive
 *
 * A banner for displaying contextual messages with variant-appropriate
 * icons, optional title, and close button.
 * Follows the same CVA + forwardRef pattern as Button.
 */

const alertVariants = cva(
  // Base styles
  [
    "relative flex gap-3 rounded-[var(--radius-lg)] p-4",
    "border",
    "text-sm",
  ],
  {
    variants: {
      variant: {
        info: "border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]",
        success:
          "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]",
        warning:
          "border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const defaultIcons: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Alert title (rendered in bold above the description) */
  title?: string;
  /** Custom icon to override the default variant icon */
  icon?: React.ReactNode;
  /** Callback when the close button is clicked */
  onClose?: () => void;
  /** Description content */
  children: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      icon,
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedVariant = variant ?? "info";
    const DefaultIcon = defaultIcons[resolvedVariant];
    const semanticRole =
      resolvedVariant === "destructive" || resolvedVariant === "warning"
        ? "alert"
        : "status";

    return (
      <div
        ref={ref}
        role={semanticRole}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {/* Icon */}
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          {icon ?? <DefaultIcon className="h-4 w-4" />}
        </span>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {title && (
            <p className="font-medium leading-tight">{title}</p>
          )}
          <div className="text-sm opacity-90">{children}</div>
        </div>

        {/* Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex shrink-0 rounded-[var(--radius-sm)] p-0.5",
              "opacity-70 hover:opacity-100",
              "transition-opacity duration-[var(--duration-fast)]",
              "focus:outline-none focus:ring-2 focus:ring-current/30"
            )}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export { Alert, alertVariants };
