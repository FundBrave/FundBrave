"use client";

import { NotFoundPage } from "@/app/components/ui/NotFoundPage";
import type { PlaygroundConfig } from "../types";

/* ------------------------------------------------------------------ */
/*  Variant presets mirroring real FundBrave 404 scenarios              */
/* ------------------------------------------------------------------ */

type IconName = "home" | "search" | "users" | "help-circle" | "compass";

const variantPresets: Record<
  "generic" | "campaign" | "profile",
  {
    headline: string;
    subtext: string;
    primaryAction: {
      label: string;
      href: string;
      icon?: IconName;
    };
    secondaryAction?: { label: string; href: string };
    quickLinks: readonly {
      icon: IconName;
      label: string;
      href: string;
    }[];
  }
> = {
  generic: {
    headline: "Page Not Found",
    subtext:
      "The page you are looking for does not exist or has been moved. Let us help you find your way back.",
    primaryAction: { label: "Back to Home", href: "/", icon: "home" },
    secondaryAction: { label: "Browse Campaigns", href: "/campaigns" },
    quickLinks: [
      { icon: "search", label: "Search", href: "/search" },
      { icon: "compass", label: "Explore", href: "/campaigns" },
      { icon: "help-circle", label: "Help", href: "/help" },
    ],
  },
  campaign: {
    headline: "Campaign Not Found",
    subtext:
      "This campaign may have ended, been removed, or the link might be incorrect. Discover other campaigns to support.",
    primaryAction: {
      label: "Explore Campaigns",
      href: "/campaigns",
      icon: "search",
    },
    secondaryAction: { label: "Return Home", href: "/" },
    quickLinks: [
      {
        icon: "compass",
        label: "Trending",
        href: "/campaigns?sort=trending",
      },
      { icon: "users", label: "Community", href: "/community" },
      { icon: "help-circle", label: "Help", href: "/help" },
    ],
  },
  profile: {
    headline: "Profile Not Found",
    subtext:
      "This user profile does not exist or may have been deactivated. Connect with other members of the FundBrave community.",
    primaryAction: {
      label: "View Community",
      href: "/community",
      icon: "users",
    },
    secondaryAction: { label: "Return Home", href: "/" },
    quickLinks: [
      {
        icon: "search",
        label: "Search Users",
        href: "/search?type=users",
      },
      { icon: "compass", label: "Campaigns", href: "/campaigns" },
      { icon: "help-circle", label: "Help", href: "/help" },
    ],
  },
};

/**
 * Placeholder illustration for the playground preview.
 * In production each variant uses a dedicated illustration asset.
 */
function PlaceholderIllustration() {
  return (
    <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-white/10 bg-primary/10">
      <span className="text-4xl font-bold text-primary/60">404</span>
    </div>
  );
}

/**
 * NotFoundPageDemo - Wraps the full-page component in a scaled, scrollable
 * container so it fits within the playground preview area.
 */
function NotFoundPageDemo(props: {
  variant: "generic" | "campaign" | "profile";
}) {
  const preset = variantPresets[props.variant];

  return (
    <div className="flex flex-col gap-4">
      {/* Scaled container */}
      <div className="max-h-[500px] overflow-auto rounded-xl border border-white/10">
        <div
          style={{ transform: "scale(0.6)", transformOrigin: "top center" }}
        >
          <NotFoundPage
            variant={props.variant}
            illustration={<PlaceholderIllustration />}
            headline={preset.headline}
            subtext={preset.subtext}
            primaryAction={preset.primaryAction}
            secondaryAction={preset.secondaryAction}
            quickLinks={preset.quickLinks}
          />
        </div>
      </div>

      {/* Variant info */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Variant: {props.variant}
        </p>
        <ul className="space-y-1 text-xs text-text-tertiary">
          <li>
            <strong className="text-text-secondary">Headline:</strong>{" "}
            {preset.headline}
          </li>
          <li>
            <strong className="text-text-secondary">Primary CTA:</strong>{" "}
            {preset.primaryAction.label}
          </li>
          {preset.secondaryAction && (
            <li>
              <strong className="text-text-secondary">Secondary CTA:</strong>{" "}
              {preset.secondaryAction.label}
            </li>
          )}
          <li>
            <strong className="text-text-secondary">Quick Links:</strong>{" "}
            {preset.quickLinks.map((l) => l.label).join(", ")}
          </li>
        </ul>
      </div>
    </div>
  );
}

const notFoundPagePlayground: PlaygroundConfig = {
  componentName: "NotFoundPage",
  importPath: "@/app/components/ui/NotFoundPage",
  defaultChildren: undefined,
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["generic", "campaign", "profile"],
      defaultValue: "generic",
    },
  ],
  renderPreview: (props) => (
    <NotFoundPageDemo
      variant={props.variant as "generic" | "campaign" | "profile"}
    />
  ),
};

export default notFoundPagePlayground;
