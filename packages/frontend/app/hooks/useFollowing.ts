"use client";

import { useState, useEffect, useCallback } from 'react';
import { followListQuerySchema, type FollowListResponse } from '@/app/components/social/schemas';

interface UseFollowingOptions {
  userId: string;
  limit?: number;
  enabled?: boolean;
}

interface UseFollowingReturn {
  users: FollowListResponse['users'];
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
 * Fetches and manages a paginated list of users that a user follows.
 * Supports infinite scroll with cursor-based pagination.
 *
 * @example
 * ```tsx
 * const { users, isLoading, hasMore, loadMore } = useFollowing({
 *   userId: "user-id",
 *   limit: 20,
 * });
 * ```
 */
export function useFollowing({
  userId,
  limit = 20,
  enabled = true,
}: UseFollowingOptions): UseFollowingReturn {
  const [users, setUsers] = useState<FollowListResponse['users']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const fetchFollowing = useCallback(async (cursor?: string, append = false) => {
    // Validate input
    const validation = followListQuerySchema.safeParse({
      userId,
      type: 'following',
      cursor,
      limit,
    });

    if (!validation.success) {
      const err = new Error(validation.error.issues[0]?.message || 'Invalid query parameters');
      setError(err);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        type: 'following',
        limit: limit.toString(),
      });

      if (cursor) {
        queryParams.append('cursor', cursor);
      }

      const response = await fetch(`/api/users/${userId}/following?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch following');
      }

      const data: FollowListResponse = await response.json();

      setUsers(prev => append ? [...prev, ...data.users] : data.users);
      setHasMore(data.hasMore);
      setTotal(data.total);
      setNextCursor(data.nextCursor);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore && nextCursor) {
      await fetchFollowing(nextCursor, true);
    }
  }, [isLoading, hasMore, nextCursor, fetchFollowing]);

  const refresh = useCallback(async () => {
    setNextCursor(undefined);
    await fetchFollowing(undefined, false);
  }, [fetchFollowing]);

  useEffect(() => {
    if (enabled) {
      fetchFollowing();
    }
  }, [enabled, fetchFollowing]);

  return {
    users,
    isLoading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}
