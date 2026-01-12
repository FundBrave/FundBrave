/**
 * Comment Type Definitions
 * Twitter-style threaded comment system with 1-level visible nesting
 */

/**
 * Comment author information
 */
export interface CommentAuthor {
  id?: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

/**
 * Comment type with full threading support
 *
 * Note: Some fields are optional to maintain compatibility with
 * the simpler Comment type from PostsContext. Components should
 * handle missing optional fields gracefully.
 */
export interface Comment {
  id: string;

  // Content
  content: string;

  // Threading
  parentId?: string | null;     // null = root comment
  rootId?: string | null;       // ID of thread root (null if IS root)
  depth?: number;               // 0 = root, 1 = reply, 2+ = nested reply

  // Timestamps
  createdAt: string;            // ISO 8601
  updatedAt?: string | null;    // null if never edited

  // Author
  author: CommentAuthor;

  // Engagement
  likesCount: number;
  repliesCount?: number;        // Direct replies only

  // User state (for current viewer)
  isLiked: boolean;
  canEdit?: boolean;            // true if author
  canDelete?: boolean;          // true if author or post owner

  // Moderation
  isPinned?: boolean;
  isHidden?: boolean;
  isEdited?: boolean;

  // Target context
  postId?: string;
  campaignId?: string;          // If comment is on campaign

  // Nested replies (populated for rendering)
  replies: Comment[];
}

/**
 * Minimal comment for previews/notifications
 */
export interface CommentPreview {
  id: string;
  content: string;              // First 100 chars
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  postId: string;
}

/**
 * A root comment with its visible replies
 * Used for rendering threaded comment lists
 */
export interface CommentThread {
  // Root comment
  root: Comment;

  // Direct replies (depth: 1)
  replies: Comment[];

  // Count of ALL replies (including nested)
  totalRepliesCount: number;

  // Nested replies by parent ID (depth: 2+)
  // Only populated when user expands "Show X replies"
  nestedReplies: Record<string, Comment[]>;

  // Loading state for nested replies
  loadingNestedFor?: string;    // Parent ID currently loading
}

/**
 * API response for comment list
 */
export interface CommentListResponse {
  threads: CommentThread[];
  totalCount: number;
  cursor?: string;              // For pagination
  hasMore: boolean;
}

/**
 * Request to expand nested replies
 */
export interface ExpandRepliesRequest {
  commentId: string;            // Parent comment to expand
  cursor?: string;              // For paginated nested replies
  limit?: number;               // Default: 10
}

/**
 * Comment creation request
 */
export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string;            // For replies
}

/**
 * Comment creation response
 */
export interface CreateCommentResponse {
  comment: Comment;
  newCommentsCount: number;     // Updated total for post
}

/**
 * Comment sort options
 */
export type CommentSortOrder = 'newest' | 'oldest' | 'most_liked';

/**
 * Comment query parameters
 */
export interface CommentQueryParams {
  postId: string;
  sortOrder: CommentSortOrder;
  cursor?: string;
  limit?: number;               // Default: 20
}
