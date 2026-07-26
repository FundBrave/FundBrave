/**
 * Campaign domain types + typed fetchers for the FundBrave API.
 *
 * Money note: the API stores USD amounts as decimal strings. We only
 * parseFloat for display/progress math — never for arithmetic we send back.
 */

import { apiFetch } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export type CampaignStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "SUSPENDED";
export type MediaType = "IMAGE" | "VIDEO";
export type CampaignSort = "newest" | "most_raised" | "ending_soon";

export interface CampaignMedia {
  id: string;
  type: MediaType;
  url: string;
  order: number;
}

export interface CampaignCreator {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  /** Decimal string, e.g. "2500.00" */
  goalUsd: string;
  /** Decimal string, e.g. "1043.50" */
  raisedUsd: string;
  /** ISO date string or null when no deadline was set */
  deadline: string | null;
  status: CampaignStatus;
  isFeatured: boolean;
  /** Null for drafts — assigned at publish time */
  safeAddress: string | null;
  donorsCount: number;
  createdAt: string;
  media: CampaignMedia[];
  creator: CampaignCreator | null;
}

export interface CampaignDetail extends Campaign {
  isOwner: boolean;
}

export interface CampaignListParams {
  search?: string;
  category?: string;
  sort?: CampaignSort;
  page?: number;
  limit?: number;
}

export interface CampaignListResponse {
  items: Campaign[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CampaignMediaInput {
  type: MediaType;
  url: string;
  order: number;
}

export interface CreateCampaignInput {
  /** 5-80 chars */
  title: string;
  /** 20-10000 chars */
  description: string;
  category: string;
  /** 10 - 10,000,000 */
  goalUsd: number;
  /** ISO string, >24h in the future, <1y */
  deadline?: string;
  /** Max 10 items */
  media?: CampaignMediaInput[];
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  maxBytes: number;
  expiresInSeconds: number;
}

// ============================================================================
// Categories
// ============================================================================

export interface CategoryDef {
  slug: string;
  label: string;
  /** Icon name resolved to a component in components/campaigns/CampaignCard */
  icon: string;
}

export const CATEGORIES: readonly CategoryDef[] = [
  { slug: "education", label: "Education", icon: "GraduationCap" },
  { slug: "health", label: "Health", icon: "Heart" },
  { slug: "disaster-relief", label: "Disaster Relief", icon: "CloudOff" },
  { slug: "community", label: "Community", icon: "Users" },
  { slug: "environment", label: "Environment", icon: "Leaf" },
  { slug: "animals", label: "Animals", icon: "Cat" },
  { slug: "arts", label: "Arts", icon: "Sparkles" },
  { slug: "technology", label: "Technology", icon: "Laptop" },
  { slug: "sports", label: "Sports", icon: "Trophy" },
  { slug: "other", label: "Other", icon: "Grid3X3" },
] as const;

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

// ============================================================================
// Formatting / math helpers
// ============================================================================

/** "2500.00" → "$2,500" · "1043.50" → "$1,043.50" */
export function formatUsd(value: string | number): string {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(n)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

/** Percent funded, clamped to 0-100. */
export function progressPercent(raisedUsd: string, goalUsd: string): number {
  const raised = Number.parseFloat(raisedUsd);
  const goal = Number.parseFloat(goalUsd);
  if (!Number.isFinite(raised) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.min(100, Math.max(0, (raised / goal) * 100));
}

/** Whole days until the deadline (0 when passed), or null when no deadline. */
export function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (!Number.isFinite(end)) return null;
  const diff = end - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
}

// ============================================================================
// Media validation (client-side, BEFORE presign)
// ============================================================================

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB
export const MAX_MEDIA_ITEMS = 10;

export type MediaValidation =
  | { ok: true; type: MediaType }
  | { ok: false; error: string };

export function validateMediaFile(file: File): MediaValidation {
  if (IMAGE_MIME_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Images must be 10MB or smaller" };
    }
    return { ok: true, type: "IMAGE" };
  }
  if (VIDEO_MIME_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return { ok: false, error: "Videos must be 200MB or smaller" };
    }
    return { ok: true, type: "VIDEO" };
  }
  return {
    ok: false,
    error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, or WebM.",
  };
}

// ============================================================================
// Fetchers
// ============================================================================

/** GET /api/campaigns — public listing (ACTIVE campaigns only). */
export async function fetchCampaigns(
  params: CampaignListParams = {}
): Promise<CampaignListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.category) qs.set("category", params.category);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return apiFetch<CampaignListResponse>(`/api/campaigns${q ? `?${q}` : ""}`);
}

/** GET /api/campaigns/categories */
export async function fetchCategories(): Promise<{ categories: string[] }> {
  return apiFetch<{ categories: string[] }>("/api/campaigns/categories");
}

/**
 * GET /api/campaigns/:slug — public; pass a token so owners can see their
 * own drafts.
 */
export async function fetchCampaign(
  slug: string,
  token?: string
): Promise<CampaignDetail> {
  return apiFetch<CampaignDetail>(
    `/api/campaigns/${encodeURIComponent(slug)}`,
    { token }
  );
}

/** POST /api/campaigns — creates a DRAFT. */
export async function createCampaign(
  input: CreateCampaignInput,
  token: string
): Promise<Campaign> {
  return apiFetch<Campaign>("/api/campaigns", {
    method: "POST",
    body: input,
    token,
  });
}

/** PATCH /api/campaigns/:id — after publish only description+media change. */
export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput,
  token: string
): Promise<Campaign> {
  return apiFetch<Campaign>(`/api/campaigns/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

/**
 * POST /api/campaigns/:id/publish — requires ≥1 image. May 503 when the
 * server cannot reach an RPC — surface the message, the draft stays saved.
 */
export async function publishCampaign(
  id: string,
  token: string
): Promise<Campaign> {
  return apiFetch<Campaign>(
    `/api/campaigns/${encodeURIComponent(id)}/publish`,
    { method: "POST", token }
  );
}

/** GET /api/campaigns/mine — all of the signed-in user's campaigns. */
export async function fetchMyCampaigns(token: string): Promise<Campaign[]> {
  return apiFetch<Campaign[]>("/api/campaigns/mine", { token });
}

/** POST /api/uploads/presign — may 503 when S3 is not configured. */
export async function presignUpload(
  input: { fileName: string; contentType: string },
  token: string
): Promise<PresignedUpload> {
  return apiFetch<PresignedUpload>("/api/uploads/presign", {
    method: "POST",
    body: input,
    token,
  });
}
