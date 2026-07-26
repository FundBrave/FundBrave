"use client";

/**
 * DonationsList — recent confirmed donations for the campaign detail page.
 *
 * Donor rows fall back gracefully: linked users show name/avatar, anonymous
 * on-chain donors show a truncated address with an initial-style fallback.
 * Simple pager (the API is page-based); polls when `pollIntervalMs` is set.
 */

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { formatUsd } from "@/lib/campaigns";
import {
  explorerTxUrl,
  truncateAddress,
  useCampaignDonations,
  useSupportedChains,
  type DonationItem,
} from "@/hooks/useDonationData";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { EmptyStateCompact } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExternalLink } from "@/components/ui/icons";

function donorName(donation: DonationItem): string {
  return (
    donation.donor?.displayName ||
    (donation.donor?.username ? `@${donation.donor.username}` : null) ||
    truncateAddress(donation.donorAddress)
  );
}

function donorInitial(donation: DonationItem): string {
  const source =
    donation.donor?.displayName || donation.donor?.username || null;
  return source ? source.charAt(0).toUpperCase() : "0x";
}

function DonationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton variant="circular" className="h-8 w-8" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton variant="text" className="h-3.5 w-32" />
        <Skeleton variant="text" className="h-3 w-20" />
      </div>
      <Skeleton variant="text" className="h-4 w-16" />
    </div>
  );
}

export interface DonationsListProps {
  campaignId: string;
  /** Refetch interval in ms (e.g. 30_000 on the detail page). */
  pollIntervalMs?: number;
  className?: string;
}

export function DonationsList({
  campaignId,
  pollIntervalMs,
  className,
}: DonationsListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useCampaignDonations(campaignId, page, {
    refetchInterval: pollIntervalMs,
  });
  const { data: chains } = useSupportedChains();

  const chainFor = (chainId: number) =>
    chains?.find((c) => c.chainId === chainId);

  return (
    <section aria-label="Recent donations" className={cn("min-w-0", className)}>
      <h2 className="text-xl font-semibold text-foreground">
        Recent donations
        {data && data.total > 0 && (
          <span className="ml-2 text-sm font-normal text-text-tertiary">
            {data.total.toLocaleString()}
          </span>
        )}
      </h2>

      <div className="mt-3 rounded-2xl border border-white/10 bg-surface-elevated px-4 py-1 sm:px-5">
        {isLoading ? (
          <div aria-busy="true" className="divide-y divide-white/5">
            {Array.from({ length: 3 }).map((_, i) => (
              <DonationRowSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-text-tertiary">
            Could not load donations right now.
          </p>
        ) : !data || data.items.length === 0 ? (
          <EmptyStateCompact
            icon={HeartHandshake}
            message="Be the first to donate"
          />
        ) : (
          <>
            <ul className="divide-y divide-white/5">
              {data.items.map((donation) => {
                const chain = chainFor(donation.chainId);
                const name = donorName(donation);
                const txUrl = explorerTxUrl(chain, donation.txHash);
                return (
                  <li
                    key={donation.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <Avatar
                      src={donation.donor?.avatarUrl ?? undefined}
                      alt={name}
                      fallback={donorInitial(donation)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatRelativeTime(donation.createdAt, "long")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        {formatUsd(donation.amountUsd)}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
                        <span>{donation.tokenSymbol}</span>
                        {chain && (
                          <span className="rounded-full border border-white/10 bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium">
                            {chain.name}
                          </span>
                        )}
                        {txUrl && (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View transaction by ${name} on the block explorer`}
                            className="text-text-tertiary transition-colors hover:text-foreground"
                          >
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-text-tertiary">
                  Page {data.page} of {data.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default DonationsList;
