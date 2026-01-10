/**
 * Mock data for the Creator Earnings Dashboard
 * Route: /dashboard
 */

import type {
  UserProfile,
  EarningRecord,
  WithdrawalRecord,
  LeaderboardEntry,
  EarningsStats,
} from "@/app/types/earnings";

// Mock user profile data (matches Figma design)
export const mockUserProfile: UserProfile = {
  id: "user-1",
  name: "Anna Doe",
  username: "@annadoe",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
  coverImage:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=200&fit=crop",
  bio: "Qorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.",
  postImpressions: 201,
  donations: 443,
};

// Mock earnings stats (matches Figma design values)
export const mockEarningsStats: EarningsStats = {
  totalAmount: 58570,
  totalAmountChange: 56,
  donations: 12340,
  donationsChange: -56,
  pointsEarnings: 10230,
  pointsEarningsChange: 56,
  comparisonPeriod: "last month",
};

// Mock earnings records (matches Figma table)
export const mockEarnings: EarningRecord[] = [
  {
    id: "earn-1",
    amount: 820000,
    currency: "USD",
    type: "Donation",
    date: "5 Dec 2024",
  },
  {
    id: "earn-2",
    amount: 820000,
    currency: "USD",
    type: "Points",
    date: "5 Dec 2024",
  },
  {
    id: "earn-3",
    amount: 820000,
    currency: "USD",
    type: "Points",
    date: "5 Dec 2024",
  },
  {
    id: "earn-4",
    amount: 820000,
    currency: "USD",
    type: "Donation",
    date: "5 Dec 2024",
  },
];

// Mock withdrawal history (matches Figma table with status badges)
export const mockWithdrawals: WithdrawalRecord[] = [
  {
    id: "with-1",
    amount: 820000,
    currency: "USD",
    type: "Donation",
    date: "5 Dec 2024",
    status: "Paid",
  },
  {
    id: "with-2",
    amount: 820000,
    currency: "USD",
    type: "Points",
    date: "5 Dec 2024",
    status: "Pending",
  },
  {
    id: "with-3",
    amount: 820000,
    currency: "USD",
    type: "Points",
    date: "5 Dec 2024",
    status: "Paid",
  },
];

// Mock leaderboard entries (matches Figma design ranks 198-206)
export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 198,
    id: "leader-1",
    name: "Agatha Links",
    username: "@gathylinks",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    points: 201,
  },
  {
    rank: 199,
    id: "leader-2",
    name: "St.Ives.co",
    username: "@johndoe",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    points: 198,
  },
  {
    rank: 200,
    id: "leader-3",
    name: "Steve Liam",
    username: "@steveliam",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    points: 177,
  },
  {
    rank: 201,
    id: "leader-4",
    name: "Jane Bauer",
    username: "@janebauer",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    points: 64,
  },
  {
    rank: 202,
    id: "leader-5",
    name: "Akpan Mike",
    username: "@akpanmike",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    points: 98,
  },
  {
    rank: 203,
    id: "leader-6",
    name: "Jane Bauer",
    username: "@janebauer",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
    points: 64,
  },
  {
    rank: 204,
    id: "leader-7",
    name: "Eghosa Ose",
    username: "@eghosaose",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
    points: 183,
  },
  {
    rank: 205,
    id: "leader-8",
    name: "Jane Bauer",
    username: "@janebauer",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
    points: 64,
  },
  {
    rank: 206,
    id: "leader-9",
    name: "Jane Bauer",
    username: "@janebauer",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop",
    points: 64,
  },
];
