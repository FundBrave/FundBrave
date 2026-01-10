"use client";

import React, { useState } from "react";
import { Search, Plus, MessageSquare, X, Menu } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { ChatListItem } from "./ChatListItem";
import type { Chat, ChatFilterTab } from "@/app/types/messenger";

// Re-export types for backward compatibility
export type { Chat, ChatFilterTab };

interface ChatSidebarProps {
  /** List of chats to display */
  chats: Chat[];
  /** Currently selected chat ID */
  selectedChatId?: string;
  /** Called when a chat is selected */
  onSelectChat?: (chatId: string) => void;
  /** Called when user clicks new chat button */
  onNewChat?: () => void;
}

/**
 * Empty state component shown when no chats match the filter
 */
function EmptyChatState({ filterTab }: { filterTab: ChatFilterTab }) {
  const getMessage = () => {
    switch (filterTab) {
      case "new":
        return "No new messages.";
      case "direct":
        return "No direct messages yet.";
      case "groups":
        return "No group chats yet.";
      default:
        return "No chats found.";
    }
  };

  return (
    <EmptyState
      icon={<MessageSquare className="h-6 w-6 text-text-tertiary" />}
      message={getMessage()}
    />
  );
}

/**
 * Mobile drawer component for chat selection
 */
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileChatDrawer({
  isOpen,
  onClose,
  children,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Chat selection"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <span className="font-semibold text-foreground">Chats</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-11 w-11 rounded-full"
              aria-label="Close chat drawer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Mobile toggle button to open chat drawer
 */
interface MobileToggleProps {
  onClick: () => void;
  selectedChatName?: string;
}

export function MobileChatToggle({ onClick, selectedChatName }: MobileToggleProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border-border-default bg-surface-elevated px-3 py-2 text-left md:hidden"
      aria-label="Open chat selection"
    >
      <Menu className="h-5 w-5 text-text-secondary" />
      <span className="truncate text-sm font-medium text-foreground">
        {selectedChatName || "Select Chat"}
      </span>
    </Button>
  );
}

export function ChatSidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  const [activeFilter, setActiveFilter] = useState<ChatFilterTab>("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredChats = chats.filter((chat) => {
    // Filter by search query
    const displayName = chat.isGroup ? chat.groupName : chat.user.name;
    if (
      searchQuery &&
      !displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter by tab
    if (activeFilter === "direct" && chat.isGroup) return false;
    if (activeFilter === "groups" && !chat.isGroup) return false;
    // "new" tab shows all for now (could filter by unread)

    return true;
  });

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId);
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-border-default bg-surface-elevated">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="font-display text-xl font-bold text-foreground">Chats</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full hover:bg-surface-overlay"
            aria-label="Search chats"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5 text-text-secondary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full hover:bg-surface-overlay"
            aria-label="New chat"
            onClick={onNewChat}
          >
            <Plus className="h-5 w-5 text-text-secondary" />
          </Button>
        </div>
      </div>

      {/* Search input (collapsible) */}
      {isSearchOpen && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border-default bg-surface-overlay py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-text-tertiary focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Filter Tabs - Using Button component */}
      <div
        className="flex gap-2 px-4 pb-4"
        role="tablist"
        aria-label="Filter chats"
      >
        <Button
          variant={activeFilter === "new" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("new")}
          className="rounded-full"
          role="tab"
          aria-selected={activeFilter === "new"}
          aria-label="Show new chats"
        >
          New
        </Button>
        <Button
          variant={activeFilter === "direct" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("direct")}
          className="rounded-full"
          role="tab"
          aria-selected={activeFilter === "direct"}
          aria-label="Show direct chats"
        >
          Direct
        </Button>
        <Button
          variant={activeFilter === "groups" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("groups")}
          className="rounded-full"
          role="tab"
          aria-selected={activeFilter === "groups"}
          aria-label="Show group chats"
        >
          Groups
        </Button>
      </div>

      {/* Chats List */}
      <div
        className="scrollbar-auto-hide flex-1 overflow-y-auto"
        role="listbox"
        aria-label="Chats list"
      >
        {filteredChats.length === 0 ? (
          <EmptyChatState filterTab={activeFilter} />
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              onClick={() => handleSelectChat(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;
