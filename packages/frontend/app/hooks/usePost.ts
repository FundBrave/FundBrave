"use client";

import { useState, useEffect, useCallback } from "react";

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
    isFollowing: boolean;
  };
  createdAt: string;
  updatedAt: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  canEdit: boolean;
  canDelete: boolean;
  type: "community" | "campaign_update" | "campaign_share";
  media?: Array<{
    id: string;
    type: "image" | "video" | "link";
    url: string;
    thumbnailUrl?: string;
    altText?: string;
  }>;
  campaign?: {
    id: string;
    title: string;
    suggestedAmount?: number;
  };
}

interface UsePostOptions {
  postId: string;
  enabled?: boolean;
}

interface UsePostReturn {
  post: Post | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * usePost - Fetch a single post by ID
 */
export function usePost({ postId, enabled = true }: UsePostOptions): UsePostReturn {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPost = useCallback(async () => {
    if (!enabled || !postId) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/posts/${postId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Post not found");
        }
        throw new Error("Failed to fetch post");
      }

      const data: Post = await response.json();
      setPost(data);
    } catch (err) {
      setIsError(true);
      setError(err as Error);
      console.error("Error fetching post:", err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, enabled]);

  const refetch = useCallback(async () => {
    await fetchPost();
  }, [fetchPost]);

  // Initial fetch
  useEffect(() => {
    if (enabled && postId) {
      fetchPost();
    }
  }, [postId, enabled, fetchPost]);

  return {
    post,
    isLoading,
    isError,
    error,
    refetch,
  };
}
