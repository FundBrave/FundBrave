"use client";

import { useGetPostQuery } from "@/app/generated/graphql";

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

interface UsePostOptions {
  postId: string;
  enabled?: boolean;
}

interface UsePostReturn {
  post: Post | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * usePost - Fetch a single post by ID using GraphQL
 */
export function usePost({ postId, enabled = true }: UsePostOptions): UsePostReturn {
  const { data, loading, error, refetch } = useGetPostQuery({
    variables: { id: postId },
    skip: !enabled || !postId,
    fetchPolicy: 'cache-and-network',
  });

  // Transform GraphQL data to match expected format
  const post: Post | null = data?.post
    ? {
        id: data.post.id,
        content: data.post.content || "",
        author: {
          id: data.post.author.id,
          name: data.post.author.displayName || data.post.author.username || "",
          username: data.post.author.username || "",
          avatar: data.post.author.avatarUrl || "",
          isVerified: data.post.author.isVerifiedCreator || false,
          isFollowing: false, // Not available in current schema
        },
        createdAt: data.post.createdAt,
        updatedAt: data.post.updatedAt || null,
        likesCount: data.post.likesCount || 0,
        commentsCount: data.post.replyCount || 0,
        sharesCount: data.post.repostsCount || 0,
        isLiked: data.post.isLiked || false,
        isBookmarked: data.post.isBookmarked || false,
        canEdit: false, // Not available in current schema - could be derived from auth context
        canDelete: false, // Not available in current schema - could be derived from auth context
        type: mapPostType(data.post.type),
        media: data.post.media?.map((m) => ({
          id: m.id,
          type: inferMediaType(m.url),
          url: m.url,
          thumbnailUrl: m.thumbnail || m.url,
          altText: m.alt || undefined,
        })),
        campaign: data.post.fundraiser
          ? {
              id: data.post.fundraiser.id,
              title: data.post.fundraiser.name,
              suggestedAmount: undefined,
            }
          : undefined,
      }
    : null;

  return {
    post,
    isLoading: loading,
    isError: !!error,
    error: error || null,
    refetch: async () => {
      await refetch();
    },
  };
}

// Helper functions
function mapPostType(
  type: string
): "community" | "campaign_update" | "campaign_share" {
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
  if (
    lowerUrl.endsWith(".mp4") ||
    lowerUrl.endsWith(".webm") ||
    lowerUrl.endsWith(".mov")
  ) {
    return "video";
  }
  return "link";
}
