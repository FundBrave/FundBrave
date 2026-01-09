/**
 * Shared animation constants for consistent motion across the app
 * Matches CSS variables in globals.css
 */

// Easing curves - match CSS variables from globals.css
export const EASE = {
  /** Standard material design ease - cubic-bezier(0.4, 0, 0.2, 1) */
  standard: [0.4, 0, 0.2, 1] as const,
  /** Snappy, quick feel - cubic-bezier(0.2, 0, 0, 1) */
  snappy: [0.2, 0, 0, 1] as const,
  /** Fluid, smooth feel - cubic-bezier(0.3, 0, 0, 1) */
  fluid: [0.3, 0, 0, 1] as const,
  /** Organic flow - smooth, natural feel */
  organic: [0.32, 0.72, 0, 1] as const,
} as const;

// Legacy export for backwards compatibility
export const EASE_ORGANIC = EASE.organic;

// Common durations (in seconds)
export const DURATION = {
  quick: 0.12,
  fast: 0.18,
  normal: 0.3,
  medium: 0.4,
  slow: 0.6,
} as const;

// Page transition presets
export const PAGE_TRANSITION = {
  fade: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: DURATION.normal, ease: EASE.snappy },
  },
  slideRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.35, ease: EASE.snappy },
  },
} as const;
