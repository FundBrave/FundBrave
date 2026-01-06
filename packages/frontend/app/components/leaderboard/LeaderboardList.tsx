"use client";

import { motion } from "motion/react";
import { LeaderboardRow } from "./LeaderboardRow";
import { UserPositionIndicator } from "./UserPositionIndicator";
import type { LeaderboardListProps } from "@/app/types/leaderboard";

// Number of entries to show in the visible list (excluding top 3 podium)
const VISIBLE_LIST_COUNT = 9;

/**
 * LeaderboardList - Scrollable list of leaderboard entries (rank 4+)
 * Shows entries 4 through VISIBLE_LIST_COUNT + 3
 * Includes UserPositionIndicator if current user is outside visible range
 */
export function LeaderboardList({
  users,
  currentUserId,
  allUsers,
}: LeaderboardListProps) {
  // users prop should already be filtered (rank 4+)
  const visibleUsers = users.slice(0, VISIBLE_LIST_COUNT);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-col"
    >
      {/* Visible Leaderboard Entries */}
      <div className="bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-y-auto scrollbar-auto-hide">
          {visibleUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.3 + index * 0.04,
              }}
            >
              <LeaderboardRow
                user={user}
                isCurrentUser={currentUserId === user.id}
                showSeparator={index < visibleUsers.length - 1}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* User Position Indicator - shows if user is outside visible range */}
      {currentUserId && allUsers && (
        <UserPositionIndicator
          allUsers={allUsers}
          currentUserId={currentUserId}
          visibleCount={VISIBLE_LIST_COUNT}
        />
      )}
    </motion.div>
  );
}

export default LeaderboardList;
