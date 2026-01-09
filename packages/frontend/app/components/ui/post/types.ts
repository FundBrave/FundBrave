import { cva, type VariantProps } from "class-variance-authority";
import type { UnifiedPostData, PostCardVariant, PostCardHandlers } from "@/app/types/post";

/**
 * CVA Variants for PostCard container
 */
export const postCardVariants = cva(
  // Base styles
  "transition-colors",
  {
    variants: {
      variant: {
        default: "p-4 border-b border-border-subtle hover:bg-surface-overlay/20",
        liked: "p-4 border-b border-border-subtle hover:bg-surface-overlay/20",
        community: "rounded-2xl border border-border-subtle bg-background/50 p-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type PostCardVariantProps = VariantProps<typeof postCardVariants>;

/**
 * Main PostCard Props
 */
export interface PostCardProps extends PostCardHandlers {
  /** Post data (unified format) */
  post: UnifiedPostData;

  /** Visual variant */
  variant?: PostCardVariant;

  /** Show "You liked this" indicator (auto for liked variant) */
  showLikedIndicator?: boolean;

  /** Show follow button in header */
  showFollowButton?: boolean;

  /** Show author role/organization */
  showAuthorRole?: boolean;

  /** Show avatar gradient border */
  showAvatarBorder?: boolean;

  /** Enable comment section (collapsible) */
  enableComments?: boolean;

  /** Content truncation length (0 = no truncation) */
  truncateAt?: number;

  /** Read-only mode (disable all interactions) */
  readOnly?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Get default props based on variant
 */
export function getVariantDefaults(variant: PostCardVariant = "default"): Partial<PostCardProps> {
  switch (variant) {
    case "liked":
      return {
        showLikedIndicator: true,
        readOnly: true,
        enableComments: false,
      };
    case "community":
      return {
        showFollowButton: true,
        showAuthorRole: true,
        showAvatarBorder: true,
        truncateAt: 200,
        enableComments: true,
      };
    case "default":
    default:
      return {
        enableComments: true,
      };
  }
}
