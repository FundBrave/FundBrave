"use client";

import { useGetMeQuery } from "@/app/generated/graphql";

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  walletAddress: string;
  isVerifiedCreator: boolean;
}

interface UseCurrentUserReturn {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useCurrentUser - Fetch current logged-in user data
 * Uses GraphQL GetMe query
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const { data, loading, error, refetch } = useGetMeQuery({
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  const currentUser: CurrentUser | null = data?.me
    ? {
        id: data.me.id,
        username: data.me.username || '',
        displayName: data.me.displayName || data.me.username || '',
        avatarUrl: data.me.avatarUrl || '',
        email: data.me.email || '',
        walletAddress: data.me.walletAddress || '',
        isVerifiedCreator: data.me.isVerifiedCreator || false,
      }
    : null;

  return {
    currentUser,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}
