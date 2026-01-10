// Main component
export { PostCard, default } from "./PostCard";

// Sub-components
export { PostHeader, type PostHeaderProps } from "./PostHeader";
export { PostContent, type PostContentProps } from "./PostContent";
export { PostImageGrid, type PostImageGridProps } from "./PostImageGrid";
export { PostActions, type PostActionsProps } from "./PostActions";
export { PostIndicator, type PostIndicatorProps, type IndicatorType } from "./PostIndicator";
export { VerifiedBadge, type VerifiedBadgeProps } from "./VerifiedBadge";

// Types and variants
export { postCardVariants, getVariantDefaults, type PostCardProps, type PostCardVariantProps } from "./types";

// Re-export post types for convenience
export type {
  UnifiedPostData,
  PostAuthor,
  PostImage,
  PostCardVariant,
  PostCardHandlers,
  Comment,
  CommentAuthor,
} from "@/app/types/post";

// Re-export adapter functions
export { fromContextPost, fromMockLike, fromCommunityPost } from "@/app/types/post";
