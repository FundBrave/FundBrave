/**
 * Home Page Type Definitions
 * Types for stories, feed filters, and suggested users
 */

// Story type for Instagram-like stories row
export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  hasUnseenStory: boolean;
  storyThumbnail?: string;
  createdAt?: string;
}

// Feed filter options
export type FeedFilter = "popular" | "recent" | "most_viewed";

// Suggested user for "People to Follow" section
export interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
  mutualConnections?: number;
  bio?: string;
}

// Top funder for leaderboard
export interface TopFunder {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatar: string;
  points: number;
}

// Props for Stories components
export interface StoriesRowProps {
  stories: Story[];
  onCreateStory?: () => void;
  onStoryClick?: (storyId: string) => void;
  className?: string;
}

export interface StoryItemProps {
  story: Story;
  onClick?: () => void;
}

// Props for Feed components
export interface FeedFiltersProps {
  activeFilter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
  className?: string;
}

export interface FeedListProps {
  filter?: FeedFilter;
  className?: string;
}

// Props for People to Follow
export interface PeopleToFollowProps {
  users: SuggestedUser[];
  onFollow?: (userId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export interface SuggestedUserProps {
  user: SuggestedUser;
  onFollow?: (userId: string) => void;
}

// Create post inline props
export interface CreatePostInlineProps {
  userAvatar?: string;
  onCreatePost?: () => void;
  className?: string;
}
