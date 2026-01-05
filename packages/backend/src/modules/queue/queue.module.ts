import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { QueueService, QUEUE_NAMES } from './queue.service';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { TrendingProcessor } from './processors/trending.processor';
import { BlockchainSyncProcessor } from './processors/blockchain-sync.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrendingModule } from '../trending/trending.module';

@Module({
  imports: [
    // Configure Bull with Redis
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),

    // Register queues
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.TRENDING },
      { name: QUEUE_NAMES.BLOCKCHAIN_SYNC },
    ),

    // Import modules needed by processors
    forwardRef(() => NotificationsModule),
    forwardRef(() => TrendingModule),
  ],
  providers: [
    QueueService,
    EmailProcessor,
    NotificationProcessor,
    TrendingProcessor,
    BlockchainSyncProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
