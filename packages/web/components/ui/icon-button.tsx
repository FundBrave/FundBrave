import * as React from "react";
import { forwardRef } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label for screen readers (required) */
  ariaLabel: string;
  /** Optional size override; Button supports size='icon' by default */
  size?: React.ComponentProps<typeof Button>["size"];
}

/**
 * IconButton
 *
 * A small, type-safe button intended for single-icon actions. Requires an
 * `ariaLabel` to ensure accessibility. Wraps the base `Button` from `ui/button`.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ ariaLabel, className, children, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        aria-label={ariaLabel}
        title={ariaLabel}
        size={size}
        variant={"ghost"}
        className={cn("p-0 inline-flex items-center justify-center", className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
