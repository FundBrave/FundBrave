// Messenger Components
export { ChatSidebar, MobileChatDrawer, MobileChatToggle } from "./ChatSidebar";
export { ChatListItem, type ChatListItemProps } from "./ChatListItem";
export {
  MessageBubble,
  DateSeparator,
  type MessageBubbleProps,
  type DateSeparatorProps,
} from "./MessageBubble";
export { ChatArea, type ChatAreaProps } from "./ChatArea";
export { SharedFilesSidebar } from "./SharedFilesSidebar";
export { UserSearchModal } from "./UserSearchModal";

// Web3 Chat Components
export { EncryptionBadge } from "./EncryptionBadge";
export { ConnectionStatus } from "./ConnectionStatus";
export { WakuDisconnectedBanner } from "./WakuDisconnectedBanner";
export { WalletNudgeBanner } from "./WalletNudgeBanner";
export { EncryptionSetupFlow } from "./EncryptionSetupFlow";

// Re-export types from the centralized types file
export type {
  Chat,
  ChatUser,
  Message,
  MessageAttachment,
  SharedFile,
  ChatFilterTab,
  SharedFilesTab,
  ChatHeaderInfo,
} from "@/app/types/messenger";
