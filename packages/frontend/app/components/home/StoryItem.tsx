"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import type { StoryItemProps } from "@/app/types/home";

/**
 * StoryItem - Individual story card with expand/collapse support
 * Expanded: Large card (150x196px) with background image, avatar top-left, name at bottom
 * Compressed: Circular avatar (64x64px) with gradient border, name below
 */

export function StoryItem({ story, onClick, isExpanded = true }: StoryItemProps) {
  const containerRef = useRef<HTMLButtonElement>(null);

  // Hover animation
  useGSAP(
    () => {
      if (!containerRef.current) return;

      const button = containerRef.current;

      const handleEnter = () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.15,
          ease: "back.out(2)",
        });
      };

      const handleLeave = () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
        });
      };

      button.addEventListener("mouseenter", handleEnter);
      button.addEventListener("mouseleave", handleLeave);

      return () => {
        button.removeEventListener("mouseenter", handleEnter);
        button.removeEventListener("mouseleave", handleLeave);
      };
    },
    { scope: containerRef }
  );

  // Get the display image (thumbnail or avatar)
  const displayImage = story.storyThumbnail || story.userAvatar;

  if (isExpanded) {
    // Expanded Layout: Large card with background image
    return (
      <button
        ref={containerRef}
        onClick={onClick}
        className="relative w-[150px] h-[196px] rounded-xl overflow-hidden shrink-0 group"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-white/[0.14] rounded-xl" />
          <Image
            src={displayImage}
            alt={story.userName}
            fill
            className="object-cover rounded-xl"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Avatar - Top Left */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-[100px] items-start">
          <div
            className={cn(
              "relative w-[42px] h-[42px] rounded-full p-[2px]",
              story.hasUnseenStory
                ? "bg-gradient-to-tr from-primary-500 via-soft-purple-500 to-primary-400"
                : "bg-white/30"
            )}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-background">
              <Image
                src={story.userAvatar}
                alt={story.userName}
                width={42}
                height={42}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* User Name - Bottom */}
          <span className="text-base text-white tracking-wide font-normal text-nowrap">
            {story.userName.split(" ")[0]} {story.userName.split(" ")[1]?.[0] ? story.userName.split(" ")[1] : ""}
          </span>
        </div>
      </button>
    );
  }

  // Compressed Layout: Small circular avatar
  return (
    <button
      ref={containerRef}
      onClick={onClick}
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
        <div className="w-full h-full rounded-full bg-background p-[2px]">
          {/* Image */}
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src={displayImage}
              alt={story.userName}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* User name */}
      <span className="text-sm text-text-secondary truncate w-full text-center group-hover:text-foreground transition-colors">
        {story.userName.split(" ")[0]}
      </span>
    </button>
  );
}

export default StoryItem;
