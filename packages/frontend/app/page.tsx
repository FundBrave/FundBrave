"use client";

import { useState, useCallback } from "react";

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

// Mock data
import {
  MOCK_STORIES,
  MOCK_TOP_FUNDERS,
  MOCK_SUGGESTED_USERS,
  MOCK_CURRENT_USER,
} from "@/lib/constants/mock-home-data";

// Types
import type { FeedFilter } from "@/app/types/home";

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
 */

export default function HomePage() {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("popular");

  // Handlers
  const handleCreateStory = useCallback(() => {
    console.log("Create story clicked");
  }, []);

  const handleStoryClick = useCallback((storyId: string) => {
    console.log("Story clicked:", storyId);
  }, []);

  const handleTryPremium = useCallback(() => {
    console.log("Premium clicked");
  }, []);

  const handleFollowUser = useCallback((userId: string) => {
    console.log("Follow user:", userId);
  }, []);

  const handleRefreshSuggestions = useCallback(() => {
    console.log("Refresh suggestions");
  }, []);

  // Left Sidebar Content
  const leftSidebar = (
    <ProfileSidebar
      user={MOCK_CURRENT_USER}
      onTryPremium={handleTryPremium}
      showDarkModeToggle
    />
  );

  // Right Sidebar Content
  const rightSidebar = (
    <div className="flex flex-col gap-6">
      {/* Top Funders Leaderboard */}
      <Leaderboard
        entries={MOCK_TOP_FUNDERS}
        title="Top Funders"
        viewAllLink="/leaderboard"
        viewAllText="View All"
        maxHeight="350px"
      />

      {/* People to Follow */}
      <PeopleToFollow
        users={MOCK_SUGGESTED_USERS}
        onFollow={handleFollowUser}
        onRefresh={handleRefreshSuggestions}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Global Navbar */}
      <Navbar />

      {/* Main Layout */}
      <HomeLayout leftSidebar={leftSidebar} rightSidebar={rightSidebar}>
        {/* Stories Row */}
        <StoriesRow
          stories={MOCK_STORIES}
          onCreateStory={handleCreateStory}
          onStoryClick={handleStoryClick}
          className="mb-6 mt-6"
        />

        {/* Create Post Inline */}
        <CreatePostInline
          userAvatar={MOCK_CURRENT_USER.avatar}
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