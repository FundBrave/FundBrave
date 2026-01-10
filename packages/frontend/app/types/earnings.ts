/**
 * TypeScript interfaces for the Creator Earnings Dashboard
 * Route: /dashboard
 */

/** Stats card data for the top metrics */
export interface EarningsStats {
  totalAmount: number;
  totalAmountChange: number;
  donations: number;
  donationsChange: number;
  pointsEarnings: number;
  pointsEarningsChange: number;
  comparisonPeriod: string;
}

/** Earning type enum */
export type EarningType = "Donation" | "Points";

/** Single earning record */
export interface EarningRecord {
  id: string;
  amount: number;
  currency: string;
  type: EarningType;
  date: string;
}

/** Withdrawal status */
export type WithdrawalStatus = "Paid" | "Pending";

/** Single withdrawal record */
export interface WithdrawalRecord {
  id: string;
  amount: number;
  currency: string;
  type: EarningType;
  date: string;
  status: WithdrawalStatus;
}

/** Leaderboard user entry */
export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatar: string;
  points: number;
}

/** User profile data for sidebar */
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  postImpressions: number;
  donations: number;
}

/** Navigation item for sidebar */
export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

/** Footer link for sidebar */
export interface FooterLink {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
}
