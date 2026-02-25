"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Clock, Check, Lock } from "@/app/components/ui/icons";
import { DURATION, EASE } from "@/lib/constants/animation";
import type { Message, MessageAttachment } from "@/app/types/messenger";
import type { MessageSendStatus } from "@/app/types/web3-chat";

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
  /** Optional send status for WhatsApp-style indicators (queued, sending, sent, delivered) */
  sendStatus?: MessageSendStatus;
  /** Whether this message was end-to-end encrypted */
  isEncrypted?: boolean;
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
              className="relative h-40 w-full max-w-[160px] overflow-hidden rounded-lg"
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

/** Crossfade variants for send status icon transitions */
const statusIconVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.fast, ease: EASE.snappy },
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    transition: { duration: DURATION.quick, ease: EASE.standard },
  },
};

/**
 * Renders a WhatsApp-style send status indicator for sent messages
 * with smooth crossfade transitions between states.
 *
 * Framer Motion owns: opacity, scale (icon transitions).
 * Tailwind owns: sizing, color, animate-pulse.
 *
 * - queued: clock icon (gray)
 * - sending: clock icon (gray, pulsing)
 * - sent: single checkmark (gray)
 * - delivered: double checkmark (green)
 */
function SendStatusIndicator({ status }: { status: MessageSendStatus }) {
  return (
    <AnimatePresence mode="wait">
      {status === "queued" && (
        <motion.span key="queued" variants={statusIconVariants} initial="hidden" animate="visible" exit="exit" className="inline-flex">
          <Clock className="h-3 w-3 text-text-tertiary" />
        </motion.span>
      )}
      {status === "sending" && (
        <motion.span key="sending" variants={statusIconVariants} initial="hidden" animate="visible" exit="exit" className="inline-flex">
          <Clock className="h-3 w-3 animate-pulse text-text-tertiary" />
        </motion.span>
      )}
      {status === "sent" && (
        <motion.span key="sent" variants={statusIconVariants} initial="hidden" animate="visible" exit="exit" className="inline-flex">
          <Check className="h-3 w-3 text-text-tertiary" />
        </motion.span>
      )}
      {status === "delivered" && (
        <motion.span key="delivered" variants={statusIconVariants} initial="hidden" animate="visible" exit="exit" className="inline-flex -space-x-1.5">
          <Check className="h-3 w-3 text-green-500" />
          <Check className="h-3 w-3 text-green-500" />
        </motion.span>
      )}
    </AnimatePresence>
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
  sendStatus,
  isEncrypted,
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

        {/* Timestamp + encryption lock + send status */}
        {showTimestamp && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] text-text-tertiary",
              isSent ? "justify-end pr-1" : "justify-start pl-1"
            )}
          >
            {/* Encryption lock icon: Framer Motion owns opacity (gentle fade-in) */}
            {isEncrypted && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DURATION.fast, ease: EASE.standard }}
                className="inline-flex"
              >
                <Lock className="h-2.5 w-2.5 text-text-tertiary" aria-label="Encrypted" />
              </motion.span>
            )}

            {/* Timestamp text */}
            <span>{formatMessageTime(message.timestamp)}</span>

            {/* Send status indicator (only for sent messages) */}
            {isSent && sendStatus && (
              <SendStatusIndicator status={sendStatus} />
            )}
          </div>
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
