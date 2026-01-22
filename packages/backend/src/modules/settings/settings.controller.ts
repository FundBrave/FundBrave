import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SettingsService } from './settings.service';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  walletAddress: string;
  sessionId?: string;
}

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ==================== GET Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get all user settings' })
  @ApiResponse({ status: 200, description: 'Returns user settings', type: UserSettingsDto })
  async getSettings(@CurrentUser() user: AuthenticatedUser): Promise<UserSettingsDto> {
    return this.settingsService.getUserSettings(user.id);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Returns notification settings', type: NotificationPreferencesDto })
  async getNotificationSettings(@CurrentUser() user: AuthenticatedUser): Promise<NotificationPreferencesDto> {
    return this.settingsService.getNotificationSettings(user.id);
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy settings' })
  @ApiResponse({ status: 200, description: 'Returns privacy settings', type: PrivacySettingsDto })
  async getPrivacySettings(@CurrentUser() user: AuthenticatedUser): Promise<PrivacySettingsDto> {
    return this.settingsService.getPrivacySettings(user.id);
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({ status: 200, description: 'Returns security settings', type: SecuritySettingsDto })
  async getSecuritySettings(@CurrentUser() user: AuthenticatedUser): Promise<SecuritySettingsDto> {
    return this.settingsService.getSecuritySettings(user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({ status: 200, description: 'Returns list of active sessions', type: [SessionInfoDto] })
  async getActiveSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<SessionInfoDto[]> {
    const sessionId = (req as any).sessionId; // Get from JWT if available
    return this.settingsService.getActiveSessions(user.id, sessionId);
  }

  // ==================== PUT Endpoints ====================

  @Put()
  @ApiOperation({ summary: 'Update general settings' })
  @ApiResponse({ status: 200, description: 'Settings updated', type: UserSettingsDto })
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateSettingsInput,
  ): Promise<UserSettingsDto> {
    return this.settingsService.updateSettings(user.id, input);
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated', type: NotificationPreferencesDto })
  async updateNotificationSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateNotificationSettingsInput,
  ): Promise<NotificationPreferencesDto> {
    return this.settingsService.updateNotificationSettings(user.id, input);
  }

  @Put('privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings updated', type: PrivacySettingsDto })
  async updatePrivacySettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdatePrivacySettingsInput,
  ): Promise<PrivacySettingsDto> {
    return this.settingsService.updatePrivacySettings(user.id, input);
  }

  // ==================== Password Management ====================

  @Post('security/password/change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed', type: PasswordChangeResultDto })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ChangePasswordInput,
  ): Promise<PasswordChangeResultDto> {
    return this.settingsService.changePassword(user.id, input);
  }

  @Post('security/password/set')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set password for wallet/OAuth users' })
  @ApiResponse({ status: 200, description: 'Password set', type: PasswordChangeResultDto })
  async setPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SetPasswordInput,
  ): Promise<PasswordChangeResultDto> {
    return this.settingsService.setPassword(user.id, input);
  }

  // ==================== Two-Factor Authentication ====================

  @Post('security/2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start 2FA setup - generates secret and QR code' })
  @ApiResponse({ status: 200, description: '2FA setup initiated', type: TwoFactorSetupResultDto })
  async enable2FA(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: Enable2FAInput,
  ): Promise<TwoFactorSetupResultDto> {
    return this.settingsService.enable2FA(user.id, input);
  }

  @Post('security/2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code and complete setup' })
  @ApiResponse({ status: 200, description: '2FA enabled', type: TwoFactorSetupResultDto })
  async verify2FA(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: Verify2FAInput,
  ): Promise<TwoFactorSetupResultDto> {
    return this.settingsService.verify2FA(user.id, input);
  }

  @Post('security/2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  async disable2FA(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: Disable2FAInput,
  ): Promise<{ success: boolean; message: string }> {
    return this.settingsService.disable2FA(user.id, input);
  }

  @Post('security/2fa/backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerated' })
  async regenerateBackupCodes(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: RegenerateBackupCodesInput,
  ): Promise<{ success: boolean; backupCodes: string[]; message: string }> {
    return this.settingsService.regenerateBackupCodes(user.id, input);
  }

  // ==================== Session Management ====================

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Terminate a specific session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID to terminate' })
  @ApiResponse({ status: 200, description: 'Session terminated' })
  async terminateSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    return this.settingsService.terminateSession(user.id, sessionId);
  }

  @Delete('sessions')
  @ApiOperation({ summary: 'Terminate all sessions except current' })
  @ApiResponse({ status: 200, description: 'Sessions terminated' })
  async terminateAllOtherSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ success: boolean; terminatedCount: number }> {
    const currentSessionId = (req as any).sessionId || '';
    return this.settingsService.terminateAllOtherSessions(user.id, currentSessionId);
  }
}
