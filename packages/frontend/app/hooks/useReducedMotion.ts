'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useReducedMotion - Hook to detect user's motion preference
 *
 * Returns true if the user has enabled "reduce motion" in their system settings.
 * This is essential for accessibility - some users experience motion sickness,
 * vestibular disorders, or simply prefer less animation.
 *
 * WCAG 2.2 AA Compliance:
 * - Success Criterion 2.3.3 (Animation from Interactions)
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={{
 *         x: prefersReducedMotion ? 0 : 100,
 *         opacity: 1,
 *       }}
 *       transition={{
 *         duration: prefersReducedMotion ? 0 : 0.3,
 *       }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With GSAP
 * function GSAPAnimation() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   useEffect(() => {
 *     if (prefersReducedMotion) {
 *       gsap.set(element, { opacity: 1 }); // Skip animation
 *     } else {
 *       gsap.to(element, { opacity: 1, duration: 0.5 });
 *     }
 *   }, [prefersReducedMotion]);
 * }
 * ```
 *
 * @returns boolean - true if user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
  // Default to false, but will update on client
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if matchMedia is available (client-side only)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // Create media query for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Handler for preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for changes
    // Use addEventListener for modern browsers, fallback for older ones
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * useMotionConfig - Get animation configuration based on motion preference
 *
 * Returns appropriate duration and transition settings based on the user's
 * motion preference. Useful for creating accessible animations that respect
 * user settings.
 *
 * @example
 * ```tsx
 * function FadeInComponent() {
 *   const { duration, transition, shouldAnimate } = useMotionConfig();
 *
 *   return (
 *     <motion.div
 *       initial={{ opacity: 0 }}
 *       animate={{ opacity: 1 }}
 *       transition={{ duration, ...transition }}
 *     >
 *       {shouldAnimate ? 'Animating...' : 'Static'}
 *     </motion.div>
 *   );
 * }
 * ```
 */
export interface MotionConfig {
  /** Whether animations should play */
  shouldAnimate: boolean;
  /** Recommended duration (0 for reduced motion) */
  duration: number;
  /** Base transition config for motion/react */
  transition: {
    duration: number;
    ease: string;
  };
  /** Get duration with fallback */
  getDuration: (defaultDuration: number) => number;
  /** Get animation values with fallback */
  getAnimation: <T>(animated: T, static_: T) => T;
}

export function useMotionConfig(): MotionConfig {
  const prefersReducedMotion = useReducedMotion();

  const getDuration = useCallback(
    (defaultDuration: number): number => {
      return prefersReducedMotion ? 0 : defaultDuration;
    },
    [prefersReducedMotion]
  );

  const getAnimation = useCallback(
    <T,>(animated: T, static_: T): T => {
      return prefersReducedMotion ? static_ : animated;
    },
    [prefersReducedMotion]
  );

  return {
    shouldAnimate: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 0.3,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
      ease: 'easeOut',
    },
    getDuration,
    getAnimation,
  };
}

/**
 * getReducedMotionValue - SSR-safe utility for getting motion preference
 *
 * Use this in non-hook contexts or for initial server rendering.
 * Always returns false on the server (conservative approach).
 *
 * @example
 * ```tsx
 * // In a utility function
 * const animationDuration = getReducedMotionValue() ? 0 : 300;
 * ```
 */
export function getReducedMotionValue(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * REDUCED_MOTION_STYLES - CSS custom properties for reduced motion
 *
 * Use these in CSS-in-JS solutions when you need to conditionally
 * apply styles based on motion preference.
 *
 * @example
 * ```tsx
 * const styles = prefersReducedMotion
 *   ? REDUCED_MOTION_STYLES.static
 *   : REDUCED_MOTION_STYLES.animated;
 * ```
 */
export const REDUCED_MOTION_STYLES = {
  animated: {
    transitionDuration: 'var(--duration-base, 240ms)',
    animationDuration: 'var(--duration-base, 240ms)',
    animationPlayState: 'running',
  },
  static: {
    transitionDuration: '0ms',
    animationDuration: '0ms',
    animationPlayState: 'paused',
  },
} as const;

export default useReducedMotion;
