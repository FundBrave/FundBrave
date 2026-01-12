"use client";

import { useState, useCallback } from "react";
import type { Comment, CreateCommentRequest, CreateCommentResponse } from "@/app/types/comment";

interface UseAddCommentReturn {
  addComment: (postId: string, content: string, parentId?: string) => Promise<Comment | null>;
  isAdding: boolean;
  error: Error | null;
}

/**
 * useAddComment - Add a comment with optimistic update
 */
export function useAddComment(): UseAddCommentReturn {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addComment = useCallback(
    async (postId: string, content: string, parentId?: string): Promise<Comment | null> => {
      setIsAdding(true);
      setError(null);

      try {
        const request: CreateCommentRequest = {
          postId,
          content,
          parentId,
        };

        // TODO: Replace with actual API call
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error("Failed to add comment");
        }

        const data: CreateCommentResponse = await response.json();

        // Return the created comment
        return data.comment;
      } catch (err) {
        setError(err as Error);
        console.error("Error adding comment:", err);
        return null;
      } finally {
        setIsAdding(false);
      }
    },
    []
  );

  return {
    addComment,
    isAdding,
    error,
  };
}
