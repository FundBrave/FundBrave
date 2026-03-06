import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialResolver } from './social.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [SocialService, SocialResolver],
  exports: [SocialService],
})
export class SocialModule {}
