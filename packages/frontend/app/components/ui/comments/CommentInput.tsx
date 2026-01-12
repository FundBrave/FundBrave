"use client";

import { useState, KeyboardEvent } from "react";
import { Send, Loader2 } from "@/app/components/ui/icons";
import { TextAreaField } from "@/app/components/ui/form/FormFields";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isReply?: boolean;
  autoFocus?: boolean;
  userAvatar?: string;
  className?: string;
}

/**
 * CommentInput - Wraps the existing TextAreaField for comment functionality
 * 
 * Features:
 * - Reuses TextAreaField component
 * - Ctrl+Enter to submit
 * - Loading state
 * - Cancel button for replies
 */
export function CommentInput({
  placeholder = "Write a comment...",
  onSubmit,
  onCancel,
  isReply = false,
  userAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  className,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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
    <div
      className={cn("flex gap-3", isReply && "ml-12", className)}
      onKeyDown={handleKeyDown}
    >
      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-surface-sunken border border-border-subtle flex-shrink-0 overflow-hidden">
        <img
          src={userAvatar}
          alt="Your avatar"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Input Container - Using TextAreaField */}
      <div className="flex-1 flex flex-col gap-2">
        <TextAreaField
          label=""
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          minHeight="80px"
          showMediaActions={false}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary">
            {content.length > 0 && (
              <>
                {content.length} characters
                <span className="mx-2">•</span>
              </>
            )}
            Ctrl+Enter to submit
          </span>

          <div className="flex items-center gap-2">
            {(isReply || onCancel) && (
              <button
                onClick={handleCancel}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs text-text-secondary hover:text-foreground active:text-foreground active:scale-[0.98] transition-colors"
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
