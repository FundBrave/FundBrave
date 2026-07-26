"use client";

/**
 * RaisedBreakdown — compact per-chain/token totals shown under the stats
 * card as a collapsible "View breakdown" disclosure. Renders nothing until
 * at least one confirmed donation exists.
 */

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/campaigns";
import {
  useRaisedBreakdown,
  useSupportedChains,
} from "@/hooks/useDonationData";
import { ChevronDown } from "@/components/ui/icons";

export interface RaisedBreakdownProps {
  campaignId: string;
  /** Refetch interval in ms (e.g. 30_000 on the detail page). */
  pollIntervalMs?: number;
  className?: string;
}

export function RaisedBreakdown({
  campaignId,
  pollIntervalMs,
  className,
}: RaisedBreakdownProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { data: rows } = useRaisedBreakdown(campaignId, {
    refetchInterval: pollIntervalMs,
  });
  const { data: chains } = useSupportedChains();

  if (!rows || rows.length === 0) return null;

  const chainName = (chainId: number) =>
    chains?.find((c) => c.chainId === chainId)?.name ?? `Chain ${chainId}`;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-surface-sunken",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        View breakdown
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn(
            "text-text-tertiary transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul
          id={panelId}
          className="flex flex-col gap-2.5 border-t border-white/10 px-4 py-3"
        >
          {rows.map((row) => (
            <li
              key={`${row.chainId}-${row.tokenSymbol}`}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate text-text-secondary">
                <span className="font-medium text-foreground">
                  {row.tokenSymbol}
                </span>{" "}
                <span className="text-text-tertiary">
                  on {chainName(row.chainId)}
                </span>
              </span>
              <span className="shrink-0 font-medium text-foreground">
                {formatUsd(row.totalUsd)}
                <span className="ml-1.5 text-xs font-normal text-text-tertiary">
                  · {row.count} donation{row.count === 1 ? "" : "s"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RaisedBreakdown;
