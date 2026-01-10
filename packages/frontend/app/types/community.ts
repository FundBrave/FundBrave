/**
 * Community type definitions
 * Centralized types for community-related components
 */

// ============================================================================
// Post Types
// ============================================================================

export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  organization?: string;
}

export interface PostReaction {
  emoji: string;
  count: number;
}

export interface PostImage {
  src: string;
  alt?: string;
}

export interface CommunityPostData {
  id: string;
  author: PostAuthor;
  content: string;
  timestamp: string;
  reactions: PostReaction[];
  viewCount: number;
  commentCount: number;
  images?: PostImage[];
  isFollowing?: boolean;
}

// ============================================================================
// Community Types
// ============================================================================

export interface Community {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageSender?: string;
  timestamp: string;
  isJoined?: boolean;
}

export interface CommunityInfo {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  onlineCount: number;
  isJoined?: boolean;
}

export interface MediaItem {
  id: string;
  type: "image" | "video";
  thumbnail: string;
  url?: string;
}

export interface CommunityDetails {
  id: string;
  name: string;
  coverImage: string;
  avatar?: string;
  createdBy: string;
  creatorUsername: string;
  memberCount: number;
  onlineCount: number;
  description: string;
  inviteLink?: string;
  notificationsEnabled: boolean;
  media: MediaItem[];
}

// ============================================================================
// Filter Types
// ============================================================================

export type CommunityFilterTab = "all" | "joined" | "not_joined";

export type InfoPanelTab = "media" | "members" | "files" | "links";
