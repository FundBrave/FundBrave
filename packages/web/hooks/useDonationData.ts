"use client";

/**
 * React Query hooks + types for donation data (phase 3).
 *
 * - useSupportedChains(): chain/token config from GET /api/donations/tokens
 * - useCampaignDonations(): confirmed donations feed (paginated)
 * - useRaisedBreakdown(): per-chain/token raised totals
 * - useDonationQr(): server-rendered EIP-681 QR (PNG data URL)
 *
 * Live totals: callers on the campaign detail page pass a
 * `refetchInterval` (30s) so donations/breakdown/campaign stay fresh while
 * the Moralis webhook + fallback poller confirm transfers server-side.
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ============================================================================
// Types (mirror packages/api donation endpoints)
// ============================================================================

export interface SupportedToken {
  /** ERC-20 contract address, or null for the chain's native asset. */
  address: string | null;
  symbol: string;
  decimals: number;
}

export interface SupportedChain {
  chainId: number;
  name: string;
  /** Base explorer URL, e.g. "https://basescan.org" (no trailing /tx). */
  explorerUrl: string;
  nativeSymbol: string;
  isTestnet: boolean;
  tokens: SupportedToken[];
}

export interface DonationDonor {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface DonationItem {
  id: string;
  chainId: number;
  txHash: string;
  tokenSymbol: string;
  /** Base-unit amount as a decimal string. */
  amountRaw: string;
  /** USD value as a decimal string, e.g. "25.00". */
  amountUsd: string;
  donorAddress: string;
  /** Linked FundBrave user, when the donor address matched one. */
  donor: DonationDonor | null;
  createdAt: string;
}

export interface DonationListResponse {
  items: DonationItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface BreakdownEntry {
  chainId: number;
  tokenSymbol: string;
  /** USD total as a decimal string. */
  totalUsd: string;
  count: number;
}

export interface DonationQr {
  /** EIP-681 payment URI. */
  uri: string;
  /** Ready-to-render PNG data URL. */
  dataUrl: string;
  /** The campaign Safe address the QR points at. */
  address: string;
}

// ============================================================================
// Query keys
// ============================================================================

export const donationKeys = {
  all: ["donations"] as const,
  tokens: () => [...donationKeys.all, "tokens"] as const,
  lists: (campaignId: string) =>
    [...donationKeys.all, "list", campaignId] as const,
  list: (campaignId: string, page: number) =>
    [...donationKeys.lists(campaignId), page] as const,
  breakdown: (campaignId: string) =>
    [...donationKeys.all, "breakdown", campaignId] as const,
  qr: (
    campaignId: string,
    chainId: number | null,
    token: string | null,
    amount: string | null
  ) => [...donationKeys.all, "qr", campaignId, chainId, token, amount] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/** Supported chains + tokens — near-static config, cached for 5 minutes. */
export function useSupportedChains() {
  return useQuery<{ chains: SupportedChain[] }, Error, SupportedChain[]>({
    queryKey: donationKeys.tokens(),
    staleTime: 5 * 60_000,
    select: (data) => data.chains,
    queryFn: () =>
      apiFetch<{ chains: SupportedChain[] }>("/api/donations/tokens"),
  });
}

/** Confirmed donations for a campaign, newest first. */
export function useCampaignDonations(
  campaignId: string | undefined,
  page: number,
  options: { refetchInterval?: number; limit?: number } = {}
) {
  const limit = options.limit ?? 10;
  return useQuery<DonationListResponse, Error>({
    queryKey: [...donationKeys.list(campaignId ?? "", page), limit],
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    refetchInterval: options.refetchInterval,
    queryFn: () =>
      apiFetch<DonationListResponse>(
        `/api/campaigns/${encodeURIComponent(
          campaignId as string
        )}/donations?page=${page}&limit=${limit}`
      ),
  });
}

/** Per-chain/token raised totals for a campaign. */
export function useRaisedBreakdown(
  campaignId: string | undefined,
  options: { refetchInterval?: number } = {}
) {
  return useQuery<{ breakdown: BreakdownEntry[] }, Error, BreakdownEntry[]>({
    queryKey: donationKeys.breakdown(campaignId ?? ""),
    enabled: !!campaignId,
    select: (data) => data.breakdown,
    refetchInterval: options.refetchInterval,
    queryFn: () =>
      apiFetch<{ breakdown: BreakdownEntry[] }>(
        `/api/campaigns/${encodeURIComponent(campaignId as string)}/breakdown`
      ),
  });
}

export interface DonationQrParams {
  chainId: number | null;
  /** ERC-20 address, or null for the native asset. */
  tokenAddress: string | null;
  /** Base-unit amount string (already parseUnits-ed), or null to omit. */
  amountBaseUnits: string | null;
}

/** Server-generated EIP-681 QR for the address/QR donation tab. */
export function useDonationQr(
  campaignId: string | undefined,
  { chainId, tokenAddress, amountBaseUnits }: DonationQrParams
) {
  return useQuery<DonationQr, Error>({
    queryKey: donationKeys.qr(
      campaignId ?? "",
      chainId,
      tokenAddress,
      amountBaseUnits
    ),
    enabled: !!campaignId && chainId !== null,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: () => {
      const qs = new URLSearchParams({ chainId: String(chainId) });
      if (tokenAddress) qs.set("token", tokenAddress);
      if (amountBaseUnits) qs.set("amount", amountBaseUnits);
      return apiFetch<DonationQr>(
        `/api/campaigns/${encodeURIComponent(campaignId as string)}/qr?${qs}`
      );
    },
  });
}

// ============================================================================
// Small shared helpers
// ============================================================================

/** "0x1234…abcd" */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Explorer link for a tx, or null when the chain is unknown. */
export function explorerTxUrl(
  chain: SupportedChain | undefined,
  txHash: string
): string | null {
  if (!chain?.explorerUrl) return null;
  return `${chain.explorerUrl.replace(/\/+$/, "")}/tx/${txHash}`;
}
