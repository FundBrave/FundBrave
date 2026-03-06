"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Send, Loader2 } from "@/app/components/ui/icons";
import { AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { Avatar } from "@/app/components/ui/Avatar";
import type { MentionUser } from "@/app/components/social/PostEditor";

interface CommentInputProps {
  placeholder?: string;
  onSubmit: (content: string, mentions?: string[]) => void;
  onCancel?: () => void;
  isReply?: boolean;
  autoFocus?: boolean;
  userAvatar?: string;
  className?: string;
  /** Called to fetch matching users for @mention autocomplete */
  onSearchUsers?: (query: string) => Promise<MentionUser[]>;
}

/**
 * CommentInput - Comment input with @mention autocomplete support
 *
 * Features:
 * - @mention detection and autocomplete dropdown
 * - Real-time user search via onSearchUsers prop
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Ctrl+Enter to submit
 * - Loading state
 * - Cancel button for replies
 */
export function CommentInput({
  placeholder = "Write a comment...",
  onSubmit,
  onCancel,
  isReply = false,
  userAvatar,
  className,
  onSearchUsers,
}: CommentInputProps) {
  const { currentUser } = useCurrentUser();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Use provided avatar, fallback to current user's avatar
  const avatarUrl =
    userAvatar ||
    currentUser?.avatarUrl ||
    undefined;

  /**
   * Detect @ mentions in text
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
  }, [content]);

  /**
   * Search users when mention query changes
   */
  useEffect(() => {
    if (!showMentions || !onSearchUsers) {
      if (!onSearchUsers) setMentionUsers([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const users = await onSearchUsers(mentionQuery);
        setMentionUsers(users);
      } catch (error) {
        console.error("Error searching users:", error);
        setMentionUsers([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounceTimer);
  }, [mentionQuery, showMentions, onSearchUsers]);

  /**
   * Insert a mention into the text
   */
  const insertMention = useCallback(
    (user: MentionUser) => {
      if (!textareaRef.current) return;

      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = content.slice(0, cursorPos);
      const textAfterCursor = content.slice(cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const beforeAt = content.slice(0, lastAtIndex);
        const mention = `@${user.username}`;
        const newContent = beforeAt + mention + " " + textAfterCursor;

        setContent(newContent);
        setShowMentions(false);

        setTimeout(() => {
          const newCursorPos = lastAtIndex + mention.length + 1;
          textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current?.focus();
        }, 0);
      }
    },
    [content]
  );

  /**
   * Parse mentions from content
   */
  function parseMentions(): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.matchAll(mentionRegex);
    return [...new Set(Array.from(matches, (m) => m[1]))];
  }

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const mentions = parseMentions();
      await onSubmit(content.trim(), mentions.length > 0 ? mentions : undefined);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention dropdown navigation
    if (showMentions && mentionUsers.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedMentionIndex((prev) =>
            prev < mentionUsers.length - 1 ? prev + 1 : prev
          );
          return;
        case "ArrowUp":
          e.preventDefault();
          setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
          return;
        case "Enter":
          e.preventDefault();
          insertMention(mentionUsers[selectedMentionIndex]);
          return;
        case "Escape":
          e.preventDefault();
          setShowMentions(false);
          return;
      }
    }

    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape
    if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  const handleCancel = () => {
    setContent("");
    onCancel?.();
  };

  return (
    <div className={cn("flex gap-3", isReply && "ml-12", className)}>
      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-surface-sunken border border-border-subtle flex-shrink-0 overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Your avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-tertiary text-xs font-medium">
            {currentUser?.displayName?.charAt(0) || "?"}
          </div>
        )}
      </div>

      {/* Input Container */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full min-h-[80px] bg-surface-sunken border border-border-subtle rounded-lg px-3 py-2",
              "text-sm text-foreground placeholder:text-text-tertiary",
              "resize-none outline-none focus:border-primary/50 transition-colors"
            )}
            aria-label="Comment input"
          />

          {/* Mention Autocomplete Dropdown */}
          {showMentions && onSearchUsers && (
            <div
              ref={mentionDropdownRef}
              className="absolute bottom-full mb-1 left-0 z-50 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg overflow-hidden"
              style={{ maxHeight: "200px", width: "260px" }}
              role="listbox"
              aria-label="Mention suggestions"
            >
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-text-secondary">
                  Searching...
                </div>
              ) : mentionUsers.length > 0 ? (
                <div className="overflow-y-auto max-h-[200px] custom-scrollbar">
                  {mentionUsers.map((user, index) => (
                    <button
                      key={user.id}
                      onClick={() => insertMention(user)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                        "hover:bg-surface-sunken",
                        index === selectedMentionIndex && "bg-surface-sunken"
                      )}
                      role="option"
                      aria-selected={index === selectedMentionIndex}
                    >
                      <Avatar
                        src={user.avatar}
                        alt={user.name}
                        fallback={user.name.charAt(0)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-foreground truncate">
                            {user.name}
                          </span>
                          {user.verified && (
                            <svg
                              className="w-3.5 h-3.5 text-primary flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-text-secondary">
                          @{user.username}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : mentionQuery.length > 0 ? (
                <div className="px-4 py-3 text-sm text-text-secondary">
                  No users found
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">
              {content.length > 0 && (
                <>
                  {content.length} characters
                  <span className="mx-2">·</span>
                </>
              )}
              Ctrl+Enter to submit
            </span>
            {onSearchUsers && (
              <div className="flex items-center gap-1 text-xs text-text-tertiary">
                <AtSign size={11} />
                <span>mention</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(isReply || onCancel) && (
              <button
                onClick={handleCancel}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs text-text-secondary hover:text-foreground active:scale-[0.98] transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className={cn(
                "flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                content.trim() && !isSubmitting
                  ? "bg-primary text-white hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98]"
                  : "bg-surface-overlay text-text-tertiary cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={12} />
                  {isReply ? "Reply" : "Comment"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommentInput;
