"use client";

import { usePosts, Post } from "@/app/provider/PostsContext";
import { PostCard, fromContextPost } from "@/app/components/ui/post";

interface PostsTabProps {
  // Optional: pass posts externally (for non-context usage)
  posts?: Post[];
}

/**
 * PostsTab - List of user's posts with full interactivity
 * Uses the unified PostCard component for consistent rendering
 */
export default function PostsTab({ posts: externalPosts }: PostsTabProps) {
  const {
    posts: contextPosts,
    isLoading,
    likePost,
    unlikePost,
    addComment,
    likeComment,
    unlikeComment,
    replyToComment,
    deleteComment,
  } = usePosts();

  const posts = externalPosts || contextPosts;

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
