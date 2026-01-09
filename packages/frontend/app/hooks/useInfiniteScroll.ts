"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Whether infinite scroll is enabled */
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  /** Ref to attach to the sentinel element */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** Whether more content is being loaded */
  isLoading: boolean;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
}

/**
 * Hook for implementing Twitter-like infinite scroll pagination
 * Uses Intersection Observer API to detect when user scrolls to bottom
 *
 * @example
 * ```tsx
 * const { sentinelRef, isLoading, setIsLoading } = useInfiniteScroll({
 *   onLoadMore: async () => {
 *     setIsLoading(true);
 *     await fetchMorePosts();
 *     setIsLoading(false);
 *   },
 *   enabled: hasMore
 * });
 *
 * return (
 *   <div>
 *     {posts.map(post => <PostCard key={post.id} post={post} />)}
 *     <div ref={sentinelRef} />
 *     {isLoading && <Spinner />}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll(
  onLoadMore: () => void | Promise<void>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 0.1, rootMargin = "100px", enabled = true } = options;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && enabled && !isLoading) {
        await onLoadMore();
      }
    },
    [onLoadMore, enabled, isLoading]
  );

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Don't create observer if disabled
    if (!enabled) return;

    // Create new observer
    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    // Observe sentinel element
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    // Cleanup on unmount
    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, threshold, rootMargin, enabled]);

  return {
    sentinelRef: sentinelRef as React.RefObject<HTMLDivElement>,
    isLoading,
    setIsLoading,
  };
}

export default useInfiniteScroll;
