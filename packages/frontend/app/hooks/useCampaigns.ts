/**
 * useCampaigns Hook
 * Hook for fetching campaigns from the backend via GraphQL
 */

import { useGetFundraisersQuery, useGetFundraiserQuery } from '@/app/generated/graphql';
import type { CampaignFilters } from '@/app/types/campaign';

export function useCampaigns(filters?: CampaignFilters) {
  // Build GraphQL filter input
  const filterInput = filters ? {
    categories: filters.category ? [filters.category] : undefined,
  } : undefined;

  // Build sort input
  const sortInput = filters?.sortBy ? {
    sortBy: filters.sortBy === 'most-funded' || filters.sortBy === 'least-funded'
      ? ('RAISED_AMOUNT' as const)
      : ('CREATED_AT' as const),
    order: filters.sortBy === 'newest' || filters.sortBy === 'most-funded'
      ? ('DESC' as const)
      : ('ASC' as const),
  } : undefined;

  const { data, loading, error, refetch } = useGetFundraisersQuery({
    variables: {
      limit: 50,
      offset: 0,
      filter: filterInput,
      sort: sortInput,
    },
    fetchPolicy: 'cache-and-network',
  });

  // Transform GraphQL data to Campaign type
  const campaigns = data?.fundraisers?.items?.map(fundraiser => ({
    id: fundraiser.id,
    title: fundraiser.name,
    description: fundraiser.description,
    goal: fundraiser.goalAmount,
    amountRaised: fundraiser.raisedAmount,
    currency: fundraiser.currency,
    deadline: fundraiser.deadline,
    imageUrl: fundraiser.images?.[0] || '',
    images: fundraiser.images,
    category: fundraiser.categories?.[0] as any,
    categories: fundraiser.categories as any[],
    creatorId: fundraiser.creator.id,
    creatorName: fundraiser.creator.displayName || fundraiser.creator.username || '',
    creatorAddress: fundraiser.creator.walletAddress,
    donorsCount: fundraiser.stats.donorsCount,
    isVerified: fundraiser.creator.isVerifiedCreator,
    createdAt: fundraiser.createdAt,
    onChainId: fundraiser.onChainId,
  })) || [];

  return {
    campaigns,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

export function useCampaign(id: string) {
  const { data, loading, error, refetch } = useGetFundraiserQuery({
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  // Transform GraphQL data to Campaign type
  const campaign = data?.fundraiser ? {
    id: data.fundraiser.id,
    title: data.fundraiser.name,
    description: data.fundraiser.description,
    goal: data.fundraiser.goalAmount,
    amountRaised: data.fundraiser.raisedAmount,
    currency: data.fundraiser.currency,
    deadline: data.fundraiser.deadline,
    imageUrl: data.fundraiser.images?.[0] || '',
    images: data.fundraiser.images,
    category: data.fundraiser.categories?.[0] as any,
    categories: data.fundraiser.categories as any[],
    creatorId: data.fundraiser.creator.id,
    creatorName: data.fundraiser.creator.displayName || data.fundraiser.creator.username || '',
    creatorAddress: data.fundraiser.creator.walletAddress,
    donorsCount: data.fundraiser.stats.donorsCount,
    isVerified: data.fundraiser.creator.isVerifiedCreator,
    createdAt: data.fundraiser.createdAt,
    onChainId: data.fundraiser.onChainId,
    stakingPoolAddr: data.fundraiser.stakingPoolAddr,
    // Add creator object with proper structure
    creator: {
      avatarUrl: data.fundraiser.creator.avatarUrl || '/placeholder-avatar.png',
      name: data.fundraiser.creator.displayName || data.fundraiser.creator.username || 'Anonymous',
      handle: data.fundraiser.creator.username ? `@${data.fundraiser.creator.username}` : '@anonymous',
    },
    milestones: data.fundraiser.milestones?.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description || '',
      targetAmount: m.targetAmount,
      isReached: m.isReached,
      reachedAt: m.reachedAt,
    })),
    updates: data.fundraiser.updates?.map(u => ({
      id: u.id,
      title: u.title,
      content: u.content,
      mediaUrls: u.mediaUrls,
      createdAt: u.createdAt,
    })),
  } : null;

  return {
    campaign,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}
