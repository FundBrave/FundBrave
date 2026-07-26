"use client";

/**
 * Admin dashboard (root admin only).
 *  - Withdrawals: co-sign pending 2-of-2 withdrawals with the admin wallet
 *    (wagmi/RainbowKit — NOT Privy), or reject them.
 *  - Whitelist: manage who can sign up.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { isWalletConfigured } from "@/lib/wagmi";
import {
  formatTokenAmount,
  type AdminWithdrawalView,
  type SafeTypedData,
  type WhitelistEntry,
  type WithdrawalStatus,
} from "@/lib/withdrawals";
import {
  useAddWhitelist,
  useAdminReject,
  useAdminSign,
  useAdminWithdrawals,
  useRemoveWhitelist,
  useWhitelist,
} from "@/hooks/useWithdrawals";
import { useSupportedChains, truncateAddress, explorerTxUrl } from "@/hooks/useDonationData";
import {
  useAdminCampaigns,
  useAdminStats,
  useModerateCampaign,
  type AdminCampaign,
} from "@/hooks/useAdmin";
import { AdminApproveControls } from "@/components/withdrawals/AdminApproveControls";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Shield,
  Trash2,
  UserPlus,
} from "@/components/ui/icons";

type Tab = "overview" | "withdrawals" | "campaigns" | "whitelist";

const TABS: Tab[] = ["overview", "withdrawals", "campaigns", "whitelist"];

function AdminPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (user && user.role !== "ADMIN") router.replace("/");
  }, [user, router]);

  if (!user || user.role !== "ADMIN") return null;

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:py-14"
    >
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-brave-mint" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-surface-sunken p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "bg-surface-elevated text-foreground"
                : "text-text-secondary hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "withdrawals" && <WithdrawalsTab />}
      {tab === "campaigns" && <CampaignsTab />}
      {tab === "whitelist" && <WhitelistTab />}
    </main>
  );
}

// ============================================================================
// Overview tab (stats)
// ============================================================================

function OverviewTab() {
  const { data, isLoading } = useAdminStats();

  if (isLoading) return <SkeletonList items={2} />;
  if (!data) return null;

  const cards = [
    { label: "Users", value: data.users.toLocaleString() },
    {
      label: "Raised (confirmed)",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(data.donations.totalUsd)),
    },
    { label: "Donations", value: data.donations.count.toLocaleString() },
    { label: "Active campaigns", value: data.campaigns.active.toLocaleString() },
    { label: "Drafts", value: data.campaigns.draft.toLocaleString() },
    { label: "Suspended", value: data.campaigns.suspended.toLocaleString() },
    { label: "Whitelisted", value: data.whitelistCount.toLocaleString() },
    { label: "Pending withdrawals", value: data.pendingWithdrawals.toLocaleString() },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-white/10 bg-surface-sunken p-4"
        >
          <p className="text-xs text-text-tertiary">{c.label}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{c.value}</p>
        </div>
      ))}
    </section>
  );
}

// ============================================================================
// Campaigns moderation tab
// ============================================================================

const CAMPAIGN_FILTERS = ["ACTIVE", "SUSPENDED", "DRAFT", "COMPLETED"] as const;

function CampaignsTab() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<string>("ACTIVE");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminCampaigns(status, search);
  const moderate = useModerateCampaign();

  const act = async (
    id: string,
    action: "suspend" | "reactivate" | "feature" | "unfeature"
  ) => {
    try {
      await moderate.mutateAsync({ id, action });
      showToast("Updated", "success", 2000);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Action failed", "error");
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search campaigns…"
        className="w-full rounded-lg border border-white/10 bg-surface-sunken px-3 py-2 text-sm text-foreground outline-none placeholder:text-text-tertiary focus:border-white/20"
      />
      <div className="flex flex-wrap gap-2">
        {CAMPAIGN_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
              status === f
                ? "border-brave-mint/50 bg-brave-mint/10 text-brave-mint"
                : "border-white/10 text-text-secondary hover:text-foreground"
            )}
          >
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList items={3} />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-surface-sunken px-4 py-8 text-center text-sm text-text-secondary">
          No campaigns.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((c) => (
            <ModerationRow key={c.id} campaign={c} onAct={act} busy={moderate.isPending} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ModerationRow({
  campaign: c,
  onAct,
  busy,
}: {
  campaign: AdminCampaign;
  onAct: (id: string, action: "suspend" | "reactivate" | "feature" | "unfeature") => void;
  busy: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/10 bg-surface-sunken p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/campaigns/${c.slug}`}
            className="truncate text-sm font-semibold text-foreground hover:underline"
          >
            {c.title}
          </Link>
          {c.isFeatured && (
            <span className="rounded-full border border-brave-teal/40 bg-brave-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-brave-teal">
              Featured
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-tertiary">
          {c.creator?.username ? `@${c.creator.username}` : c.creator?.email ?? "—"} ·{" "}
          {c.category} · {c.donorsCount} donors
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {c.status === "SUSPENDED" ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onAct(c.id, "reactivate")}>
            Reactivate
          </Button>
        ) : c.status === "ACTIVE" ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onAct(c.id, c.isFeatured ? "unfeature" : "feature")}
            >
              {c.isFeatured ? "Unfeature" : "Feature"}
            </Button>
            <Button variant="destructive" size="sm" disabled={busy} onClick={() => onAct(c.id, "suspend")}>
              Suspend
            </Button>
          </>
        ) : (
          <span className="text-xs text-text-tertiary capitalize">{c.status.toLowerCase()}</span>
        )}
      </div>
    </li>
  );
}

// ============================================================================
// Withdrawals tab
// ============================================================================

const STATUS_FILTERS: { label: string; value: WithdrawalStatus | undefined }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Executed", value: "EXECUTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Failed", value: "FAILED" },
];

function WithdrawalsTab() {
  const [filter, setFilter] = useState<WithdrawalStatus | undefined>("PENDING");
  const { data, isLoading } = useAdminWithdrawals(filter);
  const { data: chains } = useSupportedChains();

  return (
    <section className="flex flex-col gap-4">
      {!isWalletConfigured && (
        <div className="flex items-start gap-2 rounded-xl border border-brave-amber/30 bg-brave-amber/10 p-3 text-sm text-brave-amber">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Wallet approvals are disabled — set{" "}
            <code className="font-mono">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code> to co-sign
            withdrawals.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f.value
                ? "border-brave-mint/50 bg-brave-mint/10 text-brave-mint"
                : "border-white/10 text-text-secondary hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList items={3} />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-surface-sunken px-4 py-8 text-center text-sm text-text-secondary">
          No {filter?.toLowerCase() ?? ""} withdrawals.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((w) => (
            <AdminWithdrawalCard key={w.id} withdrawal={w} chains={chains} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AdminWithdrawalCard({
  withdrawal: w,
  chains,
}: {
  withdrawal: AdminWithdrawalView;
  chains: ReturnType<typeof useSupportedChains>["data"];
}) {
  const chain = chains?.find((c) => c.chainId === w.chainId);
  const token = chain?.tokens.find(
    (t) => (t.address?.toLowerCase() ?? null) === (w.tokenAddress?.toLowerCase() ?? null)
  );
  const decimals = token?.decimals ?? (w.tokenAddress ? 6 : 18);
  const txUrl = w.execTxHash ? explorerTxUrl(chain, w.execTxHash) : null;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface-sunken p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {formatTokenAmount(w.amountRaw, decimals)} {w.tokenSymbol}
            <span className="ml-2 text-xs font-normal text-text-tertiary">
              on {chain?.name ?? `chain ${w.chainId}`}
            </span>
          </p>
          {w.campaign && (
            <Link
              href={`/campaigns/${w.campaign.slug}`}
              className="mt-0.5 block truncate text-xs text-brave-mint hover:underline"
            >
              {w.campaign.title}
            </Link>
          )}
          <p className="mt-1 text-xs text-text-tertiary">
            To {truncateAddress(w.toAddress)} · {formatRelativeTime(w.createdAt)}
          </p>
        </div>
        <StatusPill status={w.status} />
      </div>

      {txUrl && (
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-brave-mint hover:underline"
        >
          View transaction <ExternalLink size={12} aria-hidden="true" />
        </a>
      )}

      {(w.status === "REJECTED" || w.status === "FAILED") && w.rejectionReason && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {w.rejectionReason}
        </p>
      )}

      {w.status === "PENDING" &&
        (w.typedData && isWalletConfigured ? (
          <AdminApproveControls id={w.id} typedData={w.typedData} />
        ) : !w.hasCreatorSignature ? (
          <p className="text-xs text-text-tertiary">
            Waiting for the creator&apos;s signature.
          </p>
        ) : (
          <RejectControls id={w.id} />
        ))}
    </li>
  );
}

function StatusPill({ status }: { status: WithdrawalStatus }) {
  const map: Record<WithdrawalStatus, string> = {
    PENDING: "border-brave-amber/40 bg-brave-amber/10 text-brave-amber",
    APPROVED: "border-brave-teal/40 bg-brave-teal/10 text-brave-teal",
    EXECUTED: "border-brave-mint/40 bg-brave-mint/10 text-brave-mint",
    REJECTED: "border-destructive/40 bg-destructive/10 text-destructive",
    FAILED: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        map[status]
      )}
    >
      {status === "APPROVED" ? "Executing" : status}
    </span>
  );
}

function RejectControls({ id }: { id: string }) {
  const { showToast } = useToast();
  const reject = useAdminReject();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submit = async () => {
    if (reason.trim().length < 3) {
      showToast("Please give a short reason", "error");
      return;
    }
    try {
      await reject.mutateAsync({ id, reason: reason.trim() });
      showToast("Withdrawal rejected", "success");
      setOpen(false);
      setReason("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Reject failed", "error");
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="self-start">
        Reject
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejection"
        className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-text-tertiary focus:border-white/20"
      />
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={submit}
          loading={reject.isPending}
          loadingText="Rejecting..."
        >
          Confirm reject
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Whitelist tab
// ============================================================================

function WhitelistTab() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const { data, isLoading } = useWhitelist(search);
  const add = useAddWhitelist();
  const remove = useRemoveWhitelist();

  const canAdd = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleAdd = async () => {
    if (!canAdd) {
      showToast("Enter a valid email", "error");
      return;
    }
    try {
      await add.mutateAsync(email.trim().toLowerCase());
      showToast("Added to the access list", "success");
      setEmail("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not add", "error");
    }
  };

  const handleRemove = async (entry: WhitelistEntry) => {
    if (!confirm(`Remove ${entry.email} from the access list?`)) return;
    try {
      await remove.mutateAsync(entry.id);
      showToast("Removed", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not remove", "error");
    }
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Add */}
      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-surface-sunken p-4 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="name@example.com"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-text-tertiary focus:border-white/20"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!canAdd}
          loading={add.isPending}
          loadingText="Adding..."
        >
          <UserPlus size={16} aria-hidden="true" />
          Add to whitelist
        </Button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search emails…"
        className="w-full rounded-lg border border-white/10 bg-surface-sunken px-3 py-2 text-sm text-foreground outline-none placeholder:text-text-tertiary focus:border-white/20"
      />

      {isLoading ? (
        <SkeletonList items={4} />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-surface-sunken px-4 py-8 text-center text-sm text-text-secondary">
          No entries{search ? " match your search" : " yet"}.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-sunken px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.email}
                </p>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {entry.usedAt ? "Joined" : "Invited"} ·{" "}
                  {formatRelativeTime(entry.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    entry.usedAt
                      ? "border-brave-mint/40 bg-brave-mint/10 text-brave-mint"
                      : "border-brave-amber/40 bg-brave-amber/10 text-brave-amber"
                  )}
                >
                  {entry.usedAt ? "Active" : "Pending"}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  aria-label={`Remove ${entry.email}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requireOnboarded>
      <AdminPageInner />
    </AuthGuard>
  );
}
