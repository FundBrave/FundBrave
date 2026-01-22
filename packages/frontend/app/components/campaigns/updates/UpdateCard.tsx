"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, Share2, MoreHorizontal, Trash2, PencilLine } from "@/app/components/ui/icons";
import type { Update } from "@/app/campaigns/data";

export interface UpdateCardProps {
  /** The update data to display */
  update: Update;
  /** Whether the current user is the creator of the campaign */
  isCreator?: boolean;
  /** Callback when the update is liked */
  onLike?: (updateId: string) => void;
  /** Callback when comment is clicked */
  onComment?: (updateId: string) => void;
  /** Callback when share is clicked */
  onShare?: (updateId: string) => void;
  /** Callback when edit is clicked (creator only) */
  onEdit?: (updateId: string) => void;
  /** Callback when delete is clicked (creator only) */
  onDelete?: (updateId: string) => void;
  /** Additional className */
  className?: string;
  /** Maximum characters to show before truncation */
  truncateAt?: number;
}

/**
 * UpdateCard - A reusable component for displaying campaign updates
 * Extracted from CampaignUpdates.tsx for reusability
 */
export function UpdateCard({
  update,
  isCreator = false,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  className,
  truncateAt = 200,
}: UpdateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const shouldTruncate = update.content.length > truncateAt;
  const displayContent = isExpanded || !shouldTruncate
    ? update.content
    : `${update.content.slice(0, truncateAt)}...`;

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(update.id);
  };

  const handleToggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(update.id);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete?.(update.id);
  };

  return (
    <article
      className={cn(
        "flex flex-col gap-4 border-b border-border-subtle pb-8 last:border-0",
        className
      )}
      aria-labelledby={`update-title-${update.id}`}
    >
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-soft-purple-500 p-[2px]">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
              {update.author?.avatarUrl ? (
                <img
                  src={update.author.avatarUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-soft-purple-500/20 flex items-center justify-center text-foreground font-bold text-sm">
                  {update.author?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                {update.author?.name || "Unknown"}
              </span>
              <button
                type="button"
                className="text-xs text-primary-400 font-semibold bg-primary-500/10 px-3 py-2 rounded-full hover:bg-primary-500/20 transition-colors min-h-[44px] active:scale-[0.95]"
              >
                Follow
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span>{update.author?.handle || "@unknown"}</span>
              <span aria-hidden="true">•</span>
              <time>{update.createdAt}</time>
            </div>
          </div>
        </div>

        {/* Creator Menu */}
        {isCreator && (
          <div className="relative">
            <button
              type="button"
              onClick={handleToggleMenu}
              className="p-2 rounded-full hover:bg-surface-overlay transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Update options"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              <MoreHorizontal size={20} className="text-text-secondary" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                  aria-hidden="true"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 z-20 bg-background border border-border-subtle rounded-xl shadow-lg overflow-hidden min-w-[140px]"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-foreground hover:bg-surface-overlay active:bg-surface-sunken transition-colors"
                    role="menuitem"
                  >
                    <PencilLine size={16} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-destructive hover:bg-surface-overlay active:bg-surface-sunken transition-colors"
                    role="menuitem"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h4
          id={`update-title-${update.id}`}
          className="text-lg font-bold text-foreground"
        >
          {update.title}
        </h4>
        <p className="text-foreground/80 text-sm leading-relaxed">
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-foreground font-semibold text-xs hover:underline focus:underline focus:outline-none min-h-[44px] flex items-center"
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-text-secondary pt-2">
        <div className="flex items-center gap-4">
          <span>
            Liked by {isLiked ? update.likes + 1 : update.likes} people
          </span>
        </div>
        <span>{update.comments} comments</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-border-subtle pt-4">
        <button
          type="button"
          onClick={handleLike}
          className={cn(
            "flex items-center gap-2 text-xs font-semibold transition-colors min-h-[44px] px-2",
            isLiked
              ? "text-primary-400"
              : "text-text-secondary hover:text-foreground"
          )}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Unlike this update" : "Like this update"}
        >
          <Heart
            size={16}
            className={cn(isLiked && "fill-current")}
          />
          Like
        </button>
        <button
          type="button"
          onClick={() => onComment?.(update.id)}
          className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-foreground transition-colors min-h-[44px] px-2"
        >
          <MessageSquare size={16} />
          Comment
        </button>
        <button
          type="button"
          onClick={() => onShare?.(update.id)}
          className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-foreground transition-colors min-h-[44px] px-2"
        >
          <Share2 size={16} />
          Share
        </button>
      </div>
    </article>
  );
}

export default UpdateCard;
