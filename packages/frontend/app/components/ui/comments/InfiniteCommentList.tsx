"use client";

import { useEffect, useRef } from "react";
import { CommentThread } from "./CommentThread";
import type { CommentThread as CommentThreadType } from "@/app/types/comment";
import type { CommentSortOrder } from "@/app/types/comment";
import { useComments } from "@/app/hooks/useComments";
import { useAddComment } from "@/app/hooks/useAddComment";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface InfiniteCommentListProps {
  postId: string;
  sortOrder: CommentSortOrder;
  highlightCommentId?: string;
  onCommentCountChange?: (count: number) => void;
  initialThreads?: CommentThreadType[];
  currentUserUsername?: string;
  creatorUsername?: string;
}

/**
 * InfiniteCommentList - Virtualized comment list with cursor pagination
 * Implements infinite scroll with Intersection Observer
 */
export function InfiniteCommentList({
  postId,
  sortOrder,
  highlightCommentId,
  onCommentCountChange,
  initialThreads = [],
  currentUserUsername,
  creatorUsername,
}: InfiniteCommentListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Use the useComments hook to fetch real comments
  const {
    threads,
    isLoading,
    isError,
    error: hookError,
    hasMore,
    totalCount,
    fetchMore,
    refetch,
  } = useComments({
    postId,
    sortOrder,
    limit: 20,
    enabled: true,
  });

  // Use the useAddComment hook for adding replies
  const { addComment } = useAddComment();

  const error = isError ? hookError?.message || "Failed to load comments" : null;

  // Update parent component with comment count
  useEffect(() => {
    if (totalCount !== undefined) {
      onCommentCountChange?.(totalCount);
    }
  }, [totalCount, onCommentCountChange]);

  // Reload when sort order changes
  useEffect(() => {
    refetch();
  }, [sortOrder, refetch]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchMore();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, fetchMore]);

  // Auto-scroll to highlighted comment
  useEffect(() => {
    if (highlightCommentId && threads.length > 0) {
      requestAnimationFrame(() => {
        const commentElement = document.getElementById(`comment-${highlightCommentId}`);
        if (commentElement) {
          const headerHeight = 56;
          const elementTop = commentElement.getBoundingClientRect().top;
          window.scrollBy({
            top: elementTop - headerHeight - 16,
            behavior: "smooth",
          });
        }
      });
    }
  }, [highlightCommentId, threads]);

  const handleReply = async (commentId: string, content: string) => {
    try {
      // Add reply with parentId (commentId is the parent)
      await addComment(postId, content, commentId);
      // The cache update in useAddComment hook should handle updating the UI
      // The refetchQueries will ensure the comment list is refreshed
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleLike = (commentId: string) => {
    // TODO: Implement like API call with optimistic update
    console.log("Like comment:", commentId);
  };

  const handleUnlike = (commentId: string) => {
    // TODO: Implement unlike API call with optimistic update
    console.log("Unlike comment:", commentId);
  };

  const handleShowMoreReplies = (commentId: string) => {
    // TODO: Implement fetch nested replies
    console.log("Show more replies for:", commentId);
  };

  const handleDelete = (commentId: string) => {
    // TODO: Implement delete API call with optimistic update
    console.log("Delete comment:", commentId);
  };

  // Loading state (initial)
  if (isLoading && threads.length === 0) {
    return (
      <div className="flex flex-col gap-4 py-8">
        {[...Array(3)].map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (threads.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-surface-sunken flex items-center justify-center">
          <svg
            className="w-8 h-8 text-foreground-muted"
            fill="none"
            strokeWidth="2"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          No comments yet
        </h3>
        <p className="text-sm text-foreground-muted">
          Be the first to share your thoughts!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Comment Threads */}
      {threads.map((thread) => (
        <CommentThread
          key={thread.root.id}
          comment={thread.root}
          replies={thread.replies}
          nestedReplies={thread.nestedReplies}
          onReply={handleReply}
          onLike={handleLike}
          onUnlike={handleUnlike}
          onShowMoreReplies={handleShowMoreReplies}
          onDelete={handleDelete}
          currentUserUsername={currentUserUsername}
          isHighlighted={thread.root.id === highlightCommentId}
          isCreator={thread.root.author.username === creatorUsername}
        />
      ))}

      {/* Loading More Indicator */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="flex items-center justify-center py-4"
        >
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Loader2 size={16} className="animate-spin" />
              <span>Loading more comments...</span>
            </div>
          )}
        </div>
      )}

      {/* End of List */}
      {!hasMore && threads.length > 0 && (
        <div className="text-center py-4 text-sm text-foreground-muted border-t border-border-subtle">
          No more comments
        </div>
      )}
    </div>
  );
}

/**
 * CommentSkeleton - Loading placeholder
 */
function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-surface-sunken" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-sunken rounded w-1/4" />
        <div className="h-3 bg-surface-sunken rounded w-full" />
        <div className="h-3 bg-surface-sunken rounded w-3/4" />
        <div className="flex gap-4 mt-2">
          <div className="h-3 bg-surface-sunken rounded w-12" />
          <div className="h-3 bg-surface-sunken rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default InfiniteCommentList;
