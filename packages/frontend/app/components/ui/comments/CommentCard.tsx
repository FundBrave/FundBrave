"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import { CommentInput } from "./CommentInput";
import type { Comment } from "@/app/provider/PostsContext";

// Format relative time (e.g., "2h ago", "3d ago")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

interface CommentCardProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
  onReply: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  depth?: number;
  maxDepth?: number;
  currentUserUsername?: string;
}

/**
 * CommentCard - Displays a single comment with GSAP micro-interactions
 */
export function CommentCard({
  comment,
  onLike,
  onUnlike,
  onReply,
  onDelete,
  depth = 0,
  maxDepth = 3,
  currentUserUsername = "janesmith",
}: CommentCardProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // GSAP refs
  const likeIconRef = useRef<SVGSVGElement>(null);
  const replyIconRef = useRef<SVGSVGElement>(null);
  const menuIconRef = useRef<SVGSVGElement>(null);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([likeIconRef.current, replyIconRef.current, menuIconRef.current]);
    };
  }, []);

  const isOwnComment = comment.author.username === currentUserUsername;
  const canNestMore = depth < maxDepth;

  // Animate like with GSAP
  const animateLike = useCallback(() => {
    if (!likeIconRef.current) return;

    gsap.timeline()
      .to(likeIconRef.current, {
        scale: 1.5,
        duration: 0.15,
        ease: "back.out(3)",
      })
      .to(likeIconRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "elastic.out(1, 0.5)",
      });
  }, []);

  // Animate reply icon
  const animateReply = useCallback(() => {
    if (!replyIconRef.current) return;

    gsap.to(replyIconRef.current, {
      rotation: -15,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.set(replyIconRef.current, { rotation: 0 });
      },
    });
  }, []);

  const handleLikeClick = () => {
    animateLike();
    if (comment.isLiked) {
      onUnlike(comment.id);
    } else {
      onLike(comment.id);
    }
  };

  const handleReplyClick = () => {
    animateReply();
    setShowReplyInput(!showReplyInput);
  };

  const handleReply = (content: string) => {
    onReply(comment.id, content);
    setShowReplyInput(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(comment.id);
    }
    setShowMenu(false);
  };

  return (
    <div className={cn("flex flex-col gap-3", depth > 0 && "ml-8 pl-4 border-l border-border-subtle/50")}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-surface-sunken border border-border-subtle flex-shrink-0 overflow-hidden">
          <img
            src={comment.author.avatar}
            alt={comment.author.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm hover:underline cursor-pointer">
              {comment.author.name}
            </span>
            {comment.author.isVerified && (
              <svg
                className="w-3.5 h-3.5 text-primary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.04 4.3l-3.71-3.71 1.41-1.41 2.3 2.3 5.3-5.3 1.41 1.41-6.71 6.71z" />
              </svg>
            )}
            <span className="text-text-tertiary text-xs">
              @{comment.author.username}
            </span>
            <span className="text-text-tertiary text-xs">•</span>
            <span className="text-text-tertiary text-xs">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* Comment Content */}
          <p className="text-foreground text-sm mt-1 leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            {/* Like */}
            <button
              onClick={handleLikeClick}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                comment.isLiked
                  ? "text-pink-500 hover:text-pink-400"
                  : "text-text-secondary hover:text-pink-500"
              )}
            >
              <Heart
                ref={likeIconRef}
                size={14}
                fill={comment.isLiked ? "currentColor" : "none"}
              />
              {comment.likesCount > 0 && comment.likesCount}
            </button>

            {/* Reply */}
            {canNestMore && (
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                <MessageCircle ref={replyIconRef} size={14} />
                Reply
              </button>
            )}

            {/* Menu (for own comments) */}
            {isOwnComment && onDelete && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded text-text-tertiary hover:text-text-secondary hover:bg-surface-overlay transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-surface-sunken border border-border-subtle rounded-lg shadow-xl overflow-hidden">
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {showReplyInput && (
        <div className="ml-11 animate-in fade-in slide-in-from-top-2 duration-200">
          <CommentInput
            placeholder={`Reply to @${comment.author.username}...`}
            onSubmit={handleReply}
            onCancel={() => setShowReplyInput(false)}
            isReply
            autoFocus
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies.length > 0 && (
        <div className="flex flex-col gap-3 mt-1">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onUnlike={onUnlike}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
              maxDepth={maxDepth}
              currentUserUsername={currentUserUsername}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentCard;
