/**
 * API Client
 * Client for interacting with the FundBrave backend API
 */

import { BACKEND_API_URL } from '@/app/lib/contracts/config';
import type { Campaign, Donation, Stake, ApiResponse, PaginatedResponse, CampaignFilters, CampaignBlockchainStatus } from '@/app/types/campaign';
import type { Address } from 'viem';

/**
 * Backend API response structure
 */
interface BackendCampaign {
  id: string;
  name: string;
  description?: string;
  raisedAmount: string;
  goalAmount: string;
  images?: string[];
  categories?: string[];
  beneficiary: string;
  contractAddress?: string;
  stats: {
    donorsCount: number;
  };
  deadline: string;
  isActive: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Transform backend campaign response to frontend Campaign type
   */
  private transformCampaign(backendCampaign: BackendCampaign): Campaign {
    // Map backend status to frontend status
    const getStatus = (isActive: boolean, deadline: string): CampaignBlockchainStatus => {
      if (!isActive) return 'completed';
      const deadlineDate = new Date(deadline);
      const now = new Date();
      if (deadlineDate < now) return 'expired';
      return 'active';
    };

    return {
      id: backendCampaign.id,
      contractAddress: (backendCampaign.contractAddress || backendCampaign.id) as Address,
      title: backendCampaign.name,
      description: backendCampaign.description || '',
      imageUrl: backendCampaign.images?.[0],
      category: this.normalizeCategory(backendCampaign.categories?.[0] || 'community'),
      goal: backendCampaign.goalAmount,
      amountRaised: backendCampaign.raisedAmount,
      deadline: backendCampaign.deadline,
      creator: backendCampaign.beneficiary as Address,
      donorsCount: backendCampaign.stats?.donorsCount || 0,
      isActive: backendCampaign.isActive,
      isVerified: backendCampaign.isVerified || false,
      status: getStatus(backendCampaign.isActive, backendCampaign.deadline),
      createdAt: backendCampaign.createdAt || new Date().toISOString(),
      updatedAt: backendCampaign.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Normalize backend category to frontend category type
   */
  private normalizeCategory(category: string): Campaign['category'] {
    const categoryMap: Record<string, Campaign['category']> = {
      'Healthcare': 'health-medical',
      'Education': 'education',
      'Environment': 'environment',
      'Emergency': 'emergency',
      'Animal': 'animal',
      'Community': 'community',
      'health-medical': 'health-medical',
      'education': 'education',
      'environment': 'environment',
      'emergency': 'emergency',
      'animal': 'animal',
      'community': 'community',
    };

    return categoryMap[category] || 'community';
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  // Campaign endpoints
  async getCampaigns(filters?: CampaignFilters): Promise<ApiResponse<Campaign[]>> {
    const queryParams = new URLSearchParams();

    if (filters?.category) queryParams.set('category', filters.category);
    if (filters?.status) queryParams.set('status', filters.status);
    if (filters?.sortBy) queryParams.set('sortBy', filters.sortBy);
    if (filters?.search) queryParams.set('search', filters.search);

    const query = queryParams.toString();
    const response = await this.request<PaginatedResponse<BackendCampaign>>(`/fundraisers${query ? `?${query}` : ''}`);

    // Extract items array from paginated response and transform
    if (response.success && response.data) {
      const transformedCampaigns = response.data.items.map(campaign =>
        this.transformCampaign(campaign)
      );

      return {
        success: true,
        data: transformedCampaigns,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch campaigns',
    };
  }

  async getCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.request<BackendCampaign>(`/fundraisers/${id}`);

    if (response.success && response.data) {
      return {
        success: true,
        data: this.transformCampaign(response.data),
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch campaign',
    };
  }

  async createCampaign(data: {
    contractAddress: string;
    title: string;
    description: string;
    goal: string;
    deadline: string;
    category: string;
    creator: string;
    transactionHash: string;
  }): Promise<ApiResponse<Campaign>> {
    return this.request<Campaign>('/blockchain/fundraisers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDonations(campaignId: string): Promise<ApiResponse<Donation[]>> {
    return this.request<Donation[]>(`/fundraisers/${campaignId}/donations`);
  }

  async createDonation(data: {
    campaignId: string;
    donor: string;
    amount: string;
    token: string;
    transactionHash: string;
  }): Promise<ApiResponse<Donation>> {
    return this.request<Donation>('/blockchain/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStakes(campaignId: string): Promise<ApiResponse<Stake[]>> {
    return this.request<Stake[]>(`/fundraisers/${campaignId}/stakes`);
  }

  async createStake(data: {
    campaignId: string;
    staker: string;
    amount: string;
    transactionHash: string;
  }): Promise<ApiResponse<Stake>> {
    return this.request<Stake>('/blockchain/stakes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCampaignUpdates(campaignId: string) {
    return this.request(`/fundraisers/${campaignId}/updates`);
  }
}

export const apiClient = new ApiClient();
