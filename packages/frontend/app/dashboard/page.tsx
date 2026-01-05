"use client";

import { useState } from "react";
import {
  ProfileSidebar,
  StatsCard,
  EarningsTable,
  WithdrawalHistoryTable,
  Leaderboard,
  WithdrawModal,
} from "@/app/components/earnings";
import {
  mockUserProfile,
  mockEarningsStats,
  mockEarnings,
  mockWithdrawals,
  mockLeaderboard,
} from "./data";

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
  // State for withdraw modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState(0);
  const [selectedWithdrawId, setSelectedWithdrawId] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

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

  return (
    <div className="min-h-screen bg-neutral-dark-500">
      <div className="flex w-full max-w-[1400px] mx-auto px-4 py-6 gap-6">
        {/* Left Sidebar - Profile */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <ProfileSidebar
            user={mockUserProfile}
            onTryPremium={handleTryPremium}
            className="sticky top-6 h-fit"
          />
        </aside>

        {/* Main Content Area - Stats + Tables + Leaderboard */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Stats Cards Row - Spans full width above tables and leaderboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 border-b border-white/10">
            <StatsCard
              title="Total Amount"
              value={mockEarningsStats.totalAmount}
              prefix="$"
              suffix="k"
              change={mockEarningsStats.totalAmountChange}
              comparisonText={`Compared to (2,553k ${mockEarningsStats.comparisonPeriod})`}
            />
            <StatsCard
              title="Donations"
              value={mockEarningsStats.donations}
              prefix="$"
              suffix="k"
              change={mockEarningsStats.donationsChange}
              comparisonText={`Compared to (1,498k ${mockEarningsStats.comparisonPeriod})`}
            />
            <StatsCard
              title="Points Earnings"
              value={mockEarningsStats.pointsEarnings}
              prefix="$"
              suffix="k"
              change={mockEarningsStats.pointsEarningsChange}
              comparisonText={`Compared to ($5,760k ${mockEarningsStats.comparisonPeriod})`}
            />
          </div>

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
            <aside className="w-full lg:w-[280px] shrink-0 lg:pl-6 lg:border-l lg:border-white/10">
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
