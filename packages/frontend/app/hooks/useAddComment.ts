"use client";

import { useCallback } from "react";
import { useCreateCommentMutation } from "@/app/generated/graphql";
import type { Comment } from "@/app/types/comment";

interface UseAddCommentReturn {
  addComment: (
    options: {
      postId?: string;
      fundraiserId?: string;
      content: string;
      parentId?: string;
    }
  ) => Promise<Comment | null>;
  isAdding: boolean;
  error: Error | null;
}

/**
 * useAddComment - Add a comment with optimistic update using GraphQL
 * Supports both post and fundraiser comments
 */
export function useAddComment(): UseAddCommentReturn {
  const [createCommentMutation, { loading: isAdding, error }] = useCreateCommentMutation();

  const addComment = useCallback(
    async ({ postId, fundraiserId, content, parentId }: {
      postId?: string;
      fundraiserId?: string;
      content: string;
      parentId?: string;
    }): Promise<Comment | null> => {
      try {
        const result = await createCommentMutation({
          variables: {
            input: {
              postId,
              fundraiserId,
              content,
              parentId,
            },
          },
          optimisticResponse: {
            createComment: {
              __typename: 'Comment',
              id: `temp-${Date.now()}`,
              postId: postId || null,
              parentId: parentId || null,
              content,
              likesCount: 0,
              isLiked: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              author: {
                __typename: 'PostAuthor',
                id: 'temp-author',
                username: 'you',
                displayName: 'You',
                avatarUrl: '',
                walletAddress: '',
                isVerifiedCreator: false,
              },
              replies: [],
            },
          },
          update: (cache, { data }) => {
            if (!data?.createComment) return;

            // Update post's replyCount if this is a post comment
            if (postId) {
              cache.modify({
                id: cache.identify({ __typename: 'Post', id: postId }),
                fields: {
                  replyCount: (prev: number) => prev + 1,
                },
              });
            }

            // Note: We rely on refetchQueries to update the comment tree
            // to avoid duplicate replies from manual cache updates
          },
          refetchQueries: postId ? ['GetPostComments'] : fundraiserId ? ['GetFundraiserComments'] : [],
        });

        if (result.data?.createComment) {
          // Transform to expected Comment format
          const comment = result.data.createComment;
          return {
            id: comment.id,
            postId: comment.postId,
            parentId: comment.parentId || undefined,
            author: {
              id: comment.author.id,
              name: comment.author.displayName || comment.author.username || "",
              username: comment.author.username || "",
              avatar: comment.author.avatarUrl || "",
              isVerified: comment.author.isVerifiedCreator || false,
            },
            content: comment.content,
            likesCount: comment.likesCount || 0,
            repliesCount: comment.replies?.length || 0,
            createdAt: comment.createdAt,
            isLiked: comment.isLiked || false,
            replies: [],
          };
        }

        return null;
      } catch (err) {
        console.error("Error adding comment:", err);
        return null;
      }
    },
    [createCommentMutation]
  );

  return {
    addComment,
    isAdding,
    error: error || null,
  };
}
