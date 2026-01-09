"use client";

import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { Heart, MessageCircle, Repeat2, BarChart3, Bookmark, Share } from "@/app/components/ui/icons";
import { cn, formatCompactNumber } from "@/lib/utils";

export interface PostActionsProps {
  /** Number of likes */
  likesCount: number;
  /** Number of comments */
  commentsCount: number;
  /** Number of shares/reposts */
  sharesCount: number;
  /** Number of views */
  viewsCount: number;
  /** Whether the current user has liked this post */
  isLiked: boolean;
  /** Whether the current user has bookmarked this post */
  isBookmarked?: boolean;
  /** Whether the comment section is currently open */
  showComments?: boolean;
  /** Disable all interactions (read-only mode) */
  readOnly?: boolean;
  /** Callback when like button is clicked */
  onLike?: () => void;
  /** Callback when comment button is clicked */
  onComment?: () => void;
  /** Callback when repost button is clicked */
  onRepost?: () => void;
  /** Callback when bookmark button is clicked */
  onBookmark?: () => void;
  /** Callback when share button is clicked */
  onShare?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PostActions - Twitter-style action bar with GSAP micro-interactions
 */
export function PostActions({
  likesCount,
  commentsCount,
  sharesCount,
  viewsCount,
  isLiked,
  isBookmarked = false,
  showComments = false,
  readOnly = false,
  onLike,
  onComment,
  onRepost,
  onBookmark,
  onShare,
  className,
}: PostActionsProps) {
  // Refs for GSAP animations
  const likeIconRef = useRef<SVGSVGElement>(null);
  const likeCountRef = useRef<HTMLSpanElement>(null);
  const bookmarkIconRef = useRef<SVGSVGElement>(null);
  const repostIconRef = useRef<SVGSVGElement>(null);
  const commentIconRef = useRef<SVGSVGElement>(null);
  const shareIconRef = useRef<SVGSVGElement>(null);

  // Store GSAP context for cleanup
  const gsapCtx = useRef<gsap.Context | null>(null);

  // Cleanup GSAP on unmount
  useEffect(() => {
    gsapCtx.current = gsap.context(() => {});
    return () => {
      gsapCtx.current?.revert();
    };
  }, []);

  // Like animation - heart pulse with particles effect
  const animateLike = useCallback(() => {
    if (!likeIconRef.current || readOnly) return;

    const tl = gsap.timeline();

    // Scale up and down with overshoot
    tl.to(likeIconRef.current, {
      scale: 1.4,
      duration: 0.15,
      ease: "back.out(3)",
    })
    .to(likeIconRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "elastic.out(1, 0.5)",
    });

    // Animate count if exists
    if (likeCountRef.current) {
      gsap.fromTo(likeCountRef.current,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" }
      );
    }
  }, [readOnly]);

  // Bookmark animation - bounce up
  const animateBookmark = useCallback(() => {
    if (!bookmarkIconRef.current || readOnly) return;

    gsap.timeline()
      .to(bookmarkIconRef.current, {
        y: -6,
        duration: 0.15,
        ease: "power2.out",
      })
      .to(bookmarkIconRef.current, {
        y: 0,
        duration: 0.4,
        ease: "bounce.out",
      });
  }, [readOnly]);

  // Repost animation - rotate
  const animateRepost = useCallback(() => {
    if (!repostIconRef.current || readOnly) return;

    gsap.to(repostIconRef.current, {
      rotation: 360,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.set(repostIconRef.current, { rotation: 0 });
      },
    });
  }, [readOnly]);

  // Comment animation - wiggle
  const animateComment = useCallback(() => {
    if (!commentIconRef.current || readOnly) return;

    gsap.to(commentIconRef.current, {
      rotation: 15,
      duration: 0.1,
      yoyo: true,
      repeat: 3,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.set(commentIconRef.current, { rotation: 0 });
      },
    });
  }, [readOnly]);

  // Share animation - fly up slightly
  const animateShare = useCallback(() => {
    if (!shareIconRef.current || readOnly) return;

    gsap.timeline()
      .to(shareIconRef.current, {
        y: -4,
        x: 2,
        duration: 0.2,
        ease: "power2.out",
      })
      .to(shareIconRef.current, {
        y: 0,
        x: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
  }, [readOnly]);

  // Click handlers with animations
  const handleLike = useCallback(() => {
    animateLike();
    onLike?.();
  }, [animateLike, onLike]);

  const handleBookmark = useCallback(() => {
    animateBookmark();
    onBookmark?.();
  }, [animateBookmark, onBookmark]);

  const handleRepost = useCallback(() => {
    animateRepost();
    onRepost?.();
  }, [animateRepost, onRepost]);

  const handleComment = useCallback(() => {
    animateComment();
    onComment?.();
  }, [animateComment, onComment]);

  const handleShare = useCallback(() => {
    animateShare();
    onShare?.();
  }, [animateShare, onShare]);

  return (
    <div className={cn("flex items-center justify-between mt-3 max-w-md -ml-2", className)}>
      {/* Comment */}
      <button
        onClick={readOnly ? undefined : handleComment}
        disabled={readOnly}
        className={cn(
          "flex items-center gap-1 transition-colors group",
          showComments ? "text-primary" : "text-text-secondary hover:text-primary",
          readOnly && "cursor-default opacity-70"
        )}
        aria-label={`${commentsCount} comments`}
      >
        <div className={cn(
          "p-3 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
          !readOnly && "group-hover:bg-primary/10"
        )}>
          <MessageCircle ref={commentIconRef} size={18} />
        </div>
        <span className="text-[13px]">
          {commentsCount > 0 ? commentsCount : ""}
        </span>
      </button>

      {/* Repost */}
      <button
        onClick={readOnly ? undefined : handleRepost}
        disabled={readOnly}
        className={cn(
          "flex items-center gap-1 text-text-secondary hover:text-green-500 transition-colors group",
          readOnly && "cursor-default opacity-70"
        )}
        aria-label={`${sharesCount} reposts`}
      >
        <div className={cn(
          "p-3 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
          !readOnly && "group-hover:bg-green-500/10"
        )}>
          <Repeat2 ref={repostIconRef} size={18} />
        </div>
        <span className="text-[13px]">
          {sharesCount > 0 ? sharesCount : ""}
        </span>
      </button>

      {/* Like */}
      <button
        onClick={readOnly ? undefined : handleLike}
        disabled={readOnly}
        className={cn(
          "flex items-center gap-1 transition-colors group",
          isLiked ? "text-pink-500" : "text-text-secondary hover:text-pink-500",
          readOnly && "cursor-default"
        )}
        aria-label={`${likesCount} likes`}
      >
        <div className={cn(
          "p-3 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
          !readOnly && "group-hover:bg-pink-500/10"
        )}>
          <Heart ref={likeIconRef} size={18} fill={isLiked ? "currentColor" : "none"} />
        </div>
        <span ref={likeCountRef} className="text-[13px]">
          {likesCount > 0 ? likesCount : ""}
        </span>
      </button>

      {/* Views */}
      <button
        className="flex items-center gap-1 text-text-secondary hover:text-primary transition-colors group cursor-default"
        aria-label={`${formatCompactNumber(viewsCount)} views`}
      >
        <div className="p-3 rounded-full group-hover:bg-primary/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <BarChart3 size={18} />
        </div>
        <span className="text-[13px]">
          {formatCompactNumber(viewsCount)}
        </span>
      </button>

      {/* Bookmark & Share */}
      <div className="flex items-center">
        <button
          onClick={readOnly ? undefined : handleBookmark}
          disabled={readOnly}
          className={cn(
            "p-3 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
            isBookmarked ? "text-primary" : "text-text-secondary hover:text-primary hover:bg-primary/10",
            readOnly && "cursor-default opacity-70"
          )}
          aria-label="Bookmark"
        >
          <Bookmark ref={bookmarkIconRef} size={18} fill={isBookmarked ? "currentColor" : "none"} />
        </button>
        <button
          onClick={readOnly ? undefined : handleShare}
          disabled={readOnly}
          className={cn(
            "p-3 rounded-full text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
            readOnly && "cursor-default opacity-70"
          )}
          aria-label="Share"
        >
          <Share ref={shareIconRef} size={18} />
        </button>
      </div>
    </div>
  );
}

export default PostActions;
