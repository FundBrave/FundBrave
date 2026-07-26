/**
 * Accessibility Components
 *
 * Trimmed port of packages/frontend/app/components/ui/a11y/index.ts.
 * The frontend version also re-exports hooks (useReducedMotion, useFocusTrap)
 * and lib/accessibility utilities — those were not ported for the MVP scaffold.
 */

// Skip Link - for bypassing navigation
export {
  SkipLink,
  SkipLinks,
  type SkipLinkProps,
  type SkipLinksProps,
} from "../SkipLink";

// Visually Hidden - for screen reader only content
export {
  VisuallyHidden,
  LiveRegion,
  Announcement,
  type VisuallyHiddenProps,
  type LiveRegionProps,
  type AnnouncementProps,
} from "../VisuallyHidden";

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
} from "../MainContent";
