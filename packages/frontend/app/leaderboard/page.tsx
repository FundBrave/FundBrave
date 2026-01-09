"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LeaderboardTabs } from "@/app/components/leaderboard/LeaderboardTabs";
import { TopThreePodium } from "@/app/components/leaderboard/TopThreePodium";
import { LeaderboardList } from "@/app/components/leaderboard/LeaderboardList";
import { mockLeaderboardData, CURRENT_USER_ID } from "./data";
import type { LeaderboardPeriod } from "@/app/types/leaderboard";
import { Navbar } from "@/app/components/common";

/**
 * LeaderboardPage - Main leaderboard page showing user rankings
 * Features:
 * - Time period tabs (All Time, This Month, This Week)
 * - Top 3 podium with crown for #1
 * - Scrollable list for rank 4+
 * - Dynamic user position indicator
 */
export default function LeaderboardPage() {
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("all-time");

  // Get data based on active period
  const getCurrentData = () => {
    switch (activePeriod) {
      case "all-time":
        return mockLeaderboardData.allTime;
      case "monthly":
        return mockLeaderboardData.monthly;
      case "weekly":
        return mockLeaderboardData.weekly;
      default:
        return mockLeaderboardData.allTime;
    }
  };

  const allUsers = getCurrentData();
  const top3Users = allUsers.slice(0, 3);
  const remainingUsers = allUsers.filter((u) => u.rank > 3);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
      <div className="max-w-3xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-6"
        >
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Leaderboard
          </h1>
          <p className="text-xs xs:text-sm sm:text-base text-white/40 mt-1">
            Top contributors in our community
          </p>
        </motion.div>

        {/* Time Period Tabs */}
        <LeaderboardTabs activeTab={activePeriod} onTabChange={setActivePeriod} />

        {/* Content with AnimatePresence for tab transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePeriod}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Top 3 Podium */}
            <TopThreePodium users={top3Users} />

            {/* Leaderboard List (Rank 4+) */}
            <LeaderboardList
              users={remainingUsers}
              currentUserId={CURRENT_USER_ID}
              allUsers={allUsers}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
    </>
  );
}
