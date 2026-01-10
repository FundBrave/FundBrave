"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import type { Chat } from "@/app/types/messenger";

export interface ChatListItemProps {
  /** Chat data to display */
  chat: Chat;
  /** Whether this chat is currently selected */
  isSelected?: boolean;
  /** Click handler for selecting the chat */
  onClick?: () => void;
}

/**
 * Individual chat list item component for the messenger sidebar.
 * Displays user avatar, name, username, message preview, and online status.
 */
export function ChatListItem({
  chat,
  isSelected = false,
  onClick,
}: ChatListItemProps) {
  const displayName = chat.isGroup ? chat.groupName : chat.user.name;
  const displayAvatar = chat.isGroup ? chat.groupAvatar : chat.user.avatar;
  const displayUsername = chat.isGroup ? undefined : `@${chat.user.username}`;

  return (
    <button
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-overlay",
        isSelected && "bg-surface-overlay"
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={displayAvatar}
          alt={displayName || "Chat"}
          fallback={displayName?.charAt(0) || "?"}
          size="md"
        />
        {/* Online indicator - green dot */}
        {!chat.isGroup && chat.user.isOnline && (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"
            aria-label="Online"
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1">
          <h3 className="truncate text-sm font-medium text-foreground">
            {displayName}
          </h3>
          {displayUsername && (
            <span className="truncate text-xs text-text-secondary">
              {displayUsername}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {chat.lastMessage}
        </p>
      </div>

      {/* Unread indicator */}
      {chat.unreadCount && chat.unreadCount > 0 && (
        <span
          className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 px-1.5 text-[10px] font-semibold text-foreground"
          aria-label={`${chat.unreadCount} unread messages`}
        >
          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
        </span>
      )}
    </button>
  );
}

export default ChatListItem;
