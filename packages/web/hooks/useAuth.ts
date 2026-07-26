"use client";

/**
 * useAuth — combines Privy (identity + embedded wallet) with the FundBrave
 * API sync/whitelist state into a single discriminated status.
 *
 * POST /api/auth/sync is idempotent and returns the full user, so it doubles
 * as the "fetch me" call — one roundtrip after login.
 */

import { useCallback, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError, type User } from "@/lib/api";
import {
  isPrivyConfigured,
  PRIVY_NOT_CONFIGURED_MESSAGE,
} from "@/lib/privy-config";
import { useToast } from "@/components/ui/Toast";

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "not_whitelisted"
  | "error"
  | "authenticated";

export interface UseAuthResult {
  status: AuthStatus;
  /** Backend user — non-null exactly when status === 'authenticated'. */
  user: User | null;
  /** Whether the Privy SDK has finished initializing. */
  privyReady: boolean;
  /** Email from the Privy session (available before backend sync, e.g. on the request-access gate). */
  privyEmail: string | null;
  /** True when authenticated but the user has not picked a username yet. */
  needsOnboarding: boolean;
  /** Open the Privy login modal (toasts an error in degraded mode). */
  login: () => void;
  /** Log out of Privy and drop the cached backend user. */
  logout: () => Promise<void>;
  /** Re-run the backend sync query. */
  refetch: () => void;
  /** Current Privy access token, or null when unauthenticated / not configured. */
  getToken: () => Promise<string | null>;
}

export const ME_QUERY_KEY = ["me"] as const;

/** Real implementation — only mounted when PrivyProvider is present. */
function usePrivyAuth(): UseAuthResult {
  const {
    ready,
    authenticated,
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
    getAccessToken,
  } = usePrivy();
  const queryClient = useQueryClient();

  const meQuery = useQuery<User, Error>({
    queryKey: ME_QUERY_KEY,
    enabled: ready && authenticated,
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        // 503 = Privy not configured server-side or embedded wallet still
        // provisioning — retry with backoff.
        if (error.status === 503) return failureCount < 5;
        // Other 4xx (403 NOT_WHITELISTED etc.) are terminal.
        if (error.status >= 400 && error.status < 500) return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new ApiError("Missing Privy access token", 401);
      const { user } = await apiFetch<{ user: User }>("/api/auth/sync", {
        method: "POST",
        token,
      });
      return user;
    },
  });

  let status: AuthStatus;
  if (!ready) {
    status = "loading";
  } else if (!authenticated) {
    status = "unauthenticated";
  } else if (meQuery.isSuccess) {
    status = "authenticated";
  } else if (meQuery.isError) {
    status =
      meQuery.error instanceof ApiError &&
      meQuery.error.code === "NOT_WHITELISTED"
        ? "not_whitelisted"
        : "error";
  } else {
    status = "loading"; // authenticated, sync in flight
  }

  const user = status === "authenticated" ? (meQuery.data ?? null) : null;

  // Wrapped so callers can safely pass it to onClick without leaking the
  // click event into Privy's login(options) parameter.
  const login = useCallback(() => {
    privyLogin();
  }, [privyLogin]);

  const logout = useCallback(async () => {
    await privyLogout();
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
  }, [privyLogout, queryClient]);

  const refetch = useCallback(() => {
    void meQuery.refetch();
  }, [meQuery]);

  const getToken = useCallback(async () => {
    return getAccessToken();
  }, [getAccessToken]);

  const privyEmail =
    privyUser?.email?.address ?? privyUser?.google?.email ?? null;

  return {
    status,
    user,
    privyReady: ready,
    privyEmail,
    needsOnboarding: status === "authenticated" && !user?.username,
    login,
    logout,
    refetch,
    getToken,
  };
}

/** Degraded mode — NEXT_PUBLIC_PRIVY_APP_ID missing; never crash, just explain. */
function useDegradedAuth(): UseAuthResult {
  const { showToast } = useToast();

  const login = useCallback(() => {
    showToast(PRIVY_NOT_CONFIGURED_MESSAGE, "error", 8000);
  }, [showToast]);

  return useMemo(
    () => ({
      status: "unauthenticated" as const,
      user: null,
      privyReady: true,
      privyEmail: null,
      needsOnboarding: false,
      login,
      logout: async () => {},
      refetch: () => {},
      getToken: async () => null,
    }),
    [login]
  );
}

export function useAuth(): UseAuthResult {
  // `isPrivyConfigured` is a build-time constant (NEXT_PUBLIC_ vars are
  // inlined), so the branch never changes at runtime and hook order is stable.
  /* eslint-disable react-hooks/rules-of-hooks */
  return isPrivyConfigured ? usePrivyAuth() : useDegradedAuth();
  /* eslint-enable react-hooks/rules-of-hooks */
}
