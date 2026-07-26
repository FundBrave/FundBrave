/**
 * Typed fetch wrapper for the FundBrave API (packages/api, NestJS).
 *
 * All authed calls send `Authorization: Bearer <privy access token>`.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Public user shape returned by /api/auth/sync, /api/auth/me, /api/users/me. */
export interface User {
  id: string;
  email: string;
  walletAddress: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
}

/**
 * Error thrown for any non-2xx response (or network failure, status 0).
 * `code` carries machine-readable codes from the API, e.g. 'NOT_WHITELISTED'.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: unknown;

  constructor(message: string, status: number, code?: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export interface ApiFetchOptions {
  /** Privy access token — sent as a Bearer token when present. */
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-serializable request body. */
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Perform a JSON request against the FundBrave API.
 *
 * @example
 * const { user } = await apiFetch<{ user: User }>("/api/auth/sync", {
 *   method: "POST",
 *   token,
 * });
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { token, method = "GET", body, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      "Could not reach the FundBrave API. Is it running?",
      0
    );
  }

  // Parse the body once, tolerating empty / non-JSON responses.
  let parsed: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const obj =
      parsed !== null && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    const code = typeof obj?.code === "string" ? obj.code : undefined;
    const message =
      typeof obj?.message === "string"
        ? obj.message
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, code, parsed);
  }

  return parsed as T;
}
