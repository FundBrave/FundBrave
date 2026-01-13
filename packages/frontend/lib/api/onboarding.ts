/**
 * Onboarding API Client
 * Handles all onboarding-related requests to the backend
 */

import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UsernameAvailabilityResponse {
  available: boolean;
}

interface ProfileDto {
  username: string;
  displayName: string;
  birthdate?: string;
  bio?: string;
  avatarUrl?: string;
}

interface CompleteOnboardingDto {
  profile: ProfileDto;
  goals: string[];
  interests?: string[];
}

interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    email: string;
  };
}

interface OnboardingStatusResponse {
  isComplete: boolean;
  completedAt?: string;
  profile?: {
    username: string;
    displayName: string;
    avatarUrl: string;
  };
}

class OnboardingApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if a username is available
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const data = await apiClient.get<UsernameAvailabilityResponse>(
        `/api/users/username/${encodeURIComponent(username)}/available`
      );
      return data.available;
    } catch (error) {
      console.error('Username availability check error:', error);
      throw error;
    }
  }

  /**
   * Complete user onboarding with profile, goals, and interests
   */
  async completeOnboarding(data: CompleteOnboardingDto): Promise<CompleteOnboardingResponse> {
    try {
      const response = await apiClient.post<CompleteOnboardingResponse>(
        `/api/users/onboarding/complete`,
        data
      );
      return response;
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw error;
    }
  }

  /**
   * Get current user's onboarding status
   */
  async getOnboardingStatus(): Promise<OnboardingStatusResponse> {
    try {
      const data = await apiClient.get<OnboardingStatusResponse>(
        `/api/users/onboarding/status`
      );
      return data;
    } catch (error) {
      console.error('Get onboarding status error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const onboardingApi = new OnboardingApiClient();

// Export types
export type {
  UsernameAvailabilityResponse,
  ProfileDto,
  CompleteOnboardingDto,
  CompleteOnboardingResponse,
  OnboardingStatusResponse,
};
