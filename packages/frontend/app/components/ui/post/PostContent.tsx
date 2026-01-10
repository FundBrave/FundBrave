"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface PostContentProps {
  /** The text content to display */
  content: string;
  /** Number of characters before truncating (0 = no truncation) */
  truncateAt?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PostContent - Post text with optional "See more" truncation
 */
export function PostContent({ content, truncateAt = 0, className }: PostContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = truncateAt > 0 && content.length > truncateAt;
  const displayContent = shouldTruncate && !isExpanded
    ? content.slice(0, truncateAt) + "..."
    : content;

  return (
    <div className={cn("mt-0.5", className)}>
      <p className="text-foreground whitespace-pre-wrap leading-normal">
        {displayContent}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-foreground hover:underline text-sm mt-1"
        >
          {isExpanded ? "Show less" : "See more"}
        </button>
      )}
    </div>
  );
}

export default PostContent;
