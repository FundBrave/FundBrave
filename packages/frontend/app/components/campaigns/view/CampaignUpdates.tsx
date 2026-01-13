"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Update, Creator } from "@/app/campaigns/data";
import { Plus, FileText } from "@/app/components/ui/icons";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { UpdateCard } from "@/app/components/campaigns/updates/UpdateCard";
import { UpdateModal } from "@/app/components/campaigns/updates/UpdateModal";
import type { CampaignUpdateData } from "@/app/components/campaigns/updates/schemas";

export interface CampaignUpdatesProps {
  /** List of updates to display */
  updates: Update[];
  /** Whether the current user is the campaign creator */
  isCreator?: boolean;
  /** The creator info for new updates */
  creator?: Creator;
  /** Campaign ID for API calls */
  campaignId?: string;
  /** Callback when updates change (for parent state management) */
  onUpdatesChange?: (updates: Update[]) => void;
  /** Additional className */
  className?: string;
}

/**
 * CampaignUpdates - Displays campaign updates with ability to post new ones
 * Features:
 * - "Post Update" button for campaign creators
 * - Empty state when no updates exist
 * - Optimistic UI updates
 * - See more pagination
 */
export default function CampaignUpdates({
  updates: initialUpdates,
  isCreator = false,
  creator,
  campaignId,
  onUpdatesChange,
  className,
}: CampaignUpdatesProps) {
  const [updates, setUpdates] = useState<Update[]>(initialUpdates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);

  // Handle opening the modal
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    if (!isSubmitting) {
      setIsModalOpen(false);
    }
  }, [isSubmitting]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CampaignUpdateData) => {
      if (!creator) return;

      setIsSubmitting(true);

      try {
        // Create new update object (optimistic update)
        const newUpdate: Update = {
          id: `temp-${Date.now()}`, // Temporary ID until API response
          author: creator,
          title: data.title,
          content: data.content,
          createdAt: "Just now",
          likes: 0,
          comments: 0,
        };

        // Optimistically add to the list
        const updatedList = [newUpdate, ...updates];
        setUpdates(updatedList);
        onUpdatesChange?.(updatedList);

        // Close modal
        setIsModalOpen(false);

        // TODO: Replace with actual API call
        // await api.campaigns.postUpdate(campaignId, data);

        // Simulate API delay for demo
        await new Promise((resolve) => setTimeout(resolve, 500));

        // If API provides a real ID, update the list
        // For now, we'll keep the optimistic update
      } catch (error) {
        console.error("Failed to post update:", error);
        // Revert optimistic update on error
        setUpdates(initialUpdates);
        onUpdatesChange?.(initialUpdates);
        // TODO: Show error toast
      } finally {
        setIsSubmitting(false);
      }
    },
    [creator, updates, initialUpdates, onUpdatesChange]
  );

  // Handle like action
  const handleLike = useCallback((updateId: string) => {
    // TODO: Implement like functionality
    console.log("Like update:", updateId);
  }, []);

  // Handle comment action
  const handleComment = useCallback((updateId: string) => {
    // TODO: Implement comment functionality
    console.log("Comment on update:", updateId);
  }, []);

  // Handle share action
  const handleShare = useCallback((updateId: string) => {
    // TODO: Implement share functionality
    console.log("Share update:", updateId);
  }, []);

  // Handle edit action
  const handleEdit = useCallback((updateId: string) => {
    // TODO: Implement edit functionality
    console.log("Edit update:", updateId);
  }, []);

  // Handle delete action
  const handleDelete = useCallback(
    (updateId: string) => {
      // TODO: Implement delete with confirmation
      const updatedList = updates.filter((u) => u.id !== updateId);
      setUpdates(updatedList);
      onUpdatesChange?.(updatedList);
    },
    [updates, onUpdatesChange]
  );

  // Handle show more
  const handleShowMore = useCallback(() => {
    setDisplayCount((prev) => prev + 5);
  }, []);

  // Determine which updates to display
  const displayedUpdates = updates.slice(0, displayCount);
  const hasMoreUpdates = updates.length > displayCount;

  return (
    <section
      className={cn("flex flex-col gap-6", className)}
      aria-labelledby="updates-section"
    >
      {/* Header with Post Update button */}
      <div className="flex items-center justify-between">
        <h3
          id="updates-section"
          className="text-xl font-bold text-foreground font-[family-name:var(--font-family-gilgan)]"
        >
          Updates
          {updates.length > 0 && (
            <span className="ml-2 text-sm font-normal text-text-tertiary">
              ({updates.length})
            </span>
          )}
        </h3>

        {isCreator && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            className="gap-2"
          >
            <Plus size={16} aria-hidden="true" />
            Post Update
          </Button>
        )}
      </div>

      {/* Updates List or Empty State */}
      {updates.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} className="text-text-tertiary" />}
          title="No updates yet"
          message={
            isCreator
              ? "Keep your donors informed! Post your first update to share progress and thank your supporters."
              : "The campaign creator hasn't posted any updates yet. Check back later for news and progress."
          }
          action={
            isCreator ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenModal}
                className="gap-2"
              >
                <Plus size={16} aria-hidden="true" />
                Post Your First Update
              </Button>
            ) : null
          }
          className="py-8"
        />
      ) : (
        <>
          <div className="flex flex-col gap-8" role="feed" aria-busy={isSubmitting}>
            <AnimatePresence mode="popLayout">
              {displayedUpdates.map((update, index) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.3,
                    delay: index === 0 && update.id.startsWith("temp-") ? 0 : 0,
                  }}
                  layout
                >
                  <UpdateCard
                    update={update}
                    isCreator={isCreator}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* See More Button */}
          {hasMoreUpdates && (
            <button
              type="button"
              onClick={handleShowMore}
              className="w-full py-3 rounded-xl border border-border-subtle text-foreground font-semibold text-sm hover:bg-surface-overlay transition-colors min-h-[48px]"
            >
              See more updates ({updates.length - displayCount} remaining)
            </button>
          )}
        </>
      )}

      {/* Update Modal */}
      <UpdateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </section>
  );
}
