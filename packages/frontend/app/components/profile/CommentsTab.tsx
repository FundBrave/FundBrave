"use client";

import Link from "next/link";
import { formatPostDate } from "@/lib/utils";

interface CommentAuthor {
  id: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface UserComment {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean | null;
  postId?: string | null;
  author: CommentAuthor;
}

interface CommentsTabProps {
  comments: UserComment[];
  isLoading?: boolean;
}

/**
 * CommentsTab - List of user's comments on posts
 */
export default function CommentsTab({ comments, isLoading }: CommentsTabProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-r-transparent"></div>
        <p className="text-text-secondary mt-2">Loading comments...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p className="text-lg font-medium">No comments yet</p>
        <p className="text-sm mt-1 text-text-tertiary">Comments you leave on posts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment) => {
        const authorName = comment.author.displayName || comment.author.username || "Anonymous";
        const avatarInitial = authorName.charAt(0).toUpperCase();

        return (
          <div key={comment.id} className="bg-surface-sunken/30 rounded-xl p-4 border border-border-subtle">
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                {comment.author.avatarUrl ? (
                  <img src={comment.author.avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  <span>{avatarInitial}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Author + date */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{authorName}</span>
                  {comment.author.username && (
                    <span className="text-text-tertiary text-sm">@{comment.author.username}</span>
                  )}
                  <span className="text-text-tertiary text-sm">·</span>
                  <span className="text-text-tertiary text-sm">{formatPostDate(comment.createdAt)}</span>
                </div>

                {/* Comment text */}
                <p className="text-foreground text-sm leading-relaxed">{comment.content}</p>

                {/* Footer */}
                <div className="flex items-center gap-4 mt-2 text-text-tertiary text-xs">
                  <span className="flex items-center gap-1">
                    <HeartIcon className={`w-3.5 h-3.5 ${comment.isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                    {comment.likesCount}
                  </span>
                  {comment.postId && (
                    <Link
                      href={`/community/post/${comment.postId}`}
                      className="hover:text-primary transition-colors"
                    >
                      View post →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
