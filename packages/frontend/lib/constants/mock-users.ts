/**
 * Mock Users Data
 * Test/demo user profiles for development and testing
 */

export interface MockUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage: string;
  country: string;
  countryFlag: string;
  points: number;
  bio: string;
  followers: number;
  following: number;
  memberSince: string;
  socialLinks: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export const MOCK_USERS: Record<string, MockUser> = {
  annadoe: {
    id: "1",
    name: "Anna Doe",
    username: "annadoe",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop",
    country: "Australia",
    countryFlag: "🇦🇺",
    points: 201,
    bio: "Passionate about making a difference in the world. Always looking for new causes to support and communities to help.",
    followers: 700,
    following: 77,
    memberSince: "9/5/2023",
    socialLinks: {
      linkedin: "https://linkedin.com/in/annadoe",
      instagram: "https://instagram.com/annadoe",
      twitter: "https://twitter.com/annadoe",
      facebook: "https://facebook.com/annadoe",
    },
  },
  johnsmith: {
    id: "2",
    name: "John Smith",
    username: "johnsmith",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop",
    country: "United States",
    countryFlag: "🇺🇸",
    points: 487,
    bio: "Tech enthusiast and philanthropist. Focused on education initiatives and environmental causes. Let's build a better future together!",
    followers: 1234,
    following: 256,
    memberSince: "3/12/2022",
    socialLinks: {
      linkedin: "https://linkedin.com/in/johnsmith",
      twitter: "https://twitter.com/johnsmith",
      facebook: "https://facebook.com/johnsmith",
    },
  },
  mariacorp: {
    id: "3",
    name: "Maria Garcia",
    username: "mariacorp",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=400&fit=crop",
    country: "Spain",
    countryFlag: "🇪🇸",
    points: 156,
    bio: "Healthcare professional dedicated to medical research funding. Believing in the power of community support for life-changing treatments.",
    followers: 542,
    following: 143,
    memberSince: "7/15/2023",
    socialLinks: {
      linkedin: "https://linkedin.com/in/mariagarcia",
      instagram: "https://instagram.com/mariacorp",
    },
  },
  alexchen: {
    id: "4",
    name: "Alex Chen",
    username: "alexchen",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=400&fit=crop",
    country: "Singapore",
    countryFlag: "🇸🇬",
    points: 892,
    bio: "Social entrepreneur focused on sustainable development and poverty alleviation. Join me in supporting meaningful projects across Asia.",
    followers: 2156,
    following: 534,
    memberSince: "1/8/2021",
    socialLinks: {
      linkedin: "https://linkedin.com/in/alexchen",
      twitter: "https://twitter.com/alexchen",
      instagram: "https://instagram.com/alexchen",
      facebook: "https://facebook.com/alexchen",
    },
  },
  sophiaMiller: {
    id: "5",
    name: "Sophia Miller",
    username: "sophiamiller",
    avatar:
      "https://images.unsplash.com/photo-1487412992315-51d9b8c61c20?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1559028615-cd4628902d4a?w=1200&h=400&fit=crop",
    country: "Canada",
    countryFlag: "🇨🇦",
    points: 334,
    bio: "Wildlife conservation advocate and animal welfare supporter. Every donation brings us closer to protecting endangered species for future generations.",
    followers: 891,
    following: 267,
    memberSince: "5/22/2022",
    socialLinks: {
      instagram: "https://instagram.com/sophiamiller",
      twitter: "https://twitter.com/sophiamiller",
      facebook: "https://facebook.com/sophiamiller",
    },
  },
  davidpatel: {
    id: "6",
    name: "David Patel",
    username: "davidpatel",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop",
    country: "India",
    countryFlag: "🇮🇳",
    points: 743,
    bio: "Education reformer and scholarship provider. Committed to making quality education accessible to underprivileged children worldwide.",
    followers: 1567,
    following: 389,
    memberSince: "11/30/2021",
    socialLinks: {
      linkedin: "https://linkedin.com/in/davidpatel",
      twitter: "https://twitter.com/davidpatel",
    },
  },
};

/**
 * Get a mock user by username
 * Returns undefined if user not found
 */
export function getMockUserByUsername(username: string): MockUser | undefined {
  return MOCK_USERS[username.toLowerCase()];
}

/**
 * Get all mock users
 */
export function getAllMockUsers(): MockUser[] {
  return Object.values(MOCK_USERS);
}
