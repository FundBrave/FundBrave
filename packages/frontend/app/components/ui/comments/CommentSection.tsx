"use client";

import { CommentInput } from "./CommentInput";
import { CommentCard } from "./CommentCard";
import type { Comment } from "@/app/types/comment";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
  onUnlikeComment: (commentId: string) => void;
  onReplyToComment: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  showHeader?: boolean;
  className?: string;
}

/**
 * CommentSection - Complete comment section with input and list
 * 
 * Combines CommentInput and CommentCard components for a full
 * commenting experience on posts.
 */
export function CommentSection({
  postId,
  comments,
  onAddComment,
  onLikeComment,
  onUnlikeComment,
  onReplyToComment,
  onDeleteComment,
  showHeader = true,
  className,
}: CommentSectionProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      {showHeader && comments.length > 0 && (
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-text-secondary">
            {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
          </h4>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>
      )}

      {/* Comment Input */}
      <CommentInput
        placeholder="Write a comment..."
        onSubmit={onAddComment}
      />

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onLike={onLikeComment}
              onUnlike={onUnlikeComment}
              onReply={onReplyToComment}
              onDelete={onDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {comments.length === 0 && (
        <p className="text-center text-text-tertiary text-sm py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}

export default CommentSection;
