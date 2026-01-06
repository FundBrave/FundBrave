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
  userAvatar = DEFAULT_USER.avatar,
  onCreatePost,
  className,
}: CreatePostInlineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    onCreatePost?.();
  }, [onCreatePost]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handlePublish = useCallback((data: PublishData) => {
    console.log("Post published:", data);
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <div
        className={cn(
          "bg-[#1a1625]/60 rounded-xl p-4 border border-white/5",
          className
        )}
      >
        {/* Main clickable area */}
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <Avatar
            src={userAvatar}
            alt="Your avatar"
            size="md"
            className="shrink-0"
          />

          {/* Input placeholder */}
          <button
            onClick={handleOpenModal}
            className={cn(
              "flex-1 text-left px-4 py-3 rounded-xl",
              "bg-white/5 hover:bg-white/10 transition-colors",
              "text-white/50 text-sm",
              "border border-white/5 hover:border-white/10"
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
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
          {MEDIA_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={handleOpenModal}
              className={cn(
                "p-3 min-h-11 min-w-11 rounded-lg",
                "text-white/50 hover:text-white hover:bg-white/5 active:bg-white/10",
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
      <CreatePost isOpen={isModalOpen} onClose={handleCloseModal} onPublish={handlePublish} />
    </>
  );
}

export default CreatePostInline;
