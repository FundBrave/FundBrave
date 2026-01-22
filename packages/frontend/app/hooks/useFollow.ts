"use client";

import { useState, useCallback, useRef } from 'react';
import { useFollowUserMutation, useUnfollowUserMutation } from '@/app/generated/graphql';

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
 * Manages follow/unfollow state with optimistic UI updates using GraphQL.
 * Automatically reverts state if mutation fails.
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
  const [error, setError] = useState<Error | null>(null);

  // Debounce timer to prevent rapid clicks
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [followUserMutation, { loading: followLoading }] = useFollowUserMutation();
  const [unfollowUserMutation, { loading: unfollowLoading }] = useUnfollowUserMutation();

  const isLoading = followLoading || unfollowLoading;

  const performFollowAction = useCallback(async (action: 'follow' | 'unfollow') => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Store previous state for rollback
    const previousIsFollowing = isFollowing;
    const previousFollowerCount = followerCount;

    // Optimistic update
    const newIsFollowing = action === 'follow';
    setIsFollowing(newIsFollowing);
    setFollowerCount(prev => newIsFollowing ? prev + 1 : Math.max(0, prev - 1));
    setError(null);

    try {
      if (action === 'follow') {
        await followUserMutation({
          variables: { userId },
          optimisticResponse: {
            followUser: true,
          },
          update: (cache) => {
            // Update user cache if needed
            cache.modify({
              id: cache.identify({ __typename: 'User', id: userId }),
              fields: {
                isFollowedByMe: () => true,
                followersCount: (prev: number) => prev + 1,
              },
            });
          },
        });
      } else {
        await unfollowUserMutation({
          variables: { userId },
          optimisticResponse: {
            unfollowUser: true,
          },
          update: (cache) => {
            // Update user cache if needed
            cache.modify({
              id: cache.identify({ __typename: 'User', id: userId }),
              fields: {
                isFollowedByMe: () => false,
                followersCount: (prev: number) => Math.max(0, prev - 1),
              },
            });
          },
        });
      }

      onSuccess?.(newIsFollowing);
    } catch (err) {
      // Rollback optimistic update
      setIsFollowing(previousIsFollowing);
      setFollowerCount(previousFollowerCount);

      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      onError?.(errorObj);
      console.error(`Error ${action}ing user:`, err);
    }
  }, [userId, isFollowing, followerCount, followUserMutation, unfollowUserMutation, onSuccess, onError]);

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
