import { Loader2 } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

interface SpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Additional class names */
  className?: string;
  /** Color variant - defaults to current text color */
  color?: "white" | "primary" | "current";
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const colorClasses: Record<NonNullable<SpinnerProps["color"]>, string> = {
  white: "text-white", // Keep white for spinners on gradient/primary buttons
  primary: "text-primary",
  current: "", // Inherit from parent
};

/**
 * Unified Spinner component for loading states.
 * Replaces duplicate spinner implementations across the codebase.
 *
 * @example
 * <Spinner size="md" />
 * <Spinner size="sm" color="white" />
 */
export function Spinner({
  size = "md",
  className,
  color = "current",
}: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

export default Spinner;
