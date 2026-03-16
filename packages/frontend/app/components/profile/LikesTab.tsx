"use client";

import { formatPostDate } from "@/lib/utils";
import Link from "next/link";

interface PostAuthor {
  id: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isVerifiedCreator?: boolean | null;
}

interface LikedPost {
  id: string;
  content: string;
  createdAt: string;
  isLiked?: boolean | null;
  isBookmarked?: boolean | null;
  likesCount: number;
  replyCount: number;
  repostsCount: number;
  author: PostAuthor;
}

interface LikesTabProps {
  posts: LikedPost[];
  isLoading?: boolean;
}

/**
 * LikesTab - List of posts the user has liked
 */
export default function LikesTab({ posts, isLoading }: LikesTabProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-r-transparent"></div>
        <p className="text-text-secondary mt-2">Loading liked posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p className="text-lg font-medium">No liked posts yet</p>
        <p className="text-sm mt-1 text-text-tertiary">Posts you like will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {posts.map((post) => {
        const authorName = post.author.displayName || post.author.username || "Anonymous";
        const avatarInitial = authorName.charAt(0).toUpperCase();

        return (
          <div key={post.id} className="py-4">
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                {post.author.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  <span>{avatarInitial}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Author row */}
                <div className="flex items-center gap-1 mb-1">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-semibold text-foreground hover:underline text-sm"
                  >
                    {authorName}
                  </Link>
                  {post.author.username && (
                    <span className="text-text-tertiary text-sm">@{post.author.username}</span>
                  )}
                  <span className="text-text-tertiary text-sm">·</span>
                  <span className="text-text-tertiary text-sm">{formatPostDate(post.createdAt)}</span>
                </div>

                {/* Post content */}
                <p className="text-foreground text-sm leading-relaxed">{post.content}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-2 text-text-tertiary text-xs">
                  <span className="flex items-center gap-1">
                    <HeartIcon className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    {post.likesCount}
                  </span>
                  <span>{post.replyCount} replies</span>
                  <span>{post.repostsCount} reposts</span>
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
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
