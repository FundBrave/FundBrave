import { NotFoundPage } from "@/app/components/ui/NotFoundPage";
import { CampaignNotFoundIllustration } from "./CampaignNotFoundIllustration";

/**
 * Campaign Not Found (404) Page
 *
 * Design specs from PHASE3_UX_SPECS.md section 4:
 * - Contextual illustration (empty donation box with search theme)
 * - Clear "Campaign Not Found" message
 * - Primary CTA: "Explore Active Campaigns" -> /campaigns
 * - Secondary action: "Go Home" -> /
 * - Quick links: Browse Campaigns, Discover, Help Center
 *
 * Recovery goal: >70% of users finding valid content after 404
 */

const quickLinks = [
  {
    icon: "search" as const,
    label: "Browse Campaigns",
    href: "/campaigns",
  },
  {
    icon: "compass" as const,
    label: "Discover",
    href: "/",
  },
  {
    icon: "help-circle" as const,
    label: "Help Center",
    href: "/help",
  },
];

export default function CampaignNotFound() {
  return (
    <NotFoundPage
      variant="campaign"
      illustration={<CampaignNotFoundIllustration />}
      headline="Campaign Not Found"
      subtext="This campaign may have ended, been removed, or the link might be incorrect."
      primaryAction={{
        label: "Explore Active Campaigns",
        href: "/campaigns",
        icon: "search",
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/",
      }}
      quickLinks={quickLinks}
    />
  );
}
