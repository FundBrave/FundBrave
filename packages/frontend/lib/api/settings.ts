/**
 * Settings API Client
 * Handles all settings-related requests to the backend
 *
 * Types aligned with backend DTOs in:
 *   packages/backend/src/modules/settings/dto/settings.response.ts
 */

import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ==================== Types matching backend DTOs ====================

export interface PrivacySettings {
  isPrivate: boolean;
  showWalletBalance: boolean;
  showDonationHistory: boolean;
  showStakingActivity: boolean;
  allowMessagesFromAnyone: boolean;
  showOnlineStatus: boolean;
  showInSearchEngines: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyOnFollow: boolean;
  notifyOnMention: boolean;
  notifyOnDonation: boolean;
  notifyOnStake: boolean;
  notifyOnYieldHarvest: boolean;
  notifyOnStockPurchase: boolean;
  notifyOnFBTVesting: boolean;
  notifyOnDAOProposal: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorEmail?: string;
  emailVerified: boolean;
  lastPasswordChange?: string | Date;
  activeSessions: number;
  loginAlertsEnabled: boolean;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  qrCodeUrl?: string;
  secret?: string;
  backupCodes?: string[];
  message: string;
}

export interface Session {
  id: string;
  device: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AllSettingsResponse {
  userId: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  language: string;
  timezone: string;
  currency: string;
  darkMode: boolean;
  updatedAt: string;
}

class SettingsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ==================== GET Endpoints ====================

  /**
   * Get all settings at once
   */
  async getAllSettings(): Promise<AllSettingsResponse> {
    return apiClient.get<AllSettingsResponse>('/api/settings');
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    return apiClient.get<PrivacySettings>('/api/settings/privacy');
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    return apiClient.get<NotificationSettings>('/api/settings/notifications');
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    return apiClient.get<SecuritySettings>('/api/settings/security');
  }

  // ==================== PUT Endpoints ====================

  /**
   * Update privacy settings
   */
  async updatePrivacy(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    return apiClient.put<PrivacySettings>('/api/settings/privacy', settings);
  }

  /**
   * Update notification settings
   */
  async updateNotifications(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return apiClient.put<NotificationSettings>('/api/settings/notifications', settings);
  }

  // ==================== Password Management ====================

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    logoutAllSessions?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(
      '/api/settings/security/password/change',
      data
    );
  }

  // ==================== Two-Factor Authentication ====================

  /**
   * Enable 2FA - Step 1: Generate secret and QR code
   */
  async enable2FA(password: string = ''): Promise<TwoFactorSetupResponse> {
    return apiClient.post<TwoFactorSetupResponse>('/api/settings/security/2fa/enable', { password });
  }

  /**
   * Verify 2FA code during setup - Step 2
   */
  async verify2FA(code: string): Promise<TwoFactorSetupResponse> {
    return apiClient.post<TwoFactorSetupResponse>(
      '/api/settings/security/2fa/verify',
      { code }
    );
  }

  /**
   * Disable 2FA
   */
  async disable2FA(password: string, code: string = ''): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(
      '/api/settings/security/2fa/disable',
      { password, code }
    );
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(password: string = '', code: string = ''): Promise<{ success: boolean; backupCodes: string[]; message: string }> {
    return apiClient.post<{ success: boolean; backupCodes: string[]; message: string }>(
      '/api/settings/security/2fa/backup-codes/regenerate',
      { password, code }
    );
  }

  // ==================== Session Management ====================

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
    return apiClient.delete<{ success: boolean; revokedCount: number }>(
      '/api/settings/sessions'
    );
  }
}

// Export singleton instance
export const settingsApi = new SettingsApiClient();
