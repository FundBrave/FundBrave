"use client";

import { useState, useEffect } from "react";
import {
  ProfileSidebar,
  StatsCard,
  EarningsTable,
  WithdrawalHistoryTable,
  Leaderboard,
  WithdrawModal,
  DeFiPositions,
} from "@/app/components/earnings";
import { BackHeader } from "@/app/components/common/BackHeader";
import {
  mockUserProfile,
  mockEarningsStats,
  mockEarnings,
  mockWithdrawals,
  mockLeaderboard,
} from "./data";
import { useGetMeQuery, useGetFundraisersByCreatorQuery } from "@/app/generated/graphql";
import { useAuth } from "@/app/provider/AuthProvider";
import { Loader2 } from "@/app/components/ui/icons";
import type { UserProfile, EarningsStats } from "@/app/types/earnings";

/**
 * Creator Earnings Dashboard Page
 * Route: /dashboard
 *
 * Figma Design: 3-column responsive layout
 * - Left Sidebar (280px): ProfileSidebar with user info and navigation
 * - Main Content: Stats cards, Earnings table, Withdrawal history
 * - Right Sidebar (300px): Leaderboard rankings
 *
 * Responsive behavior:
 * - Mobile: Single column, sidebars hidden
 * - Tablet: 2 columns (main + right sidebar)
 * - Desktop: Full 3-column layout
 */

export default function DashboardPage() {
  const { user: authUser, isAuthenticated } = useAuth();

  // Fetch current user data from GraphQL
  const { data: meData, loading: meLoading, error: meError } = useGetMeQuery({
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch user's campaigns
  const { data: campaignsData, loading: campaignsLoading } = useGetFundraisersByCreatorQuery({
    variables: {
      creatorId: meData?.me?.id || '',
      limit: 100,
      offset: 0,
    },
    skip: !meData?.me?.id,
    fetchPolicy: 'cache-and-network',
  });

  // State for withdraw modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState(0);
  const [selectedWithdrawId, setSelectedWithdrawId] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Transform API data to match component props
  const userProfile: UserProfile = meData?.me
    ? {
        id: meData.me.id,
        name: meData.me.displayName || meData.me.username || "Anonymous",
        username: meData.me.username ? `@${meData.me.username}` : "@anonymous",
        avatar: meData.me.avatarUrl || mockUserProfile.avatar,
        coverImage: mockUserProfile.coverImage, // TODO: Add cover image to GraphQL
        bio: meData.me.bio || "",
        postImpressions: meData.me.stats.postsCount || 0,
        donations: meData.me.stats.fundraisersCount || 0,
      }
    : mockUserProfile;

  // Calculate earnings stats from GraphQL data
  const earningsStats: EarningsStats = meData?.me
    ? {
        totalAmount: parseFloat(meData.me.stats.totalDonated || "0"),
        totalAmountChange: 0, // TODO: Calculate change from previous period
        donations: parseFloat(meData.me.stats.totalDonated || "0"),
        donationsChange: 0,
        pointsEarnings: meData.me.stats.reputationScore || 0,
        pointsEarningsChange: 0,
        comparisonPeriod: "last month",
      }
    : mockEarningsStats;

  // Handle withdraw button click
  const handleWithdraw = (earningId: string) => {
    const earning = mockEarnings.find((e) => e.id === earningId);
    if (earning) {
      setSelectedWithdrawId(earningId);
      setSelectedWithdrawAmount(earning.amount);
      setIsWithdrawModalOpen(true);
    }
  };

  // Handle withdraw confirmation
  const handleConfirmWithdraw = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log(`Withdrawal confirmed for earning ID: ${selectedWithdrawId}`);
    console.log(`Amount: ${selectedWithdrawAmount} USD`);

    setIsProcessing(false);
    setIsWithdrawModalOpen(false);
    setSelectedWithdrawId(null);
    setSelectedWithdrawAmount(0);
  };

  // Handle premium CTA click
  const handleTryPremium = () => {
    console.log("Premium subscription clicked - placeholder action");
  };

  // Loading state
  if (meLoading) {
    return (
      <div className="min-h-screen bg-background">
        <BackHeader title="Dashboard" fallbackHref="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-text-secondary">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (meError || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <BackHeader title="Dashboard" fallbackHref="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {!isAuthenticated ? "Authentication Required" : "Error Loading Dashboard"}
            </h2>
            <p className="text-text-secondary mb-6">
              {!isAuthenticated
                ? "Please log in to view your dashboard."
                : "We couldn't load your dashboard data. Please try again."}
            </p>
            {!isAuthenticated && (
              <a
                href="/auth"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Log In
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BackHeader title="Dashboard" fallbackHref="/" />
      <div className="flex w-full max-w-[1400px] mx-auto px-4 py-6 gap-6">
        {/* Left Sidebar - Profile */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <ProfileSidebar
            user={userProfile}
            onTryPremium={handleTryPremium}
            className="sticky top-6 h-fit"
          />
        </aside>

        {/* Main Content Area - Stats + Tables + Leaderboard */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Stats Cards Row - Spans full width above tables and leaderboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 border-b border-border-default">
            <StatsCard
              title="Total Amount"
              value={earningsStats.totalAmount}
              prefix="$"
              suffix="k"
              change={earningsStats.totalAmountChange}
              comparisonText={`Compared to ${earningsStats.comparisonPeriod}`}
            />
            <StatsCard
              title="Donations"
              value={earningsStats.donations}
              prefix="$"
              suffix="k"
              change={earningsStats.donationsChange}
              comparisonText={`Compared to ${earningsStats.comparisonPeriod}`}
            />
            <StatsCard
              title="Points Earnings"
              value={earningsStats.pointsEarnings}
              prefix="$"
              suffix="k"
              change={earningsStats.pointsEarningsChange}
              comparisonText={`Compared to ${earningsStats.comparisonPeriod}`}
            />
          </div>

          {/* DeFi Positions — Per-campaign staking & wealth building breakdown */}
          {campaignsData?.fundraisersByCreator?.items && campaignsData.fundraisersByCreator.items.length > 0 && (
            <div className="pb-6 border-b border-border-default">
              <DeFiPositions
                campaigns={campaignsData.fundraisersByCreator.items
                  .filter((f: any) => f.onChainId !== undefined && f.onChainId !== null)
                  .map((f: any) => ({
                    id: f.id,
                    title: f.name,
                    onChainId: f.onChainId,
                    stakingPoolAddr: f.stakingPoolAddr,
                  }))}
              />
            </div>
          )}

          {/* Tables and Leaderboard Row - Side by side */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tables Column */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {/* All Earnings Table */}
              <EarningsTable
                earnings={mockEarnings}
                onWithdraw={handleWithdraw}
              />

              {/* Withdrawal History Table */}
              <WithdrawalHistoryTable withdrawals={mockWithdrawals} />
            </div>

            {/* Leaderboard Column */}
            <aside className="w-full lg:w-[280px] shrink-0 lg:pl-6 lg:border-l lg:border-border-default">
              <Leaderboard
                entries={mockLeaderboard}
                currentUserRank={200}
                className="lg:sticky lg:top-6"
              />
            </aside>
          </div>
        </main>
      </div>

      {/* Withdraw Confirmation Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onConfirm={handleConfirmWithdraw}
        amount={selectedWithdrawAmount}
        currency="USD"
        isLoading={isProcessing}
      />
    </div>
  );
}
