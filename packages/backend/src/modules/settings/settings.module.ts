import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Settings Module
 * Provides user settings management including:
 * - General preferences (language, timezone, currency, theme)
 * - Notification settings
 * - Privacy settings
 * - Security settings (password, 2FA)
 * - Session management
 */
@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
