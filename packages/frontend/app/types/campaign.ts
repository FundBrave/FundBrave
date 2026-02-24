/**
 * Campaign Types
 * Type definitions for campaigns, donations, and stakes
 */

import type { Address } from 'viem';

export interface Campaign {
  id: string;
  contractAddress: Address;
  title: string;
  description: string;
  imageUrl?: string;
  category: CampaignCategory;
  goal: string; // BigInt as string
  amountRaised: string; // BigInt as string
  deadline: string; // ISO date string
  creator: Address;
  creatorName?: string;
  donorsCount: number;
  isActive: boolean;
  isVerified: boolean;
  status: CampaignBlockchainStatus;
  createdAt: string;
  updatedAt: string;
  // Optional computed fields
  progress?: number;
  daysLeft?: number;
}

export interface CampaignCreateInput {
  title: string;
  description: string;
  goal: bigint;
  duration: number; // in days
  category: string;
  imageUrl?: string;
  images: string[];
  categories: string[];
  region: string;
  beneficiary: Address;
}

export interface Donation {
  id: string;
  campaignId: string;
  donor: Address;
  amount: string; // BigInt as string
  token: Address;
  timestamp: string;
  transactionHash: string;
}

export interface Stake {
  id: string;
  campaignId: string;
  staker: Address;
  amount: string; // BigInt as string
  timestamp: string;
  transactionHash: string;
  isActive: boolean;
}

export type CampaignCategory =
  | 'health-medical'
  | 'education'
  | 'environment'
  | 'emergency'
  | 'animal'
  | 'community';

export type CampaignBlockchainStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface CampaignFilters {
  category?: CampaignCategory;
  status?: CampaignBlockchainStatus;
  sortBy?: 'oldest' | 'newest' | 'most-funded' | 'least-funded';
  search?: string;
}

export interface CampaignStats {
  totalCampaigns: number;
  totalRaised: string;
  totalDonors: number;
  activeCampaigns: number;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore: boolean;
}
