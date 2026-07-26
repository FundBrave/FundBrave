"use client";

/**
 * WithdrawalsList — creator's withdrawal history with live status.
 * Statuses flip in place while the API co-signs + executes (list polls).
 */

import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  formatTokenAmount,
  type WithdrawalStatus,
  type WithdrawalView,
} from "@/lib/withdrawals";
import { useMyWithdrawals } from "@/hooks/useWithdrawals";
import { useSupportedChains, explorerTxUrl } from "@/hooks/useDonationData";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ExternalLink } from "@/components/ui/icons";

const STATUS_META: Record<
  WithdrawalStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Awaiting approval",
    className: "border-brave-amber/40 bg-brave-amber/10 text-brave-amber",
  },
  APPROVED: {
    label: "Executing…",
    className: "border-brave-teal/40 bg-brave-teal/10 text-brave-teal",
  },
  EXECUTED: {
    label: "Completed",
    className: "border-brave-mint/40 bg-brave-mint/10 text-brave-mint",
  },
  REJECTED: {
    label: "Declined",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  FAILED: {
    label: "Failed",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

export function WithdrawalsList() {
  const { data, isLoading } = useMyWithdrawals();
  const { data: chains } = useSupportedChains();

  if (isLoading) return <SkeletonList items={2} />;
  if (!data || data.length === 0) return null;

  return (
    <section
      aria-label="Withdrawals"
      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-surface-elevated p-6 sm:p-8"
    >
      <h2 className="text-lg font-semibold text-foreground">Withdrawals</h2>
      <ul className="flex flex-col gap-3">
        {data.map((w) => (
          <WithdrawalRow key={w.id} withdrawal={w} chains={chains} />
        ))}
      </ul>
    </section>
  );
}

function WithdrawalRow({
  withdrawal: w,
  chains,
}: {
  withdrawal: WithdrawalView;
  chains: ReturnType<typeof useSupportedChains>["data"];
}) {
  const chain = chains?.find((c) => c.chainId === w.chainId);
  const token = chain?.tokens.find(
    (t) => (t.address?.toLowerCase() ?? null) === (w.tokenAddress?.toLowerCase() ?? null)
  );
  const decimals = token?.decimals ?? (w.tokenAddress ? 6 : 18);
  const meta = STATUS_META[w.status];
  const txUrl = w.execTxHash ? explorerTxUrl(chain, w.execTxHash) : null;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/10 bg-surface-sunken p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {formatTokenAmount(w.amountRaw, decimals)} {w.tokenSymbol}
            <span className="ml-2 text-xs font-normal text-text-tertiary">
              on {chain?.name ?? `chain ${w.chainId}`}
            </span>
          </p>
          {w.campaign && (
            <p className="mt-0.5 truncate text-xs text-text-secondary">
              {w.campaign.title}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            meta.className
          )}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-tertiary">
          {formatRelativeTime(w.createdAt)}
        </span>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-brave-mint hover:underline"
          >
            View transaction
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>

      {(w.status === "REJECTED" || w.status === "FAILED") && w.rejectionReason && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {w.rejectionReason}
        </p>
      )}
    </li>
  );
}

export default WithdrawalsList;
