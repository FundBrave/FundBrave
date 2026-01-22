"use client";

import { useCallback } from "react";
import { useLikeCommentMutation, useUnlikeCommentMutation } from "@/app/generated/graphql";

interface UseLikeCommentReturn {
  likeComment: (commentId: string) => Promise<boolean>;
  unlikeComment: (commentId: string) => Promise<boolean>;
  isLiking: boolean;
  error: Error | null;
}

/**
 * useLikeComment - Like/unlike a comment with optimistic update using GraphQL
 */
export function useLikeComment(): UseLikeCommentReturn {
  const [likeCommentMutation, { loading: isLiking, error: likeError }] = useLikeCommentMutation();
  const [unlikeCommentMutation, { loading: isUnliking, error: unlikeError }] = useUnlikeCommentMutation();

  const likeComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const result = await likeCommentMutation({
        variables: { commentId },
        optimisticResponse: {
          likeComment: true,
        },
        update: (cache) => {
          // Update the comment's isLiked status and likesCount in cache
          cache.modify({
            id: cache.identify({ __typename: 'Comment', id: commentId }),
            fields: {
              isLiked: () => true,
              likesCount: (prev: number) => prev + 1,
            },
          });
        },
      });

      return result.data?.likeComment ?? false;
    } catch (err) {
      console.error("Error liking comment:", err);
      return false;
    }
  }, [likeCommentMutation]);

  const unlikeComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const result = await unlikeCommentMutation({
        variables: { commentId },
        optimisticResponse: {
          unlikeComment: true,
        },
        update: (cache) => {
          // Update the comment's isLiked status and likesCount in cache
          cache.modify({
            id: cache.identify({ __typename: 'Comment', id: commentId }),
            fields: {
              isLiked: () => false,
              likesCount: (prev: number) => Math.max(0, prev - 1),
            },
          });
        },
      });

      return result.data?.unlikeComment ?? false;
    } catch (err) {
      console.error("Error unliking comment:", err);
      return false;
    }
  }, [unlikeCommentMutation]);

  return {
    likeComment,
    unlikeComment,
    isLiking: isLiking || isUnliking,
    error: likeError || unlikeError || null,
  };
}
