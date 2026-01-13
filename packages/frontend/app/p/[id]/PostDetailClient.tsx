"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostActionBar } from "@/app/components/ui/post/PostActionBar";
import { CommentSectionHeader } from "@/app/components/ui/comments/CommentSectionHeader";
import { InfiniteCommentList } from "@/app/components/ui/comments/InfiniteCommentList";
import { StickyCommentInput } from "@/app/components/ui/comments/StickyCommentInput";
import { CommentInput } from "@/app/components/ui/comments/CommentInput";
import type { CommentSortOrder } from "@/app/types/comment";

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
    isFollowing: boolean;
  };
  createdAt: string;
  updatedAt: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  canEdit: boolean;
  canDelete: boolean;
  type: "community" | "campaign_update" | "campaign_share";
  media?: Array<{
    id: string;
    type: "image" | "video" | "link";
    url: string;
    thumbnailUrl?: string;
    altText?: string;
  }>;
  campaign?: {
    id: string;
    title: string;
    suggestedAmount?: number;
  };
}

interface PostDetailClientProps {
  post: Post;
  highlightCommentId?: string;
  autoFocusReply?: boolean;
}

export function PostDetailClient({
  post,
  highlightCommentId,
  autoFocusReply = false,
}: PostDetailClientProps) {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>("newest");
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [isMobile, setIsMobile] = useState(false);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handlers
  const handleBack = () => {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    // TODO: API call
  };

  const handleComment = () => {
    if (isMobile) {
      // On mobile, focus sticky input
      const input = document.querySelector('[aria-label="Comment input"]') as HTMLTextAreaElement;
      input?.focus();
    } else {
      // On desktop, scroll to comment section
      commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author.name} on FundBrave`,
          text: post.content,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      // TODO: Show toast
      alert("Link copied to clipboard!");
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: API call
  };

  const handleDonate = () => {
    // TODO: Open donation modal
    console.log("Open donation modal");
  };

  const handleSubmitComment = async (content: string) => {
    // TODO: API call
    console.log("Submit comment:", content);
    setCommentsCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky Header */}
      <header
        className={cn(
          "sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-border-subtle",
          "transition-all duration-200"
        )}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-foreground hover:text-primary-400 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span className="font-medium hidden sm:inline">Back</span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-foreground-muted hover:text-foreground hover:bg-surface-overlay rounded-full transition-colors"
              aria-label="Share post"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={handleBookmark}
              className={cn(
                "p-2 rounded-full transition-colors",
                isBookmarked
                  ? "text-primary-400 bg-primary-500/10"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface-overlay"
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            >
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button
              className="p-2 text-foreground-muted hover:text-foreground hover:bg-surface-overlay rounded-full transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Post Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Author Info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-surface-sunken border border-border-subtle flex-shrink-0 overflow-hidden">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-foreground hover:underline cursor-pointer">
                {post.author.name}
              </h2>
              {post.author.isVerified && (
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.04 4.3l-3.71-3.71 1.41-1.41 2.3 2.3 5.3-5.3 1.41 1.41-6.71 6.71z" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <span>@{post.author.username}</span>
              <span>•</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Post Body */}
        <div className="mb-4">
          <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Media (if present) */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4 rounded-xl overflow-hidden border border-border-subtle">
            <img
              src={post.media[0].url}
              alt={post.media[0].altText || "Post image"}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Campaign Card (if campaign post) */}
        {post.campaign && (
          <div className="mb-4 p-4 rounded-xl border border-border-subtle bg-surface-sunken">
            <p className="text-sm text-foreground-muted mb-2">Campaign</p>
            <p className="font-semibold text-foreground">{post.campaign.title}</p>
          </div>
        )}

        {/* Action Bar */}
        <div className="py-4 border-y border-border-subtle">
          <PostActionBar
            post={{
              id: post.id,
              likesCount,
              commentsCount,
              isLiked,
              isBookmarked,
            }}
            context="detail"
            campaign={post.campaign}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onBookmark={handleBookmark}
            onDonate={post.campaign ? handleDonate : undefined}
            showLabels={!isMobile}
            size="lg"
          />
        </div>

        {/* Comments Section */}
        <div ref={commentSectionRef} className="mt-6">
          <CommentSectionHeader
            count={commentsCount}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />

          {/* Desktop Comment Input */}
          {!isMobile && (
            <div className="my-6">
              <CommentInput
                placeholder="Add a comment..."
                onSubmit={handleSubmitComment}
                autoFocus={autoFocusReply}
              />
            </div>
          )}

          {/* Comments List */}
          <InfiniteCommentList
            postId={post.id}
            sortOrder={sortOrder}
            highlightCommentId={highlightCommentId}
            onCommentCountChange={setCommentsCount}
            currentUserUsername="janesmith"
            creatorUsername={post.author.username}
          />
        </div>
      </main>

      {/* Mobile Sticky Comment Input */}
      {isMobile && (
        <StickyCommentInput
          postId={post.id}
          onSubmit={handleSubmitComment}
          placeholder="Write a comment..."
        />
      )}
    </div>
  );
}

export default PostDetailClient;
