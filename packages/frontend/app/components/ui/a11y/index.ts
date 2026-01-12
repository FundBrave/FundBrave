/**
 * Accessibility Components and Utilities
 *
 * This module exports all accessibility-related components for FundBrave.
 * Import from this index for a clean API surface.
 *
 * @example
 * ```tsx
 * import { SkipLink, VisuallyHidden, LiveRegion } from '@/app/components/ui/a11y';
 * ```
 */

// Skip Link - for bypassing navigation
export { SkipLink, SkipLinks, type SkipLinkProps, type SkipLinksProps } from '../SkipLink';

// Visually Hidden - for screen reader only content
export {
  VisuallyHidden,
  LiveRegion,
  Announcement,
  type VisuallyHiddenProps,
  type LiveRegionProps,
  type AnnouncementProps,
} from '../VisuallyHidden';

// Main Content - semantic landmarks
export {
  MainContent,
  ContentSection,
  AsideContent,
  NavContent,
  FooterContent,
  type MainContentProps,
  type ContentSectionProps,
  type AsideContentProps,
  type NavContentProps,
  type FooterContentProps,
} from '../MainContent';

// Re-export hooks from their location
export { useReducedMotion, useMotionConfig, getReducedMotionValue, REDUCED_MOTION_STYLES } from '@/app/hooks/useReducedMotion';
export { useFocusTrap, useFocusOnMount, useFocusReturn, useArrowKeyNavigation } from '@/app/hooks/useFocusTrap';

// Re-export utilities from accessibility lib
export {
  trapFocus,
  getFocusableElements,
  focusFirstElement,
  announceToScreenReader,
  createScreenReaderOnly,
  handleKeyboardNavigation,
  isTouchTargetAccessible,
  FocusManager,
  createSkipLink,
  isVisibleToScreenReader,
  getAccessibleName,
  type KeyboardNavigationConfig,
} from '@/app/lib/accessibility';
