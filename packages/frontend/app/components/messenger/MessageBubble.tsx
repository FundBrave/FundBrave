"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Message, MessageAttachment } from "@/app/types/messenger";

export interface MessageBubbleProps {
  /** Message data */
  message: Message;
  /** Whether this message is from the current user (sent) or received */
  isSent: boolean;
  /** Optional sender avatar for received messages */
  senderAvatar?: string;
  /** Optional sender name for received messages */
  senderName?: string;
  /** Whether to show the timestamp */
  showTimestamp?: boolean;
}

/**
 * Formats a timestamp string to display time (e.g., "10:30 AM")
 */
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Renders message attachments (images, videos, documents)
 */
function MessageAttachments({
  attachments,
  isSent,
}: {
  attachments: MessageAttachment[];
  isSent: boolean;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => {
        if (attachment.type === "image") {
          return (
            <div
              key={attachment.id}
              className="relative h-40 w-40 overflow-hidden rounded-lg"
            >
              <Image
                src={attachment.url}
                alt={attachment.name || "Attachment"}
                fill
                className="object-cover"
              />
            </div>
          );
        }
        // For other types, show a placeholder
        return (
          <div
            key={attachment.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2",
              isSent ? "bg-surface-elevated" : "bg-surface-overlay"
            )}
          >
            <span className="text-sm text-foreground">
              {attachment.name || "Attachment"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Individual message bubble component.
 * Sent messages have purple gradient background and align right.
 * Received messages have dark gray background and align left.
 */
export function MessageBubble({
  message,
  isSent,
  showTimestamp = true,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] space-y-1",
          isSent ? "items-end" : "items-start"
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isSent
              ? // Sent messages: purple/green gradient
                "bg-gradient-to-r from-purple-500 to-primary-500 text-white"
              : // Received messages: visible contrast in both modes
                "bg-gray-100 dark:bg-neutral-dark-400 text-foreground border border-border-subtle"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments
              attachments={message.attachments}
              isSent={isSent}
            />
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <span
            className={cn(
              "block text-[10px] text-text-tertiary",
              isSent ? "text-right pr-1" : "text-left pl-1"
            )}
          >
            {formatMessageTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Date separator component for the chat thread
 */
export interface DateSeparatorProps {
  /** Date string to display (e.g., "Today", "Yesterday", "Dec 25") */
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-full bg-surface-overlay px-4 py-1 text-xs text-text-tertiary">
        {date}
      </span>
    </div>
  );
}

export default MessageBubble;
