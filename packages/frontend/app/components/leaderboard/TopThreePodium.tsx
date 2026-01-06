"use client";

import { motion } from "motion/react";
import { PodiumCard } from "./PodiumCard";
import type { TopThreePodiumProps } from "@/app/types/leaderboard";

/**
 * TopThreePodium - Displays the top 3 ranked users
 * Layout: #2 (left) | #1 (center, elevated) | #3 (right)
 * The center position (#1) is elevated with a crown
 */
export function TopThreePodium({ users }: TopThreePodiumProps) {
  // Ensure we have exactly 3 users for podium
  const top3 = users.slice(0, 3);

  if (top3.length < 3) {
    return null;
  }

  // Reorder: [#2, #1, #3] for display (center #1)
  const [first, second, third] = top3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-row items-end justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-10 mb-6 sm:mb-8 md:mb-12 pt-6 sm:pt-8 md:pt-16"
    >
      {/* Position 2 - Left */}
      <div className="mt-8 sm:mt-10 md:mt-12">
        <PodiumCard user={second} position={2} />
      </div>

      {/* Position 1 - Center (elevated with crown) */}
      <div className="relative">
        <PodiumCard user={first} position={1} />
      </div>

      {/* Position 3 - Right */}
      <div className="mt-8 sm:mt-10 md:mt-12">
        <PodiumCard user={third} position={3} />
      </div>
    </motion.div>
  );
}

export default TopThreePodium;
