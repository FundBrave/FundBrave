"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SuggestedUser } from "./SuggestedUser";
import type { PeopleToFollowProps } from "@/app/types/home";

/**
 * PeopleToFollow - Right sidebar widget showing user suggestions
 * Based on Figma design:
 * - Header: "People to Follow" with Refresh button
 * - List of SuggestedUser components
 * - Refresh button has rotation animation on click
 */

export function PeopleToFollow({
  users,
  onFollow,
  onRefresh,
  className,
}: PeopleToFollowProps) {
  const refreshIconRef = useRef<SVGSVGElement>(null);

  const handleRefresh = useCallback(() => {
    // GSAP rotation animation
    if (refreshIconRef.current) {
      gsap.to(refreshIconRef.current, {
        rotation: "+=360",
        duration: 0.5,
        ease: "power2.inOut",
      });
    }
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className={cn("bg-transparent", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <h3 className="text-base font-semibold text-white">People to Follow</h3>
        <button
          onClick={handleRefresh}
          className="p-2.5 min-h-11 min-w-11 rounded-lg text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center"
          aria-label="Refresh suggestions"
        >
          <RefreshCw ref={refreshIconRef} className="w-5 h-5" />
        </button>
      </div>

      {/* User List */}
      <div className="px-4 py-2">
        {users.map((user) => (
          <SuggestedUser key={user.id} user={user} onFollow={onFollow} />
        ))}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <p className="text-white/40 text-sm text-center">
            No suggestions available
          </p>
        </div>
      )}
    </div>
  );
}

export default PeopleToFollow;
