"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export interface PostActionBarPost {
  id: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface PostActionBarCampaign {
  id: string;
  title: string;
  suggestedAmount?: number;
}

interface PostActionBarProps {
  post: PostActionBarPost;
  context: "feed" | "detail";
  campaign?: PostActionBarCampaign;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark?: () => void;
  onDonate?: () => void;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * PostActionBar - Unified action bar with campaign awareness
 * Removes Views/Impressions, adds Donate button for campaign posts
 */
export function PostActionBar({
  post,
  context,
  campaign,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDonate,
  showLabels = false,
  size = "md",
  className,
}: PostActionBarProps) {
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const likeIconRef = useRef<SVGSVGElement>(null);
  const bookmarkIconRef = useRef<SVGSVGElement>(null);

  const isCampaignPost = !!campaign;
  const showDonate = isCampaignPost && onDonate;
  const showBookmark = !isCampaignPost && onBookmark;

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 18,
      gap: "gap-4",
      padding: "p-1",
      touchTarget: "min-w-[40px] min-h-[40px]",
    },
    md: {
      icon: 20,
      gap: "gap-6",
      padding: "p-1.5",
      touchTarget: "min-w-[44px] min-h-[44px]",
    },
    lg: {
      icon: 22,
      gap: "gap-8",
      padding: "p-2",
      touchTarget: "min-w-[48px] min-h-[48px]",
    },
  };

  const config = sizeConfig[size];

  // Like animation
  useEffect(() => {
    return () => {
      gsap.killTweensOf(likeIconRef.current);
      gsap.killTweensOf(bookmarkIconRef.current);
    };
  }, []);

  const handleLike = () => {
    if (isLikeAnimating) return;

    setIsLikeAnimating(true);
    onLike();

    if (likeIconRef.current) {
      gsap
        .timeline()
        .to(likeIconRef.current, {
          scale: 1.3,
          duration: 0.15,
          ease: "back.out(2)",
        })
        .to(likeIconRef.current, {
          scale: 0.9,
          duration: 0.1,
        })
        .to(likeIconRef.current, {
          scale: 1.1,
          duration: 0.1,
        })
        .to(likeIconRef.current, {
          scale: 1,
          duration: 0.15,
          ease: "power2.out",
          onComplete: () => setIsLikeAnimating(false),
        });
    } else {
      setIsLikeAnimating(false);
    }
  };

  const handleBookmark = () => {
    onBookmark?.();

    if (bookmarkIconRef.current) {
      gsap
        .timeline()
        .to(bookmarkIconRef.current, {
          scale: 0.8,
          duration: 0.15,
        })
        .to(bookmarkIconRef.current, {
          scale: 1.1,
          duration: 0.2,
        })
        .to(bookmarkIconRef.current, {
          scale: 1,
          duration: 0.15,
        });
    }
  };

  return (
    <div
      className={cn("flex items-center", config.gap, className)}
      role="group"
      aria-label="Post actions"
    >
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLikeAnimating}
        className={cn(
          "flex items-center gap-2 transition-colors group",
          config.padding,
          config.touchTarget,
          post.isLiked
            ? "text-pink-500"
            : "text-foreground-muted hover:text-pink-500"
        )}
        aria-pressed={post.isLiked}
        aria-label={`Like, ${post.likesCount} likes`}
      >
        <Heart
          ref={likeIconRef}
          size={config.icon}
          fill={post.isLiked ? "currentColor" : "none"}
          className="flex-shrink-0"
        />
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            showLabels && "md:inline hidden"
          )}
          aria-hidden="true"
        >
          {post.likesCount > 0 && post.likesCount}
        </span>
        {showLabels && context === "detail" && (
          <span className="text-sm font-medium hidden md:inline">Like</span>
        )}
      </button>

      {/* Comment Button */}
      <button
        onClick={onComment}
        className={cn(
          "flex items-center gap-2 transition-colors group",
          config.padding,
          config.touchTarget,
          "text-foreground-muted hover:text-primary-400"
        )}
        aria-label={`Comments, ${post.commentsCount} comments`}
      >
        <MessageCircle size={config.icon} className="flex-shrink-0" />
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            showLabels && "md:inline hidden"
          )}
          aria-hidden="true"
        >
          {post.commentsCount > 0 && post.commentsCount}
        </span>
        {showLabels && context === "detail" && (
          <span className="text-sm font-medium hidden md:inline">Comment</span>
        )}
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className={cn(
          "flex items-center gap-2 transition-colors group",
          config.padding,
          config.touchTarget,
          "text-foreground-muted hover:text-foreground"
        )}
        aria-label="Share post"
      >
        <Share2 size={config.icon} className="flex-shrink-0" />
        {showLabels && context === "detail" && (
          <span className="text-sm font-medium hidden md:inline">Share</span>
        )}
      </button>

      {/* Donate Button (Campaign Posts) */}
      {showDonate && (
        <button
          onClick={onDonate}
          className={cn(
            "flex items-center gap-2 transition-colors group",
            config.padding,
            config.touchTarget,
            "text-primary-400 hover:text-primary-300 font-medium",
            context === "detail" && "ml-auto"
          )}
          aria-label={`Donate to ${campaign.title}`}
        >
          <DollarSign size={config.icon} className="flex-shrink-0" />
          <span className="text-sm font-medium">
            Donate
            {campaign.suggestedAmount && context === "detail" && (
              <span className="ml-1">${campaign.suggestedAmount}</span>
            )}
          </span>
        </button>
      )}

      {/* Bookmark Button (Non-Campaign Posts) */}
      {showBookmark && (
        <button
          onClick={handleBookmark}
          className={cn(
            "flex items-center gap-2 transition-colors group",
            config.padding,
            config.touchTarget,
            post.isBookmarked
              ? "text-primary-400"
              : "text-foreground-muted hover:text-primary-400",
            context === "detail" && "ml-auto"
          )}
          aria-pressed={post.isBookmarked}
          aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark post"}
        >
          <Bookmark
            ref={bookmarkIconRef}
            size={config.icon}
            fill={post.isBookmarked ? "currentColor" : "none"}
            className="flex-shrink-0"
          />
        </button>
      )}
    </div>
  );
}

export default PostActionBar;
