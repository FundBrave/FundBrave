/**
 * TypeScript interfaces for the Leaderboard page
 * Route: /leaderboard
 */

/** Time period filter options */
export type LeaderboardPeriod = "all-time" | "monthly" | "weekly";

/** Leaderboard user entry */
export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  username: string; // e.g., "@agathalinks"
  avatar: string;
  points: number;
  memberSince: string; // "22/11/2024"
}

/** Leaderboard data organized by time period */
export interface LeaderboardData {
  allTime: LeaderboardUser[];
  monthly: LeaderboardUser[];
  weekly: LeaderboardUser[];
}

/** Props for LeaderboardTabs component */
export interface LeaderboardTabsProps {
  activeTab: LeaderboardPeriod;
  onTabChange: (tab: LeaderboardPeriod) => void;
}

/** Props for PodiumCard component */
export interface PodiumCardProps {
  user: LeaderboardUser;
  position: 1 | 2 | 3;
}

/** Props for TopThreePodium component */
export interface TopThreePodiumProps {
  users: LeaderboardUser[];
}

/** Props for LeaderboardRow component */
export interface LeaderboardRowProps {
  user: LeaderboardUser;
  isCurrentUser?: boolean;
  showSeparator?: boolean;
}

/** Props for UserPositionIndicator component */
export interface UserPositionIndicatorProps {
  allUsers: LeaderboardUser[];
  currentUserId: string;
  visibleCount: number;
}

/** Props for LeaderboardList component */
export interface LeaderboardListProps {
  users: LeaderboardUser[];
  currentUserId?: string;
  allUsers?: LeaderboardUser[];
}
