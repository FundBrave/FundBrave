"use client";

import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/button";
import type { SuggestedUserProps } from "@/app/types/home";

/**
 * SuggestedUser - Individual user suggestion card for "People to Follow" section
 * Based on Figma design:
 * - Avatar on left
 * - Name and @username in center
 * - Follow button on right with GSAP animation
 * - Handles follow/unfollow with optimistic UI updates
 */

export function SuggestedUser({ user, onFollow }: SuggestedUserProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleFollow = useCallback(async () => {
    // GSAP animation on button click
    if (buttonRef.current) {
      gsap
        .timeline()
        .to(buttonRef.current, {
          scale: 0.95,
          duration: 0.1,
        })
        .to(buttonRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "elastic.out(1, 0.5)",
        });
    }

    // Optimistic UI update
    const wasFollowing = isFollowing;
    setIsFollowing((prev) => !prev);
    setIsLoading(true);

    try {
      await onFollow?.(user.id);
    } catch (error) {
      // Revert on error
      console.error("Failed to follow/unfollow user:", error);
      setIsFollowing(wasFollowing);
    } finally {
      setIsLoading(false);
    }
  }, [onFollow, user.id, isFollowing]);

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Avatar */}
      <Avatar
        src={user.avatar}
        alt={user.name}
        size="md"
        fallback={user.name.charAt(0)}
        className="shrink-0"
      />

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          {user.isVerified && (
            <svg
              className="w-4 h-4 text-primary-400 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <p className="text-sm text-text-secondary truncate">@{user.username}</p>
      </div>

      {/* Follow Button */}
      <Button
        ref={buttonRef}
        variant={isFollowing ? "secondary" : "primary"}
        size="md"
        onClick={handleFollow}
        disabled={isLoading}
        className={cn(
          "shrink-0 min-w-[80px]",
          isFollowing && "bg-surface-overlay border-border-default"
        )}
      >
        {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}

export default SuggestedUser;
