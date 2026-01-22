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
import { settingsApi } from '@/lib/api/settings';
import { useAuth } from '@/app/provider/AuthProvider';

/**
 * Fetch user's email preferences from backend
 */
async function fetchEmailPreferences(): Promise<GetEmailPreferencesResponse> {
  try {
    const settings = await settingsApi.getAllSettings();
    return {
      preferences: settings.notifications,
      email: 'user@example.com', // TODO: Get from auth context
    };
  } catch (error) {
    console.error('Failed to fetch email preferences:', error);
    throw error;
  }
}

/**
 * Update user's email preferences on backend
 */
async function updateEmailPreferences(
  request: UpdateEmailPreferencesRequest
): Promise<UpdateEmailPreferencesResponse> {
  try {
    const updated = await settingsApi.updateNotifications(request.preferences);
    return {
      preferences: updated,
      success: true,
    };
  } catch (error) {
    console.error('Failed to update email preferences:', error);
    throw error;
  }
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
