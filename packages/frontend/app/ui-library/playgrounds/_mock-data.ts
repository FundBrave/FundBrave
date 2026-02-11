/**
 * Shared Mock Data for Social/Comment Playground Demos
 *
 * All objects conform to the TypeScript interfaces defined in:
 *   - @/app/types/post.ts       (PostAuthor, PostImage, UnifiedPostData)
 *   - @/app/types/comment.ts    (Comment, CommentAuthor)
 *   - @/app/components/ui/post/PostActionBar.tsx (PostActionBarCampaign)
 *
 * Content is FundBrave-contextual: campaign names, donation amounts,
 * crypto references, and realistic community interactions.
 */

import type { PostAuthor, PostImage, UnifiedPostData } from "@/app/types/post";
import type { Comment, CommentAuthor } from "@/app/types/comment";
import type { PostActionBarCampaign } from "@/app/components/ui/post/PostActionBar";

// ============================================================================
// Authors
// ============================================================================

export const MOCK_AUTHOR: PostAuthor = {
  id: "user-001",
  name: "Amara Osei",
  username: "amaraosei",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Amara&backgroundColor=1a1a2e",
  isVerified: true,
  role: "Campaign Creator",
  organization: "FundBrave Foundation",
};

export const MOCK_AUTHOR_2: PostAuthor = {
  id: "user-002",
  name: "David Chen",
  username: "dchen_dev",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=David&backgroundColor=1a1a2e",
  isVerified: false,
};

export const MOCK_AUTHOR_3: PostAuthor = {
  id: "user-003",
  name: "Sofia Ramirez",
  username: "sofiaramirez",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Sofia&backgroundColor=1a1a2e",
  isVerified: true,
  role: "Community Lead",
  organization: "DeFi For Good",
};

export const MOCK_AUTHOR_4: PostAuthor = {
  id: "user-004",
  name: "Kwame Mensah",
  username: "kwamemensah",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Kwame&backgroundColor=1a1a2e",
  isVerified: false,
};

// ============================================================================
// Comment Authors (CommentAuthor shape from @/app/types/comment)
// ============================================================================

export const MOCK_COMMENT_AUTHOR_1: CommentAuthor = {
  id: "user-002",
  name: "David Chen",
  username: "dchen_dev",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=David&backgroundColor=1a1a2e",
  isVerified: false,
};

export const MOCK_COMMENT_AUTHOR_2: CommentAuthor = {
  id: "user-003",
  name: "Sofia Ramirez",
  username: "sofiaramirez",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Sofia&backgroundColor=1a1a2e",
  isVerified: true,
};

export const MOCK_COMMENT_AUTHOR_3: CommentAuthor = {
  id: "user-004",
  name: "Kwame Mensah",
  username: "kwamemensah",
  avatar:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Kwame&backgroundColor=1a1a2e",
  isVerified: false,
};

// ============================================================================
// Images
// ============================================================================

export const MOCK_IMAGES: PostImage[] = [
  {
    src: "https://placehold.co/600x400/1a1a2e/ffffff?text=Campaign+Photo",
    alt: "Clean water initiative campaign photo",
  },
  {
    src: "https://placehold.co/600x400/162447/ffffff?text=Community+Event",
    alt: "Community fundraising event",
  },
  {
    src: "https://placehold.co/600x400/1f4068/ffffff?text=Milestone+Update",
    alt: "Campaign milestone celebration",
  },
  {
    src: "https://placehold.co/600x400/1b1b3a/ffffff?text=Donor+Wall",
    alt: "Top donors recognition wall",
  },
];

export const MOCK_SINGLE_IMAGE: PostImage = {
  src: "https://placehold.co/800x450/1a1a2e/ffffff?text=Campaign+Banner",
  alt: "Solar panels for rural schools campaign banner",
};

// ============================================================================
// Campaigns (PostActionBarCampaign for donate-button demos)
// ============================================================================

export const MOCK_CAMPAIGN: PostActionBarCampaign = {
  id: "campaign-001",
  title: "Solar Panels for Rural Schools",
  suggestedAmount: 25,
};

export const MOCK_CAMPAIGN_2: PostActionBarCampaign = {
  id: "campaign-002",
  title: "Clean Water Initiative - Lake Volta Region",
  suggestedAmount: 50,
};

// ============================================================================
// Comments (with nested replies)
// ============================================================================

const REPLY_TO_COMMENT_1: Comment = {
  id: "reply-001",
  content:
    "Thanks for the support! We just crossed the 2 ETH mark. Every contribution through FundBrave is transparently tracked on-chain.",
  parentId: "comment-001",
  rootId: "comment-001",
  depth: 1,
  createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  author: {
    id: "user-001",
    name: "Amara Osei",
    username: "amaraosei",
    avatar:
      "https://api.dicebear.com/9.x/avataaars/svg?seed=Amara&backgroundColor=1a1a2e",
    isVerified: true,
  },
  likesCount: 8,
  repliesCount: 0,
  isLiked: false,
  postId: "post-001",
  replies: [],
};

const REPLY_TO_COMMENT_2: Comment = {
  id: "reply-002",
  content:
    "Absolutely. The staking rewards are a great incentive too -- donors can earn yield while their funds are locked for the campaign.",
  parentId: "comment-002",
  rootId: "comment-002",
  depth: 1,
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  author: MOCK_COMMENT_AUTHOR_3,
  likesCount: 3,
  repliesCount: 0,
  isLiked: true,
  postId: "post-001",
  replies: [],
};

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "comment-001",
    content:
      "Just donated 0.5 ETH to this campaign! The transparency of on-chain donations is what makes FundBrave different. Keep pushing forward!",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    author: MOCK_COMMENT_AUTHOR_1,
    likesCount: 12,
    repliesCount: 1,
    isLiked: true,
    canEdit: false,
    canDelete: false,
    postId: "post-001",
    replies: [REPLY_TO_COMMENT_1],
  },
  {
    id: "comment-002",
    content:
      "This is exactly the kind of DeFi use case that drives real-world impact. Decentralized fundraising removes the middleman and puts donors in control. Shared this with our DAO.",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    author: MOCK_COMMENT_AUTHOR_2,
    likesCount: 24,
    repliesCount: 1,
    isLiked: false,
    isPinned: true,
    postId: "post-001",
    replies: [REPLY_TO_COMMENT_2],
  },
  {
    id: "comment-003",
    content:
      "How does the smart contract handle partial refunds if the campaign doesn't reach its goal? I want to make sure my 0.2 ETH is protected.",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    author: MOCK_COMMENT_AUTHOR_3,
    likesCount: 6,
    repliesCount: 0,
    isLiked: false,
    postId: "post-001",
    replies: [],
  },
];

// ============================================================================
// Posts
// ============================================================================

export const MOCK_POST: UnifiedPostData = {
  id: "post-001",
  content:
    "We just hit 75% of our fundraising goal for the Solar Panels for Rural Schools campaign! 3.2 ETH raised from 47 donors so far. Every donation is verified on-chain through FundBrave's smart contracts. Let's push to the finish line -- share this with your network and help us bring clean energy to 12 schools in the Volta Region.",
  author: MOCK_AUTHOR,
  createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  images: [MOCK_SINGLE_IMAGE],
  likesCount: 142,
  commentsCount: 23,
  sharesCount: 38,
  viewsCount: 1847,
  isLiked: false,
  isBookmarked: false,
  isFollowing: true,
  comments: MOCK_COMMENTS,
  type: "campaign_update",
  campaignId: "campaign-001",
  campaign: {
    id: "campaign-001",
    title: "Solar Panels for Rural Schools",
    suggestedAmount: 25,
  },
};

export const MOCK_POST_COMMUNITY: UnifiedPostData = {
  id: "post-002",
  content:
    "Excited to announce that FundBrave now supports staking rewards for campaign donors. Stake your donation and earn yield while supporting causes you believe in. Early backers of the Clean Water Initiative have already earned 4.2% APY on their contributions. DeFi meets philanthropy!",
  author: MOCK_AUTHOR_3,
  createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  timestamp: "12h ago",
  images: MOCK_IMAGES.slice(0, 2),
  likesCount: 89,
  commentsCount: 15,
  sharesCount: 22,
  viewsCount: 956,
  isLiked: true,
  isBookmarked: true,
  isFollowing: false,
  comments: [],
  type: "community",
};

export const MOCK_POST_LIKED: UnifiedPostData = {
  id: "post-003",
  content:
    "Just completed my first donation on FundBrave -- 0.1 ETH to the Emergency Relief Fund. The transaction was instant and I can track exactly where my funds go on the blockchain. No more wondering if donations reach the people who need them.",
  author: MOCK_AUTHOR_2,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  likesCount: 67,
  commentsCount: 8,
  sharesCount: 11,
  viewsCount: 534,
  isLiked: true,
  isBookmarked: false,
  likedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  comments: [],
};

export const MOCK_POST_WITH_IMAGES: UnifiedPostData = {
  id: "post-004",
  content:
    "Milestone update: The Clean Water Initiative campaign has successfully funded 3 water purification stations! Here are photos from the installation in the Lake Volta Region. Thank you to all 120+ donors who made this possible through FundBrave. Total raised: 8.7 ETH.",
  author: MOCK_AUTHOR,
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  images: MOCK_IMAGES,
  likesCount: 231,
  commentsCount: 45,
  sharesCount: 67,
  viewsCount: 3210,
  isLiked: false,
  isBookmarked: true,
  isFollowing: true,
  comments: MOCK_COMMENTS.slice(0, 1),
  type: "campaign_update",
  campaignId: "campaign-002",
  campaign: {
    id: "campaign-002",
    title: "Clean Water Initiative - Lake Volta Region",
    suggestedAmount: 50,
  },
};

export const MOCK_POST_NO_CAMPAIGN: UnifiedPostData = {
  id: "post-005",
  content:
    "Thinking about the future of decentralized fundraising. What if every charity operated with full on-chain transparency? No overhead fees, no middlemen, just direct impact. That is exactly what we are building at FundBrave. Would love to hear your thoughts on what features matter most to you as a donor.",
  author: MOCK_AUTHOR_4,
  createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  likesCount: 34,
  commentsCount: 19,
  sharesCount: 5,
  viewsCount: 412,
  isLiked: false,
  isBookmarked: false,
  comments: [],
  type: "community",
};
