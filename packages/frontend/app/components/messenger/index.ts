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
