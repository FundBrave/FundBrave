"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyCommentInputProps {
  postId: string;
  replyTo?: { id: string; username: string };
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * StickyCommentInput - Mobile fixed-bottom comment input
 * Keyboard-aware with expand/collapse states
 */
export function StickyCommentInput({
  postId,
  replyTo,
  onSubmit,
  onCancel,
  disabled = false,
  placeholder = "Write a comment...",
  className,
}: StickyCommentInputProps) {
  const [content, setContent] = useState(replyTo ? `@${replyTo.username} ` : "");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxLength = 1000;
  const isValid = content.trim().length > 0 && content.length <= maxLength;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Auto-focus when replying
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
      setIsFocused(true);
    }
  }, [replyTo]);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
      setIsFocused(false);
      textareaRef.current?.blur();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent(replyTo ? `@${replyTo.username} ` : "");
    setIsFocused(false);
    textareaRef.current?.blur();
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isValid) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-subtle",
        "transition-all duration-200 ease-out",
        "md:relative md:border-0 md:bg-transparent",
        isFocused ? "shadow-2xl" : "shadow-lg md:shadow-none",
        className
      )}
      // iOS safe area inset
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
      }}
    >
      <div className="max-w-3xl mx-auto px-4 pt-3">
        {/* Reply Context (if replying) */}
        {replyTo && (
          <div className="flex items-center justify-between mb-2 text-xs text-foreground-muted">
            <span>
              Replying to <span className="text-primary-400">@{replyTo.username}</span>
            </span>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-surface-overlay rounded transition-colors"
              aria-label="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Container */}
        <div
          className={cn(
            "flex items-end gap-3 p-3 rounded-lg border transition-colors",
            isFocused
              ? "bg-surface-sunken border-primary-500/50"
              : "bg-surface-overlay border-border-subtle"
          )}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-surface-sunken border border-border-subtle flex-shrink-0 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
          </div>

          {/* Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Small delay to allow button clicks
                setTimeout(() => {
                  if (content.trim().length === 0) {
                    setIsFocused(false);
                  }
                }, 100);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSubmitting}
              maxLength={maxLength}
              rows={1}
              className={cn(
                "w-full bg-transparent text-foreground text-sm resize-none outline-none",
                "placeholder:text-foreground-muted",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Comment input"
            />

            {/* Character Count (when focused) */}
            {isFocused && (
              <div
                className={cn(
                  "text-xs mt-1 transition-colors",
                  content.length > maxLength * 0.9
                    ? "text-destructive"
                    : "text-foreground-muted"
                )}
              >
                {content.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={cn(
              "p-2 rounded-full transition-all flex-shrink-0",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
              isValid
                ? "bg-primary-500 hover:bg-primary-600 text-white"
                : "bg-surface-sunken text-foreground-muted cursor-not-allowed"
            )}
            aria-label="Send comment"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Cancel Button (when expanded) */}
        {isFocused && !replyTo && (
          <div className="flex justify-end mt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StickyCommentInput;
