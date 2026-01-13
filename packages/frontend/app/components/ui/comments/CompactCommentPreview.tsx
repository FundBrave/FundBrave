"use client";

import type { CommentPreview } from "@/app/types/comment";
import { cn } from "@/lib/utils";

interface CompactCommentPreviewProps {
  comment: CommentPreview;
  maxLength?: number;
  showAvatar?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * CompactCommentPreview - Truncated comment for notifications and activity feeds
 * Shows first N characters with ellipsis
 */
export function CompactCommentPreview({
  comment,
  maxLength = 100,
  showAvatar = true,
  onClick,
  className,
}: CompactCommentPreviewProps) {
  const truncatedContent =
    comment.content.length > maxLength
      ? `${comment.content.slice(0, maxLength)}...`
      : comment.content;

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        onClick && "cursor-pointer hover:bg-surface-overlay transition-colors rounded-lg p-2 -m-2",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Avatar (optional) */}
      {showAvatar && (
        <div className="w-6 h-6 rounded-full bg-surface-sunken border border-border-subtle flex-shrink-0 overflow-hidden">
          <img
            src={comment.author.avatar}
            alt={comment.author.username}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-medium text-foreground-muted">
            @{comment.author.username}:
          </span>{" "}
          <span className="text-foreground">{truncatedContent}</span>
        </p>
      </div>
    </div>
  );
}

export default CompactCommentPreview;
