// Community Components
export { CommunitySidebar, MobileCommunityToggle, MobileDrawer } from "./CommunitySidebar";
export { CommunityFeed } from "./CommunityFeed";
export { CommunityPost } from "./CommunityPost";
export { CommunityInfoPanel } from "./CommunityInfoPanel";

// Re-export types from the centralized types file
export type {
  CommunityPostData,
  PostAuthor,
  PostReaction,
  PostImage,
  CommunityInfo,
} from "@/app/types/community";

export type {
  Community,
  CommunityFilterTab,
} from "./CommunitySidebar";

export type {
  MediaItem,
  CommunityDetails,
  InfoPanelTab,
} from "./CommunityInfoPanel";
