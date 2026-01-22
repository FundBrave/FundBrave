"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// Common components
import { Navbar, ProfileSidebar, Leaderboard, PeopleToFollow } from "@/app/components/common";

// Home components
import {
  HomeLayout,
  StoriesRow,
  CreatePostInline,
  FeedFilters,
  FeedList,
} from "@/app/components/home";

// UI Components
import { Spinner } from "@/app/components/ui/Spinner";

// Hooks
import { useAuth } from "@/app/provider/AuthProvider";
import {
  useGetMeQuery,
  useGetDonationLeaderboardQuery,
  useGetSuggestedUsersQuery,
  useFollowUserMutation,
} from "@/app/generated/graphql";

// Mock data (keep stories for now - TODO: implement Status feature)
import { MOCK_STORIES } from "@/lib/constants/mock-home-data";

// Types
import type { FeedFilter } from "@/app/types/home";
import type { UserProfile, LeaderboardEntry, SuggestedUser } from "@/app/types/home";

/**
 * Home Page - Main feed page
 * Route: /
 *
 * Features:
 * - Global Navbar at top
 * - 3-column responsive layout:
 *   - Left: ProfileSidebar (user info, stats, nav)
 *   - Center: Stories, Create Post, Feed with filters
 *   - Right: Top Funders leaderboard, People to Follow
 * - Twitter-like infinite scroll pagination
 * - Instagram-like stories row
 *
 * Authentication:
 * - Redirects to /auth if not authenticated
 * - Fetches real data from GraphQL API
 */

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("popular");

  // GraphQL Queries
  const { data: meData, loading: meLoading, error: meError } = useGetMeQuery({
    skip: !isAuthenticated || authLoading,
    fetchPolicy: 'cache-first',
  });

  const { data: leaderboardData, loading: leaderboardLoading } = useGetDonationLeaderboardQuery({
    variables: { limit: 6 },
    skip: !isAuthenticated || authLoading || !meData?.me,
    fetchPolicy: 'cache-first',
  });

  const {
    data: suggestedUsersData,
    loading: suggestedUsersLoading,
    refetch: refetchSuggestedUsers
  } = useGetSuggestedUsersQuery({
    variables: { limit: 5 },
    skip: !isAuthenticated || authLoading || !meData?.me,
    fetchPolicy: 'cache-first',
  });

  // Follow user mutation
  const [followUserMutation] = useFollowUserMutation();

  // Handlers - MUST be before any conditional returns
  const handleCreateStory = useCallback(() => {
    console.log("Create story clicked - TODO: implement Status feature");
  }, []);

  const handleStoryClick = useCallback((storyId: string) => {
    console.log("Story clicked:", storyId);
  }, []);

  const handleTryPremium = useCallback(() => {
    console.log("Premium clicked");
  }, []);

  const handleFollowUser = useCallback(async (userId: string) => {
    try {
      await followUserMutation({
        variables: { userId },
        refetchQueries: ["GetSuggestedUsers"],
      });
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  }, [followUserMutation]);

  const handleRefreshSuggestions = useCallback(() => {
    refetchSuggestedUsers();
  }, [refetchSuggestedUsers]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading spinner while checking authentication
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show error if user data failed to load
  if (meError || !meData?.me) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to load user data</h2>
          <p className="text-text-secondary">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  // Transform GraphQL data to component props format
  const currentUser: UserProfile = {
    id: meData.me.id,
    name: meData.me.displayName || meData.me.username || "Anonymous",
    username: meData.me.username ? `@${meData.me.username}` : "@user",
    avatar: meData.me.avatarUrl || "",
    coverImage: meData.me.bannerUrl || "",
    bio: meData.me.bio || "No bio yet",
    postImpressions: meData.me.stats.postsCount || 0,
    donations: parseInt(meData.me.stats.totalDonated) || 0,
  };

  // Transform leaderboard data
  const topFunders: LeaderboardEntry[] = leaderboardData?.donationLeaderboard.entries.map(entry => ({
    rank: entry.rank,
    id: entry.donor.id || "",
    name: entry.donor.displayName || entry.donor.username || "Anonymous",
    username: entry.donor.username ? `@${entry.donor.username}` : "@anonymous",
    avatar: entry.donor.avatarUrl || "",
    points: parseInt(entry.totalDonated) || 0,
  })) || [];

  // Transform suggested users data
  const suggestedUsers: SuggestedUser[] = suggestedUsersData?.suggestedUsers
    .filter(user => !user.isFollowing)
    .map(user => ({
      id: user.id,
      name: user.displayName || user.username || "Anonymous",
      username: user.username || "user",
      avatar: user.avatarUrl || "",
      isVerified: user.isVerifiedCreator,
      mutualConnections: user.stats.followersCount || 0, // Use followers count as proxy for mutual connections
    })) || [];

  // Left Sidebar Content
  const leftSidebar = (
    <ProfileSidebar
      user={currentUser}
      onTryPremium={handleTryPremium}
      showDarkModeToggle
    />
  );

  // Right Sidebar Content
  const rightSidebar = (
    <div className="flex flex-col gap-6">
      {/* Top Funders Leaderboard */}
      {leaderboardLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <Leaderboard
          entries={topFunders}
          title="Top Funders"
          viewAllLink="/leaderboard"
          viewAllText="View All"
          maxHeight="350px"
        />
      )}

      {/* People to Follow */}
      {suggestedUsersLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <PeopleToFollow
          users={suggestedUsers}
          onFollow={handleFollowUser}
          onRefresh={handleRefreshSuggestions}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navbar */}
      <Navbar />

      {/* Main Layout */}
      <HomeLayout leftSidebar={leftSidebar} rightSidebar={rightSidebar}>
        {/* Stories Row - TODO: Replace with real Status feature when available */}
        <StoriesRow
          stories={MOCK_STORIES}
          onCreateStory={handleCreateStory}
          onStoryClick={handleStoryClick}
          className="mb-6 mt-6"
        />

        {/* Create Post Inline */}
        <CreatePostInline
          userAvatar={currentUser.avatar}
          className="mb-6"
        />

        {/* Feed Filters */}
        <FeedFilters
          activeFilter={feedFilter}
          onChange={setFeedFilter}
          className="mb-6"
        />

        {/* Feed List with Infinite Scroll */}
        <FeedList filter={feedFilter} />
      </HomeLayout>
    </div>
  );
}