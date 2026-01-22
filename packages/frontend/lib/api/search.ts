/**
 * Search API Client
 * Handles all search-related requests to the backend
 */

import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export type SearchType = 'all' | 'campaigns' | 'users' | 'posts';

export interface SearchCampaign {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  goal: string;
  amountRaised: string;
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
  displayName?: string;
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
}

class SearchApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search across all content types
   */
  async search(query: string, type: SearchType = 'all', limit = 10): Promise<SearchResults> {
    if (!query.trim()) {
      return {
        campaigns: [],
        users: [],
        posts: [],
        total: 0,
      };
    }

    return apiClient.get<SearchResults>(
      `/api/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`
    );
  }

  /**
   * Search only campaigns
   */
  async searchCampaigns(query: string, limit = 10): Promise<SearchCampaign[]> {
    if (!query.trim()) {
      return [];
    }

    const results = await apiClient.get<{ campaigns: SearchCampaign[] }>(
      `/api/search?q=${encodeURIComponent(query)}&type=campaigns&limit=${limit}`
    );

    return results.campaigns || [];
  }

  /**
   * Search only users
   */
  async searchUsers(query: string, limit = 10): Promise<SearchUser[]> {
    if (!query.trim()) {
      return [];
    }

    const results = await apiClient.get<{ users: SearchUser[] }>(
      `/api/search?q=${encodeURIComponent(query)}&type=users&limit=${limit}`
    );

    return results.users || [];
  }

  /**
   * Search only posts
   */
  async searchPosts(query: string, limit = 10): Promise<SearchPost[]> {
    if (!query.trim()) {
      return [];
    }

    const results = await apiClient.get<{ posts: SearchPost[] }>(
      `/api/search?q=${encodeURIComponent(query)}&type=posts&limit=${limit}`
    );

    return results.posts || [];
  }

  /**
   * Get search suggestions (trending or recent searches)
   */
  async getSuggestions(): Promise<{ suggestions: string[] }> {
    return apiClient.get<{ suggestions: string[] }>('/api/search/suggestions');
  }
}

// Export singleton instance
export const searchApi = new SearchApiClient();
