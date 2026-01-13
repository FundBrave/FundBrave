"use client";

import { useState, useCallback } from "react";

interface UseLikeCommentReturn {
  likeComment: (commentId: string) => Promise<boolean>;
  unlikeComment: (commentId: string) => Promise<boolean>;
  isLiking: boolean;
  error: Error | null;
}

/**
 * useLikeComment - Like/unlike a comment with optimistic update
 */
export function useLikeComment(): UseLikeCommentReturn {
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const likeComment = useCallback(async (commentId: string): Promise<boolean> => {
    setIsLiking(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like comment");
      }

      return true;
    } catch (err) {
      setError(err as Error);
      console.error("Error liking comment:", err);
      return false;
    } finally {
      setIsLiking(false);
    }
  }, []);

  const unlikeComment = useCallback(async (commentId: string): Promise<boolean> => {
    setIsLiking(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unlike comment");
      }

      return true;
    } catch (err) {
      setError(err as Error);
      console.error("Error unliking comment:", err);
      return false;
    } finally {
      setIsLiking(false);
    }
  }, []);

  return {
    likeComment,
    unlikeComment,
    isLiking,
    error,
  };
}
