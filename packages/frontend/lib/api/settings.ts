/**
 * Settings API Client
 * Handles all settings-related requests to the backend
 */

import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export interface ProfileSettings {
  displayName: string;
  username: string;
  bio?: string;
  website?: string;
  location?: string;
  isPrivate: boolean;
}

export interface PrivacySettings {
  showEmail: boolean;
  showDonations: boolean;
  showCampaigns: boolean;
  allowMessages: boolean;
}

export interface NotificationSettings {
  donationAlerts: boolean;
  campaignFunded: boolean;
  campaignUpdates: boolean;
  newFollowers: boolean;
  comments: boolean;
  replies: boolean;
  mentions: boolean;
  weeklyDigest: boolean;
  marketing: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'totp' | 'sms';
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface Session {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceName: string;
  browser: string;
  os: string;
  location: {
    city: string;
    country: string;
    countryCode: string;
  };
  ipAddress: string;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface AllSettingsResponse {
  profile: ProfileSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

class SettingsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all settings at once
   */
  async getAllSettings(): Promise<AllSettingsResponse> {
    return apiClient.get<AllSettingsResponse>('/api/settings');
  }

  /**
   * Update profile settings
   */
  async updateProfile(settings: Partial<ProfileSettings>): Promise<ProfileSettings> {
    return apiClient.put<ProfileSettings>('/api/settings/profile', settings);
  }

  /**
   * Update privacy settings
   */
  async updatePrivacy(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    return apiClient.put<PrivacySettings>('/api/settings/privacy', settings);
  }

  /**
   * Update notification settings
   */
  async updateNotifications(
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    return apiClient.put<NotificationSettings>('/api/settings/notifications', settings);
  }

  /**
   * Update security settings
   */
  async updateSecurity(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    return apiClient.put<SecuritySettings>('/api/settings/security', settings);
  }

  /**
   * Enable 2FA
   */
  async enable2FA(): Promise<TwoFactorSetupResponse> {
    return apiClient.post<TwoFactorSetupResponse>('/api/settings/2fa/enable');
  }

  /**
   * Verify 2FA code during setup
   */
  async verify2FA(code: string): Promise<{ success: boolean; backupCodes: string[] }> {
    return apiClient.post<{ success: boolean; backupCodes: string[] }>(
      '/api/settings/2fa/verify',
      { code }
    );
  }

  /**
   * Disable 2FA
   */
  async disable2FA(password: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/api/settings/2fa/disable', { password });
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<{ codes: string[] }> {
    return apiClient.post<{ codes: string[] }>('/api/settings/2fa/backup-codes');
  }

  /**
   * Get active sessions
   */
  async getSessions(): Promise<Session[]> {
    return apiClient.get<Session[]>('/api/settings/sessions');
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/settings/sessions/${sessionId}`);
  }

  /**
   * Revoke all other sessions except current
   */
  async revokeAllOtherSessions(): Promise<{ success: boolean; revokedCount: number }> {
    return apiClient.post<{ success: boolean; revokedCount: number }>(
      '/api/settings/sessions/revoke-all'
    );
  }
}

// Export singleton instance
export const settingsApi = new SettingsApiClient();
