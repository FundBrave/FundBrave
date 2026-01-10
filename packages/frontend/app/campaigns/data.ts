export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies: number;
}

export interface Update {
  id: string;
  author: Creator;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
}

export interface CampaignDetail {
  id: string;
  title: string;
  imageUrl: string;
  categories: string[];
  creator: Creator;
  story: string;
  targetAmount: number;
  amountRaised: number;
  supportersCount: number;
  daysLeft: number;
  endDate: Date;
  updates: Update[];
  comments: Comment[];
}

export const MOCK_CAMPAIGN_DETAIL: CampaignDetail = {
  id: "1",
  title: "Support John's Fight Against Cancer",
  imageUrl: "https://picsum.photos/seed/campaign1-detail/800/600",
  categories: ["Health and Medical", "Family", "Emergency"],
  creator: {
    id: "c1",
    name: "Johnson Peter",
    handle: "@johndoe",
    avatarUrl: "https://picsum.photos/seed/creator1/100/100",
  },
  story:
    "Rorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos... Rorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos",
  targetAmount: 500000,
  amountRaised: 350000,
  supportersCount: 1600,
  daysLeft: 14,
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  updates: [
    {
      id: "u1",
      author: {
        id: "c1",
        name: "Johnson Peter",
        handle: "@johndoe",
        avatarUrl: "https://picsum.photos/seed/creator1/100/100",
      },
      title: "Surviving cancer",
      content:
        "Rorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos...",
      createdAt: "20 minutes ago",
      likes: 3,
      comments: 2,
    },
  ],
  comments: [
    {
      id: "cm1",
      author: {
        name: "Dave Lucid",
        avatarUrl: "https://picsum.photos/seed/user1/100/100",
      },
      content:
        "Exploring these resources feels like embarking on a design adventure filled with endless possibilities and creativity.",
      createdAt: "2 days ago",
      likes: 32,
      replies: 1,
    },
    {
      id: "cm2",
      author: {
        name: "Jake Mike",
        avatarUrl: "https://picsum.photos/seed/user2/100/100",
      },
      content:
        "Exploring these resources feels like embarking on a design adventure filled with endless possibilities and creativity.",
      createdAt: "2 days ago",
      likes: 32,
      replies: 1,
    },
  ],
};

export function getCampaignById(id: string): CampaignDetail | undefined {
  // In a real app, this would fetch from an API
  // For now, we return the mock data
  return MOCK_CAMPAIGN_DETAIL;
}
