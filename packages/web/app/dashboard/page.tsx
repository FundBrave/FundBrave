"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyStateCompact } from "@/components/ui/EmptyState";
import { Check, PencilLine, Plus, Rocket, Wallet } from "@/components/ui/icons";
import { Copy, Rocket as RocketLucide } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { truncateWalletAddress } from "@/lib/wallet";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import {
  type Campaign,
  type CampaignStatus,
  formatUsd,
} from "@/lib/campaigns";
import { useMyCampaigns, usePublishCampaign } from "@/hooks/useCampaigns";
import {
  CampaignImage,
  MediaPlaceholder,
  coverImage,
} from "@/components/campaigns/CampaignCard";
import { WithdrawModal } from "@/components/withdrawals/WithdrawModal";
import { WithdrawalsList } from "@/components/withdrawals/WithdrawalsList";
import { Banknote } from "lucide-react";

// ============================================================================
// My campaigns section
// ============================================================================

const STATUS_BADGE: Record<CampaignStatus, string> = {
  DRAFT: "border-brave-amber/40 bg-brave-amber/10 text-brave-amber",
  ACTIVE: "border-brave-mint/40 bg-brave-mint/10 text-brave-mint",
  COMPLETED: "border-brave-teal/40 bg-brave-teal/10 text-brave-teal",
  SUSPENDED: "border-destructive/40 bg-destructive/10 text-destructive",
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        STATUS_BADGE[status]
      )}
    >
      {status === "DRAFT" ? "Draft" : status === "ACTIVE" ? "Active" : status}
    </span>
  );
}

function MyCampaignRow({ campaign }: { campaign: Campaign }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const publishMutation = usePublishCampaign();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const cover = coverImage(campaign);
  const hasImage = campaign.media.some((m) => m.type === "IMAGE");

  const handlePublish = async () => {
    if (!hasImage) {
      showToast("Add at least one image before publishing.", "error");
      return;
    }
    try {
      await publishMutation.mutateAsync(campaign.id);
      showToast(`"${campaign.title}" is live!`, "success");
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

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface-sunken p-3 sm:flex-row sm:items-center">
      {/* Cover + title */}
      <Link
        href={`/campaigns/${campaign.slug}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
          {cover ? (
            <CampaignImage src={cover} alt="" sizes="80px" />
          ) : (
            <MediaPlaceholder />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {campaign.title}
            </p>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {formatUsd(campaign.raisedUsd)} raised of{" "}
            {formatUsd(campaign.goalUsd)} ·{" "}
            {campaign.donorsCount.toLocaleString()}{" "}
            {campaign.donorsCount === 1 ? "donor" : "donors"}
          </p>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/campaigns/create?draft=${campaign.id}`}
            aria-label={`Edit ${campaign.title}`}
          >
            <PencilLine size={16} aria-hidden="true" />
            Edit
          </Link>
        </Button>
        {campaign.status === "DRAFT" && (
          <Button
            size="sm"
            onClick={handlePublish}
            loading={publishMutation.isPending}
            loadingText="Publishing..."
          >
            <Rocket size={16} aria-hidden="true" />
            Publish
          </Button>
        )}
        {(campaign.status === "ACTIVE" || campaign.status === "COMPLETED") && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWithdrawOpen(true)}
          >
            <Banknote size={16} aria-hidden="true" />
            Withdraw
          </Button>
        )}
      </div>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        destination={user?.walletAddress ?? null}
      />
    </li>
  );
}

function MyCampaignsSection() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useMyCampaigns();

  return (
    <section
      aria-label="My campaigns"
      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-surface-elevated p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">My campaigns</h2>
        <Button asChild size="sm">
          <Link href="/campaigns/create">
            <Plus size={16} aria-hidden="true" />
            New campaign
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList items={2} />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-text-secondary">
            We could not load your campaigns.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyStateCompact
          icon={RocketLucide}
          message="You have not created any campaigns yet. Start one and rally support for your cause."
          action={{
            label: "Start a campaign",
            onClick: () => router.push("/campaigns/create"),
          }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((campaign) => (
            <MyCampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null; // AuthGuard guarantees this never renders

  const name = user.displayName || user.username || user.email;

  const handleCopy = async () => {
    if (!user.walletAddress) return;
    try {
      await navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      showToast("Wallet address copied", "success", 2000);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy address", "error");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/auth/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14"
    >
      {/* Welcome card */}
      <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-surface-elevated p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Avatar
            src={user.avatarUrl ?? undefined}
            alt={name}
            size="xl"
            showGradientBorder
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
              Welcome, {name}
            </h1>
            {user.username && (
              <p className="truncate text-sm text-text-secondary">
                @{user.username}
              </p>
            )}
          </div>
        </div>

        {/* Wallet */}
        {user.walletAddress ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-sunken px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 text-text-secondary">
              <Wallet size={18} aria-hidden="true" />
              <span
                className="truncate font-mono text-sm"
                title={user.walletAddress}
              >
                {truncateWalletAddress(user.walletAddress)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy wallet address"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              {copied ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-surface-sunken px-4 py-3 text-sm text-text-tertiary">
            Your wallet is still being provisioned. It will appear here
            shortly.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handleLogout}
            loading={loggingOut}
            loadingText="Logging out..."
            className="sm:w-auto"
          >
            Log out
          </Button>
        </div>
      </section>

      {/* My campaigns */}
      <MyCampaignsSection />

      {/* Withdrawals (renders only when the user has any) */}
      <WithdrawalsList />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireOnboarded>
      <DashboardContent />
    </AuthGuard>
  );
}
