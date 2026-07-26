"use client";

/** Admin stats + campaign moderation hooks (phase 5). */

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiError } from "@/lib/api";

export interface PlatformStats {
  users: number;
  campaigns: { active: number; draft: number; suspended: number };
  donations: { count: number; totalUsd: string };
  whitelistCount: number;
  pendingWithdrawals: number;
}

export interface AdminCampaign {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "SUSPENDED";
  isFeatured: boolean;
  raisedUsd: string;
  goalUsd: string;
  donorsCount: number;
  creator: { username: string | null; email: string } | null;
  createdAt: string;
}

const adminKeys = {
  stats: ["admin", "stats"] as const,
  campaigns: (status?: string, search?: string) =>
    ["admin", "campaigns", status ?? "all", search ?? ""] as const,
};

function useToken() {
  const { getToken } = useAuth();
  return useCallback(async () => {
    const token = await getToken();
    if (!token) throw new ApiError("You must be signed in", 401);
    return token;
  }, [getToken]);
}

export function useAdminStats() {
  const getToken = useToken();
  return useQuery<PlatformStats, Error>({
    queryKey: adminKeys.stats,
    queryFn: async () =>
      apiFetch<PlatformStats>("/api/admin/stats", { token: await getToken() }),
  });
}

export function useAdminCampaigns(status?: string, search?: string) {
  const getToken = useToken();
  return useQuery<AdminCampaign[], Error>({
    queryKey: adminKeys.campaigns(status, search),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (search) qs.set("search", search);
      const suffix = qs.toString() ? `?${qs}` : "";
      return apiFetch<AdminCampaign[]>(`/api/admin/campaigns${suffix}`, {
        token: await getToken(),
      });
    },
  });
}

export function useModerateCampaign() {
  const getToken = useToken();
  const qc = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { id: string; action: "suspend" | "reactivate" | "feature" | "unfeature" }
  >({
    mutationFn: async ({ id, action }) =>
      apiFetch(`/api/admin/campaigns/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        token: await getToken(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}
