import { NotFoundPage } from "@/app/components/ui/NotFoundPage";
import { ProfileNotFoundIllustration } from "./ProfileNotFoundIllustration";

/**
 * Profile Not Found (404) Page
 *
 * Design specs from PHASE3_UX_SPECS.md section 5:
 * - Profile-themed illustration (avatar silhouette with question mark)
 * - Clear "User Not Found" message
 * - Primary CTA: "Browse Community" -> /community
 * - Secondary action: "Go Home" -> /
 * - Quick links: Browse Community, Find Campaigns, Help Center
 *
 * Recovery goal: >65% of users clicking CTA after 404
 */

const quickLinks = [
  {
    icon: "users" as const,
    label: "Browse Community",
    href: "/community",
  },
  {
    icon: "search" as const,
    label: "Find Campaigns",
    href: "/campaigns",
  },
  {
    icon: "help-circle" as const,
    label: "Help Center",
    href: "/help",
  },
];

export default function ProfileNotFound() {
  return (
    <NotFoundPage
      variant="profile"
      illustration={<ProfileNotFoundIllustration />}
      headline="User Not Found"
      subtext="This profile doesn't exist or may have been deactivated."
      primaryAction={{
        label: "Browse Community",
        href: "/community",
        icon: "users",
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/",
      }}
      quickLinks={quickLinks}
    />
  );
}
