"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/app/components/ui/comments";
import { PostHeader } from "./PostHeader";
import { PostContent } from "./PostContent";
import { PostImageGrid } from "./PostImageGrid";
import { PostActions } from "./PostActions";
import { PostIndicator } from "./PostIndicator";
import { postCardVariants, getVariantDefaults, type PostCardProps } from "./types";
import type { PostImage } from "@/app/types/post";

/**
 * PostCard - Unified post component with variants for different contexts
 *
 * Variants:
 * - default: Standard profile post with action bar and collapsible comments
 * - liked: Read-only post in likes tab with "You liked this" indicator
 * - community: Community post with follow button, author role, and image grid
 */
export function PostCard(props: PostCardProps) {
  const {
    post,
    variant = "default",
    className,
    // Extract handlers
    onLike,
    onUnlike,
    onComment,
    onShare,
    onRepost,
    onBookmark,
    onFollow,
    onMenuClick,
    onAuthorClick,
    onImageClick,
    onAddComment,
    onLikeComment,
    onUnlikeComment,
    onReplyToComment,
    onDeleteComment,
    ...restProps
  } = props;

  // Merge variant defaults with explicit props
  const variantDefaults = getVariantDefaults(variant);
  const {
    showLikedIndicator = variantDefaults.showLikedIndicator ?? false,
    showFollowButton = variantDefaults.showFollowButton ?? false,
    showAuthorRole = variantDefaults.showAuthorRole ?? false,
    showAvatarBorder = variantDefaults.showAvatarBorder ?? false,
    enableComments = variantDefaults.enableComments ?? true,
    truncateAt = variantDefaults.truncateAt ?? 0,
    readOnly = variantDefaults.readOnly ?? false,
  } = restProps;

  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.isFollowing ?? false);

  // Normalize images - handle both single imageUrl and images array
  const images: PostImage[] = post.images?.length
    ? post.images
    : post.imageUrl
      ? [{ src: post.imageUrl, alt: "" }]
      : [];

  // Handlers
  const handleLikeClick = () => {
    if (readOnly) return;
    if (post.isLiked) {
      onUnlike?.(post.id);
    } else {
      onLike?.(post.id);
    }
  };

  const handleCommentClick = () => {
    if (enableComments) {
      setShowComments(!showComments);
    }
    onComment?.(post.id);
  };

  const handleFollowClick = () => {
    setIsFollowing(!isFollowing);
    onFollow?.(post.author.id ?? post.author.username);
  };

  return (
    <div className={cn(postCardVariants({ variant }), className)}>
      {/* Liked indicator */}
      {showLikedIndicator && <PostIndicator type="liked" />}

      {/* Main content wrapper */}
      <div className={cn(variant !== "community" && "flex gap-3")}>
        {/* For default/liked variants, avatar is part of the flex layout */}
        {variant !== "community" && (
          <img
            src={post.author.avatar}
            alt={post.author.name}
            onClick={() => onAuthorClick?.(post.author.id ?? post.author.username)}
            className={cn(
              "w-10 h-10 rounded-full flex-shrink-0 object-cover",
              onAuthorClick && "cursor-pointer"
            )}
          />
        )}

        <div className={cn(variant !== "community" && "flex-1 min-w-0")}>
          {/* Header */}
          {variant === "community" ? (
            <PostHeader
              author={post.author}
              timestamp={post.timestamp || post.createdAt}
              rawTimestamp={!!post.timestamp}
              showRole={showAuthorRole}
              showFollowButton={showFollowButton}
              isFollowing={isFollowing}
              showAvatarBorder={showAvatarBorder}
              onFollow={handleFollowClick}
              onMenuClick={() => onMenuClick?.(post.id, "menu")}
              onAuthorClick={() => onAuthorClick?.(post.author.id ?? post.author.username)}
            />
          ) : (
            // Inline header for default/liked variants (to match original layout)
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                <span
                  onClick={() => onAuthorClick?.(post.author.id ?? post.author.username)}
                  className={cn(
                    "text-foreground font-bold",
                    onAuthorClick && "hover:underline cursor-pointer"
                  )}
                >
                  {post.author.name}
                </span>
                {post.author.isVerified && (
                  <svg
                    className="w-[18px] h-[18px] text-primary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.04 4.3l-3.71-3.71 1.41-1.41 2.3 2.3 5.3-5.3 1.41 1.41-6.71 6.71z" />
                  </svg>
                )}
                <span className="text-text-secondary">@{post.author.username}</span>
                <span className="text-text-secondary">·</span>
                <span className="text-text-secondary">
                  {post.timestamp || new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => onMenuClick?.(post.id, "menu")}
                className="p-2 -mt-1 -mr-2 rounded-full hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <PostContent
            content={post.content}
            truncateAt={truncateAt}
            className={variant === "community" ? "mt-3" : ""}
          />

          {/* Images */}
          {images.length > 0 && (
            <PostImageGrid
              images={images}
              onImageClick={(index) => onImageClick?.(post.id, index)}
            />
          )}

          {/* Actions */}
          <PostActions
            likesCount={post.likesCount}
            commentsCount={post.commentsCount}
            sharesCount={post.sharesCount}
            viewsCount={post.viewsCount}
            isLiked={post.isLiked}
            isBookmarked={post.isBookmarked}
            showComments={showComments}
            readOnly={readOnly}
            onLike={handleLikeClick}
            onComment={handleCommentClick}
            onRepost={() => onRepost?.(post.id)}
            onBookmark={() => onBookmark?.(post.id)}
            onShare={() => onShare?.(post.id)}
          />

          {/* Comments Section */}
          {enableComments && showComments && (
            <div className="mt-4 pt-4 border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-200">
              <CommentSection
                postId={post.id}
                comments={post.comments || []}
                onAddComment={(content) => onAddComment?.(post.id, content)}
                onLikeComment={(commentId) => onLikeComment?.(post.id, commentId)}
                onUnlikeComment={(commentId) => onUnlikeComment?.(post.id, commentId)}
                onReplyToComment={(commentId, content) =>
                  onReplyToComment?.(post.id, commentId, content)
                }
                onDeleteComment={(commentId) => onDeleteComment?.(post.id, commentId)}
                showHeader={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostCard;
