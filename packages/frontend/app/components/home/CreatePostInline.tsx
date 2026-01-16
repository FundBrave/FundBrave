"use client";

import { useState, useCallback } from "react";
import {
  ImageIcon,
  Video,
  BarChart3,
  Smile,
  Sparkles,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/button";
import CreatePost from "@/app/components/ui/CreatePost/CreatePost";
import type { CreatePostInlineProps } from "@/app/types/home";
import type { PublishData } from "@/app/components/ui/types/CreatePost.types";
import { useCreatePostMutation } from "@/app/generated/graphql";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

/**
 * CreatePostInline - Simplified inline create post area for home feed
 * Based on Figma design:
 * - User avatar on left
 * - "Create a post" placeholder text
 * - Media toolbar icons (image, video, poll, emoji, AI, location)
 * - Post button on right
 * - Clicking opens the full CreatePost modal
 */

// Default user avatar for demo
const DEFAULT_USER = {
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  name: "Anna Doe",
};

// Media action buttons
const MEDIA_ACTIONS = [
  { id: "image", icon: ImageIcon, label: "Add image" },
  { id: "video", icon: Video, label: "Add video" },
  { id: "poll", icon: BarChart3, label: "Create poll" },
  { id: "emoji", icon: Smile, label: "Add emoji" },
  { id: "ai", icon: Sparkles, label: "AI assist" },
  { id: "location", icon: MapPin, label: "Add location" },
];

export function CreatePostInline({
  userAvatar,
  onCreatePost,
  className,
}: CreatePostInlineProps) {
  const { currentUser } = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createPostMutation, { loading: isPublishing }] = useCreatePostMutation();

  // Use provided avatar, fallback to current user's avatar, then to default
  const avatarUrl = userAvatar || currentUser?.avatarUrl || DEFAULT_USER.avatar;

  // Build user profile for CreatePost modal
  const userProfile = currentUser ? {
    name: currentUser.displayName,
    avatar: currentUser.avatarUrl,
    audience: "everyone" as const,
  } : undefined;

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    onCreatePost?.();
  }, [onCreatePost]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handlePublish = useCallback(async (data: PublishData) => {
    try {
      if (data.type === "post") {
        // Determine post type based on content
        let postType = "TEXT";
        if (data.mediaUrls && data.mediaUrls.length > 0) {
          // Check if any URL is a video
          const hasVideo = data.mediaUrls.some(url =>
            url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')
          );
          postType = hasVideo ? "VIDEO" : "IMAGE";
        }

        // Create a regular post
        await createPostMutation({
          variables: {
            input: {
              content: data.content,
              mediaUrls: data.mediaUrls || [],
              type: postType,
              visibility: "PUBLIC", // Default to PUBLIC visibility
            },
          },
          // Refetch the feed to show the new post
          refetchQueries: ["GetFeed"],
        });

        console.log("Post created successfully");
      } else {
        // Campaign update - for now just log it
        // TODO: implement campaign update mutation
        console.log("Campaign update:", data);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      // Keep modal open on error so user can try again
    }
  }, [createPostMutation]);

  return (
    <>
      <div
        className={cn(
          "bg-surface-elevated/60 rounded-xl p-4 border border-border-default",
          className
        )}
      >
        {/* Main clickable area */}
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <Avatar
            src={avatarUrl}
            alt="Your avatar"
            size="md"
            className="shrink-0"
          />

          {/* Input placeholder */}
          <button
            onClick={handleOpenModal}
            className={cn(
              "flex-1 text-left px-4 py-3 rounded-xl",
              "bg-surface-overlay hover:bg-surface-overlay/80 transition-colors",
              "text-text-tertiary text-sm",
              "border border-border-default hover:border-border-subtle"
            )}
          >
            Create a post
          </button>

          {/* Post Button */}
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenModal}
            className="shrink-0"
          >
            Post
          </Button>
        </div>

        {/* Media Actions Toolbar */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border-default">
          {MEDIA_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={handleOpenModal}
              className={cn(
                "p-3 min-h-11 min-w-11 rounded-lg",
                "text-text-tertiary hover:text-foreground hover:bg-surface-overlay active:bg-surface-overlay/80",
                "transition-colors"
              )}
              title={action.label}
            >
              <action.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePost
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPublish={handlePublish}
        user={userProfile}
      />
    </>
  );
}

export default CreatePostInline;
