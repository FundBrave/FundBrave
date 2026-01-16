"use client";

import { useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePosts } from "@/app/provider/PostsContext";
import { useGetFeedQuery } from "@/app/generated/graphql";
import { PostCard, fromContextPost } from "@/app/components/profile";
import { Spinner } from "@/app/components/ui/Spinner";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import type { FeedListProps, FeedFilter } from "@/app/types/home";
import type { Post } from "@/app/provider/PostsContext";

/**
 * FeedList - Main feed with posts and infinite scroll
 * Uses GraphQL to fetch feed data
 * Twitter-like infinite scroll pagination
 */

export function FeedList({ filter = "recent", className }: FeedListProps) {
  const {
    likePost,
    unlikePost,
    addComment,
    likeComment,
    unlikeComment,
    replyToComment,
    deleteComment,
  } = usePosts();

  // Fetch feed from GraphQL
  const { data, loading, error, fetchMore } = useGetFeedQuery({
    variables: {
      feedType: 'HOME',
      limit: 20,
      cursor: undefined,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Transform GraphQL data to Post format
  const posts: Post[] = data?.feed?.posts?.map((post) => ({
    id: post.id,
    content: post.content || "",
    imageUrl: post.media?.[0]?.url, // Use media array from GraphQL
    author: {
      name: post.author.displayName || post.author.username || "Unknown",
      username: post.author.username || "",
      avatar: post.author.avatarUrl || "",
      isVerified: post.author.isVerifiedCreator || false,
    },
    likesCount: post.likesCount || 0,
    commentsCount: post.replyCount || 0, // GraphQL schema uses replyCount
    sharesCount: post.repostsCount || 0, // GraphQL schema uses repostsCount
    viewsCount: post.viewsCount || 0,
    createdAt: post.createdAt,
    isLiked: post.isLiked || false, // GraphQL schema uses isLiked
    comments: [],
  })) || [];

  const hasMore = data?.feed?.hasMore || false;
  const cursor = data?.feed?.nextCursor;

  // Load more posts callback
  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor) return;

    try {
      await fetchMore({
        variables: {
          feedType: 'HOME',
          limit: 20,
          cursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;

          return {
            feed: {
              ...fetchMoreResult.feed,
              posts: [
                ...(prev.feed?.posts || []),
                ...(fetchMoreResult.feed?.posts || []),
              ],
            },
          };
        },
      });
    } catch (err) {
      console.error("Error loading more posts:", err);
    }
  }, [hasMore, cursor, fetchMore]);

  // Infinite scroll hook
  const { sentinelRef, isLoading: isLoadingMore, setIsLoading } = useInfiniteScroll(
    async () => {
      if (!hasMore || isLoadingMore || loading) return;
      setIsLoading(true);
      await loadMore();
      setIsLoading(false);
    },
    { enabled: hasMore && !loading }
  );

  // Sort posts based on filter (client-side sorting for now)
  const sortedPosts = [...posts].sort((a, b) => {
    switch (filter) {
      case "popular":
        return b.likesCount - a.likesCount;
      case "most_viewed":
        return b.viewsCount - a.viewsCount;
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Handlers for PostCard
  const handleLike = useCallback(
    (postId: string) => {
      likePost(postId);
    },
    [likePost]
  );

  const handleUnlike = useCallback(
    (postId: string) => {
      unlikePost(postId);
    },
    [unlikePost]
  );

  const handleAddComment = useCallback(
    (postId: string, content: string) => {
      addComment(postId, content);
    },
    [addComment]
  );

  const handleLikeComment = useCallback(
    (postId: string, commentId: string) => {
      likeComment(postId, commentId);
    },
    [likeComment]
  );

  const handleUnlikeComment = useCallback(
    (postId: string, commentId: string) => {
      unlikeComment(postId, commentId);
    },
    [unlikeComment]
  );

  const handleReplyToComment = useCallback(
    (postId: string, commentId: string, content: string) => {
      replyToComment(postId, commentId, content);
    },
    [replyToComment]
  );

  const handleDeleteComment = useCallback(
    (postId: string, commentId: string) => {
      deleteComment(postId, commentId);
    },
    [deleteComment]
  );

  // Error state
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <p className="text-red-400 text-sm">Failed to load feed</p>
        <p className="text-white/30 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  // Loading state
  if (loading && posts.length === 0) {
    return (
      <div className={cn("flex justify-center py-12", className)}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (!loading && posts.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <p className="text-white/40 text-sm">No posts yet</p>
        <p className="text-white/30 text-sm mt-1">Be the first to create a post!</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4")}>
      {/* Posts List */}
      {sortedPosts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <PostCard
            post={fromContextPost(post)}
            variant="default"
            enableComments
            onLike={handleLike}
            onUnlike={handleUnlike}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            onUnlikeComment={handleUnlikeComment}
            onReplyToComment={handleReplyToComment}
            onDeleteComment={handleDeleteComment}
          />
        </motion.div>
      ))}

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      )}

      {/* End of Feed Message */}
      {!hasMore && posts.length > 0 && (
        <div className="flex justify-center py-6">
          <p className="text-white/30 text-sm">You&apos;ve reached the end</p>
        </div>
      )}
    </div>
  );
}

export default FeedList;
