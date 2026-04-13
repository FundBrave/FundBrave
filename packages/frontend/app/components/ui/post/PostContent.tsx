"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
 * Render text with @mentions as clickable links and #hashtags as styled text
 */
function ContentWithMentions({ text, className }: { text: string; className?: string }) {
  const router = useRouter();

  // Match @mentions and #hashtags
  const parts: { text: string; type: "text" | "mention" | "hashtag"; value?: string }[] = [];
  const regex = /(@(\w+))|(#(\w+))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        type: "text",
      });
    }

    if (match[1]) {
      // @mention
      parts.push({
        text: match[1],
        type: "mention",
        value: match[2],
      });
    } else if (match[3]) {
      // #hashtag
      parts.push({
        text: match[3],
        type: "hashtag",
        value: match[4],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      type: "text",
    });
  }

  // If no special content found, render plain text
  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "mention") {
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/profile/${part.value}`);
              }}
              className="text-primary hover:underline font-medium cursor-pointer"
              aria-label={`View profile of ${part.value}`}
            >
              {part.text}
            </button>
          );
        }
        if (part.type === "hashtag") {
          return (
            <span
              key={index}
              className="text-primary font-medium"
            >
              {part.text}
            </span>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </span>
  );
}

/**
 * PostContent - Post text with @mention links and optional "See more" truncation
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
        <ContentWithMentions text={displayContent} />
      </p>
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-foreground hover:underline text-sm mt-1"
        >
          {isExpanded ? "Show less" : "See more"}
        </button>
      )}
    </div>
  );
}

export default PostContent;
