/**
 * Unified Post Types
 * Consolidates PostCard, LikeCard, and CommunityPost interfaces
 */

import type { Post, PostAuthor as ContextPostAuthor } from "@/app/provider/PostsContext";
import type { MockLike } from "@/lib/constants/mock-profile-activity";
import type { CommunityPostData } from "@/app/types/community";
import type { Comment, CommentAuthor } from "@/app/types/comment";

// ============================================================================
// Author Types
// ============================================================================

export interface PostAuthor {
  id?: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
  role?: string;
  organization?: string;
}

// ============================================================================
// Image Types
// ============================================================================

export interface PostImage {
  src: string;
  alt?: string;
}

// ============================================================================
// Re-export Comment types for convenience
// ============================================================================

export type { Comment, CommentAuthor };

// ============================================================================
// Unified Post Data Type
// ============================================================================

export interface UnifiedPostData {
  id: string;
  content: string;
  author: PostAuthor;
  createdAt: string;

  // Images - supports single (imageUrl) or multiple (images array)
  imageUrl?: string;
  images?: PostImage[];

  // Engagement counts
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;

  // Interaction state
  isLiked: boolean;
  isBookmarked?: boolean;
  isFollowing?: boolean;

  // Extended data
  comments: Comment[];

  // Metadata
  likedAt?: string;
  timestamp?: string;

  // Campaign awareness (Phase 4)
  type?: "community" | "campaign_update" | "campaign_share";
  campaignId?: string;
  campaign?: {
    id: string;
    title: string;
    suggestedAmount?: number;
  };
}

// ============================================================================
// Variant Types (for PostCard component)
// ============================================================================

export type PostCardVariant = "default" | "liked" | "community";

// ============================================================================
// Event Handler Types
// ============================================================================

export interface PostCardHandlers {
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onFollow?: (authorId: string) => void;
  onMenuClick?: (postId: string, action: string) => void;
  onAuthorClick?: (authorId: string) => void;
  onImageClick?: (postId: string, imageIndex: number) => void;
  /** Callback when post content area is clicked (navigates to post detail) */
  onPostClick?: (postId: string) => void;

  // Comment handlers (for embedded comment section)
  onAddComment?: (postId: string, content: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  onUnlikeComment?: (postId: string, commentId: string) => void;
  onReplyToComment?: (postId: string, commentId: string, content: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Convert Post (from PostsContext) to UnifiedPostData
 */
export function fromContextPost(post: Post): UnifiedPostData {
  return {
    id: post.id,
    content: post.content,
    author: {
      id: post.author.username,
      name: post.author.name,
      username: post.author.username,
      avatar: post.author.avatar,
      isVerified: post.author.isVerified,
    },
    createdAt: post.createdAt,
    imageUrl: post.imageUrl,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    sharesCount: post.sharesCount,
    viewsCount: post.viewsCount,
    isLiked: post.isLiked,
    comments: post.comments,
  };
}

/**
 * Convert MockLike to UnifiedPostData
 */
export function fromMockLike(like: MockLike): UnifiedPostData {
  return {
    id: like.id,
    content: like.content,
    author: {
      id: like.author.username,
      name: like.author.name,
      username: like.author.username,
      avatar: like.author.avatar,
      isVerified: like.author.isVerified,
    },
    createdAt: like.createdAt,
    imageUrl: like.imageUrl,
    likesCount: like.likesCount,
    commentsCount: like.commentsCount,
    sharesCount: like.sharesCount,
    viewsCount: like.viewsCount,
    isLiked: true,
    likedAt: like.likedAt,
    comments: [],
  };
}

/**
 * Convert CommunityPostData to UnifiedPostData
 */
export function fromCommunityPost(post: CommunityPostData): UnifiedPostData {
  // Sum up reactions to get total likes count
  const likesCount = post.reactions?.reduce((sum, r) => sum + r.count, 0) ?? 0;

  return {
    id: post.id,
    content: post.content,
    author: {
      id: post.author.id,
      name: post.author.name,
      username: post.author.name.toLowerCase().replace(/\s+/g, ""),
      avatar: post.author.avatar,
      role: post.author.role,
      organization: post.author.organization,
    },
    createdAt: new Date().toISOString(),
    timestamp: post.timestamp,
    images: post.images,
    likesCount,
    commentsCount: post.commentCount,
    sharesCount: 0,
    viewsCount: post.viewCount,
    isLiked: false,
    isFollowing: post.isFollowing,
    comments: [],
  };
}
