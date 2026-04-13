"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LeaderboardTabs } from "@/app/components/leaderboard/LeaderboardTabs";
import { TopThreePodium } from "@/app/components/leaderboard/TopThreePodium";
import { LeaderboardList } from "@/app/components/leaderboard/LeaderboardList";
import {
  useGetDonationLeaderboardQuery,
  useGetMeQuery,
  LeaderboardPeriod as GqlLeaderboardPeriod,
} from "@/app/generated/graphql";
import { useAuth } from "@/app/provider/AuthProvider";
import { Spinner } from "@/app/components/ui/Spinner";
import type { LeaderboardPeriod, LeaderboardUser } from "@/app/types/leaderboard";
import { Navbar } from "@/app/components/common";

/** Map local period type to GraphQL enum */
const PERIOD_MAP: Record<LeaderboardPeriod, GqlLeaderboardPeriod> = {
  "all-time": "ALL" as GqlLeaderboardPeriod,
  "monthly": "THIRTY_DAYS" as GqlLeaderboardPeriod,
  "weekly": "SEVEN_DAYS" as GqlLeaderboardPeriod,
};

export default function LeaderboardPage() {
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("all-time");
  const { isAuthenticated } = useAuth();

  const { data: meData } = useGetMeQuery({
    skip: !isAuthenticated,
    fetchPolicy: "cache-first",
  });

  const { data, loading, error } = useGetDonationLeaderboardQuery({
    variables: {
      period: PERIOD_MAP[activePeriod],
      limit: 25,
    },
    fetchPolicy: "cache-first",
  });

  const allUsers: LeaderboardUser[] = useMemo(() => {
    if (!data?.donationLeaderboard?.entries) return [];
    return data.donationLeaderboard.entries.map((entry) => ({
      rank: entry.rank,
      id: entry.donor.id || entry.donor.walletAddress,
      name: entry.donor.isAnonymous
        ? "Anonymous"
        : entry.donor.displayName || entry.donor.username || "Unknown",
      username: entry.donor.username ? `@${entry.donor.username}` : "@anonymous",
      avatar: entry.donor.avatarUrl || "",
      points: parseInt(entry.totalDonated) || 0,
      memberSince: "",
    }));
  }, [data]);

  const currentUserId = meData?.me?.id || "";
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
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Leaderboard
          </h1>
          <p className="text-xs xs:text-sm sm:text-base text-text-secondary mt-1">
            Top contributors in our community
          </p>
        </motion.div>

        {/* Time Period Tabs */}
        <LeaderboardTabs activeTab={activePeriod} onTabChange={setActivePeriod} />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-text-secondary">Failed to load leaderboard data.</p>
          </div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-secondary">No leaderboard data yet. Be the first to donate!</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activePeriod}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <TopThreePodium users={top3Users} />
              <LeaderboardList
                users={remainingUsers}
                currentUserId={currentUserId}
                allUsers={allUsers}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
    </>
  );
}
