"use client";

/**
 * React Query hooks for campaigns.
 *
 * Reads are keyed under ["campaigns", ...]; mutations invalidate the
 * narrowest sensible prefix. Uploads go presign → XHR PUT so we can report
 * per-file progress.
 */

import { useCallback } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  type Campaign,
  type CampaignDetail,
  type CampaignListParams,
  type CampaignListResponse,
  type CreateCampaignInput,
  type MediaType,
  type UpdateCampaignInput,
  createCampaign,
  fetchCampaign,
  fetchCampaigns,
  fetchMyCampaigns,
  presignUpload,
  publishCampaign,
  updateCampaign,
  validateMediaFile,
} from "@/lib/campaigns";
import { useAuth } from "@/hooks/useAuth";

// ============================================================================
// Query keys
// ============================================================================

export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (params: CampaignListParams) =>
    [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (slug: string) => [...campaignKeys.details(), slug] as const,
  mine: () => [...campaignKeys.all, "mine"] as const,
};

// ============================================================================
// Queries
// ============================================================================

/** Public listing with pagination — keeps previous page while fetching. */
export function useCampaignsList(params: CampaignListParams) {
  return useQuery<CampaignListResponse, Error>({
    queryKey: campaignKeys.list(params),
    queryFn: () => fetchCampaigns(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Single campaign by slug. Waits for auth to settle so owners get their
 * Bearer token attached (drafts 404 without it).
 *
 * Pass `refetchInterval` (ms) to poll — the detail page uses 30s so raised
 * totals stay live while donations confirm.
 */
export function useCampaign(
  slug: string | undefined,
  options: { refetchInterval?: number } = {}
) {
  const { status, getToken } = useAuth();
  const authed = status === "authenticated";

  return useQuery<CampaignDetail, Error>({
    queryKey: [...campaignKeys.detail(slug ?? ""), authed],
    enabled: !!slug && status !== "loading",
    refetchInterval: options.refetchInterval,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      const token = await getToken();
      return fetchCampaign(slug as string, token ?? undefined);
    },
  });
}

/** The signed-in user's campaigns (drafts included). */
export function useMyCampaigns(enabled = true) {
  const { status, getToken } = useAuth();

  return useQuery<Campaign[], Error>({
    queryKey: campaignKeys.mine(),
    enabled: enabled && status === "authenticated",
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new ApiError("Missing access token", 401);
      return fetchMyCampaigns(token);
    },
  });
}

// ============================================================================
// Mutations
// ============================================================================

async function requireToken(
  getToken: () => Promise<string | null>
): Promise<string> {
  const token = await getToken();
  if (!token) {
    throw new ApiError("You must be signed in to do that.", 401);
  }
  return token;
}

export function useCreateCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, CreateCampaignInput>({
    mutationFn: async (input) => {
      const token = await requireToken(getToken);
      return createCampaign(input, token);
    },
    onSuccess: () => {
      // Drafts only show up in "mine" — public lists are unaffected.
      void queryClient.invalidateQueries({ queryKey: campaignKeys.mine() });
    },
  });
}

export function useUpdateCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, { id: string; input: UpdateCampaignInput }>({
    mutationFn: async ({ id, input }) => {
      const token = await requireToken(getToken);
      return updateCampaign(id, input, token);
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.mine() });
      void queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(updated.slug),
      });
      // Published campaigns appear in public lists too.
      if (updated.status === "ACTIVE") {
        void queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      }
    },
  });
}

export function usePublishCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, string>({
    mutationFn: async (id) => {
      const token = await requireToken(getToken);
      return publishCampaign(id, token);
    },
    onSuccess: () => {
      // Status, safeAddress, and list membership all change — flush everything.
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}

// ============================================================================
// Uploads (presign → PUT with progress)
// ============================================================================

export interface UploadedMedia {
  url: string;
  type: MediaType;
}

function putWithProgress(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed — network error"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(file);
  });
}

/**
 * Returns an async `(file, onProgress) => { url, type }` uploader.
 * Validates locally, presigns, then PUTs via XHR for progress events.
 */
export function useUploadMedia() {
  const { getToken } = useAuth();

  return useCallback(
    async (
      file: File,
      onProgress?: (percent: number) => void
    ): Promise<UploadedMedia> => {
      const check = validateMediaFile(file);
      if (!check.ok) throw new Error(check.error);

      const token = await getToken();
      if (!token) throw new Error("You must be signed in to upload files.");

      let presigned;
      try {
        presigned = await presignUpload(
          { fileName: file.name, contentType: file.type },
          token
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
          throw new Error(
            "File uploads are not configured on the server yet. Please try again later."
          );
        }
        throw err;
      }

      await putWithProgress(presigned.uploadUrl, file, onProgress);
      return { url: presigned.publicUrl, type: check.type };
    },
    [getToken]
  );
}
