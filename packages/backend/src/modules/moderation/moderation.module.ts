import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationResolver } from './moderation.resolver';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [ModerationService, ModerationResolver],
  exports: [ModerationService],
})
export class ModerationModule {}
