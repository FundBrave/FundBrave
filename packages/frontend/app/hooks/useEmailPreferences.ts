/**
 * useEmailPreferences Hook
 *
 * Custom hook for managing user email notification preferences.
 * Provides fetching, updating, and state management for email settings.
 */

import { useState, useEffect } from 'react';
import type {
  EmailPreferences,
  GetEmailPreferencesResponse,
  UpdateEmailPreferencesRequest,
  UpdateEmailPreferencesResponse,
  DEFAULT_EMAIL_PREFERENCES,
} from '@/app/types/email-notifications';

/**
 * Mock API functions - Replace with actual GraphQL/REST API calls
 */

/**
 * Fetch user's email preferences
 * In real implementation: GraphQL query or REST GET /api/notifications/preferences
 */
async function fetchEmailPreferences(): Promise<GetEmailPreferencesResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock response - replace with actual API call
  return {
    preferences: {
      donationAlerts: true,
      campaignFunded: true,
      campaignUpdates: true,
      newFollowers: false,
      comments: false,
      replies: false,
      mentions: false,
      weeklyDigest: true,
      marketing: false,
    },
    email: 'user@example.com',
  };
}

/**
 * Update user's email preferences
 * In real implementation: GraphQL mutation or REST PUT /api/notifications/preferences
 */
async function updateEmailPreferences(
  request: UpdateEmailPreferencesRequest
): Promise<UpdateEmailPreferencesResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mock response - replace with actual API call
  return {
    preferences: {
      donationAlerts: true,
      campaignFunded: true,
      campaignUpdates: true,
      newFollowers: false,
      comments: false,
      replies: false,
      mentions: false,
      weeklyDigest: true,
      marketing: false,
      ...request.preferences,
    },
    success: true,
  };
}

/**
 * Hook return type
 */
interface UseEmailPreferencesReturn {
  preferences: EmailPreferences | null;
  email: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updatePreference: (key: keyof EmailPreferences, value: boolean) => Promise<void>;
  updateMultiplePreferences: (updates: Partial<EmailPreferences>) => Promise<void>;
  unsubscribeFromAll: () => Promise<void>;
  reloadPreferences: () => Promise<void>;
}

/**
 * useEmailPreferences Hook
 *
 * @returns Email preferences state and mutation functions
 *
 * @example
 * const { preferences, updatePreference, isLoading } = useEmailPreferences();
 *
 * // Toggle a single preference
 * await updatePreference('donationAlerts', false);
 *
 * // Update multiple preferences
 * await updateMultiplePreferences({
 *   comments: true,
 *   replies: true,
 * });
 */
export function useEmailPreferences(): UseEmailPreferencesReturn {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load preferences on mount
   */
  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * Fetch preferences from API
   */
  async function loadPreferences() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchEmailPreferences();
      setPreferences(response.preferences);
      setEmail(response.email);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load email preferences. Please refresh the page.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Update a single preference
   */
  async function updatePreference(
    key: keyof EmailPreferences,
    value: boolean
  ): Promise<void> {
    if (!preferences) return;

    // Optimistic update
    const previousPreferences = preferences;
    setPreferences({ ...preferences, [key]: value });

    try {
      setIsSaving(true);
      setError(null);
      const response = await updateEmailPreferences({
        preferences: { [key]: value },
      });
      setPreferences(response.preferences);
    } catch (err) {
      // Revert on error
      setPreferences(previousPreferences);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update preferences. Please try again.'
      );
      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Update multiple preferences at once
   */
  async function updateMultiplePreferences(
    updates: Partial<EmailPreferences>
  ): Promise<void> {
    if (!preferences) return;

    // Optimistic update
    const previousPreferences = preferences;
    setPreferences({ ...preferences, ...updates });

    try {
      setIsSaving(true);
      setError(null);
      const response = await updateEmailPreferences({
        preferences: updates,
      });
      setPreferences(response.preferences);
    } catch (err) {
      // Revert on error
      setPreferences(previousPreferences);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update preferences. Please try again.'
      );
      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Unsubscribe from all non-essential emails
   */
  async function unsubscribeFromAll(): Promise<void> {
    if (!preferences) return;

    const allOffPreferences: Partial<EmailPreferences> = {
      donationAlerts: false,
      campaignFunded: false,
      campaignUpdates: false,
      newFollowers: false,
      comments: false,
      replies: false,
      mentions: false,
      weeklyDigest: false,
      marketing: false,
    };

    await updateMultiplePreferences(allOffPreferences);
  }

  /**
   * Reload preferences from server
   */
  async function reloadPreferences(): Promise<void> {
    await loadPreferences();
  }

  return {
    preferences,
    email,
    isLoading,
    isSaving,
    error,
    updatePreference,
    updateMultiplePreferences,
    unsubscribeFromAll,
    reloadPreferences,
  };
}
