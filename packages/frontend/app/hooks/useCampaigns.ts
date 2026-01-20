/**
 * useCampaigns Hook
 * Hook for fetching campaigns from the backend API
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/app/lib/api/client';
import type { Campaign, CampaignFilters } from '@/app/types/campaign';

export function useCampaigns(filters?: CampaignFilters) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getCampaigns(filters);

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch campaigns');
        }

        setCampaigns(response.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [filters?.category, filters?.status, filters?.sortBy, filters?.search]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getCampaigns(filters);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch campaigns');
      }

      setCampaigns(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    campaigns,
    isLoading,
    error,
    refetch,
  };
}

export function useCampaign(id: string) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getCampaign(id);

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch campaign');
        }

        setCampaign(response.data || null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaign';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const refetch = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getCampaign(id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch campaign');
      }

      setCampaign(response.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaign';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    campaign,
    isLoading,
    error,
    refetch,
  };
}
