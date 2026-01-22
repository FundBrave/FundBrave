"use client";

import React from "react";
import { MessageSquare } from "@/app/components/ui/icons";
import { CommunityPost } from "./CommunityPost";
import { Button } from "@/app/components/ui/button";
import { Avatar } from "@/app/components/ui/Avatar";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { formatNumber } from "@/lib/utils";
import type { CommunityPostData, CommunityInfo } from "@/app/types/community";

// Re-export CommunityInfo for backward compatibility
export type { CommunityInfo };

interface CommunityFeedProps {
  /** Community information to display in the header */
  community: CommunityInfo;
  /** Posts to display in the feed */
  posts: CommunityPostData[];
  /** Called when user joins/leaves the community */
  onJoin?: () => void;
  /** Called when user follows an author */
  onFollowAuthor?: (authorId: string) => void;
  /** Called when user reacts to a post */
  onReactToPost?: (postId: string, emoji: string) => void;
  /** Called when user clicks to comment on a post */
  onCommentOnPost?: (postId: string) => void;
  /** Called when user likes a post */
  onLikePost?: (postId: string) => void;
  /** Called when user unlikes a post */
  onUnlikePost?: (postId: string) => void;
  /** Called when user adds a comment */
  onAddComment?: (postId: string, content: string) => void;
  /** Called when user likes a comment */
  onLikeComment?: (postId: string, commentId: string) => void;
  /** Called when user unlikes a comment */
  onUnlikeComment?: (postId: string, commentId: string) => void;
  /** Called when user replies to a comment */
  onReplyToComment?: (postId: string, commentId: string, content: string) => void;
  /** Called when user deletes a comment */
  onDeleteComment?: (postId: string, commentId: string) => void;
}

/**
 * Empty state component shown when there are no posts
 */
function EmptyFeedState() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No posts yet"
      description="Be the first to share something with this community. Start a conversation or share an update."
      className="py-16"
    />
  );
}

export function CommunityFeed({
  community,
  posts,
  onJoin,
  onFollowAuthor,
  onReactToPost,
  onCommentOnPost,
  onLikePost,
  onUnlikePost,
  onAddComment,
  onLikeComment,
  onUnlikeComment,
  onReplyToComment,
  onDeleteComment,
}: CommunityFeedProps) {
  const [isJoined, setIsJoined] = React.useState(community.isJoined ?? false);

  const handleJoin = () => {
    setIsJoined(!isJoined);
    onJoin?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Community Header */}
      <div className="border-b border-border-subtle px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Community Avatar */}
          <Avatar
            src={community.avatar}
            alt={community.name}
            fallback={community.name.charAt(0)}
            size="lg"
          />

          {/* Community Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{community.name}</h1>
              <Button
                variant={isJoined ? "secondary" : "tertiary"}
                size="sm"
                onClick={handleJoin}
                className="h-auto px-3 py-1 text-sm"
              >
                {isJoined ? "Joined" : "Join"}
              </Button>
            </div>
            <p className="text-sm text-text-secondary">
              {formatNumber(community.memberCount, { useLocale: true })} members,{" "}
              {formatNumber(community.onlineCount, { useLocale: true })} online
            </p>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="scrollbar-auto-hide flex-1 overflow-y-auto p-4">
        {posts.length === 0 ? (
          <EmptyFeedState />
        ) : (
          <>
            {/* Date Separator */}
            <div className="mb-6 flex justify-center">
              <span className="rounded-full bg-surface-sunken px-4 py-1.5 text-sm text-text-secondary">
                Today
              </span>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post) => (
                <CommunityPost
                  key={post.id}
                  post={post}
                  onFollow={onFollowAuthor}
                  onReact={onReactToPost}
                  onComment={onCommentOnPost}
                  onLike={onLikePost}
                  onUnlike={onUnlikePost}
                  onAddComment={onAddComment}
                  onLikeComment={onLikeComment}
                  onUnlikeComment={onUnlikeComment}
                  onReplyToComment={onReplyToComment}
                  onDeleteComment={onDeleteComment}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CommunityFeed;
