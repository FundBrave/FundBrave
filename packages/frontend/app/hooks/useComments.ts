"use client";

import { useState } from "react";
import { useGetPostCommentsQuery } from "@/app/generated/graphql";
import type {
  CommentThread,
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
 * useComments - Fetch comments with pagination using GraphQL
 * Implements offset-based pagination for infinite scroll
 */
export function useComments({
  postId,
  sortOrder = "newest",
  limit = 20,
  enabled = true,
}: UseCommentsOptions): UseCommentsReturn {
  const [offset, setOffset] = useState(0);

  const { data, loading, error, fetchMore: apolloFetchMore, refetch } = useGetPostCommentsQuery({
    variables: {
      postId,
      limit,
      offset: 0,
    },
    skip: !enabled || !postId,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Transform GraphQL data to CommentThread format
  // Backend returns 'postComments' with 'items' array of root comments with nested replies
  const threads: CommentThread[] = data?.postComments?.items?.map((comment) => {
    const rootComment = {
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

    const replies = comment.replies?.map((reply) => ({
      id: reply.id,
      postId: postId,
      parentId: comment.id,
      author: {
        id: reply.author.id,
        name: reply.author.displayName || reply.author.username || "",
        username: reply.author.username || "",
        avatar: reply.author.avatarUrl || "",
        isVerified: reply.author.isVerifiedCreator || false,
      },
      content: reply.content,
      likesCount: reply.likesCount || 0,
      repliesCount: 0,
      createdAt: reply.createdAt,
      isLiked: reply.isLiked || false,
      replies: [],
    })) || [];

    return {
      root: rootComment,
      replies,
      totalRepliesCount: replies.length,
      nestedReplies: {},
    };
  }) || [];

  const hasMore = data?.postComments?.hasMore || false;
  const totalCount = data?.postComments?.total || 0;
  // Use offset as pseudo-cursor for pagination tracking
  const cursor = hasMore ? String(offset + limit) : undefined;

  const fetchMore = async () => {
    if (!hasMore || loading) return;

    const newOffset = offset + limit;

    try {
      await apolloFetchMore({
        variables: {
          postId,
          limit,
          offset: newOffset,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;

          return {
            postComments: {
              ...fetchMoreResult.postComments,
              items: [
                ...(prev.postComments?.items || []),
                ...(fetchMoreResult.postComments?.items || []),
              ],
            },
          };
        },
      });
      setOffset(newOffset);
    } catch (err) {
      console.error("Error fetching more comments:", err);
    }
  };

  return {
    threads,
    isLoading: loading,
    isError: !!error,
    error: error || null,
    hasMore,
    cursor,
    totalCount,
    fetchMore,
    refetch: async () => {
      setOffset(0);
      await refetch();
    },
  };
}
