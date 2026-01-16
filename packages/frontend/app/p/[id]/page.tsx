"use client";

import { useParams } from "next/navigation";
import { Spinner } from "@/app/components/ui/Spinner";
import { useGetPostQuery } from "@/app/generated/graphql";
import { PostDetailClient } from "./PostDetailClient";

/**
 * Post Detail Page - Client-side rendered
 * Route: /p/[id]
 *
 * Features:
 * - Single post view with full content
 * - Comment section with infinite scroll
 * - Like/Share/Bookmark actions
 * - Author profile link
 */

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Fetch post from GraphQL
  const { data, loading, error } = useGetPostQuery({
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data?.post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Post Not Found</h1>
          <p className="text-text-secondary mb-6">
            This post may have been deleted or you don't have permission to view it.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-purple text-white hover:bg-primary-purple/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to Feed
          </a>
          <p className="mt-6 text-sm text-text-secondary">
            Need help?{" "}
            <a href="/help" className="text-primary-purple hover:underline">
              Visit our Help Center
            </a>
          </p>
        </div>
      </div>
    );
  }

  const post = data.post;

  // Transform GraphQL data to Post format
  const transformedPost = {
    id: post.id,
    content: post.content || "",
    author: {
      id: post.author.id,
      name: post.author.displayName || post.author.username || "",
      username: post.author.username || "",
      avatar: post.author.avatarUrl || "",
      isVerified: post.author.isVerifiedCreator || false,
      isFollowing: false, // Not available in current schema
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt || null,
    likesCount: post.likesCount || 0,
    commentsCount: post.replyCount || 0,
    sharesCount: post.repostsCount || 0,
    isLiked: post.isLiked || false,
    isBookmarked: post.isBookmarked || false,
    canEdit: false, // Not available in current schema
    canDelete: false, // Not available in current schema
    type: mapPostType(post.type),
    media: post.media?.map((m) => ({
      id: m.id,
      type: inferMediaType(m.url),
      url: m.url,
      thumbnailUrl: m.thumbnail || m.url,
      altText: m.alt || undefined,
    })),
    campaign: post.fundraiser
      ? {
          id: post.fundraiser.id,
          title: post.fundraiser.name,
          suggestedAmount: undefined,
        }
      : undefined,
  };

  return <PostDetailClient post={transformedPost} />;
}

// Helper functions
function mapPostType(type: string): "community" | "campaign_update" | "campaign_share" {
  if (type === "FUNDRAISER_UPDATE") return "campaign_update";
  if (type === "FUNDRAISER_SHARE") return "campaign_share";
  return "community";
}

function inferMediaType(url: string): "image" | "video" | "link" {
  const lowerUrl = url.toLowerCase();
  if (
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".gif") ||
    lowerUrl.endsWith(".webp")
  ) {
    return "image";
  }
  if (lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".webm") || lowerUrl.endsWith(".mov")) {
    return "video";
  }
  return "link";
}
