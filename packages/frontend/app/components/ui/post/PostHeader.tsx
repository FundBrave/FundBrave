"use client";

import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/button";
import { VerifiedBadge } from "./VerifiedBadge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { PostAuthor } from "@/app/types/post";

export interface PostHeaderProps {
  /** Author information */
  author: PostAuthor;
  /** Post creation timestamp (ISO string or human-readable) */
  timestamp: string;
  /** Whether to use the timestamp as-is (true) or format it (false) */
  rawTimestamp?: boolean;
  /** Show author role/organization (for community posts) */
  showRole?: boolean;
  /** Show follow button */
  showFollowButton?: boolean;
  /** Whether currently following the author */
  isFollowing?: boolean;
  /** Show gradient border on avatar */
  showAvatarBorder?: boolean;
  /** Callback when follow button is clicked */
  onFollow?: () => void;
  /** Callback when menu (three dots) is clicked */
  onMenuClick?: () => void;
  /** Callback when author name/avatar is clicked */
  onAuthorClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PostHeader - Author info, timestamp, follow button, and menu
 */
export function PostHeader({
  author,
  timestamp,
  rawTimestamp = false,
  showRole = false,
  showFollowButton = false,
  isFollowing = false,
  showAvatarBorder = false,
  onFollow,
  onMenuClick,
  onAuthorClick,
  className,
}: PostHeaderProps) {
  const displayTimestamp = rawTimestamp ? timestamp : formatRelativeTime(timestamp);

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Avatar */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onAuthorClick?.();
        }}
        className={cn(onAuthorClick && "cursor-pointer")}
      >
        <Avatar
          src={author.avatar}
          alt={author.name}
          fallback={author.name.charAt(0)}
          size="md"
          showGradientBorder={showAvatarBorder}
        />
      </div>

      {/* Author Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            {/* Name row with verified badge and follow button */}
            <div className="flex items-center gap-1 flex-wrap">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick?.();
                }}
                className={cn(
                  "text-foreground font-bold",
                  onAuthorClick && "hover:underline cursor-pointer"
                )}
              >
                {author.name}
              </span>
              {author.isVerified && <VerifiedBadge size="md" />}
              {showFollowButton && (
                <Button
                  variant={isFollowing ? "ghost" : "tertiary"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollow?.();
                  }}
                  className="h-auto px-2 py-0.5 ml-1"
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>

            {/* Role/Organization (community posts) */}
            {showRole && (author.role || author.organization) && (
              <p className="text-sm text-text-secondary">
                {author.role}
                {author.role && author.organization && " "}
                {author.organization}
              </p>
            )}

            {/* Username and timestamp row (for non-role layout) */}
            {!showRole && (
              <div className="flex items-center gap-1 text-text-secondary text-sm">
                <span>@{author.username}</span>
                <span>·</span>
                <span>{displayTimestamp}</span>
              </div>
            )}

            {/* Timestamp row (for role layout) */}
            {showRole && (
              <p className="text-sm text-text-tertiary">
                Posted ~ {displayTimestamp}
              </p>
            )}
          </div>

          {/* Three dots menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.();
            }}
            className="p-2 -mt-1 -mr-2 rounded-full hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
            aria-label="Post options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostHeader;
