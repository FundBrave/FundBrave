import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import {
  UpdateSettingsInput,
  UpdateNotificationSettingsInput,
  UpdatePrivacySettingsInput,
  ChangePasswordInput,
  SetPasswordInput,
  Enable2FAInput,
  Verify2FAInput,
  Disable2FAInput,
  RegenerateBackupCodesInput,
  UserSettingsDto,
  NotificationPreferencesDto,
  PrivacySettingsDto,
  SecuritySettingsDto,
  SessionInfoDto,
  PasswordChangeResultDto,
  TwoFactorSetupResultDto,
} from './dto';
import {
  UnauthorizedException,
  InvalidInputException,
} from '../../common/exceptions';

const BCRYPT_ROUNDS = 14;
const BACKUP_CODE_COUNT = 10;

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Settings Retrieval ====================

  /**
   * Get all settings for a user
   */
  async getUserSettings(userId: string): Promise<UserSettingsDto> {
    const [user, notificationSettings, sessions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isPrivate: true,
          emailVerified: true,
          twoFactorEnabled: true,
          twoFactorEmail: true,
          passwordHash: true,
          language: true,
          timezone: true,
          currency: true,
          darkMode: true,
          showWalletBalance: true,
          showDonationHistory: true,
          showStakingActivity: true,
          allowMessagesFromAnyone: true,
          showOnlineStatus: true,
          showInSearchEngines: true,
          loginAlertsEnabled: true,
          passwordChangedAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.notificationSetting.findUnique({
        where: { userId },
      }),
      this.prisma.session.count({
        where: { userId, expiresAt: { gt: new Date() } },
      }),
    ]);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Create default notification settings if not exists
    const notifications = notificationSettings || await this.prisma.notificationSetting.create({
      data: { userId },
    });

    return {
      userId: user.id,
      notifications: {
        emailEnabled: notifications.emailEnabled,
        pushEnabled: notifications.pushEnabled,
        notifyOnLike: notifications.notifyOnLike,
        notifyOnComment: notifications.notifyOnComment,
        notifyOnFollow: notifications.notifyOnFollow,
        notifyOnMention: notifications.notifyOnMention,
        notifyOnDonation: notifications.notifyOnDonation,
        notifyOnStake: notifications.notifyOnStake,
        notifyOnYieldHarvest: notifications.notifyOnYieldHarvest,
        notifyOnStockPurchase: notifications.notifyOnStockPurchase,
        notifyOnFBTVesting: notifications.notifyOnFBTVesting,
        notifyOnDAOProposal: notifications.notifyOnDAOProposal,
      },
      privacy: {
        isPrivate: user.isPrivate,
        showWalletBalance: user.showWalletBalance ?? true,
        showDonationHistory: user.showDonationHistory ?? true,
        showStakingActivity: user.showStakingActivity ?? true,
        allowMessagesFromAnyone: user.allowMessagesFromAnyone ?? true,
        showOnlineStatus: user.showOnlineStatus ?? true,
        showInSearchEngines: user.showInSearchEngines ?? true,
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled ?? false,
        twoFactorEmail: user.twoFactorEmail ? this.maskEmail(user.twoFactorEmail) : undefined,
        emailVerified: user.emailVerified,
        lastPasswordChange: user.passwordChangedAt ?? undefined,
        activeSessions: sessions,
        loginAlertsEnabled: user.loginAlertsEnabled ?? true,
      },
      language: user.language ?? 'en',
      timezone: user.timezone ?? 'UTC',
      currency: user.currency ?? 'USD',
      darkMode: user.darkMode ?? false,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get notification settings only
   */
  async getNotificationSettings(userId: string): Promise<NotificationPreferencesDto> {
    let settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSetting.create({
        data: { userId },
      });
    }

    return {
      emailEnabled: settings.emailEnabled,
      pushEnabled: settings.pushEnabled,
      notifyOnLike: settings.notifyOnLike,
      notifyOnComment: settings.notifyOnComment,
      notifyOnFollow: settings.notifyOnFollow,
      notifyOnMention: settings.notifyOnMention,
      notifyOnDonation: settings.notifyOnDonation,
      notifyOnStake: settings.notifyOnStake,
      notifyOnYieldHarvest: settings.notifyOnYieldHarvest,
      notifyOnStockPurchase: settings.notifyOnStockPurchase,
      notifyOnFBTVesting: settings.notifyOnFBTVesting,
      notifyOnDAOProposal: settings.notifyOnDAOProposal,
    };
  }

  /**
   * Get privacy settings only
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettingsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPrivate: true,
        showWalletBalance: true,
        showDonationHistory: true,
        showStakingActivity: true,
        allowMessagesFromAnyone: true,
        showOnlineStatus: true,
        showInSearchEngines: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      isPrivate: user.isPrivate,
      showWalletBalance: user.showWalletBalance ?? true,
      showDonationHistory: user.showDonationHistory ?? true,
      showStakingActivity: user.showStakingActivity ?? true,
      allowMessagesFromAnyone: user.allowMessagesFromAnyone ?? true,
      showOnlineStatus: user.showOnlineStatus ?? true,
      showInSearchEngines: user.showInSearchEngines ?? true,
    };
  }

  /**
   * Get security settings only
   */
  async getSecuritySettings(userId: string): Promise<SecuritySettingsDto> {
    const [user, sessions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          twoFactorEmail: true,
          emailVerified: true,
          passwordChangedAt: true,
          loginAlertsEnabled: true,
        },
      }),
      this.prisma.session.count({
        where: { userId, expiresAt: { gt: new Date() } },
      }),
    ]);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      twoFactorEmail: user.twoFactorEmail ? this.maskEmail(user.twoFactorEmail) : undefined,
      emailVerified: user.emailVerified,
      lastPasswordChange: user.passwordChangedAt ?? undefined,
      activeSessions: sessions,
      loginAlertsEnabled: user.loginAlertsEnabled ?? true,
    };
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(userId: string, currentSessionId?: string): Promise<SessionInfoDto[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActivity: 'desc' },
    });

    return sessions.map(session => ({
      id: session.id,
      device: session.userAgent || 'Unknown device',
      ipAddress: this.maskIpAddress(session.ipAddress || 'Unknown'),
      location: session.location || 'Unknown location',
      lastActive: session.lastActivity,
      isCurrent: session.id === currentSessionId,
    }));
  }

  // ==================== Settings Updates ====================

  /**
   * Update general settings
   */
  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<UserSettingsDto> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        language: input.language,
        timezone: input.timezone,
        currency: input.currency,
        darkMode: input.darkMode,
      },
    });

    return this.getUserSettings(userId);
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    input: UpdateNotificationSettingsInput,
  ): Promise<NotificationPreferencesDto> {
    const settings = await this.prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });

    return {
      emailEnabled: settings.emailEnabled,
      pushEnabled: settings.pushEnabled,
      notifyOnLike: settings.notifyOnLike,
      notifyOnComment: settings.notifyOnComment,
      notifyOnFollow: settings.notifyOnFollow,
      notifyOnMention: settings.notifyOnMention,
      notifyOnDonation: settings.notifyOnDonation,
      notifyOnStake: settings.notifyOnStake,
      notifyOnYieldHarvest: settings.notifyOnYieldHarvest,
      notifyOnStockPurchase: settings.notifyOnStockPurchase,
      notifyOnFBTVesting: settings.notifyOnFBTVesting,
      notifyOnDAOProposal: settings.notifyOnDAOProposal,
    };
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    input: UpdatePrivacySettingsInput,
  ): Promise<PrivacySettingsDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPrivate: input.isPrivate,
        showWalletBalance: input.showWalletBalance,
        showDonationHistory: input.showDonationHistory,
        showStakingActivity: input.showStakingActivity,
        allowMessagesFromAnyone: input.allowMessagesFromAnyone,
        showOnlineStatus: input.showOnlineStatus,
        showInSearchEngines: input.showInSearchEngines,
      },
      select: {
        isPrivate: true,
        showWalletBalance: true,
        showDonationHistory: true,
        showStakingActivity: true,
        allowMessagesFromAnyone: true,
        showOnlineStatus: true,
        showInSearchEngines: true,
      },
    });

    return {
      isPrivate: user.isPrivate,
      showWalletBalance: user.showWalletBalance ?? true,
      showDonationHistory: user.showDonationHistory ?? true,
      showStakingActivity: user.showStakingActivity ?? true,
      allowMessagesFromAnyone: user.allowMessagesFromAnyone ?? true,
      showOnlineStatus: user.showOnlineStatus ?? true,
      showInSearchEngines: user.showInSearchEngines ?? true,
    };
  }

  // ==================== Password Management ====================

  /**
   * Change password for users with existing password
   */
  async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<PasswordChangeResultDto> {
    // Verify passwords match
    if (input.newPassword !== input.confirmPassword) {
      throw new InvalidInputException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new InvalidInputException('Password authentication is not set up for this account');
    }

    // Verify current password
    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

    // Update password and optionally invalidate other sessions
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
        },
      });

      if (input.logoutAllSessions) {
        // Delete all sessions except current one would need session ID
        await tx.session.deleteMany({
          where: { userId },
        });
      }
    });

    this.logger.log(`Password changed for user ${userId}`);

    return {
      success: true,
      message: input.logoutAllSessions
        ? 'Password changed successfully. All sessions have been logged out.'
        : 'Password changed successfully.',
    };
  }

  /**
   * Set password for users who registered with wallet/OAuth
   */
  async setPassword(userId: string, input: SetPasswordInput): Promise<PasswordChangeResultDto> {
    if (input.password !== input.confirmPassword) {
      throw new InvalidInputException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordHash) {
      throw new InvalidInputException('Password is already set. Use change password instead.');
    }

    if (!user.email) {
      throw new InvalidInputException('Email is required to set a password. Please add an email first.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });

    this.logger.log(`Password set for user ${userId}`);

    return {
      success: true,
      message: 'Password set successfully. You can now log in with email and password.',
    };
  }

  // ==================== Two-Factor Authentication ====================

  /**
   * Enable 2FA - Step 1: Generate secret
   */
  async enable2FA(userId: string, input: Enable2FAInput): Promise<TwoFactorSetupResultDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true, username: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new InvalidInputException('Two-factor authentication is already enabled');
    }

    // Verify password
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `FundBrave:${user.email || user.username || userId}`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store temporary secret (will be confirmed in verify step)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorPending: true,
      },
    });

    return {
      success: true,
      qrCodeUrl,
      secret: secret.base32,
      message: 'Scan the QR code with your authenticator app, then verify with a code.',
    };
  }

  /**
   * Verify 2FA code and complete setup
   */
  async verify2FA(userId: string, input: Verify2FAInput): Promise<TwoFactorSetupResultDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorPending: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorSecret || !user.twoFactorPending) {
      throw new InvalidInputException('2FA setup not initiated. Please start the setup process first.');
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: input.code,
      window: 1,
    });

    if (!isValid) {
      throw new InvalidInputException('Invalid verification code');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorPending: false,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    this.logger.log(`2FA enabled for user ${userId}`);

    return {
      success: true,
      backupCodes,
      message: 'Two-factor authentication has been enabled. Save your backup codes in a safe place!',
    };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, input: Disable2FAInput): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new InvalidInputException('Two-factor authentication is not enabled');
    }

    // Verify password
    if (user.passwordHash) {
      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Verify 2FA code or backup code
    const isCodeValid = this.verify2FACode(user.twoFactorSecret!, input.code) ||
      await this.verifyBackupCode(user.twoFactorBackupCodes, input.code);

    if (!isCodeValid) {
      throw new InvalidInputException('Invalid verification code');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorPending: false,
      },
    });

    this.logger.log(`2FA disabled for user ${userId}`);

    return {
      success: true,
      message: 'Two-factor authentication has been disabled.',
    };
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    input: RegenerateBackupCodesInput,
  ): Promise<{ success: boolean; backupCodes: string[]; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new InvalidInputException('Two-factor authentication is not enabled');
    }

    // Verify password
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Verify 2FA code
    if (!this.verify2FACode(user.twoFactorSecret!, input.code)) {
      throw new InvalidInputException('Invalid verification code');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: hashedBackupCodes },
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);

    return {
      success: true,
      backupCodes,
      message: 'New backup codes have been generated. Previous codes are no longer valid.',
    };
  }

  // ==================== Session Management ====================

  /**
   * Terminate a specific session
   */
  async terminateSession(userId: string, sessionId: string): Promise<{ success: boolean }> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new InvalidInputException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    this.logger.log(`Session ${sessionId} terminated for user ${userId}`);

    return { success: true };
  }

  /**
   * Terminate all sessions except current
   */
  async terminateAllOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<{ success: boolean; terminatedCount: number }> {
    const result = await this.prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });

    this.logger.log(`${result.count} sessions terminated for user ${userId}`);

    return {
      success: true,
      terminatedCount: result.count,
    };
  }

  // ==================== Helper Methods ====================

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (name.length <= 2) {
      return `${name[0]}***@${domain}`;
    }
    return `${name[0]}${name[1]}***@${domain}`;
  }

  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip.substring(0, ip.length / 2) + '***';
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private verify2FACode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }

  private async verifyBackupCode(hashedCodes: string[], code: string): Promise<boolean> {
    for (const hashedCode of hashedCodes) {
      const isValid = await bcrypt.compare(code, hashedCode);
      if (isValid) {
        return true;
      }
    }
    return false;
  }
}
