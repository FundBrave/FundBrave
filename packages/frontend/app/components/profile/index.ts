// Profile Components Index
// Re-export all profile-related components for easier imports

export { default as ProfileHeader } from "./ProfileHeader";
export { default as ProfileTabs } from "./ProfileTabs";

// Tab Content Components
export { default as CampaignsTab, CampaignCardWithActions } from "./CampaignsTab";
export { default as PostsTab } from "./PostsTab";
export { default as DonationsTab, DonationCard } from "./DonationsTab";
export { default as LikesTab } from "./LikesTab";
export { default as CommentsTab, CommentCard } from "./CommentsTab";

// Re-export PostCard from the unified ui/post module
export { PostCard, fromContextPost, fromMockLike } from "@/app/components/ui/post";
