"use client";

import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Send, X, AtSign, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Avatar } from "@/app/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useContentModeration } from "@/app/hooks/useContentModeration";
import { ContentModerationWarning } from "@/app/components/ai/ContentModerationWarning";
import type { ModerationResponse } from "@/app/lib/ai-service";

/**
 * User data for mentions
 */
export interface MentionUser {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  verified?: boolean;
}

/**
 * Parsed mention in the text
 */
interface ParsedMention {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

interface PostEditorProps {
  /** Current user avatar for display */
  currentUserAvatar?: string;
  /** Current user name for display */
  currentUserName?: string;
  /** Placeholder text for the editor */
  placeholder?: string;
  /** Maximum character limit */
  maxLength?: number;
  /** Called when post is submitted */
  onSubmit?: (content: string, mentions: string[], imageUrl?: string) => void;
  /** Called to fetch matching users for mentions */
  onSearchUsers?: (query: string) => Promise<MentionUser[]>;
  /** Whether the editor is in loading state */
  isSubmitting?: boolean;
  /** Custom className */
  className?: string;
  /** Enable content moderation */
  enableModeration?: boolean;
  /** Called when moderation check completes */
  onModerationResult?: (result: ModerationResponse) => void;
  /** Allow posting flagged content */
  allowFlaggedContent?: boolean;
}

/**
 * PostEditor Component
 *
 * Rich text editor for creating social posts with @mention support.
 *
 * Features:
 * - Real-time mention detection when user types @
 * - Autocomplete dropdown with user search
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click to insert mentions
 * - Mentions are linked to user profiles
 * - Character count with limit
 * - Optional image attachment
 * - Accessible with ARIA attributes
 */
export function PostEditor({
  currentUserAvatar,
  currentUserName = "You",
  placeholder = "What's on your mind?",
  maxLength = 500,
  onSubmit,
  onSearchUsers,
  isSubmitting = false,
  className,
  enableModeration = true,
  onModerationResult,
  allowFlaggedContent = true,
}: PostEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string>();
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showModerationWarning, setShowModerationWarning] = useState(false);
  const [forceSubmit, setForceSubmit] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Content moderation hook
  const {
    checkContent,
    isChecking: isModerationChecking,
    result: moderationResult,
    error: moderationError,
    reset: resetModeration,
  } = useContentModeration();

  // Mock users for demonstration (replace with real search)
  const mockUsers: MentionUser[] = [
    { id: "1", username: "johndoe", name: "John Doe", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", verified: true },
    { id: "2", username: "janedoe", name: "Jane Doe", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", verified: false },
    { id: "3", username: "alexsmith", name: "Alex Smith", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", verified: true },
    { id: "4", username: "sarahwilson", name: "Sarah Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", verified: false },
  ];

  /**
   * Detect @ mentions in text and show autocomplete
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);

    // Find the last @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setSelectedMentionIndex(0);

        // Calculate dropdown position
        const coords = getCaretCoordinates(textarea, cursorPos);
        setMentionPosition({
          top: coords.top + 20,
          left: coords.left,
        });

        return;
      }
    }

    setShowMentions(false);
  }, [content]);

  /**
   * Search for users when mention query changes
   */
  useEffect(() => {
    if (!showMentions) return;

    const searchUsers = async () => {
      setIsSearching(true);

      try {
        let users: MentionUser[];

        if (onSearchUsers) {
          users = await onSearchUsers(mentionQuery);
        } else {
          // Use mock users for demonstration
          users = mockUsers.filter(
            (user) =>
              user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
              user.name.toLowerCase().includes(mentionQuery.toLowerCase())
          );
        }

        setMentionUsers(users);
      } catch (error) {
        console.error("Error searching users:", error);
        setMentionUsers([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [mentionQuery, showMentions, onSearchUsers]);

  /**
   * Get caret coordinates in textarea for dropdown positioning
   */
  function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
    const div = document.createElement("div");
    const style = getComputedStyle(element);

    // Copy textarea styles
    ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight", "padding"].forEach((prop) => {
      div.style[prop as any] = style[prop as any];
    });

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.width = `${element.offsetWidth}px`;

    const textContent = element.value.substring(0, position);
    div.textContent = textContent;

    const span = document.createElement("span");
    span.textContent = element.value.substring(position) || ".";
    div.appendChild(span);

    document.body.appendChild(div);

    const coordinates = {
      top: span.offsetTop,
      left: span.offsetLeft,
    };

    document.body.removeChild(div);

    return coordinates;
  }

  /**
   * Insert a mention into the text
   */
  function insertMention(user: MentionUser) {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    // Find the @ position
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const beforeAt = content.slice(0, lastAtIndex);
      const mention = `@${user.username}`;
      const newContent = beforeAt + mention + " " + textAfterCursor;

      setContent(newContent);
      setShowMentions(false);

      // Set cursor position after the mention
      setTimeout(() => {
        const newCursorPos = lastAtIndex + mention.length + 1;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current?.focus();
      }, 0);
    }
  }

  /**
   * Handle keyboard navigation in mention dropdown
   */
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!showMentions || mentionUsers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < mentionUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        if (showMentions) {
          e.preventDefault();
          insertMention(mentionUsers[selectedMentionIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowMentions(false);
        break;
    }
  }

  /**
   * Parse mentions from content for submission
   */
  function parseMentions(): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.matchAll(mentionRegex);
    const usernames = Array.from(matches, (m) => m[1]);

    // Remove duplicates
    return [...new Set(usernames)];
  }

  /**
   * Handle post submission with moderation check
   */
  async function handleSubmit() {
    if (!content.trim() || isSubmitting || isModerationChecking) return;

    // If moderation is enabled and we haven't checked yet or force submit
    if (enableModeration && !forceSubmit) {
      try {
        const result = await checkContent(content, "user_message");

        // Notify parent of moderation result
        onModerationResult?.(result);

        // If content is not safe, show warning
        if (!result.is_safe) {
          setShowModerationWarning(true);

          // If content is rejected, don't allow submission
          if (result.action === "reject") {
            return;
          }

          // If flagged and we don't allow flagged content, stop
          if (!allowFlaggedContent) {
            return;
          }

          // Show warning and wait for user decision
          return;
        }
      } catch (err) {
        // If moderation check fails, allow submission anyway
        console.error("Moderation check failed:", err);
      }
    }

    // Submit the post
    const mentions = parseMentions();
    onSubmit?.(content, mentions, imageUrl);

    // Reset editor
    setContent("");
    setImageUrl(undefined);
    setShowModerationWarning(false);
    setForceSubmit(false);
    resetModeration();
  }

  /**
   * Handle proceeding with flagged content
   */
  function handleProceedAnyway() {
    setForceSubmit(true);
    setShowModerationWarning(false);
    // Call submit directly since forceSubmit won't be updated immediately
    const mentions = parseMentions();
    onSubmit?.(content, mentions, imageUrl);

    // Reset editor
    setContent("");
    setImageUrl(undefined);
    setForceSubmit(false);
    resetModeration();
  }

  /**
   * Handle editing content after moderation warning
   */
  function handleEditContent() {
    setShowModerationWarning(false);
    setForceSubmit(false);
    textareaRef.current?.focus();
  }

  /**
   * Handle dismiss moderation warning
   */
  function handleDismissWarning() {
    setShowModerationWarning(false);
  }

  /**
   * Handle content change
   */
  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
    }
  }

  /**
   * Navigate to user profile when mention is clicked
   */
  function handleMentionClick(username: string) {
    router.push(`/profile/${username}`);
  }

  const isOverLimit = content.length > maxLength;
  const charactersRemaining = maxLength - content.length;

  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-4", className)}>
      <div className="flex gap-3">
        {/* User Avatar */}
        <Avatar
          src={currentUserAvatar}
          alt={currentUserName}
          fallback={currentUserName.charAt(0)}
          size="md"
        />

        <div className="flex-1">
          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSubmitting}
              className={cn(
                "w-full min-h-[100px] bg-transparent text-foreground placeholder:text-text-tertiary",
                "resize-none outline-none",
                "focus:outline-none",
                isOverLimit && "text-destructive"
              )}
              aria-label="Post content"
              aria-describedby="post-editor-help"
            />

            {/* Mention Autocomplete Dropdown */}
            {showMentions && mentionPosition && (
              <div
                ref={mentionDropdownRef}
                className="absolute z-50 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg overflow-hidden"
                style={{
                  top: `${mentionPosition.top}px`,
                  left: `${mentionPosition.left}px`,
                  maxHeight: "200px",
                  width: "280px",
                }}
                role="listbox"
                aria-label="Mention suggestions"
              >
                {isSearching ? (
                  <div className="px-4 py-3 text-sm text-text-secondary">Searching...</div>
                ) : mentionUsers.length > 0 ? (
                  <div className="overflow-y-auto max-h-[200px] custom-scrollbar">
                    {mentionUsers.map((user, index) => (
                      <button
                        key={user.id}
                        onClick={() => insertMention(user)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
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
                              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary">@{user.username}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-text-secondary">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative mt-3 rounded-lg overflow-hidden">
              <img src={imageUrl} alt="Post attachment" className="w-full h-48 object-cover" />
              <button
                onClick={() => setImageUrl(undefined)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Content Moderation Warning */}
          {showModerationWarning && moderationResult && (
            <div className="mt-3">
              <ContentModerationWarning
                result={moderationResult}
                isChecking={false}
                error={null}
                onDismiss={handleDismissWarning}
                onEdit={handleEditContent}
                onProceed={handleProceedAnyway}
                allowProceed={allowFlaggedContent && moderationResult.action !== "reject"}
              />
            </div>
          )}

          {/* Editor Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              {/* Image Upload Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // In real implementation, open file picker
                  const demoImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop";
                  setImageUrl(demoImageUrl);
                }}
                disabled={isSubmitting}
                className="text-text-secondary hover:text-foreground"
                aria-label="Attach image"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>

              {/* Mention Hint */}
              <div className="flex items-center gap-1 text-xs text-text-tertiary ml-2">
                <AtSign className="w-3.5 h-3.5" />
                <span>Type @ to mention</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Character Count */}
              <span
                id="post-editor-help"
                className={cn(
                  "text-sm",
                  isOverLimit ? "text-destructive font-medium" : "text-text-tertiary"
                )}
                aria-live="polite"
              >
                {charactersRemaining < 50 && `${charactersRemaining} characters remaining`}
                {isOverLimit && "Character limit exceeded"}
              </span>

              {/* Moderation indicator */}
              {enableModeration && (
                <div className="flex items-center gap-1 text-xs text-text-tertiary">
                  <Shield className="w-3 h-3" />
                  <span>AI moderated</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isOverLimit || isSubmitting || isModerationChecking}
                size="sm"
                className="gap-2"
              >
                {isModerationChecking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking...
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Display post content with clickable mentions
 */
export function PostContentWithMentions({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const router = useRouter();

  // Parse content and create parts with mentions
  const parts: { text: string; isMention: boolean; username?: string }[] = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        text: content.slice(lastIndex, match.index),
        isMention: false,
      });
    }

    // Add mention
    parts.push({
      text: match[0],
      isMention: true,
      username: match[1],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      text: content.slice(lastIndex),
      isMention: false,
    });
  }

  return (
    <p className={cn("text-foreground whitespace-pre-wrap break-words", className)}>
      {parts.map((part, index) =>
        part.isMention ? (
          <button
            key={index}
            onClick={() => router.push(`/profile/${part.username}`)}
            className="text-primary hover:underline font-medium cursor-pointer"
            aria-label={`View profile of ${part.username}`}
          >
            {part.text}
          </button>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </p>
  );
}
