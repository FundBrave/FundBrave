"use client";

import { useParams } from "next/navigation";
import { usePosts, Post } from "@/app/provider/PostsContext";
import { useGetUserPostsQuery } from "@/app/generated/graphql";
import { PostCard, fromContextPost } from "@/app/components/ui/post";

interface PostsTabProps {
  // Optional: pass username externally
  username?: string;
  // Optional: pass posts externally (for non-context usage)
  posts?: Post[];
}

/**
 * PostsTab - List of user's posts with full interactivity
 * Uses GraphQL to fetch user posts
 * Uses the unified PostCard component for consistent rendering
 */
export default function PostsTab({ username: externalUsername, posts: externalPosts }: PostsTabProps) {
  const params = useParams();
  const username = externalUsername || (params.username as string);

  const {
    likePost,
    unlikePost,
    addComment,
    likeComment,
    unlikeComment,
    replyToComment,
    deleteComment,
  } = usePosts();

  // Fetch user posts from GraphQL
  const { data, loading, error } = useGetUserPostsQuery({
    variables: {
      userId: username, // API expects userId, not username
      limit: 50,
      offset: 0,
    },
    skip: !username || !!externalPosts,
    fetchPolicy: 'cache-and-network',
  });

  // Transform GraphQL data to Post format
  const graphqlPosts: Post[] = data?.userPosts?.items?.map((post) => ({
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

  const posts = externalPosts || graphqlPosts;
  const isLoading = loading;

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="mb-2">Failed to load posts</p>
        <p className="text-sm">Please try again later</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p className="mb-2">No posts yet</p>
        <p className="text-sm">Create your first post using the button below!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={fromContextPost(post)}
          variant="default"
          enableComments
          onLike={(postId) => likePost(postId)}
          onUnlike={(postId) => unlikePost(postId)}
          onAddComment={(postId, content) => addComment(postId, content)}
          onLikeComment={(postId, commentId) => likeComment(postId, commentId)}
          onUnlikeComment={(postId, commentId) => unlikeComment(postId, commentId)}
          onReplyToComment={(postId, commentId, content) => replyToComment(postId, commentId, content)}
          onDeleteComment={(postId, commentId) => deleteComment(postId, commentId)}
        />
      ))}
    </div>
  );
}

// Also export the PostCard component for direct usage elsewhere
export { PostCard } from "@/app/components/ui/post";
