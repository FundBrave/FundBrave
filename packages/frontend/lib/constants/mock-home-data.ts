/**
 * Mock data for the Home page
 * Stories, Top Funders, Suggested Users, and User Profile
 */

import type { Story, TopFunder, SuggestedUser } from "@/app/types/home";
import type { UserProfile } from "@/app/types/earnings";

// Mock Stories Data
export const MOCK_STORIES: Story[] = [
  {
    id: "1",
    userId: "user1",
    userName: "John Dike",
    userAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    hasUnseenStory: true,
    storyThumbnail:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop",
  },
  {
    id: "2",
    userId: "user2",
    userName: "George Efiong",
    userAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    hasUnseenStory: true,
    storyThumbnail:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop",
  },
  {
    id: "3",
    userId: "user3",
    userName: "Agatha Links",
    userAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    hasUnseenStory: true,
    storyThumbnail:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop",
  },
  {
    id: "4",
    userId: "user4",
    userName: "Williams Ike",
    userAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    hasUnseenStory: false,
  },
  {
    id: "5",
    userId: "user5",
    userName: "Sarah Chen",
    userAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    hasUnseenStory: true,
  },
  {
    id: "6",
    userId: "user6",
    userName: "Mike Johnson",
    userAvatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    hasUnseenStory: false,
  },
];

// Mock Top Funders / Leaderboard Data
export const MOCK_TOP_FUNDERS: TopFunder[] = [
  {
    rank: 1,
    id: "funder1",
    name: "Agatha Links",
    username: "@gathylinks",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    points: 201,
  },
  {
    rank: 2,
    id: "funder2",
    name: "St.Ives.co",
    username: "@johndoe",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    points: 198,
  },
  {
    rank: 3,
    id: "funder3",
    name: "Eghosa Ose",
    username: "@eghosaose",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    points: 183,
  },
  {
    rank: 4,
    id: "funder4",
    name: "Steve Liam",
    username: "@steveliam",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    points: 177,
  },
  {
    rank: 5,
    id: "funder5",
    name: "Akpan Mike",
    username: "@akpanmike",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    points: 98,
  },
  {
    rank: 6,
    id: "funder6",
    name: "Jane Bauer",
    username: "@janebauer",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    points: 64,
  },
];

// Mock Suggested Users for "People to Follow"
export const MOCK_SUGGESTED_USERS: SuggestedUser[] = [
  {
    id: "suggest1",
    name: "Johnson Peter",
    username: "johndoe",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    isVerified: true,
    mutualConnections: 5,
  },
  {
    id: "suggest2",
    name: "Ruth Bills",
    username: "johndoe",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    isVerified: false,
    mutualConnections: 3,
  },
  {
    id: "suggest3",
    name: "Adams Efiong",
    username: "johndoe",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    isVerified: true,
    mutualConnections: 8,
  },
  {
    id: "suggest4",
    name: "Lilian Judge",
    username: "johndoe",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    isVerified: false,
    mutualConnections: 2,
  },
  {
    id: "suggest5",
    name: "George Miller",
    username: "gerogemiller",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    isVerified: false,
    mutualConnections: 1,
  },
];

// Mock Current User Profile
export const MOCK_CURRENT_USER: UserProfile = {
  id: "current-user",
  name: "Anna Doe",
  username: "@annadoe",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  coverImage:
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=300&fit=crop",
  bio: "Qorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.",
  postImpressions: 201,
  donations: 443,
};
