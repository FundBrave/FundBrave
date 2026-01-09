"use client";

import React, { useState } from "react";
import {
  CommunitySidebar,
  MobileCommunityToggle,
  MobileDrawer,
  CommunityFeed,
  CommunityInfoPanel,
  CommunityPostData,
  Community,
  CommunityDetails,
} from "@/app/components/community";
import { BackHeader } from "@/app/components/common/BackHeader";

// Mock data for communities with Unsplash images
const mockCommunities: Community[] = [
  {
    id: "1",
    name: "Meta Technologies",
    avatar: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop",
    lastMessage: "Gabriel: When is the show going to start?",
    timestamp: "5h",
    isJoined: true,
  },
  {
    id: "2",
    name: "FusionSphere",
    avatar: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=100&h=100&fit=crop",
    lastMessage: "You: When is the show going to start?",
    timestamp: "5h",
    isJoined: true,
  },
  {
    id: "3",
    name: "TechSphere",
    avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop",
    lastMessage: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    timestamp: "5h",
    isJoined: true,
  },
  {
    id: "4",
    name: "VertexFusion",
    avatar: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=100&h=100&fit=crop",
    lastMessage: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    timestamp: "5h",
    isJoined: false,
  },
  {
    id: "5",
    name: "QuantumFusion",
    avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop",
    lastMessage: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    timestamp: "5h",
    isJoined: false,
  },
  {
    id: "6",
    name: "WaveQuantum",
    avatar: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop",
    lastMessage: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    timestamp: "5h",
    isJoined: true,
  },
];

// Mock data for community details with Unsplash images
const mockCommunityDetails: CommunityDetails = {
  id: "1",
  name: "Meta Technologies",
  avatar: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop",
  coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=300&fit=crop",
  createdBy: "John Doe",
  creatorUsername: "@johndoe",
  memberCount: 228796,
  onlineCount: 109675,
  description:
    "Qorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.",
  inviteLink: "https://metatechnologies.com/",
  notificationsEnabled: false,
  media: [
    { id: "1", type: "video" as const, thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop" },
    { id: "2", type: "video" as const, thumbnail: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=200&h=200&fit=crop" },
    { id: "3", type: "image" as const, thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop" },
    { id: "4", type: "video" as const, thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop" },
  ],
};

// Mock data for posts with Unsplash images
const mockPosts: CommunityPostData[] = [
  {
    id: "1",
    author: {
      id: "author1",
      name: "Williams Ike",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      role: "CEO",
      organization: "Lend a helping hand organization",
    },
    content:
      "Rorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos...",
    timestamp: "20 minutes ago",
    reactions: [
      { emoji: "😊", count: 150 },
      { emoji: "❤️", count: 100 },
      { emoji: "👍", count: 54 },
    ],
    viewCount: 100304,
    commentCount: 60,
    isFollowing: false,
  },
  {
    id: "2",
    author: {
      id: "author2",
      name: "Agatha Links",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      role: "CEO",
      organization: "Lend a helping hand organization",
    },
    content:
      "Rorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos...",
    timestamp: "20 minutes ago",
    reactions: [
      { emoji: "😊", count: 150 },
      { emoji: "❤️", count: 100 },
      { emoji: "👍", count: 54 },
    ],
    viewCount: 100304,
    commentCount: 60,
    images: [
      { src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop", alt: "Medical equipment" },
      { src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop", alt: "Healthcare scene" },
    ],
    isFollowing: false,
  },
];

export default function CommunityPage() {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("1");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleSelectCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setIsMobileDrawerOpen(false);
    // In a real app, this would fetch the community details and posts
  };

  const handleCreateCommunity = () => {
    // Handle community creation
    console.log("Create community clicked");
  };

  const handleJoinCommunity = () => {
    // Handle joining community
    console.log("Join community clicked");
  };

  const handleFollowAuthor = (authorId: string) => {
    console.log("Follow author:", authorId);
  };

  const handleReactToPost = (postId: string, emoji: string) => {
    console.log("React to post:", postId, emoji);
  };

  const handleCommentOnPost = (postId: string) => {
    console.log("Comment on post:", postId);
  };

  const handleToggleNotifications = (enabled: boolean) => {
    console.log("Toggle notifications:", enabled);
  };

  const handleMediaClick = (mediaId: string) => {
    console.log("Media clicked:", mediaId);
  };

  // Get selected community data
  const selectedCommunity = mockCommunities.find(
    (c) => c.id === selectedCommunityId
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <BackHeader title="Community" fallbackHref="/" />
      <div className="flex flex-1 w-full flex-col overflow-hidden md:flex-row">
      {/* Mobile Community Selector */}
      <div className="border-b border-border-subtle p-4 md:hidden">
        <MobileCommunityToggle
          onClick={() => setIsMobileDrawerOpen(true)}
          selectedCommunityName={selectedCommunity?.name}
        />
      </div>

      {/* Left Sidebar - Communities List */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border-subtle md:block lg:w-72">
        <CommunitySidebar
          communities={mockCommunities}
          selectedCommunityId={selectedCommunityId}
          onSelectCommunity={handleSelectCommunity}
          onCreateCommunity={handleCreateCommunity}
        />
      </aside>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      >
        <CommunitySidebar
          communities={mockCommunities}
          selectedCommunityId={selectedCommunityId}
          onSelectCommunity={handleSelectCommunity}
          onCreateCommunity={handleCreateCommunity}
        />
      </MobileDrawer>

      {/* Middle - Community Feed */}
      <main className="min-h-0 min-w-0 flex-1">
        {selectedCommunity ? (
          <CommunityFeed
            community={{
              id: selectedCommunity.id,
              name: selectedCommunity.name,
              avatar: selectedCommunity.avatar,
              memberCount: mockCommunityDetails.memberCount,
              onlineCount: mockCommunityDetails.onlineCount,
              isJoined: selectedCommunity.isJoined,
            }}
            posts={mockPosts}
            onJoin={handleJoinCommunity}
            onFollowAuthor={handleFollowAuthor}
            onReactToPost={handleReactToPost}
            onCommentOnPost={handleCommentOnPost}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-neutral-dark-200">Select a community to view</p>
          </div>
        )}
      </main>

      {/* Right Sidebar - Community Info */}
      <aside className="hidden w-96 flex-shrink-0 p-4 lg:block xl:w-80">
        <CommunityInfoPanel
          community={mockCommunityDetails}
          onToggleNotifications={handleToggleNotifications}
          onMediaClick={handleMediaClick}
        />
      </aside>
      </div>
    </div>
  );
}
