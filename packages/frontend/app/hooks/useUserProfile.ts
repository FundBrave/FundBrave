/**
 * useUserProfile Hook
 * Hook for fetching user profile data via GraphQL
 */

import { useGetUserByUsernameQuery, useGetUserActivityQuery, useGetUserDonationStatsQuery, useGetUserStakingStatsQuery } from '@/app/generated/graphql';

export function useUserProfile(username: string) {
  // Fetch user profile
  const { data, loading, error, refetch } = useGetUserByUsernameQuery({
    variables: { username },
    skip: !username,
    fetchPolicy: 'cache-and-network',
  });

  const user = data?.userByUsername || null;

  return {
    user,
    isLoading: loading,
    error: error?.message || null,
    refetch,
  };
}

export function useUserActivity(userId: string) {
  const { data, loading, error } = useGetUserActivityQuery({
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    activity: data?.userActivity || null,
    isLoading: loading,
    error: error?.message || null,
  };
}

export function useUserDonationStats(userId: string) {
  const { data, loading, error } = useGetUserDonationStatsQuery({
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    donationStats: data?.userDonationStats || null,
    isLoading: loading,
    error: error?.message || null,
  };
}

export function useUserStakingStats(userId: string) {
  const { data, loading, error } = useGetUserStakingStatsQuery({
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    stakingStats: data?.userStakingStats || null,
    isLoading: loading,
    error: error?.message || null,
  };
}
