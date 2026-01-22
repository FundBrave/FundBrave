/**
 * usePosts Hooks
 * Hooks for social posts operations via GraphQL
 */

import { useState } from 'react';
import {
  useGetFeedQuery,
  useGetPostQuery,
  useGetPostsQuery,
  useGetUserPostsQuery,
  useGetPostCommentsQuery,
  useGetTrendingHashtagsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useRepostMutation,
  useRemoveRepostMutation,
  useBookmarkPostMutation,
  useRemoveBookmarkMutation,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  FeedType,
  TrendingPeriod,
} from '@/app/generated/graphql';

// Hook for fetching feed (home, following, explore)
export function useFeed(feedType: FeedType = 'HOME', limit: number = 20) {
  const { data, loading, error, refetch, fetchMore } = useGetFeedQuery({
    variables: {
      feedType,
      limit,
    },
    fetchPolicy: 'cache-and-network',
  });

  const loadMore = () => {
    if (data?.feed?.hasMore && data?.feed?.nextCursor) {
      fetchMore({
        variables: {
          cursor: data.feed.nextCursor,
        },
      });
    }
  };

  return {
    posts: data?.feed?.posts || [],
    hasMore: data?.feed?.hasMore || false,
    isLoading: loading,
    error: error?.message || null,
    refetch,
    loadMore,
  };
}

// Hook for fetching a single post
export function usePost(postId: string) {
  const { data, loading, error, refetch } = useGetPostQuery({
    variables: { id: postId },
    skip: !postId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    post: data?.post || null,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching user's posts
export function useUserPosts(userId: string, limit: number = 20) {
  const { data, loading, error, refetch } = useGetUserPostsQuery({
    variables: {
      userId,
      limit,
      offset: 0,
    },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    posts: data?.userPosts?.items || [],
    total: data?.userPosts?.total || 0,
    hasMore: data?.userPosts?.hasMore || false,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching post comments
export function usePostComments(postId: string, limit: number = 20) {
  const { data, loading, error, refetch } = useGetPostCommentsQuery({
    variables: {
      postId,
      limit,
      offset: 0,
    },
    skip: !postId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    comments: data?.postComments?.items || [],
    total: data?.postComments?.total || 0,
    hasMore: data?.postComments?.hasMore || false,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching trending hashtags
export function useTrendingHashtags(limit: number = 10, period: TrendingPeriod = 'TWENTY_FOUR_HOURS') {
  const { data, loading, error, refetch } = useGetTrendingHashtagsQuery({
    variables: {
      limit,
      period,
    },
    fetchPolicy: 'cache-and-network',
  });

  return {
    hashtags: data?.trendingHashtags || [],
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for post actions (create, update, delete)
export function usePostActions() {
  const [createPostMutation, { loading: isCreating }] = useCreatePostMutation();
  const [updatePostMutation, { loading: isUpdating }] = useUpdatePostMutation();
  const [deletePostMutation, { loading: isDeleting }] = useDeletePostMutation();
  const [likePostMutation] = useLikePostMutation();
  const [unlikePostMutation] = useUnlikePostMutation();
  const [repostMutation] = useRepostMutation();
  const [removeRepostMutation] = useRemoveRepostMutation();
  const [bookmarkPostMutation] = useBookmarkPostMutation();
  const [removeBookmarkMutation] = useRemoveBookmarkMutation();

  const [error, setError] = useState<string | null>(null);

  const createPost = async (content: string, fundraiserId?: string) => {
    setError(null);
    try {
      const result = await createPostMutation({
        variables: {
          input: {
            content,
            fundraiserId,
          },
        },
      });
      return result.data?.createPost || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      return null;
    }
  };

  const updatePost = async (postId: string, content: string) => {
    setError(null);
    try {
      const result = await updatePostMutation({
        variables: {
          postId,
          input: {
            content,
          },
        },
      });
      return result.data?.updatePost || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post';
      setError(errorMessage);
      return null;
    }
  };

  const deletePost = async (postId: string) => {
    setError(null);
    try {
      await deletePostMutation({
        variables: { postId },
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete post';
      setError(errorMessage);
      return false;
    }
  };

  const likePost = async (postId: string) => {
    try {
      await likePostMutation({
        variables: { postId },
        optimisticResponse: {
          likePost: true,
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      await unlikePostMutation({
        variables: { postId },
        optimisticResponse: {
          unlikePost: true,
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    return isLiked ? await unlikePost(postId) : await likePost(postId);
  };

  const repost = async (postId: string, comment?: string) => {
    try {
      await repostMutation({
        variables: {
          input: {
            postId,
            comment,
          },
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const removeRepost = async (postId: string) => {
    try {
      await removeRepostMutation({
        variables: { postId },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const toggleRepost = async (postId: string, isReposted: boolean, comment?: string) => {
    return isReposted ? await removeRepost(postId) : await repost(postId, comment);
  };

  const bookmarkPost = async (postId: string) => {
    try {
      await bookmarkPostMutation({
        variables: { postId },
        optimisticResponse: {
          bookmarkPost: true,
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const removeBookmark = async (postId: string) => {
    try {
      await removeBookmarkMutation({
        variables: { postId },
        optimisticResponse: {
          removeBookmark: true,
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const toggleBookmark = async (postId: string, isBookmarked: boolean) => {
    return isBookmarked ? await removeBookmark(postId) : await bookmarkPost(postId);
  };

  return {
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    toggleLike,
    repost,
    removeRepost,
    toggleRepost,
    bookmarkPost,
    removeBookmark,
    toggleBookmark,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  };
}

// Hook for comment actions
export function useCommentActions() {
  const [createCommentMutation, { loading: isCreating }] = useCreateCommentMutation();
  const [deleteCommentMutation, { loading: isDeleting }] = useDeleteCommentMutation();
  const [likeCommentMutation] = useLikeCommentMutation();
  const [unlikeCommentMutation] = useUnlikeCommentMutation();

  const [error, setError] = useState<string | null>(null);

  const createComment = async (postId: string, content: string, parentId?: string) => {
    setError(null);
    try {
      const result = await createCommentMutation({
        variables: {
          input: {
            postId,
            content,
            parentId,
          },
        },
      });
      return result.data?.createComment || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create comment';
      setError(errorMessage);
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    setError(null);
    try {
      await deleteCommentMutation({
        variables: { commentId },
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(errorMessage);
      return false;
    }
  };

  const likeComment = async (commentId: string) => {
    try {
      await likeCommentMutation({
        variables: { commentId },
        optimisticResponse: {
          likeComment: true,
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const unlikeComment = async (commentId: string) => {
    try {
      await unlikeCommentMutation({
        variables: { commentId },
        optimisticResponse: {
          unlikeComment: true,
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const toggleLike = async (commentId: string, isLiked: boolean) => {
    return isLiked ? await unlikeComment(commentId) : await likeComment(commentId);
  };

  return {
    createComment,
    deleteComment,
    likeComment,
    unlikeComment,
    toggleLike,
    isCreating,
    isDeleting,
    error,
  };
}
