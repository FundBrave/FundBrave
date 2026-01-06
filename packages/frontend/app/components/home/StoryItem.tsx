"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import type { StoryItemProps } from "@/app/types/home";

/**
 * StoryItem - Individual story avatar for the Stories row
 * Based on Figma design / Instagram-style:
 * - Circular image with gradient border (unseen) or gray border (seen)
 * - User name truncated below
 * - GSAP scale animation on hover
 */

export function StoryItem({ story, onClick }: StoryItemProps) {
  const containerRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scale: 1.08,
        duration: 0.15,
        ease: "back.out(2)",
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, []);

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col items-center gap-2 shrink-0 w-[80px] group"
    >
      {/* Avatar with gradient border */}
      <div
        className={cn(
          "relative w-16 h-16 rounded-full p-[3px]",
          story.hasUnseenStory
            ? "bg-gradient-to-tr from-primary-500 via-soft-purple-500 to-primary-400"
            : "bg-white/20"
        )}
      >
        {/* Inner container for spacing */}
        <div className="w-full h-full rounded-full bg-neutral-dark-500 p-[2px]">
          {/* Image */}
          <div className="relative w-full h-full rounded-full overflow-hidden">
            {story.storyThumbnail ? (
              <Image
                src={story.storyThumbnail}
                alt={story.userName}
                fill
                className="object-cover"
              />
            ) : (
              <Image
                src={story.userAvatar}
                alt={story.userName}
                fill
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* User name */}
      <span className="text-sm text-white/70 truncate w-full text-center group-hover:text-white transition-colors">
        {story.userName.split(" ")[0]}
      </span>
    </button>
  );
}

export default StoryItem;
