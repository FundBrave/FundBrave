"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ChatSidebar,
  MobileChatDrawer,
  MobileChatToggle,
  ChatArea,
  SharedFilesSidebar,
  UserSearchModal,
  type Chat,
  type Message as ChatMessage,
  type SharedFile,
} from "@/app/components/messenger";
import { BackHeader } from "@/app/components/common/BackHeader";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  type Message,
  type Conversation,
} from "@/app/hooks/useMessaging";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import { useAuth } from "@/app/provider/AuthProvider";
import { Loader2 } from "@/app/components/ui/icons";

// Mock shared files (backend doesn't have this yet)
const mockSharedFiles: SharedFile[] = [];

export default function MessengerPage() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSharedFilesCollapsed, setIsSharedFilesCollapsed] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  // Fetch conversations from backend
  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations(20, 0);

  // Fetch messages for selected conversation
  const {
    messages: apiMessages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useMessages(selectedConversationId, 50, 0);

  // Send message hook
  const { sendMessage, isSending } = useSendMessage();

  // Mark as read hook
  const { markAsRead } = useMarkAsRead();

  // Convert API messages to ChatMessage format
  useEffect(() => {
    if (apiMessages && apiMessages.length > 0) {
      const converted: ChatMessage[] = apiMessages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.createdAt,
        isRead: msg.isRead,
        mediaUrl: msg.mediaUrl,
      }));
      setLocalMessages(converted);
    } else {
      setLocalMessages([]);
    }
  }, [apiMessages]);

  // Convert API conversations to Chat format
  const chats: Chat[] = (conversations || []).map((conv) => {
    // Get the other participant (not current user)
    const otherParticipant = conv.participants.find((p) => p.user.id !== user?.id);
    const otherUser = otherParticipant?.user;

    return {
      id: conv.id,
      user: {
        id: otherUser?.id || "",
        name: otherUser?.displayName || otherUser?.username || "Unknown",
        username: otherUser?.username || "unknown",
        avatar: otherUser?.avatarUrl || "",
        isOnline: otherUser?.isOnline || false,
      },
      lastMessage: conv.lastMessage?.content || "",
      lastMessageTime: conv.lastMessage?.createdAt || conv.createdAt,
      unreadCount: conv.unreadCount,
    };
  });

  // WebSocket for real-time updates
  const { isConnected, sendTypingIndicator, joinConversation, leaveConversation } = useWebSocket({
    onNewMessage: (event) => {
      // If message is for current conversation, add it
      if (event.conversationId === selectedConversationId) {
        const newMessage: ChatMessage = {
          id: event.message.id,
          senderId: event.message.senderId,
          content: event.message.content,
          timestamp: event.message.createdAt,
          isRead: event.message.isRead,
          mediaUrl: event.message.mediaUrl,
        };
        setLocalMessages((prev) => [...prev, newMessage]);

        // Mark as read if viewing this conversation
        if (selectedConversationId && event.message.senderId !== user?.id) {
          markAsRead(selectedConversationId, event.message.id);
        }
      }

      // Refetch conversations to update last message
      refetchConversations();
    },
    onMessageRead: (event) => {
      // Update read status of messages
      if (event.conversationId === selectedConversationId) {
        setLocalMessages((prev) =>
          prev.map((msg) =>
            event.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
          )
        );
      }
    },
    onTypingIndicator: (event) => {
      // Handle typing indicator (could show in UI)
      console.log("Typing:", event);
    },
  });

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversationId) {
      joinConversation(selectedConversationId);
      return () => {
        leaveConversation(selectedConversationId);
      };
    }
  }, [selectedConversationId, joinConversation, leaveConversation]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedConversationId && localMessages.length > 0) {
      const lastMessage = localMessages[localMessages.length - 1];
      if (lastMessage && !lastMessage.isRead && lastMessage.senderId !== user?.id) {
        markAsRead(selectedConversationId, lastMessage.id);
      }
    }
  }, [selectedConversationId, localMessages, markAsRead, user?.id]);

  const handleSelectChat = (chatId: string) => {
    setSelectedConversationId(chatId);
    setIsMobileDrawerOpen(false);
  };

  const handleNewChat = () => {
    setIsUserSearchOpen(true);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    refetchConversations();
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !content.trim()) return;

    // Optimistically add message to UI
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || "current-user",
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setLocalMessages((prev) => [...prev, optimisticMessage]);

    // Send to backend
    const message = await sendMessage(selectedConversationId, content);

    if (message) {
      // Replace optimistic message with real one
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? {
                id: message.id,
                senderId: message.senderId,
                content: message.content,
                timestamp: message.createdAt,
                isRead: message.isRead,
                mediaUrl: message.mediaUrl,
              }
            : msg
        )
      );

      // Refetch conversations to update last message
      refetchConversations();
    } else {
      // Remove optimistic message on error
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    }
  };

  const handleEmojiClick = () => {
    console.log("Emoji picker clicked");
  };

  const handleAttachmentClick = () => {
    console.log("Attachment clicked");
  };

  const handleFileClick = (fileId: string) => {
    console.log("File clicked:", fileId);
  };

  const handleToggleSharedFiles = () => {
    setIsSharedFilesCollapsed((prev) => !prev);
  };

  const handleSeeMoreFiles = () => {
    console.log("See more files clicked");
  };

  // Get selected chat data
  const selectedChat = chats.find((c) => c.id === selectedConversationId);

  // Loading state
  if (conversationsLoading && chats.length === 0) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <BackHeader title="Messages" fallbackHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <BackHeader title="Messages" fallbackHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-error mb-4">Failed to load conversations</p>
            <button
              onClick={() => refetchConversations()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <BackHeader title="Messages" fallbackHref="/" />
      <div className="flex flex-1 w-full flex-col overflow-hidden md:flex-row">
        {/* Mobile Chat Selector */}
        <div className="border-b border-border-default p-4 md:hidden">
          <MobileChatToggle
            onClick={() => setIsMobileDrawerOpen(true)}
            selectedChatName={
              selectedChat?.isGroup
                ? selectedChat.groupName
                : selectedChat?.user.name
            }
          />
        </div>

        {/* Left Sidebar - Chats List (280px) */}
        <aside className="hidden w-[280px] flex-shrink-0 md:block">
          <ChatSidebar
            chats={chats}
            selectedChatId={selectedConversationId || ""}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
          />
        </aside>

        {/* Mobile Drawer */}
        <MobileChatDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        >
          <ChatSidebar
            chats={chats}
            selectedChatId={selectedConversationId || ""}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
          />
        </MobileChatDrawer>

        {/* Main Chat Area (flexible center) */}
        <main className="min-h-0 min-w-0 flex-1">
          {selectedChat ? (
            messagesLoading && localMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <ChatArea
                chatUser={selectedChat.user}
                messages={localMessages}
                currentUserId={user?.id || ""}
                onSendMessage={handleSendMessage}
                onEmojiClick={handleEmojiClick}
                onAttachmentClick={handleAttachmentClick}
                isSharedFilesVisible={!isSharedFilesCollapsed}
                onToggleSharedFiles={handleToggleSharedFiles}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-neutral-dark-200 mb-4">
                  Select a chat to start messaging
                </p>
                {chats.length === 0 && (
                  <p className="text-text-tertiary text-sm">
                    No conversations yet. Start a new chat!
                  </p>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Shared Files with collapsible animation */}
        <aside
          className={cn(
            "hidden flex-shrink-0 transition-all duration-300 ease-out lg:block",
            isSharedFilesCollapsed ? "w-0 overflow-hidden p-0" : "w-[280px] p-4"
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out",
              isSharedFilesCollapsed
                ? "scale-95 opacity-0"
                : "scale-100 opacity-100"
            )}
          >
            <SharedFilesSidebar
              files={mockSharedFiles}
              onFileClick={handleFileClick}
              onSeeMore={handleSeeMoreFiles}
              isCollapsed={isSharedFilesCollapsed}
              onToggleCollapse={handleToggleSharedFiles}
            />
          </div>
        </aside>
      </div>

      {/* WebSocket connection indicator (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 px-3 py-1 bg-surface-elevated border border-border-subtle rounded-full text-xs">
          <span
            className={cn(
              "inline-block w-2 h-2 rounded-full mr-2",
              isConnected ? "bg-success" : "bg-error"
            )}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      )}

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
