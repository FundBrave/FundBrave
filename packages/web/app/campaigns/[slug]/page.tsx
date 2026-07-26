"use client";

/**
 * /campaigns/[slug] — campaign detail: media gallery, story, stats card,
 * the donation flow (wallet + address/QR), recent donations, and per-chain
 * raised breakdown. Campaign/donations/breakdown queries poll every 30s on
 * this page so totals stay live. Draft owners get a banner with
 * Edit/Publish actions.
 */

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import {
  type CampaignDetail,
  type CampaignMedia,
  daysLeft,
  formatUsd,
  progressPercent,
} from "@/lib/campaigns";
import { useCampaign, usePublishCampaign } from "@/hooks/useCampaigns";
import {
  CampaignImage,
  CampaignProgressBar,
  CategoryChip,
  MediaPlaceholder,
} from "@/components/campaigns/CampaignCard";
import { DonatePanel } from "@/components/donate/DonatePanel";
import { DonationsList } from "@/components/donate/DonationsList";
import { RaisedBreakdown } from "@/components/donate/RaisedBreakdown";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Clock, PencilLine, Play, Share2 } from "@/components/ui/icons";

/** Live-totals polling interval for campaign/donations/breakdown queries. */
const POLL_INTERVAL_MS = 30_000;

// ============================================================================
// Media gallery
// ============================================================================

function MediaGallery({
  media,
  title,
}: {
  media: CampaignMedia[];
  title: string;
}) {
  const sorted = [...media].sort((a, b) => a.order - b.order);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[Math.min(activeIndex, sorted.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      {/* Main viewer */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-sunken">
        {!active ? (
          <MediaPlaceholder />
        ) : active.type === "VIDEO" ? (
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          />
        ) : (
          <CampaignImage
            src={active.url}
            alt={title}
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div
          className="scrollbar-hidden flex gap-2 overflow-x-auto pb-1"
          role="listbox"
          aria-label="Campaign media"
        >
          {sorted.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              aria-label={`View media ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {item.type === "VIDEO" ? (
                <span className="flex h-full w-full items-center justify-center bg-black/70">
                  <Play size={18} className="text-white" aria-hidden="true" />
                </span>
              ) : (
                <CampaignImage src={item.url} alt="" sizes="96px" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Stats + donate panel
// ============================================================================

function StatsCard({ campaign }: { campaign: CampaignDetail }) {
  const percent = progressPercent(campaign.raisedUsd, campaign.goalUsd);
  const remaining = daysLeft(campaign.deadline);

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-surface-elevated p-5 sm:p-6 lg:sticky lg:top-24">
      <div>
        <p className="text-3xl font-bold text-foreground">
          {formatUsd(campaign.raisedUsd)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          raised of {formatUsd(campaign.goalUsd)} goal
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <CampaignProgressBar percent={percent} className="h-2" />
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>{Math.round(percent)}% funded</span>
          <span>
            {campaign.donorsCount.toLocaleString()}{" "}
            {campaign.donorsCount === 1 ? "donor" : "donors"}
          </span>
        </div>
      </div>

      {remaining !== null && (
        <p className="inline-flex items-center gap-1.5 text-sm text-brave-amber">
          <Clock size={16} aria-hidden="true" />
          {remaining === 0
            ? "This campaign has ended"
            : `${remaining} day${remaining === 1 ? "" : "s"} left`}
        </p>
      )}

      {/* Donate flow (phase 3): wallet payments + address/QR fallback */}
      {campaign.status === "ACTIVE" && campaign.safeAddress ? (
        <>
          <DonatePanel
            campaignId={campaign.id}
            safeAddress={campaign.safeAddress}
          />
          <RaisedBreakdown
            campaignId={campaign.id}
            pollIntervalMs={POLL_INTERVAL_MS}
          />
        </>
      ) : campaign.status === "DRAFT" ? (
        <p className="rounded-xl border border-white/10 bg-surface-sunken p-4 text-sm text-text-tertiary">
          This campaign has not been published yet.
        </p>
      ) : null}
    </aside>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

function DetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" aria-busy="true">
      <Skeleton variant="text" className="h-9 w-3/4" />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rounded" className="aspect-video w-full" />
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="h-11 w-11" />
            <Skeleton variant="text" className="h-4 w-40" />
          </div>
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-2/3" />
        </div>
        <Skeleton variant="rounded" className="h-72 w-full" />
      </div>
    </main>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function CampaignDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : undefined;
  const router = useRouter();
  const { showToast } = useToast();

  const { data: campaign, isLoading, error, refetch } = useCampaign(slug, {
    refetchInterval: POLL_INTERVAL_MS,
  });
  const publishMutation = usePublishCampaign();

  if (error instanceof ApiError && error.status === 404) {
    notFound();
  }

  if (isLoading || !campaign) {
    if (error) {
      return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="max-w-sm text-text-secondary">
            We could not load this campaign. The API may be unavailable.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </main>
      );
    }
    return <DetailSkeleton />;
  }

  const creatorName =
    campaign.creator?.displayName ||
    (campaign.creator?.username ? `@${campaign.creator.username}` : null);

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: campaign.title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard", "success", 2500);
    } catch {
      showToast("Could not copy the link", "error");
    }
  };

  const handlePublish = async () => {
    try {
      const published = await publishMutation.mutateAsync(campaign.id);
      showToast("Your campaign is live!", "success");
      router.push(`/campaigns/${published.slug}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        showToast(
          `${err.message} Your draft is saved — you can retry publishing anytime.`,
          "error",
          9000
        );
      } else {
        showToast(
          err instanceof Error ? err.message : "Publishing failed",
          "error",
          6000
        );
      }
    }
  };

  const hasImage = campaign.media.some((m) => m.type === "IMAGE");

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Draft owner banner */}
      {campaign.status === "DRAFT" && campaign.isOwner && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brave-amber/30 bg-brave-amber/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brave-amber">
            This is a draft — publish it from your dashboard to start
            receiving donations.
            {!hasImage && " Add at least one image before publishing."}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/campaigns/create?draft=${campaign.id}`}>
                <PencilLine size={16} aria-hidden="true" />
                Edit
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              loading={publishMutation.isPending}
              loadingText="Publishing..."
              disabled={!hasImage}
            >
              Publish
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip
            category={campaign.category}
            className="border-white/10 bg-surface-elevated text-foreground"
          />
          {campaign.status !== "ACTIVE" && (
            <span className="rounded-full border border-brave-amber/40 bg-brave-amber/10 px-2.5 py-1 text-xs font-semibold text-brave-amber">
              {campaign.status === "DRAFT" ? "Draft" : campaign.status}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-3xl font-bold text-balance text-foreground">
            {campaign.title}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="shrink-0 self-start"
          >
            <Share2 size={16} aria-hidden="true" />
            Share
          </Button>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: gallery + story */}
        <div className="flex min-w-0 flex-col gap-6">
          <MediaGallery media={campaign.media} title={campaign.title} />

          {/* Creator */}
          {campaign.creator && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-elevated px-4 py-3">
              <Avatar
                src={campaign.creator.avatarUrl ?? undefined}
                alt={creatorName ?? "Campaign creator"}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {creatorName ?? "Anonymous"}
                </p>
                <p className="text-xs text-text-tertiary">Campaign organizer</p>
              </div>
            </div>
          )}

          {/* Story */}
          <section aria-label="Campaign story">
            <h2 className="text-xl font-semibold text-foreground">
              About this campaign
            </h2>
            <p className="mt-3 text-base leading-relaxed whitespace-pre-wrap text-text-secondary">
              {campaign.description}
            </p>
          </section>

          {/* Recent donations (published campaigns only) */}
          {campaign.status !== "DRAFT" && (
            <DonationsList
              campaignId={campaign.id}
              pollIntervalMs={POLL_INTERVAL_MS}
            />
          )}
        </div>

        {/* Right: stats + donate */}
        <StatsCard campaign={campaign} />
      </div>
    </main>
  );
}
