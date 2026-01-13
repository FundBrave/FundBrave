"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/**
 * Inline SVG Icons - following NotFoundPage pattern
 * Hand-crafted, optimized, accessible social media icons
 */
const socialIcons = {
  twitter: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
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
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  linkedin: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  github: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  chevronDown: (
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
}

export interface SocialLinksGroupProps {
  /** Current social links values */
  value: SocialLinks;
  /** Change handler */
  onChange: (value: SocialLinks) => void;
  /** Validation errors keyed by social platform */
  errors?: Partial<Record<keyof SocialLinks, string>>;
  /** Whether inputs are disabled */
  disabled?: boolean;
  /** Initially collapsed on mobile */
  defaultCollapsed?: boolean;
}

interface SocialInputConfig {
  key: keyof SocialLinks;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  prefix?: string;
  helpText: string;
}

const socialConfigs: SocialInputConfig[] = [
  {
    key: "twitter",
    label: "X (Twitter)",
    icon: socialIcons.twitter,
    placeholder: "username",
    prefix: "@",
    helpText: "Your X/Twitter handle without the @",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: socialIcons.instagram,
    placeholder: "username",
    prefix: "@",
    helpText: "Your Instagram handle without the @",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: socialIcons.linkedin,
    placeholder: "https://linkedin.com/in/username",
    helpText: "Full URL to your LinkedIn profile",
  },
  {
    key: "github",
    label: "GitHub",
    icon: socialIcons.github,
    placeholder: "username",
    helpText: "Your GitHub username",
  },
];

/**
 * SocialLinksGroup - Grouped social media input fields
 *
 * Features:
 * - Collapsible accordion on mobile
 * - Platform-specific icons and prefixes
 * - Error states with animations
 * - Meets 44px minimum touch targets
 */
export function SocialLinksGroup({
  value,
  onChange,
  errors = {},
  disabled = false,
  defaultCollapsed = true,
}: SocialLinksGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Animate content height on collapse/expand
  useEffect(() => {
    if (contentRef.current) {
      if (isCollapsed) {
        gsap.to(contentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.25,
          ease: "power2.inOut",
        });
      } else {
        gsap.to(contentRef.current, {
          height: "auto",
          opacity: 1,
          duration: 0.25,
          ease: "power2.inOut",
        });
      }
    }
  }, [isCollapsed]);

  const handleInputChange = (key: keyof SocialLinks, newValue: string) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  // Shake animation for error
  const shakeInput = (key: string) => {
    const input = inputRefs.current.get(key);
    if (input) {
      gsap.to(input, {
        keyframes: [
          { x: -6, duration: 0.05 },
          { x: 6, duration: 0.05 },
          { x: -4, duration: 0.05 },
          { x: 4, duration: 0.05 },
          { x: -2, duration: 0.05 },
          { x: 2, duration: 0.05 },
          { x: 0, duration: 0.05 },
        ],
        ease: "power2.inOut",
      });
    }
  };

  // Trigger shake when error appears
  useEffect(() => {
    Object.keys(errors).forEach((key) => {
      if (errors[key as keyof SocialLinks]) {
        shakeInput(key);
      }
    });
  }, [errors]);

  const filledCount = Object.values(value).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Collapsible header - only on mobile */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "flex items-center justify-between w-full p-3 rounded-xl",
          "bg-surface-sunken/50 border border-white/10",
          "transition-all duration-200",
          "hover:bg-surface-overlay",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "min-h-[44px]",
          "md:hidden" // Only show collapse on mobile
        )}
        aria-expanded={!isCollapsed}
        aria-controls="social-links-content"
      >
        <span className="text-sm font-medium text-foreground">
          Social Links
          {filledCount > 0 && (
            <span className="ml-2 text-xs text-text-tertiary">
              ({filledCount} added)
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="text-text-secondary"
        >
          {socialIcons.chevronDown}
        </motion.span>
      </button>

      {/* Content wrapper for animation */}
      <div
        ref={contentRef}
        id="social-links-content"
        className={cn(
          "overflow-hidden",
          // On desktop, always show (no collapse)
          "md:!h-auto md:!opacity-100"
        )}
        style={{
          height: defaultCollapsed ? 0 : "auto",
          opacity: defaultCollapsed ? 0 : 1,
        }}
      >
        <div className="flex flex-col gap-4">
          {socialConfigs.map((config) => {
            const hasError = !!errors[config.key];
            const inputValue = value[config.key] || "";

            return (
              <div key={config.key} className="flex flex-col gap-2">
                {/* Label */}
                <label
                  htmlFor={`social-${config.key}`}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <span className="text-text-secondary">{config.icon}</span>
                  {config.label}
                </label>

                {/* Input container */}
                <div className="relative">
                  {config.prefix && (
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      {config.prefix}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      if (el) inputRefs.current.set(config.key, el);
                    }}
                    id={`social-${config.key}`}
                    type={config.key === "linkedin" ? "url" : "text"}
                    value={inputValue}
                    onChange={(e) =>
                      handleInputChange(config.key, e.target.value)
                    }
                    placeholder={config.placeholder}
                    disabled={disabled}
                    aria-invalid={hasError}
                    aria-describedby={
                      hasError ? `social-${config.key}-error` : undefined
                    }
                    className={cn(
                      // Base styles
                      "w-full bg-surface-sunken rounded-xl",
                      config.prefix ? "pl-8 pr-4" : "px-4",
                      "py-3",
                      // Typography
                      "text-foreground placeholder:text-text-tertiary",
                      // Border and focus
                      "border outline-none",
                      "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                      // Transitions
                      "transition-all duration-200",
                      // Touch target (44px min height)
                      "min-h-[44px]",
                      // States
                      hasError
                        ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
                        : "border-white/10",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Error or help text */}
                <AnimatePresence mode="wait">
                  {hasError ? (
                    <motion.p
                      key="error"
                      id={`social-${config.key}-error`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors[config.key]}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="help"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-text-tertiary"
                    >
                      {config.helpText}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SocialLinksGroup;
