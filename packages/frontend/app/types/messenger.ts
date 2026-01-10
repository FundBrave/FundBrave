/**
 * Messenger/Chat type definitions
 * Centralized types for messenger-related components
 */

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline?: boolean;
}

export interface Chat {
  id: string;
  user: ChatUser;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead?: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  name?: string;
  thumbnail?: string;
  size?: number;
}

// ============================================================================
// Shared Files Types
// ============================================================================

export interface SharedFile {
  id: string;
  type: "video" | "image" | "audio" | "document";
  name: string;
  url: string;
  thumbnail?: string;
  uploadedAt: string;
  uploadedBy?: string;
  size?: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export type ChatFilterTab = "new" | "direct" | "groups";

export type SharedFilesTab = "videos" | "images" | "audio" | "docs";

// ============================================================================
// Component Props Types
// ============================================================================

export interface ChatHeaderInfo {
  user: ChatUser;
  status: "online" | "offline" | "typing";
}
