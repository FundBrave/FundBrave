"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface TokenSwatchProps {
  /** The type of design token being visualized */
  variant: "color" | "spacing" | "shadow" | "radius";
  /** Human-readable token name (e.g. "primary-500") */
  name: string;
  /** Raw value of the token (e.g. "#450cf0", "1rem", "0 4px 16px ...") */
  value: string;
  /** CSS custom property name to copy (e.g. "--color-primary-500") */
  cssVar?: string;
  /** Additional className for the outer container */
  className?: string;
}

/**
 * TokenSwatch -- renders a visual preview of a design token with its metadata.
 * Supports color, spacing, shadow, and border-radius token types.
 * Clicking copies the CSS variable to the clipboard.
 */
export function TokenSwatch({
  variant,
  name,
  value,
  cssVar,
  className,
}: TokenSwatchProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyValue = cssVar ? `var(${cssVar})` : value;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = copyValue;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [copyValue]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-3 p-3 w-full rounded-lg",
        "bg-surface-elevated border border-border-subtle",
        "text-left transition-all duration-[var(--duration-fast)]",
        "hover:border-border-emphasis hover:bg-white/[0.04]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "group cursor-pointer",
        className
      )}
      aria-label={`Copy ${cssVar ?? name} to clipboard`}
      title={`Click to copy: ${copyValue}`}
    >
      {/* Visual preview */}
      <TokenPreview variant={variant} value={value} />

      {/* Text info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {name}
        </p>
        <p className="text-xs text-text-tertiary truncate">
          {value}
        </p>
        {cssVar && (
          <p className="text-xs text-primary/70 font-mono truncate mt-0.5">
            {cssVar}
          </p>
        )}
      </div>

      {/* Copy indicator */}
      <div className="shrink-0 text-text-tertiary group-hover:text-text-secondary transition-colors">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Token Preview sub-component                                                */
/* -------------------------------------------------------------------------- */

interface TokenPreviewProps {
  variant: TokenSwatchProps["variant"];
  value: string;
}

function TokenPreview({ variant, value }: TokenPreviewProps) {
  switch (variant) {
    case "color":
      return (
        <span
          className="h-10 w-10 shrink-0 rounded-lg border border-white/10"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      );

    case "spacing":
      return (
        <div
          className="flex h-10 w-10 shrink-0 items-end justify-center"
          aria-hidden="true"
        >
          <div
            className="rounded-sm bg-primary"
            style={{
              width: value,
              height: "6px",
              minWidth: "4px",
              maxWidth: "40px",
            }}
          />
        </div>
      );

    case "shadow":
      return (
        <div
          className="h-10 w-10 shrink-0 rounded-lg bg-white/90"
          style={{ boxShadow: value }}
          aria-hidden="true"
        />
      );

    case "radius":
      return (
        <div
          className="h-10 w-10 shrink-0 border-2 border-primary bg-primary/10"
          style={{ borderRadius: value }}
          aria-hidden="true"
        />
      );

    default:
      return null;
  }
}

export default TokenSwatch;
