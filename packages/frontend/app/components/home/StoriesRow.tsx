"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryItem } from "./StoryItem";
import type { StoriesRowProps } from "@/app/types/home";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * StoriesRow - Instagram-like horizontal scrollable stories
 * Features expand/collapse based on scroll visibility:
 * - Expanded: Large cards (150x196px) with background images
 * - Compressed: Small circular avatars (64x64px)
 */

export function StoriesRow({
  stories,
  onCreateStory,
  onStoryClick,
  className,
  initialExpanded = true,
}: StoriesRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // ScrollTrigger setup - compress when scrolled out of view
  useGSAP(
    () => {
      if (!containerRef.current) return;

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 5%",
        end: "bottom -5%",
        onLeave: () => setIsExpanded(false),
        onEnterBack: () => setIsExpanded(true),
      });
    },
    { scope: containerRef }
  );

  // Animation for Create Story button hover
  useGSAP(
    () => {
      if (!createButtonRef.current) return;

      const button = createButtonRef.current;

      const handleEnter = () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.15,
          ease: "power2.out",
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
    { scope: createButtonRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hidden py-4 px-3.5",
        "border-b border-border-default",
        className
      )}
    >
      {/* Create Story Button */}
      <button
        ref={createButtonRef}
        onClick={onCreateStory}
        className={cn(
          "flex flex-col items-center shrink-0 group transition-all duration-300",
          isExpanded ? "w-[130px] sm:w-[150px]" : "w-[80px]"
        )}
      >
        {isExpanded ? (
          // Expanded: Large card with purple background
          <div className="relative w-[130px] sm:w-[150px] h-[196px] rounded-xl bg-primary-500/10 flex flex-col items-center justify-center gap-8 overflow-hidden">
            {/* Icon */}
            <div className="relative z-10 size-14 rounded-full bg-gradient-to-br from-primary-500 to-soft-purple-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Plus className="w-5 h-5 text-white" />
            </div>
            {/* Label */}
            <span className="text-base text-white tracking-wide font-normal">
              Create Story
            </span>
          </div>
        ) : (
          // Compressed: Dashed circle with plus icon
          <>
            <div
              className={cn(
                "relative w-16 h-16 rounded-full",
                "border-2 border-dashed border-border-default",
                "flex items-center justify-center",
                "bg-surface-overlay hover:bg-surface-overlay/80 transition-colors",
                "group-hover:border-primary-400"
              )}
            >
              {/* Video icon background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Video className="w-6 h-6 text-foreground" />
              </div>
              {/* Plus icon */}
              <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-soft-purple-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </div>
            {/* Label */}
            <span className="mt-2 text-sm text-text-secondary group-hover:text-foreground transition-colors">
              Create Story
            </span>
          </>
        )}
      </button>

      {/* Stories List */}
      {stories.map((story) => (
        <StoryItem
          key={story.id}
          story={story}
          isExpanded={isExpanded}
          onClick={() => onStoryClick?.(story.id)}
        />
      ))}

      {/* Empty State */}
      {stories.length === 0 && (
        <div className="flex items-center justify-center flex-1 py-4">
          <p className="text-sm text-text-tertiary">No stories yet</p>
        </div>
      )}
    </div>
  );
}

export default StoriesRow;
