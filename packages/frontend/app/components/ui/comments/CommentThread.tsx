"use client";

import { useState } from "react";
import { CommentCard } from "./CommentCard";
import { ThreadConnector } from "./ThreadConnector";
import type { Comment as CommentType } from "@/app/types/comment";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface CommentThreadProps {
  comment: CommentType;
  replies: CommentType[];
  nestedReplies?: Record<string, CommentType[]>;
  maxVisibleReplies?: number;
  onReply?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  onUnlike?: (commentId: string) => void;
  onShowMoreReplies?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  isLoadingNested?: boolean;
  currentUserUsername?: string;
  isHighlighted?: boolean;
  isCreator?: boolean;
}

/**
 * CommentThread - Renders a root comment with its replies
 * Implements Twitter-style 1-level visible nesting
 */
export function CommentThread({
  comment,
  replies = [],
  nestedReplies = {},
  maxVisibleReplies = 3,
  onReply,
  onLike,
  onUnlike,
  onShowMoreReplies,
  onDelete,
  isLoadingNested = false,
  currentUserUsername,
  isHighlighted = false,
  isCreator = false,
}: CommentThreadProps) {
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Visible replies (first-level only)
  const visibleReplies = replies.slice(0, maxVisibleReplies);
  const hiddenRepliesCount = Math.max(0, replies.length - maxVisibleReplies);

  const handleShowMore = () => {
    if (onShowMoreReplies) {
      onShowMoreReplies(comment.id);
    }
  };

  const toggleExpandReply = (replyId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(replyId)) {
        next.delete(replyId);
      } else {
        next.add(replyId);
      }
      return next;
    });
  };

  const hasNestedReplies = (replyId: string) => {
    return nestedReplies[replyId] && nestedReplies[replyId].length > 0;
  };

  return (
    <div className="flex flex-col">
      {/* Root Comment */}
      <div
        id={`comment-${comment.id}`}
        className={cn(
          "transition-colors duration-300",
          isHighlighted && "bg-primary-500/10 rounded-lg -mx-2 px-2 py-1"
        )}
      >
        <CommentCard
          comment={comment}
          onLike={() => onLike?.(comment.id)}
          onUnlike={() => onUnlike?.(comment.id)}
          onReply={(_, content) => onReply?.(comment.id, content)}
          onDelete={onDelete}
          depth={0}
          currentUserUsername={currentUserUsername}
          isCreator={isCreator}
        />
      </div>

      {/* Thread Connector and Replies */}
      {replies.length > 0 && (
        <ThreadConnector replyCount={replies.length} isExpanded={true}>
          <div className="ml-8 mt-3 space-y-3">
            {/* Visible Replies */}
            {visibleReplies.map((reply) => (
              <div key={reply.id}>
                <div
                  id={`comment-${reply.id}`}
                  className="relative"
                >
                  {/* Horizontal connector to reply */}
                  <div
                    className="absolute -left-8 top-4 w-8 h-0.5 bg-border-subtle"
                    aria-hidden="true"
                  />

                  <CommentCard
                    comment={reply}
                    onLike={() => onLike?.(reply.id)}
                    onUnlike={() => onUnlike?.(reply.id)}
                    onReply={(_, content) => onReply?.(reply.id, content)}
                    onDelete={onDelete}
                    depth={1}
                    isReply={true}
                    currentUserUsername={currentUserUsername}
                  />
                </div>

                {/* Nested Replies (depth 2+) */}
                {hasNestedReplies(reply.id) && (
                  <div className="ml-8 mt-2">
                    {expandedReplies.has(reply.id) ? (
                      <>
                        {nestedReplies[reply.id].map((nestedReply) => (
                          <div key={nestedReply.id} className="mb-3">
                            <CommentCard
                              comment={nestedReply}
                              onLike={() => onLike?.(nestedReply.id)}
                              onUnlike={() => onUnlike?.(nestedReply.id)}
                              onReply={(_, content) => onReply?.(nestedReply.id, content)}
                              onDelete={onDelete}
                              depth={2}
                              isReply={true}
                              currentUserUsername={currentUserUsername}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => toggleExpandReply(reply.id)}
                          className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
                        >
                          <ChevronUp size={12} />
                          Hide replies
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleExpandReply(reply.id)}
                        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        <ChevronDown size={12} />
                        Show {nestedReplies[reply.id].length} {nestedReplies[reply.id].length === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Show More Replies Button */}
            {hiddenRepliesCount > 0 && (
              <div className="relative">
                <div
                  className="absolute -left-8 top-2 w-4 h-0.5 bg-border-subtle"
                  aria-hidden="true"
                />
                <button
                  onClick={handleShowMore}
                  disabled={isLoadingNested}
                  className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
                >
                  {isLoadingNested ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Loading replies...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} />
                      Show {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </ThreadConnector>
      )}
    </div>
  );
}

export default CommentThread;
