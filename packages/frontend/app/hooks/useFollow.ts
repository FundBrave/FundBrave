"use client";

import { useState, useCallback, useRef } from 'react';
import { followActionSchema, type FollowResponse } from '@/app/components/social/schemas';

interface UseFollowOptions {
  userId: string;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  onSuccess?: (isFollowing: boolean) => void;
  onError?: (error: Error) => void;
}

interface UseFollowReturn {
  isFollowing: boolean;
  followerCount: number;
  isLoading: boolean;
  error: Error | null;
  toggleFollow: () => Promise<void>;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
}

/**
 * useFollow Hook
 *
 * Manages follow/unfollow state with optimistic UI updates.
 * Automatically reverts state if API call fails.
 * Includes debouncing to prevent rapid clicks.
 *
 * @example
 * ```tsx
 * const { isFollowing, followerCount, isLoading, toggleFollow } = useFollow({
 *   userId: "user-id",
 *   initialIsFollowing: false,
 *   initialFollowerCount: 120,
 * });
 * ```
 */
export function useFollow({
  userId,
  initialIsFollowing = false,
  initialFollowerCount = 0,
  onSuccess,
  onError,
}: UseFollowOptions): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounce timer to prevent rapid clicks
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRequestRef = useRef<AbortController | null>(null);

  const performFollowAction = useCallback(async (action: 'follow' | 'unfollow') => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Cancel any pending request
    if (pendingRequestRef.current) {
      pendingRequestRef.current.abort();
    }

    // Validate input
    const validation = followActionSchema.safeParse({
      targetUserId: userId,
      action,
    });

    if (!validation.success) {
      const err = new Error(validation.error.issues[0]?.message || 'Invalid user ID');
      setError(err);
      onError?.(err);
      return;
    }

    // Store previous state for rollback
    const previousIsFollowing = isFollowing;
    const previousFollowerCount = followerCount;

    // Optimistic update
    const newIsFollowing = action === 'follow';
    setIsFollowing(newIsFollowing);
    setFollowerCount(prev => newIsFollowing ? prev + 1 : Math.max(0, prev - 1));
    setIsLoading(true);
    setError(null);

    // Create abort controller for this request
    const abortController = new AbortController();
    pendingRequestRef.current = abortController;

    try {
      // Simulate API call (replace with actual API endpoint)
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: action === 'follow' ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      const data: FollowResponse = await response.json();

      // Update with actual server data
      setIsFollowing(data.isFollowing);
      setFollowerCount(data.followerCount);

      onSuccess?.(data.isFollowing);
    } catch (err) {
      // Don't handle aborted requests as errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // Rollback optimistic update
      setIsFollowing(previousIsFollowing);
      setFollowerCount(previousFollowerCount);

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = null;
    }
  }, [userId, isFollowing, followerCount, onSuccess, onError]);

  const toggleFollow = useCallback(async () => {
    // Debounce to prevent rapid clicks (300ms)
    return new Promise<void>((resolve) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        await performFollowAction(isFollowing ? 'unfollow' : 'follow');
        resolve();
      }, 300);
    });
  }, [isFollowing, performFollowAction]);

  const follow = useCallback(async () => {
    if (!isFollowing) {
      await performFollowAction('follow');
    }
  }, [isFollowing, performFollowAction]);

  const unfollow = useCallback(async () => {
    if (isFollowing) {
      await performFollowAction('unfollow');
    }
  }, [isFollowing, performFollowAction]);

  return {
    isFollowing,
    followerCount,
    isLoading,
    error,
    toggleFollow,
    follow,
    unfollow,
  };
}
