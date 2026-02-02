/**
 * Search API Client
 * Handles all search-related requests to the backend
 */

import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export type SearchType = 'all' | 'campaigns' | 'users' | 'posts';

/**
 * Backend response types (matches backend DTOs exactly)
 */
interface BackendSearchCampaign {
  id: string;
  name: string;
  description?: string;
  images: string[];
  goalAmount: string;
  raisedAmount: string;
  category: string;
  creator: {
    id: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface BackendSearchUser {
  id: string;
  walletAddress: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  isVerifiedCreator: boolean;
  followersCount: number;
}

interface BackendSearchPost {
  id: string;
  content: string;
  author: {
    id: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

interface BackendSearchResults {
  campaigns: BackendSearchCampaign[];
  users: BackendSearchUser[];
  posts: BackendSearchPost[];
  totalCampaigns: number;
  totalUsers: number;
  totalPosts: number;
}

/**
 * Frontend types (optimized for UI components)
 */
export interface SearchCampaign {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  goal: string;
  amountRaised: string;
  targetAmount: number;
  status?: string[];
  category?: string;
  creator: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface SearchUser {
  id: string;
  username: string;
  name: string;
  displayName?: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  isVerified?: boolean;
  followersCount?: number;
}

export interface SearchPost {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
}

export interface SearchResults {
  campaigns: SearchCampaign[];
  users: SearchUser[];
  posts: SearchPost[];
  total: number;
  totalCampaigns?: number;
  totalUsers?: number;
  totalPosts?: number;
}

/**
 * Data adapter to transform backend responses to frontend format
 */
class SearchDataAdapter {
  static transformCampaign(backendCampaign: BackendSearchCampaign): SearchCampaign {
    const goalAmount = parseFloat(backendCampaign.goalAmount);
    const raisedAmount = parseFloat(backendCampaign.raisedAmount);

    return {
      id: backendCampaign.id,
      title: backendCampaign.name,
      description: backendCampaign.description,
      imageUrl: backendCampaign.images[0] || '/images/placeholder-campaign.jpg',
      goal: backendCampaign.goalAmount,
      amountRaised: backendCampaign.raisedAmount,
      targetAmount: goalAmount,
      status: [],
      category: backendCampaign.category,
      creator: {
        id: backendCampaign.creator.id,
        username: backendCampaign.creator.username || 'anonymous',
        displayName: backendCampaign.creator.displayName,
        avatarUrl: backendCampaign.creator.avatarUrl,
      },
    };
  }

  static transformUser(backendUser: BackendSearchUser): SearchUser {
    const displayName = backendUser.displayName || backendUser.username || 'Anonymous';
    const username = backendUser.username || backendUser.walletAddress.substring(0, 10);

    return {
      id: backendUser.id,
      username: username.startsWith('@') ? username : `@${username}`,
      name: displayName,
      displayName: backendUser.displayName,
      avatar: backendUser.avatarUrl || '/images/placeholder-avatar.jpg',
      avatarUrl: backendUser.avatarUrl,
      isVerified: backendUser.isVerifiedCreator,
      followersCount: backendUser.followersCount,
    };
  }

  static transformPost(backendPost: BackendSearchPost): SearchPost {
    return {
      id: backendPost.id,
      content: backendPost.content,
      author: {
        id: backendPost.author.id,
        username: backendPost.author.username || 'anonymous',
        displayName: backendPost.author.displayName,
        avatarUrl: backendPost.author.avatarUrl,
      },
      createdAt: new Date(backendPost.createdAt).toISOString(),
      likesCount: backendPost.likesCount,
      commentsCount: backendPost.commentsCount,
    };
  }

  static transformSearchResults(backendResults: BackendSearchResults): SearchResults {
    const campaigns = backendResults.campaigns.map(this.transformCampaign);
    const users = backendResults.users.map(this.transformUser);
    const posts = backendResults.posts.map(this.transformPost);

    return {
      campaigns,
      users,
      posts,
      total: backendResults.totalCampaigns + backendResults.totalUsers + backendResults.totalPosts,
      totalCampaigns: backendResults.totalCampaigns,
      totalUsers: backendResults.totalUsers,
      totalPosts: backendResults.totalPosts,
    };
  }
}

class SearchApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search across all content types
   */
  async search(query: string, type: SearchType = 'all', limit = 10, offset = 0): Promise<SearchResults> {
    if (!query.trim()) {
      return {
        campaigns: [],
        users: [],
        posts: [],
        total: 0,
        totalCampaigns: 0,
        totalUsers: 0,
        totalPosts: 0,
      };
    }

    try {
      const backendResults = await apiClient.get<BackendSearchResults>(
        `/api/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&offset=${offset}`
      );

      return SearchDataAdapter.transformSearchResults(backendResults);
    } catch (error) {
      console.error('Search API error:', error);
      throw new Error('Failed to search. Please try again later.');
    }
  }

  /**
   * Search only campaigns
   */
  async searchCampaigns(query: string, limit = 10, offset = 0): Promise<SearchCampaign[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const backendResults = await apiClient.get<BackendSearchResults>(
        `/api/search?q=${encodeURIComponent(query)}&type=campaigns&limit=${limit}&offset=${offset}`
      );

      return backendResults.campaigns.map(SearchDataAdapter.transformCampaign);
    } catch (error) {
      console.error('Campaign search error:', error);
      throw new Error('Failed to search campaigns. Please try again later.');
    }
  }

  /**
   * Search only users
   */
  async searchUsers(query: string, limit = 10, offset = 0): Promise<SearchUser[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const backendResults = await apiClient.get<BackendSearchResults>(
        `/api/search?q=${encodeURIComponent(query)}&type=users&limit=${limit}&offset=${offset}`
      );

      return backendResults.users.map(SearchDataAdapter.transformUser);
    } catch (error) {
      console.error('User search error:', error);
      throw new Error('Failed to search users. Please try again later.');
    }
  }

  /**
   * Search only posts
   */
  async searchPosts(query: string, limit = 10, offset = 0): Promise<SearchPost[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const backendResults = await apiClient.get<BackendSearchResults>(
        `/api/search?q=${encodeURIComponent(query)}&type=posts&limit=${limit}&offset=${offset}`
      );

      return backendResults.posts.map(SearchDataAdapter.transformPost);
    } catch (error) {
      console.error('Post search error:', error);
      throw new Error('Failed to search posts. Please try again later.');
    }
  }

  /**
   * Get search suggestions (trending or recent searches)
   */
  async getSuggestions(): Promise<{ suggestions: string[] }> {
    try {
      return await apiClient.get<{ suggestions: string[] }>('/api/search/suggestions');
    } catch (error) {
      console.error('Suggestions error:', error);
      return { suggestions: [] };
    }
  }
}

// Export singleton instance
export const searchApi = new SearchApiClient();
