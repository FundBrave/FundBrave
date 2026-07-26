"use client";

/**
 * CampaignCard — grid card for the campaigns listing (adapted from the old
 * frontend CampaignCard, simplified for the MVP: no staking/APY/chain pills,
 * no GSAP hover — CSS transitions only).
 *
 * Also exports shared pieces reused by the detail page and dashboard:
 * CampaignImage (next/image with plain-img + gradient fallbacks),
 * CategoryChip, and CATEGORY_ICONS.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type Campaign,
  categoryLabel,
  daysLeft,
  formatUsd,
  progressPercent,
} from "@/lib/campaigns";
import {
  Cat,
  Clock,
  CloudOff,
  GraduationCap,
  Grid3X3,
  Heart,
  Laptop,
  Leaf,
  Rocket,
  Sparkles,
  Trophy,
  Users,
} from "@/components/ui/icons";
import type { IconComponent } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";

// ============================================================================
// Category icons (slugs match lib/campaigns CATEGORIES)
// ============================================================================

export const CATEGORY_ICONS: Record<string, IconComponent> = {
  education: GraduationCap,
  health: Heart,
  "disaster-relief": CloudOff,
  community: Users,
  environment: Leaf,
  animals: Cat,
  arts: Sparkles,
  technology: Laptop,
  sports: Trophy,
  other: Grid3X3,
};

export function CategoryChip({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category] ?? Grid3X3;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm",
        className
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {categoryLabel(category)}
    </span>
  );
}

// ============================================================================
// Image with graceful fallbacks
// ============================================================================

/** Hosts allowed by next.config.ts remotePatterns. */
export function isNextImageHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      /\.amazonaws\.com$/.test(host) ||
      host === "picsum.photos" ||
      host === "images.unsplash.com" ||
      host === "api.dicebear.com"
    );
  } catch {
    return false;
  }
}

export function MediaPlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "bg-[linear-gradient(135deg,var(--primary-800)_0%,var(--purple-700)_55%,var(--soft-purple-700)_100%)]",
        className
      )}
    >
      <Rocket size={40} className="text-white/40" />
    </div>
  );
}

export interface CampaignImageProps {
  src: string;
  alt: string;
  /** next/image `sizes` hint — required for the fill layout to stay cheap. */
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Renders inside a `relative` parent. Uses next/image for allowed hosts,
 * falls back to a plain <img> for unknown hosts, and a gradient placeholder
 * when the image fails entirely.
 */
export function CampaignImage({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
  priority = false,
}: CampaignImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <MediaPlaceholder />;

  if (!isNextImageHost(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          className
        )}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

/** First IMAGE by order, or null. */
export function coverImage(campaign: Campaign): string | null {
  const image = [...campaign.media]
    .sort((a, b) => a.order - b.order)
    .find((m) => m.type === "IMAGE");
  return image?.url ?? null;
}

// ============================================================================
// Progress bar
// ============================================================================

export function CampaignProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-white/10",
        className
      )}
    >
      <div
        className="bg-progress-gradient h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ============================================================================
// Card
// ============================================================================

export interface CampaignCardProps {
  campaign: Campaign;
  className?: string;
  /** Set on above-the-fold cards to preload their cover. */
  priority?: boolean;
}

export function CampaignCard({
  campaign,
  className,
  priority = false,
}: CampaignCardProps) {
  const cover = coverImage(campaign);
  const percent = progressPercent(campaign.raisedUsd, campaign.goalUsd);
  const remaining = daysLeft(campaign.deadline);

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      aria-label={`View campaign: ${campaign.title}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated",
        "transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        className
      )}
    >
      {/* Cover */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-surface-sunken sm:h-48">
        {cover ? (
          <CampaignImage
            src={cover}
            alt=""
            priority={priority}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <MediaPlaceholder />
        )}
        <div className="absolute top-3 left-3">
          <CategoryChip category={campaign.category} />
        </div>
        {campaign.status !== "ACTIVE" && (
          <span className="absolute top-3 right-3 rounded-full border border-brave-amber/40 bg-black/60 px-2.5 py-1 text-xs font-semibold text-brave-amber backdrop-blur-sm">
            {campaign.status === "DRAFT" ? "Draft" : campaign.status}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-base leading-snug font-semibold text-foreground">
          {campaign.title}
        </h3>

        <div className="mt-auto flex flex-col gap-2">
          <CampaignProgressBar percent={percent} />

          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-foreground">
              {formatUsd(campaign.raisedUsd)}
              <span className="ml-1 font-normal text-text-tertiary">
                raised
              </span>
            </span>
            <span className="text-text-secondary">
              of {formatUsd(campaign.goalUsd)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
            <span>
              {campaign.donorsCount.toLocaleString()}{" "}
              {campaign.donorsCount === 1 ? "donor" : "donors"}
            </span>
            {remaining !== null && (
              <span className="inline-flex items-center gap-1 text-brave-amber">
                <Clock size={12} aria-hidden="true" />
                {remaining === 0 ? "Ended" : `${remaining}d left`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

export function CampaignCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated",
        className
      )}
    >
      <Skeleton variant="rectangular" className="h-44 w-full sm:h-48" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton variant="text" className="h-5 w-full" />
        <Skeleton variant="text" className="h-5 w-2/3" />
        <Skeleton variant="rounded" className="h-1.5 w-full" />
        <div className="flex justify-between">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export default CampaignCard;
