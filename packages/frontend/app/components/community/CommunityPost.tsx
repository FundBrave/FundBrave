"use client";

import { PostCard, fromCommunityPost } from "@/app/components/ui/post";
import type { CommunityPostData } from "@/app/types/community";

// Re-export types for backward compatibility
export type { CommunityPostData } from "@/app/types/community";

interface CommunityPostProps {
  post: CommunityPostData;
  onFollow?: (authorId: string) => void;
  onReact?: (postId: string, emoji: string) => void;
  onComment?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  onUnlikeComment?: (postId: string, commentId: string) => void;
  onReplyToComment?: (postId: string, commentId: string, content: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

/**
 * CommunityPost - Community feed post using unified PostCard component
 * Wrapper for backward compatibility with existing CommunityFeed
 */
export function CommunityPost({
  post,
  onFollow,
  onComment,
  onLike,
  onUnlike,
  onAddComment,
  onLikeComment,
  onUnlikeComment,
  onReplyToComment,
  onDeleteComment,
}: CommunityPostProps) {
  return (
    <PostCard
      post={fromCommunityPost(post)}
      variant="community"
      showFollowButton
      showAuthorRole
      showAvatarBorder
      truncateAt={200}
      enableComments
      onFollow={onFollow}
      onComment={onComment}
      onLike={onLike}
      onUnlike={onUnlike}
      onAddComment={onAddComment}
      onLikeComment={onLikeComment}
      onUnlikeComment={onUnlikeComment}
      onReplyToComment={onReplyToComment}
      onDeleteComment={onDeleteComment}
    />
  );
}

export default CommunityPost;
