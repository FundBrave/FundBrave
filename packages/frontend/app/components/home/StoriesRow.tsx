"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import { Plus, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryItem } from "./StoryItem";
import type { StoriesRowProps } from "@/app/types/home";

/**
 * StoriesRow - Instagram-like horizontal scrollable stories
 * Based on Figma design:
 * - "Create Story" button with plus icon on the left
 * - Horizontal scrollable list of story avatars
 * - Touch-friendly swipe on mobile
 */

export function StoriesRow({
  stories,
  onCreateStory,
  onStoryClick,
  className,
}: StoriesRowProps) {
  const createButtonRef = useRef<HTMLButtonElement>(null);

  const handleCreateHover = useCallback(() => {
    if (createButtonRef.current) {
      gsap.to(createButtonRef.current, {
        scale: 1.05,
        duration: 0.15,
        ease: "power2.out",
      });
    }
  }, []);

  const handleCreateLeave = useCallback(() => {
    if (createButtonRef.current) {
      gsap.to(createButtonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, []);

  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto scrollbar-hidden py-4 px-1",
        "-mx-1", // Compensate for padding to allow edge items to touch container edge
        className
      )}
    >
      {/* Create Story Button */}
      <button
        ref={createButtonRef}
        onClick={onCreateStory}
        onMouseEnter={handleCreateHover}
        onMouseLeave={handleCreateLeave}
        className="flex flex-col items-center gap-2 shrink-0 w-[80px] group"
      >
        {/* Dashed border circle with plus icon */}
        <div
          className={cn(
            "relative w-16 h-16 rounded-full",
            "border-2 border-dashed border-white/30",
            "flex items-center justify-center",
            "bg-white/5 hover:bg-white/10 transition-colors",
            "group-hover:border-primary-400"
          )}
        >
          {/* Video icon background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Video className="w-6 h-6 text-white" />
          </div>
          {/* Plus icon */}
          <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-soft-purple-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Plus className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Label */}
        <span className="text-sm text-white/70 group-hover:text-white transition-colors">
          Create Story
        </span>
      </button>

      {/* Stories List */}
      {stories.map((story) => (
        <StoryItem
          key={story.id}
          story={story}
          onClick={() => onStoryClick?.(story.id)}
        />
      ))}

      {/* Empty State */}
      {stories.length === 0 && (
        <div className="flex items-center justify-center flex-1 py-4">
          <p className="text-sm text-white/40">No stories yet</p>
        </div>
      )}
    </div>
  );
}

export default StoriesRow;
