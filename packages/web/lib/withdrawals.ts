/**
 * Withdrawal types, fetchers, and BigInt-safe amount helpers (phase 4).
 *
 * The 2-of-2 flow: creator requests → creator signs the SafeTx typed data
 * with their Privy embedded wallet → admin co-signs with their own wallet →
 * the API deploys the Safe (if needed) and executes on-chain.
 */

import { apiFetch } from "@/lib/api";

export type WithdrawalStatus =
  | "PENDING"
  | "APPROVED"
  | "EXECUTED"
  | "REJECTED"
  | "FAILED";

export interface WithdrawalCampaignRef {
  title: string;
  slug: string;
  safeAddress: string;
}

export interface WithdrawalView {
  id: string;
  campaignId: string;
  campaign?: WithdrawalCampaignRef;
  chainId: number;
  tokenAddress: string | null;
  tokenSymbol: string;
  amountRaw: string;
  toAddress: string;
  status: WithdrawalStatus;
  safeTxHash: string | null;
  execTxHash: string | null;
  deployTxHash: string | null;
  rejectionReason: string | null;
  hasCreatorSignature: boolean;
  hasAdminSignature: boolean;
  createdAt: string;
  updatedAt: string;
}

/** EIP-712 typed data, values as strings (from the API). */
export interface SafeTypedData {
  domain: { chainId: number; verifyingContract: string };
  types: { SafeTx: { name: string; type: string }[] };
  primaryType: "SafeTx";
  message: Record<string, string>;
}

export interface CreateWithdrawalResponse {
  withdrawal: WithdrawalView;
  typedData: SafeTypedData;
}

export interface AdminWithdrawalView extends WithdrawalView {
  /** Present when the creator has signed and it awaits the admin. */
  typedData: SafeTypedData | null;
}

export interface TokenBalance {
  address: string | null;
  symbol: string;
  decimals: number;
  balanceRaw: string;
}

export interface ChainBalance {
  chainId: number;
  name: string;
  deployed: boolean;
  native: { symbol: string; decimals: number; balanceRaw: string };
  tokens: TokenBalance[];
}

export interface CampaignBalances {
  safeAddress: string;
  chains: ChainBalance[];
}

export interface WhitelistEntry {
  id: string;
  email: string;
  invitedBy: string | null;
  usedAt: string | null;
  createdAt: string;
}

// ============================================================================
// Fetchers
// ============================================================================

export const withdrawalFetchers = {
  mine: (token: string) =>
    apiFetch<WithdrawalView[]>("/api/withdrawals/mine", { token }),

  balances: (token: string, campaignId: string) =>
    apiFetch<CampaignBalances>(
      `/api/withdrawals/balances/${encodeURIComponent(campaignId)}`,
      { token }
    ),

  create: (
    token: string,
    body: {
      campaignId: string;
      chainId: number;
      tokenAddress?: string | null;
      amountRaw: string;
    }
  ) =>
    apiFetch<CreateWithdrawalResponse>("/api/withdrawals", {
      method: "POST",
      token,
      body: {
        campaignId: body.campaignId,
        chainId: body.chainId,
        ...(body.tokenAddress ? { tokenAddress: body.tokenAddress } : {}),
        amountRaw: body.amountRaw,
      },
    }),

  creatorSignature: (token: string, id: string, signature: string) =>
    apiFetch<WithdrawalView>(
      `/api/withdrawals/${encodeURIComponent(id)}/creator-signature`,
      { method: "POST", token, body: { signature } }
    ),

  adminList: (token: string, status?: WithdrawalStatus) =>
    apiFetch<AdminWithdrawalView[]>(
      `/api/admin/withdrawals${status ? `?status=${status}` : ""}`,
      { token }
    ),

  adminSign: (token: string, id: string, signature: string) =>
    apiFetch<WithdrawalView>(
      `/api/admin/withdrawals/${encodeURIComponent(id)}/signature`,
      { method: "POST", token, body: { signature } }
    ),

  adminReject: (token: string, id: string, reason: string) =>
    apiFetch<WithdrawalView>(
      `/api/admin/withdrawals/${encodeURIComponent(id)}/reject`,
      { method: "POST", token, body: { reason } }
    ),

  whitelistList: (token: string, search?: string) =>
    apiFetch<WhitelistEntry[]>(
      `/api/admin/whitelist${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      { token }
    ),

  whitelistAdd: (token: string, email: string) =>
    apiFetch<WhitelistEntry>("/api/admin/whitelist", {
      method: "POST",
      token,
      body: { email },
    }),

  whitelistRemove: (token: string, id: string) =>
    apiFetch<{ deleted: boolean }>(
      `/api/admin/whitelist/${encodeURIComponent(id)}`,
      { method: "DELETE", token }
    ),
};

// ============================================================================
// BigInt-safe amount helpers (never use floats for token math)
// ============================================================================

/**
 * Format a base-unit integer string into a human amount.
 * Trims trailing zeros; caps the fractional part at `maxDisplay` decimals.
 */
export function formatTokenAmount(
  raw: string,
  decimals: number,
  maxDisplay = 6
): string {
  let value: bigint;
  try {
    value = BigInt(raw);
  } catch {
    return "0";
  }
  if (decimals === 0) return value.toString();

  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;
  if (frac === 0n) return whole.toString();

  let fracStr = frac.toString().padStart(decimals, "0");
  // Cap displayed precision
  if (fracStr.length > maxDisplay) fracStr = fracStr.slice(0, maxDisplay);
  fracStr = fracStr.replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export class AmountError extends Error {}

/**
 * Parse a human-entered decimal string into base units (bigint).
 * Rejects negatives, malformed input, and more than `decimals` places.
 */
export function parseTokenAmount(input: string, decimals: number): bigint {
  const trimmed = input.trim();
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    throw new AmountError("Enter a valid amount");
  }
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > decimals) {
    throw new AmountError(`Too many decimals (max ${decimals})`);
  }
  const normalized = `${whole || "0"}${frac.padEnd(decimals, "0")}`;
  const value = BigInt(normalized);
  if (value <= 0n) throw new AmountError("Amount must be greater than zero");
  return value;
}
