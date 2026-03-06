"use client";

import { useState, useCallback, useMemo } from 'react';
import { useGetFollowingQuery } from '@/app/generated/graphql';
import type { FollowListUser } from '@/app/components/social/schemas';

interface UseFollowingOptions {
  userId: string;
  limit?: number;
  enabled?: boolean;
}

interface UseFollowingReturn {
  users: FollowListUser[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useFollowing Hook
 *
 * Fetches and manages a paginated list of users that a user follows via GraphQL.
 * Supports offset-based pagination with "Load More".
 */
export function useFollowing({
  userId,
  limit = 20,
  enabled = true,
}: UseFollowingOptions): UseFollowingReturn {
  const [offset, setOffset] = useState(0);

  const { data, loading, error, fetchMore, refetch } = useGetFollowingQuery({
    variables: { userId, limit, offset: 0 },
    skip: !enabled || !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Transform GraphQL data to FollowListUser format
  const users: FollowListUser[] = useMemo(() => {
    if (!data?.following?.items) return [];
    return data.following.items.map((item) => ({
      id: item.user.id,
      name: item.user.displayName || item.user.username,
      username: item.user.username,
      avatar: item.user.avatarUrl || '',
      isVerified: item.user.isVerifiedCreator ?? false,
      isFollowing: true, // User is following all users in this list
      isFollowedBy: false,
    }));
  }, [data]);

  const hasMore = data?.following?.hasMore ?? false;
  const total = data?.following?.total ?? 0;

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const newOffset = users.length;
    setOffset(newOffset);
    await fetchMore({
      variables: { userId, limit, offset: newOffset },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          following: {
            ...fetchMoreResult.following,
            items: [
              ...(prev.following?.items || []),
              ...(fetchMoreResult.following?.items || []),
            ],
          },
        };
      },
    });
  }, [hasMore, loading, users.length, fetchMore, userId, limit]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await refetch({ userId, limit, offset: 0 });
  }, [refetch, userId, limit]);

  return {
    users,
    isLoading: loading,
    error: error ? new Error(error.message) : null,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}
