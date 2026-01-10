/**
 * Mock Profile Activity Data
 * Test data for posts, donations, likes, and comments on profile pages
 */

// ============================================
// POSTS
// ============================================
export interface MockPost {
  id: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
}

export const MOCK_POSTS: MockPost[] = [
  {
    id: "post-1",
    content:
      "Just donated to an amazing campaign helping children get access to clean water! Every little bit helps. 💧 #FundBrave #CleanWater",
    imageUrl:
      "https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=600&h=400&fit=crop",
    likesCount: 42,
    commentsCount: 8,
    sharesCount: 12,
    viewsCount: 1250,
    createdAt: "2024-12-25T10:30:00Z",
    author: {
      name: "Anna Doe",
      username: "annadoe",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      isVerified: true,
    },
  },
  {
    id: "post-2",
    content:
      "So proud to be part of this community! Together we've raised over $50,000 for medical research this month. Thank you all for your incredible generosity! 🙏",
    likesCount: 156,
    commentsCount: 23,
    sharesCount: 45,
    viewsCount: 4820,
    createdAt: "2024-12-20T15:45:00Z",
    author: {
      name: "Anna Doe",
      username: "annadoe",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      isVerified: true,
    },
  },
  {
    id: "post-3",
    content:
      "Visited the school we helped build in Kenya last year. The children's smiles made every donation worth it! Here's to making more dreams come true. 🏫✨",
    imageUrl:
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=400&fit=crop",
    likesCount: 234,
    commentsCount: 56,
    sharesCount: 78,
    viewsCount: 12400,
    createdAt: "2024-12-15T09:00:00Z",
    author: {
      name: "Anna Doe",
      username: "annadoe",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      isVerified: true,
    },
  },
];

// ============================================
// DONATIONS
// ============================================
export interface MockDonation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignImage: string;
  amount: number;
  currency: string;
  cryptoType?: string;
  cryptoAmount?: number;
  donatedAt: string;
  isAnonymous: boolean;
  message?: string;
  campaignEndDate: Date;
}

export const MOCK_DONATIONS: MockDonation[] = [
  {
    id: "donation-1",
    campaignId: "1",
    campaignTitle: "Support John's Fight Against Cancer",
    campaignImage:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop",
    amount: 100,
    currency: "USD",
    cryptoType: "ETH",
    cryptoAmount: 0.029,
    donatedAt: "2024-12-24T14:30:00Z",
    isAnonymous: false,
    message: "Stay strong John! Wishing you a speedy recovery.",
    campaignEndDate: new Date("2025-02-15"),
  },
  {
    id: "donation-2",
    campaignId: "2",
    campaignTitle: "Help Build a School in Rural Kenya",
    campaignImage:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop",
    amount: 250,
    currency: "USD",
    cryptoType: "USDC",
    cryptoAmount: 250,
    donatedAt: "2024-12-20T11:15:00Z",
    isAnonymous: false,
    message: "Education changes lives!",
    campaignEndDate: new Date("2025-03-01"),
  },
  {
    id: "donation-3",
    campaignId: "3",
    campaignTitle: "Emergency Relief for Natural Disaster",
    campaignImage:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=300&fit=crop",
    amount: 500,
    currency: "USD",
    cryptoType: "BTC",
    cryptoAmount: 0.0053,
    donatedAt: "2024-12-18T08:45:00Z",
    isAnonymous: true,
    campaignEndDate: new Date("2025-01-31"),
  },
  {
    id: "donation-4",
    campaignId: "4",
    campaignTitle: "Animal Shelter Expansion Project",
    campaignImage:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop",
    amount: 75,
    currency: "USD",
    cryptoType: "ETH",
    cryptoAmount: 0.021,
    donatedAt: "2024-12-15T16:20:00Z",
    isAnonymous: false,
    message: "For all the furry friends! 🐕",
    campaignEndDate: new Date("2025-02-28"),
  },
  {
    id: "donation-5",
    campaignId: "5",
    campaignTitle: "Clean Ocean Initiative",
    campaignImage:
      "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=400&h=300&fit=crop",
    amount: 150,
    currency: "USD",
    cryptoType: "USDT",
    cryptoAmount: 150,
    donatedAt: "2024-12-10T13:00:00Z",
    isAnonymous: false,
    campaignEndDate: new Date("2025-04-15"),
  },
];

// ============================================
// LIKES (Posts/tweets the user has liked)
// ============================================
export interface MockLike {
  id: string;
  content: string;
  imageUrl?: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  likedAt: string;
  createdAt: string;
}

export const MOCK_LIKES: MockLike[] = [
  {
    id: "like-1",
    content:
      "Just reached our $20,000 milestone for Tech Education! 🎉 Thank you to everyone who believed in our mission. Together, we're changing lives through code. #FundBrave #TechForGood",
    imageUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop",
    author: {
      name: "David Patel",
      username: "davidpatel",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      isVerified: true,
    },
    likesCount: 342,
    commentsCount: 56,
    sharesCount: 89,
    viewsCount: 8420,
    likedAt: "2024-12-24T09:00:00Z",
    createdAt: "2024-12-24T08:30:00Z",
  },
  {
    id: "like-2",
    content:
      "Our community garden is blooming! 🌱 Fresh vegetables are now being distributed to 50+ families in need. This is what crowdfunding can achieve when we come together.",
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
    author: {
      name: "Maria Garcia",
      username: "mariacorp",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    },
    likesCount: 128,
    commentsCount: 24,
    sharesCount: 31,
    viewsCount: 2150,
    likedAt: "2024-12-22T14:30:00Z",
    createdAt: "2024-12-22T10:00:00Z",
  },
  {
    id: "like-3",
    content:
      "Mental health matters. 💜 Today we launched free counseling sessions for students. If you're struggling, you're not alone. Reach out. #MentalHealthAwareness",
    author: {
      name: "Sophia Miller",
      username: "sophiamiller",
      avatar:
        "https://images.unsplash.com/photo-1487412992315-51d9b8c61c20?w=200&h=200&fit=crop",
      isVerified: true,
    },
    likesCount: 892,
    commentsCount: 145,
    sharesCount: 267,
    viewsCount: 24500,
    likedAt: "2024-12-20T11:15:00Z",
    createdAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "like-4",
    content:
      "Solar panels installed in 3 more villages this week! ☀️ 200+ homes now have clean energy. The impact is real and it's growing every day. Thank you @FundBrave community!",
    imageUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop",
    author: {
      name: "Alex Chen",
      username: "alexchen",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    },
    likesCount: 456,
    commentsCount: 67,
    sharesCount: 123,
    viewsCount: 9870,
    likedAt: "2024-12-18T16:45:00Z",
    createdAt: "2024-12-18T14:00:00Z",
  },
  {
    id: "like-5",
    content:
      "Every child deserves access to clean water. Today, we completed our 10th well in rural Kenya. 🚰 This wouldn't be possible without your support. #CleanWater #FundBrave",
    author: {
      name: "John Smith",
      username: "johnsmith",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      isVerified: true,
    },
    likesCount: 1205,
    commentsCount: 189,
    sharesCount: 412,
    viewsCount: 45200,
    likedAt: "2024-12-15T08:20:00Z",
    createdAt: "2024-12-15T07:00:00Z",
  },
];

// ============================================
// COMMENTS
// ============================================
export interface MockComment {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignImage: string;
  content: string;
  likesCount: number;
  repliesCount: number;
  commentedAt: string;
}

export const MOCK_COMMENTS: MockComment[] = [
  {
    id: "comment-1",
    campaignId: "1",
    campaignTitle: "Support John's Fight Against Cancer",
    campaignImage:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop",
    content:
      "This is such an important cause. John's story really touched my heart. Sending all my prayers and support! 🙏💪",
    likesCount: 24,
    repliesCount: 3,
    commentedAt: "2024-12-24T10:30:00Z",
  },
  {
    id: "comment-2",
    campaignId: "2",
    campaignTitle: "Help Build a School in Rural Kenya",
    campaignImage:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop",
    content:
      "Education is the key to breaking the cycle of poverty. So happy to contribute to this wonderful initiative!",
    likesCount: 18,
    repliesCount: 5,
    commentedAt: "2024-12-22T15:45:00Z",
  },
  {
    id: "comment-3",
    campaignId: "6",
    campaignTitle: "Tech Education for Underprivileged Youth",
    campaignImage:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop",
    content:
      "As someone who works in tech, I know how life-changing these skills can be. Great job reaching the halfway mark!",
    likesCount: 31,
    repliesCount: 7,
    commentedAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "comment-4",
    campaignId: "7",
    campaignTitle: "Community Garden Project",
    campaignImage:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    content:
      "Love this! Community gardens bring people together and provide fresh produce for those in need. Win-win! 🌱🥕",
    likesCount: 12,
    repliesCount: 2,
    commentedAt: "2024-12-18T14:20:00Z",
  },
  {
    id: "comment-5",
    campaignId: "8",
    campaignTitle: "Mental Health Awareness Campaign",
    campaignImage:
      "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop",
    content:
      "Mental health matters! Thank you for bringing awareness to this important topic. We need more campaigns like this.",
    likesCount: 45,
    repliesCount: 12,
    commentedAt: "2024-12-15T11:30:00Z",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format a date string to a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)}w ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format currency with proper symbol and formatting
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format large numbers with K/M suffix (e.g., 1.2K, 45.2K)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}
