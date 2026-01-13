import { NotFoundPage } from "@/app/components/ui/NotFoundPage";
import { NotFoundIllustration } from "@/app/components/ui/NotFoundIllustration";

/**
 * Generic 404 Not Found Page
 *
 * Design specs from PHASE1_UX_SPECS.md Section 1:
 * - Route: app/not-found.tsx
 * - Priority: Quick Win - First deliverable
 *
 * UX Principles Applied:
 * - Jakob's Law: Follows familiar 404 patterns (Google, GitHub)
 * - Hick's Law: Limited to 2-3 clear actions
 * - Trust Through Design: Professional appearance prevents panic
 * - Progressive Disclosure: Primary actions first, then secondary options
 *
 * Accessibility:
 * - role="main" with aria-labelledby
 * - Screen reader announcement via aria-live="polite"
 * - Auto-focus on primary CTA
 * - All interactive elements tabbable
 * - Reduced motion support via CSS
 *
 * Visual Specs:
 * - Illustration: 220x220px desktop, 180x180px mobile with float animation
 * - Headline: Gilgan, text-2xl (clamp), bold
 * - Subtext: Montserrat, text-base (16px), muted
 * - Primary CTA: Brand gradient button
 * - Quick links: surface-elevated background with hover state
 */

// Quick links configuration - using icon names (strings) for Server Component compatibility
const quickLinks = [
  {
    icon: "search" as const,
    label: "Browse Campaigns",
    href: "/campaigns",
  },
  {
    icon: "users" as const,
    label: "Community",
    href: "/community",
  },
  {
    icon: "help-circle" as const,
    label: "Help Center",
    href: "/help",
  },
];

export default function NotFound() {
  return (
    <NotFoundPage
      variant="generic"
      illustration={<NotFoundIllustration />}
      headline="Page Not Found"
      subtext="The page you're looking for doesn't exist or has been moved."
      primaryAction={{
        label: "Return Home",
        href: "/",
        icon: "home",
      }}
      quickLinks={quickLinks}
    />
  );
}
