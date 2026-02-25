"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, PanelRightClose, PanelRightOpen } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/button";
import { MessageBubble, DateSeparator } from "./MessageBubble";
import { EncryptionBadge } from "./EncryptionBadge";
import { ConnectionStatus } from "./ConnectionStatus";
import { WakuFallbackBanner } from "./WakuFallbackBanner";
import { WalletNudgeBanner } from "./WalletNudgeBanner";
import type { Message, ChatUser } from "@/app/types/messenger";
import type { WakuConnectionStatus, MessageSendStatus } from "@/app/types/web3-chat";

export interface ChatAreaProps {
  /** Current chat user info */
  chatUser: ChatUser;
  /** List of messages in the chat */
  messages: Message[];
  /** Current user ID (to determine sent/received messages) */
  currentUserId: string;
  /** Called when user sends a message */
  onSendMessage?: (content: string) => void;
  /** Called when user clicks emoji button */
  onEmojiClick?: () => void;
  /** Called when user clicks attachment button */
  onAttachmentClick?: () => void;
  /** Whether the shared files sidebar is visible */
  isSharedFilesVisible?: boolean;
  /** Called when user toggles shared files visibility */
  onToggleSharedFiles?: () => void;
  /** Whether the current conversation is E2E encrypted */
  isEncrypted?: boolean;
  /** Waku connection status for the connection indicator */
  connectionStatus?: WakuConnectionStatus;
  /** Whether Waku is in degraded (fallback) mode */
  isDegraded?: boolean;
  /** Whether the current user is using a temp wallet */
  isTempWallet?: boolean;
  /** Callback to retry Waku connection from fallback banner */
  onRetryConnection?: () => void;
  /** Callback to open wallet connect flow from nudge banner */
  onConnectWallet?: () => void;
  /** Optional map of messageId -> sendStatus for WhatsApp-style indicators */
  messageSendStatuses?: Record<string, MessageSendStatus>;
}

/**
 * Groups messages by date for displaying date separators
 */
function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();

  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, message]);
  });

  return groups;
}

/**
 * Chat header props
 */
interface ChatHeaderProps {
  user: ChatUser;
  isSharedFilesVisible?: boolean;
  onToggleSharedFiles?: () => void;
  isEncrypted?: boolean;
  connectionStatus?: WakuConnectionStatus;
}

/**
 * Chat header component showing user info, status, and actions
 */
function ChatHeader({
  user,
  isSharedFilesVisible = true,
  onToggleSharedFiles,
  isEncrypted,
  connectionStatus,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border-default bg-surface-elevated px-4 py-3 md:px-6">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={user.avatar}
          alt={user.name}
          fallback={user.name.charAt(0)}
          size="md"
        />
        {user.isOnline && (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-elevated bg-green-500"
            aria-label="Online"
          />
        )}
      </div>

      {/* User info */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-foreground">
          @{user.username}
        </h2>
        <p
          className={cn(
            "text-xs",
            user.isOnline ? "text-green-400" : "text-text-tertiary"
          )}
        >
          {user.isOnline ? "Online" : "Offline"}
        </p>
      </div>

      {/* Encryption badge + connection status */}
      <div className="hidden items-center gap-2 md:flex">
        {isEncrypted !== undefined && (
          <EncryptionBadge isEncrypted={isEncrypted} />
        )}
        {connectionStatus && (
          <ConnectionStatus status={connectionStatus} />
        )}
      </div>

      {/* Header actions - Toggle shared files sidebar */}
      <div className="hidden items-center gap-2 lg:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSharedFiles}
          className="h-11 w-11 rounded-full hover:bg-surface-overlay active:bg-foreground/10 active:scale-[0.98]"
          aria-label={isSharedFilesVisible ? "Hide shared files" : "Show shared files"}
        >
          {isSharedFilesVisible ? (
            <PanelRightClose className="h-5 w-5 text-text-secondary" />
          ) : (
            <PanelRightOpen className="h-5 w-5 text-text-secondary" />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Message input bar component
 */
function MessageInput({
  onSend,
  onEmojiClick,
  onAttachmentClick,
}: {
  onSend: (content: string) => void;
  onEmojiClick?: () => void;
  onAttachmentClick?: () => void;
}) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 border-t border-border-default bg-surface-elevated px-4 py-3 md:px-6"
    >
      {/* Emoji button */}
      <button
        type="button"
        onClick={onEmojiClick}
        className="flex min-h-[44px] min-w-[44px] h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-overlay hover:text-foreground active:bg-white/20 active:scale-[0.98]"
        aria-label="Add emoji"
      >
        <Smile className="h-5 w-5" />
      </button>

      {/* Message input */}
      <div className="relative flex-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message here..."
          inputMode="text"
          enterKeyHint="send"
          className="w-full min-h-[44px] rounded-full border border-border-default bg-surface-overlay py-3 pl-4 pr-12 text-sm text-foreground placeholder:text-text-tertiary focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {/* Attachment button inside input */}
        <button
          type="button"
          onClick={onAttachmentClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-tertiary transition-colors hover:text-foreground active:text-foreground active:scale-[0.98]"
          aria-label="Add attachment"
        >
          <Paperclip className="h-5 w-5" />
        </button>
      </div>

      {/* Send button - using brand gradient */}
      <button
        type="submit"
        disabled={!message.trim()}
        className={cn(
          "flex min-h-[44px] min-w-[44px] h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all",
          message.trim()
            ? "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)] text-white shadow-[0_8px_30px_0_rgba(97,36,243,0.35)] hover:brightness-110 active:brightness-90 active:scale-[0.98]"
            : "bg-surface-overlay text-text-tertiary cursor-not-allowed"
        )}
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}

/**
 * Main chat area component containing header, messages, and input.
 */
export function ChatArea({
  chatUser,
  messages,
  currentUserId,
  onSendMessage,
  onEmojiClick,
  onAttachmentClick,
  isSharedFilesVisible = true,
  onToggleSharedFiles,
  isEncrypted,
  connectionStatus,
  isDegraded,
  isTempWallet,
  onRetryConnection,
  onConnectWallet,
  messageSendStatuses,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    onSendMessage?.(content);
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Chat Header */}
      <ChatHeader
        user={chatUser}
        isSharedFilesVisible={isSharedFilesVisible}
        onToggleSharedFiles={onToggleSharedFiles}
        isEncrypted={isEncrypted}
        connectionStatus={connectionStatus}
      />

      {/* Degraded mode fallback banner */}
      {isDegraded && onRetryConnection && (
        <WakuFallbackBanner onRetry={onRetryConnection} />
      )}

      {/* Wallet nudge banner for temp-wallet users */}
      {isTempWallet && onConnectWallet && (
        <WalletNudgeBanner onConnect={onConnectWallet} />
      )}

      {/* Messages Area */}
      <div className="scrollbar-auto-hide flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {Array.from(messageGroups.entries()).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <DateSeparator date={date} />

            {/* Messages for this date */}
            <div className="space-y-3">
              {dateMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSent={message.senderId === currentUserId}
                  showTimestamp
                  sendStatus={messageSendStatuses?.[message.id]}
                  isEncrypted={isEncrypted}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onEmojiClick={onEmojiClick}
        onAttachmentClick={onAttachmentClick}
      />
    </div>
  );
}

export default ChatArea;
