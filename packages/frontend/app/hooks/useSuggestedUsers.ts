"use client";

import { useState, useEffect, useCallback } from 'react';
import { userSuggestionSchema, type UserSuggestionResponse } from '@/app/components/social/schemas';

interface UseSuggestedUsersOptions {
  limit?: number;
  excludeIds?: string[];
  source?: 'sidebar' | 'discover' | 'profile';
  enabled?: boolean;
}

interface UseSuggestedUsersReturn {
  users: UserSuggestionResponse[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * useSuggestedUsers Hook
 *
 * Fetches user suggestions based on mutual followers, interests, and activity.
 * Used for "Who to Follow" widgets and discovery pages.
 *
 * @example
 * ```tsx
 * const { users, isLoading, refresh } = useSuggestedUsers({
 *   limit: 5,
 *   source: 'sidebar',
 * });
 * ```
 */
export function useSuggestedUsers({
  limit = 5,
  excludeIds = [],
  source = 'sidebar',
  enabled = true,
}: UseSuggestedUsersOptions = {}): UseSuggestedUsersReturn {
  const [users, setUsers] = useState<UserSuggestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuggestions = useCallback(async () => {
    // Validate input
    const validation = userSuggestionSchema.safeParse({
      limit,
      excludeIds,
      source,
    });

    if (!validation.success) {
      const err = new Error(validation.error.issues[0]?.message || 'Invalid suggestion parameters');
      setError(err);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        source,
      });

      if (excludeIds.length > 0) {
        excludeIds.forEach(id => queryParams.append('excludeIds[]', id));
      }

      const response = await fetch(`/api/users/suggestions?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user suggestions');
      }

      const data: UserSuggestionResponse[] = await response.json();
      setUsers(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, excludeIds, source]);

  const refresh = useCallback(async () => {
    await fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    if (enabled) {
      fetchSuggestions();
    }
  }, [enabled, fetchSuggestions]);

  return {
    users,
    isLoading,
    error,
    refresh,
  };
}
