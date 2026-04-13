"use client";

import { useState, useCallback, useMemo } from 'react';
import { useGetFollowersQuery } from '@/app/generated/graphql';
import type { FollowListUser, FollowListResponse } from '@/app/components/social/schemas';

interface UseFollowersOptions {
  userId: string;
  limit?: number;
  enabled?: boolean;
}

interface UseFollowersReturn {
  users: FollowListUser[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useFollowers Hook
 *
 * Fetches and manages a paginated list of a user's followers via GraphQL.
 * Supports offset-based pagination with "Load More".
 */
export function useFollowers({
  userId,
  limit = 20,
  enabled = true,
}: UseFollowersOptions): UseFollowersReturn {
  const [offset, setOffset] = useState(0);

  const { data, loading, error, fetchMore, refetch } = useGetFollowersQuery({
    variables: { userId, limit, offset: 0 },
    skip: !enabled || !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Transform GraphQL data to FollowListUser format
  const users: FollowListUser[] = useMemo(() => {
    if (!data?.followers?.items) return [];
    return data.followers.items.map((item) => ({
      id: item.user.id,
      name: item.user.displayName || item.user.username,
      username: item.user.username,
      avatar: item.user.avatarUrl || '',
      isVerified: item.user.isVerifiedCreator ?? false,
      isFollowing: false, // Not available from this query
      isFollowedBy: false,
    }));
  }, [data]);

  const hasMore = data?.followers?.hasMore ?? false;
  const total = data?.followers?.total ?? 0;

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const newOffset = users.length;
    setOffset(newOffset);
    await fetchMore({
      variables: { userId, limit, offset: newOffset },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          followers: {
            ...fetchMoreResult.followers,
            items: [
              ...(prev.followers?.items || []),
              ...(fetchMoreResult.followers?.items || []),
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
