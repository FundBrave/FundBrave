"use client";

import { useState, useEffect, useCallback } from 'react';
import { followListQuerySchema, type FollowListResponse } from '@/app/components/social/schemas';

interface UseFollowersOptions {
  userId: string;
  limit?: number;
  enabled?: boolean;
}

interface UseFollowersReturn {
  users: FollowListResponse['users'];
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
 * Fetches and manages a paginated list of a user's followers.
 * Supports infinite scroll with cursor-based pagination.
 *
 * @example
 * ```tsx
 * const { users, isLoading, hasMore, loadMore } = useFollowers({
 *   userId: "user-id",
 *   limit: 20,
 * });
 * ```
 */
export function useFollowers({
  userId,
  limit = 20,
  enabled = true,
}: UseFollowersOptions): UseFollowersReturn {
  const [users, setUsers] = useState<FollowListResponse['users']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const fetchFollowers = useCallback(async (cursor?: string, append = false) => {
    // Validate input
    const validation = followListQuerySchema.safeParse({
      userId,
      type: 'followers',
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
        type: 'followers',
        limit: limit.toString(),
      });

      if (cursor) {
        queryParams.append('cursor', cursor);
      }

      const response = await fetch(`/api/users/${userId}/followers?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch followers');
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
      await fetchFollowers(nextCursor, true);
    }
  }, [isLoading, hasMore, nextCursor, fetchFollowers]);

  const refresh = useCallback(async () => {
    setNextCursor(undefined);
    await fetchFollowers(undefined, false);
  }, [fetchFollowers]);

  useEffect(() => {
    if (enabled) {
      fetchFollowers();
    }
  }, [enabled, fetchFollowers]);

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
