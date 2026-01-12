"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";

/**
 * NotFoundPage - Reusable base component for 404 pages
 *
 * Design specs from PHASE1_UX_SPECS.md:
 * - Supports variants: generic, campaign, profile
 * - Primary CTA with gradient button
 * - Optional secondary action and quick links
 * - Full accessibility support
 * - Mobile-responsive layout
 */

// Icon name type for serializable props (Server -> Client safe)
type IconName = "home" | "search" | "users" | "help-circle" | "arrow-left" | "compass";

// Inline SVG icons - hand-crafted, optimized, accessible
// Using 24x24 viewBox, stroke-based design, currentColor for theming
const icons: Record<IconName, React.ReactNode> = {
  home: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  search: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  users: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  "help-circle": (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  "arrow-left": (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  compass: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
};

// Helper to get icon by name
function getIcon(name: IconName): React.ReactNode {
  return icons[name] || null;
}

interface QuickLink {
  icon: IconName;
  label: string;
  href: string;
}

export interface NotFoundPageProps {
  /** Variant type for contextual 404 pages */
  variant?: "generic" | "campaign" | "profile";
  /** Illustration component to display */
  illustration: React.ReactNode;
  /** Main headline text */
  headline: string;
  /** Supporting subtext message */
  subtext: string;
  /** Primary call-to-action */
  primaryAction: {
    label: string;
    href: string;
    icon?: IconName;
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    href: string;
  };
  /** Optional quick navigation links */
  quickLinks?: readonly QuickLink[];
  /** Additional className for container */
  className?: string;
}

export function NotFoundPage({
  variant = "generic",
  illustration,
  headline,
  subtext,
  primaryAction,
  secondaryAction,
  quickLinks,
  className,
}: NotFoundPageProps) {
  // Ref for focus management - auto-focus primary CTA on mount
  const primaryCTARef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    // Auto-focus primary CTA for accessibility
    // Small delay to ensure animation completes
    const timer = setTimeout(() => {
      primaryCTARef.current?.focus();
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      role="main"
      aria-labelledby="not-found-heading"
      className={cn(
        // Layout: centered, full height minus header
        "flex min-h-[calc(100vh-80px)] flex-col items-center justify-center",
        // Spacing: mobile vs desktop padding
        "px-4 py-16 md:px-8 md:py-24",
        // Animation: page fade-in on mount
        "animate-page-fade-in",
        className
      )}
    >
      {/* Screen reader announcement - live region for immediate feedback */}
      <div role="status" aria-live="polite" className="sr-only">
        Page not found. Use the links below to navigate.
      </div>

      {/* Illustration with float animation */}
      <div className="mb-8 animate-float" aria-hidden="true">
        {illustration}
      </div>

      {/* Headline - Gilgan font, text-2xl clamp, bold */}
      <h1
        id="not-found-heading"
        className="mb-2 text-center font-display text-2xl font-bold text-foreground"
      >
        {headline}
      </h1>

      {/* Subtext - Montserrat, text-base (16px), muted color */}
      <p className="mb-8 max-w-md text-center font-alt text-base leading-normal text-muted-foreground">
        {subtext}
      </p>

      {/* Primary CTA - Brand gradient button */}
      <Button
        asChild
        size="lg"
        variant="primary"
        className="mb-8 min-h-[44px] min-w-[200px]"
      >
        <Link
          href={primaryAction.href}
          ref={primaryCTARef}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {primaryAction.icon && (
            <span className="mr-2">{getIcon(primaryAction.icon)}</span>
          )}
          {primaryAction.label}
        </Link>
      </Button>

      {/* Secondary Action (optional) */}
      {secondaryAction && (
        <Link
          href={secondaryAction.href}
          className="mb-8 min-h-[44px] inline-flex items-center font-alt text-sm font-medium text-text-secondary underline-offset-4 transition-all hover:text-primary hover:underline active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {secondaryAction.label}
        </Link>
      )}

      {/* Quick Links Section */}
      {quickLinks && quickLinks.length > 0 && (
        <nav aria-label="Quick navigation links">
          {/* Divider with label */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px w-12 bg-border" aria-hidden="true" />
            <span className="font-alt text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Quick Links
            </span>
            <div className="h-px w-12 bg-border" aria-hidden="true" />
          </div>

          {/* Quick link buttons */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  // Base styles
                  "inline-flex items-center gap-2 rounded-xl px-4 py-3",
                  // Touch target compliance (44px min height)
                  "min-h-[44px]",
                  // Background and hover states
                  "bg-surface-elevated transition-all hover:bg-surface-overlay active:scale-[0.98]",
                  // Typography
                  "font-alt text-sm font-medium text-text-secondary",
                  // Focus styles for accessibility
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                <span className="text-primary">{getIcon(link.icon)}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </main>
  );
}

export default NotFoundPage;
