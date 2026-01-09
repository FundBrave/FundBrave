"use client";

import { motion } from "motion/react";
import { LeaderboardRow } from "./LeaderboardRow";
import type { UserPositionIndicatorProps, LeaderboardUser } from "@/app/types/leaderboard";

/**
 * UserPositionIndicator - Shows the current user's position with context
 * If user is not in the visible range, shows their rank with ±1 surrounding ranks
 * Professional leaderboard style with "..." skip indicator
 */
export function UserPositionIndicator({
  allUsers,
  currentUserId,
  visibleCount,
}: UserPositionIndicatorProps) {
  // Find current user in the list
  const currentUserIndex = allUsers.findIndex((u) => u.id === currentUserId);

  // If user not found, don't render
  if (currentUserIndex === -1) {
    return null;
  }

  const currentUser = allUsers[currentUserIndex];

  // Check if user is already visible (in top positions including podium + visible list)
  // Podium shows top 3, visibleCount is for the list (4+)
  const isInVisibleRange = currentUserIndex < 3 + visibleCount;

  // If user is already visible, don't show indicator
  if (isInVisibleRange) {
    return null;
  }

  // Get surrounding users (user-1, user, user+1)
  const surroundingUsers: LeaderboardUser[] = [];

  // Add user before (if exists and not in visible range)
  if (currentUserIndex > 0) {
    surroundingUsers.push(allUsers[currentUserIndex - 1]);
  }

  // Add current user
  surroundingUsers.push(currentUser);

  // Add user after (if exists)
  if (currentUserIndex < allUsers.length - 1) {
    surroundingUsers.push(allUsers[currentUserIndex + 1]);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-4 sm:mt-6"
    >
      {/* Skip Indicator - Top */}
      <div className="flex items-center justify-center py-2 sm:py-3">
        <div className="flex items-center gap-1 text-text-tertiary">
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current" />
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current" />
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current" />
        </div>
      </div>

      {/* Surrounding Users - Your Position Section */}
      <div className="bg-surface-overlay/50 rounded-xl sm:rounded-2xl border border-primary-500/20 overflow-hidden">
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border-subtle bg-primary-500/5">
          <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-primary-400 uppercase tracking-wider">
            Your Position
          </span>
        </div>
        {surroundingUsers.map((user, index) => (
          <LeaderboardRow
            key={user.id}
            user={user}
            isCurrentUser={user.id === currentUserId}
            showSeparator={index < surroundingUsers.length - 1}
          />
        ))}
      </div>

      {/* Skip Indicator - Bottom (if there are more users after) */}
      {currentUserIndex < allUsers.length - 2 && (
        <div className="flex items-center justify-center py-2 sm:py-3">
          <div className="flex items-center gap-1 text-text-tertiary">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current" />
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current" />
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default UserPositionIndicator;
