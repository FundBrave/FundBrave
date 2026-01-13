"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  CommentThread,
  CommentListResponse,
  CommentSortOrder,
} from "@/app/types/comment";

interface UseCommentsOptions {
  postId: string;
  sortOrder?: CommentSortOrder;
  limit?: number;
  enabled?: boolean;
}

interface UseCommentsReturn {
  threads: CommentThread[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  cursor: string | undefined;
  totalCount: number;
  fetchMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * useComments - Fetch comments with pagination
 * Implements cursor-based pagination for infinite scroll
 */
export function useComments({
  postId,
  sortOrder = "newest",
  limit = 20,
  enabled = true,
}: UseCommentsOptions): UseCommentsReturn {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [totalCount, setTotalCount] = useState(0);

  const fetchComments = useCallback(
    async (reset = false) => {
      if (!enabled || isLoading) return;

      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        // TODO: Replace with actual API call
        const response = await fetch(
          `/api/posts/${postId}/comments?sort=${sortOrder}&cursor=${reset ? "" : cursor || ""}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }

        const data: CommentListResponse = await response.json();

        if (reset) {
          setThreads(data.threads);
        } else {
          setThreads((prev) => [...prev, ...data.threads]);
        }

        setCursor(data.cursor);
        setHasMore(data.hasMore);
        setTotalCount(data.totalCount);
      } catch (err) {
        setIsError(true);
        setError(err as Error);
        console.error("Error fetching comments:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [postId, sortOrder, limit, cursor, enabled, isLoading]
  );

  const fetchMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchComments(false);
    }
  }, [hasMore, isLoading, fetchComments]);

  const refetch = useCallback(async () => {
    setCursor(undefined);
    await fetchComments(true);
  }, [fetchComments]);

  // Initial fetch - intentionally omitting refetch from deps to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [refetch, enabled]);

  return {
    threads,
    isLoading,
    isError,
    error,
    hasMore,
    cursor,
    totalCount,
    fetchMore,
    refetch,
  };
}
