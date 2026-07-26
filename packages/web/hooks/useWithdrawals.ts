"use client";

/**
 * React Query hooks for the withdrawal + admin flows (phase 4).
 *
 * Auth: every call needs the Privy access token, fetched via useAuth().getToken().
 * Live status: lists poll every 15s while anything is mid-flight, so a
 * withdrawal visibly progresses PENDING → APPROVED → EXECUTED as the API
 * co-signs and executes on-chain.
 */

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import {
  withdrawalFetchers,
  type AdminWithdrawalView,
  type CampaignBalances,
  type CreateWithdrawalResponse,
  type WhitelistEntry,
  type WithdrawalStatus,
  type WithdrawalView,
} from "@/lib/withdrawals";

export const withdrawalKeys = {
  all: ["withdrawals"] as const,
  mine: () => [...withdrawalKeys.all, "mine"] as const,
  balances: (campaignId: string) =>
    [...withdrawalKeys.all, "balances", campaignId] as const,
  admin: (status?: WithdrawalStatus) =>
    [...withdrawalKeys.all, "admin", status ?? "all"] as const,
  whitelist: (search?: string) =>
    [...withdrawalKeys.all, "whitelist", search ?? ""] as const,
};

const IN_FLIGHT: WithdrawalStatus[] = ["PENDING", "APPROVED"];

function hasInFlight(items: { status: WithdrawalStatus }[] | undefined): boolean {
  return Boolean(items?.some((w) => IN_FLIGHT.includes(w.status)));
}

/** Token accessor that throws a friendly error when unavailable. */
function useToken() {
  const { getToken } = useAuth();
  return useCallback(async () => {
    const token = await getToken();
    if (!token) throw new ApiError("You must be signed in", 401);
    return token;
  }, [getToken]);
}

// ─── Creator ──────────────────────────────────────────────────────────

export function useMyWithdrawals() {
  const getToken = useToken();
  return useQuery<WithdrawalView[], Error>({
    queryKey: withdrawalKeys.mine(),
    refetchInterval: (query) =>
      hasInFlight(query.state.data) ? 15_000 : false,
    queryFn: async () => withdrawalFetchers.mine(await getToken()),
  });
}

export function useCampaignBalances(campaignId: string | null, enabled: boolean) {
  const getToken = useToken();
  return useQuery<CampaignBalances, Error>({
    queryKey: withdrawalKeys.balances(campaignId ?? ""),
    enabled: enabled && !!campaignId,
    staleTime: 15_000,
    queryFn: async () =>
      withdrawalFetchers.balances(await getToken(), campaignId as string),
  });
}

export function useCreateWithdrawal() {
  const getToken = useToken();
  const qc = useQueryClient();
  return useMutation<
    CreateWithdrawalResponse,
    Error,
    { campaignId: string; chainId: number; tokenAddress: string | null; amountRaw: string }
  >({
    mutationFn: async (body) =>
      withdrawalFetchers.create(await getToken(), body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: withdrawalKeys.mine() });
    },
  });
}

export function useSubmitCreatorSignature() {
  const getToken = useToken();
  const qc = useQueryClient();
  return useMutation<WithdrawalView, Error, { id: string; signature: string }>({
    mutationFn: async ({ id, signature }) =>
      withdrawalFetchers.creatorSignature(await getToken(), id, signature),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: withdrawalKeys.mine() });
    },
  });
}

// ─── Admin: withdrawals ───────────────────────────────────────────────

export function useAdminWithdrawals(status?: WithdrawalStatus) {
  const getToken = useToken();
  return useQuery<AdminWithdrawalView[], Error>({
    queryKey: withdrawalKeys.admin(status),
    refetchInterval: (query) =>
      hasInFlight(query.state.data) ? 15_000 : false,
    queryFn: async () => withdrawalFetchers.adminList(await getToken(), status),
  });
}

export function useAdminSign() {
  const getToken = useToken();
  const qc = useQueryClient();
  return useMutation<WithdrawalView, Error, { id: string; signature: string }>({
    mutationFn: async ({ id, signature }) =>
      withdrawalFetchers.adminSign(await getToken(), id, signature),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: withdrawalKeys.all });
    },
  });
}

export function useAdminReject() {
  const getToken = useToken();
  const qc = useQueryClient();
  return useMutation<WithdrawalView, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) =>
      withdrawalFetchers.adminReject(await getToken(), id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: withdrawalKeys.all });
    },
  });
}

// ─── Admin: whitelist ─────────────────────────────────────────────────

export function useWhitelist(search: string) {
  const getToken = useToken();
  return useQuery<WhitelistEntry[], Error>({
    queryKey: withdrawalKeys.whitelist(search),
    queryFn: async () => withdrawalFetchers.whitelistList(await getToken(), search),
  });
}

export function useAddWhitelist() {
  const getToken = useToken();
  const qc = useQueryClient();
  return useMutation<WhitelistEntry, Error, string>({
    mutationFn: async (email) =>
      withdrawalFetchers.whitelistAdd(await getToken(), email),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...withdrawalKeys.all, "whitelist"],
      });
    },
  });
}

export function useRemoveWhitelist() {
  const getToken = useToken();
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean }, Error, string>({
    mutationFn: async (id) =>
      withdrawalFetchers.whitelistRemove(await getToken(), id),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...withdrawalKeys.all, "whitelist"],
      });
    },
  });
}
