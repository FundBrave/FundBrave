import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Notification settings response
 */
@ObjectType('NotificationPreferences')
export class NotificationPreferencesDto {
  @ApiProperty({ description: 'Email notifications enabled' })
  @Field()
  emailEnabled: boolean;

  @ApiProperty({ description: 'Push notifications enabled' })
  @Field()
  pushEnabled: boolean;

  @ApiProperty({ description: 'Notify on likes' })
  @Field()
  notifyOnLike: boolean;

  @ApiProperty({ description: 'Notify on comments' })
  @Field()
  notifyOnComment: boolean;

  @ApiProperty({ description: 'Notify on follows' })
  @Field()
  notifyOnFollow: boolean;

  @ApiProperty({ description: 'Notify on mentions' })
  @Field()
  notifyOnMention: boolean;

  @ApiProperty({ description: 'Notify on donations received' })
  @Field()
  notifyOnDonation: boolean;

  @ApiProperty({ description: 'Notify on stake events' })
  @Field()
  notifyOnStake: boolean;

  @ApiProperty({ description: 'Notify on yield harvest' })
  @Field()
  notifyOnYieldHarvest: boolean;

  @ApiProperty({ description: 'Notify on stock purchases' })
  @Field()
  notifyOnStockPurchase: boolean;

  @ApiProperty({ description: 'Notify on FBT vesting events' })
  @Field()
  notifyOnFBTVesting: boolean;

  @ApiProperty({ description: 'Notify on DAO proposals' })
  @Field()
  notifyOnDAOProposal: boolean;
}

/**
 * Privacy settings response
 */
@ObjectType('PrivacySettings')
export class PrivacySettingsDto {
  @ApiProperty({ description: 'Profile is private' })
  @Field()
  isPrivate: boolean;

  @ApiProperty({ description: 'Show wallet balance publicly' })
  @Field()
  showWalletBalance: boolean;

  @ApiProperty({ description: 'Show donation history publicly' })
  @Field()
  showDonationHistory: boolean;

  @ApiProperty({ description: 'Show staking activity publicly' })
  @Field()
  showStakingActivity: boolean;

  @ApiProperty({ description: 'Allow direct messages from anyone' })
  @Field()
  allowMessagesFromAnyone: boolean;

  @ApiProperty({ description: 'Show online status' })
  @Field()
  showOnlineStatus: boolean;

  @ApiProperty({ description: 'Show profile to search engines' })
  @Field()
  showInSearchEngines: boolean;
}

/**
 * Security settings response
 */
@ObjectType('SecuritySettings')
export class SecuritySettingsDto {
  @ApiProperty({ description: 'Two-factor authentication enabled' })
  @Field()
  twoFactorEnabled: boolean;

  @ApiPropertyOptional({ description: 'Email for 2FA (masked)' })
  @Field({ nullable: true })
  twoFactorEmail?: string;

  @ApiProperty({ description: 'Email verified status' })
  @Field()
  emailVerified: boolean;

  @ApiPropertyOptional({ description: 'Last password change date' })
  @Field({ nullable: true })
  lastPasswordChange?: Date;

  @ApiProperty({ description: 'Number of active sessions' })
  @Field()
  activeSessions: number;

  @ApiProperty({ description: 'Login alerts enabled' })
  @Field()
  loginAlertsEnabled: boolean;
}

/**
 * Full user settings response
 */
@ObjectType('UserSettings')
export class UserSettingsDto {
  @ApiProperty({ description: 'User ID' })
  @Field()
  userId: string;

  @ApiProperty({ description: 'Notification preferences' })
  @Field(() => NotificationPreferencesDto)
  notifications: NotificationPreferencesDto;

  @ApiProperty({ description: 'Privacy settings' })
  @Field(() => PrivacySettingsDto)
  privacy: PrivacySettingsDto;

  @ApiProperty({ description: 'Security settings' })
  @Field(() => SecuritySettingsDto)
  security: SecuritySettingsDto;

  @ApiProperty({ description: 'Preferred language' })
  @Field()
  language: string;

  @ApiProperty({ description: 'Preferred timezone' })
  @Field()
  timezone: string;

  @ApiProperty({ description: 'Preferred currency for display' })
  @Field()
  currency: string;

  @ApiProperty({ description: 'Dark mode preference' })
  @Field()
  darkMode: boolean;

  @ApiProperty({ description: 'Last settings update' })
  @Field()
  updatedAt: Date;
}

/**
 * Session information
 */
@ObjectType('SessionInfo')
export class SessionInfoDto {
  @ApiProperty({ description: 'Session ID' })
  @Field()
  id: string;

  @ApiProperty({ description: 'Device/browser info' })
  @Field()
  device: string;

  @ApiProperty({ description: 'IP address (masked)' })
  @Field()
  ipAddress: string;

  @ApiProperty({ description: 'Location (approximate)' })
  @Field()
  location: string;

  @ApiProperty({ description: 'Last active timestamp' })
  @Field()
  lastActive: Date;

  @ApiProperty({ description: 'Is current session' })
  @Field()
  isCurrent: boolean;
}

/**
 * Password change result
 */
@ObjectType('PasswordChangeResult')
export class PasswordChangeResultDto {
  @ApiProperty({ description: 'Success status' })
  @Field()
  success: boolean;

  @ApiProperty({ description: 'Message' })
  @Field()
  message: string;

  @ApiPropertyOptional({ description: 'New session token (all other sessions invalidated)' })
  @Field({ nullable: true })
  newToken?: string;
}

/**
 * 2FA setup response
 */
@ObjectType('TwoFactorSetupResult')
export class TwoFactorSetupResultDto {
  @ApiProperty({ description: 'Success status' })
  @Field()
  success: boolean;

  @ApiPropertyOptional({ description: 'QR code URL for authenticator apps' })
  @Field({ nullable: true })
  qrCodeUrl?: string;

  @ApiPropertyOptional({ description: 'Secret key for manual entry' })
  @Field({ nullable: true })
  secret?: string;

  @ApiPropertyOptional({ description: 'Backup codes' })
  @Field(() => [String], { nullable: true })
  backupCodes?: string[];

  @ApiProperty({ description: 'Message' })
  @Field()
  message: string;
}
