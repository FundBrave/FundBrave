import {
  Process,
  Processor,
  OnQueueFailed,
  OnQueueCompleted,
} from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES, NotificationJobData } from '../queue.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/dto';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Notification queue processor
 * Handles creating notifications in batches
 */
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process()
  async handleNotificationJob(job: Job<NotificationJobData>): Promise<void> {
    this.logger.debug(
      `Processing notification job ${job.id}: ${job.data.type}`,
    );

    const { type, recipientId, recipientIds, notification } = job.data;

    try {
      switch (type) {
        case 'single':
          if (recipientId) {
            await this.createSingleNotification(recipientId, notification);
          }
          break;

        case 'batch':
          if (recipientIds && recipientIds.length > 0) {
            await this.createBatchNotifications(recipientIds, notification);
          }
          break;

        case 'broadcast':
          await this.createBroadcastNotifications(notification);
          break;

        default:
          this.logger.warn(`Unknown notification type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process notification job: ${error}`);
      throw error;
    }
  }

  /**
   * Create a single notification
   */
  private async createSingleNotification(
    recipientId: string,
    notification: NotificationJobData['notification'],
  ): Promise<void> {
    try {
      await this.notificationsService.createNotification(
        recipientId,
        notification.type as NotificationType,
        undefined,
        notification.entityId,
        notification.entityType,
        notification.metadata,
        notification.title,
        notification.message,
      );
      this.logger.debug(`Notification created for user ${recipientId}`);
    } catch (error) {
      this.logger.debug(
        `Notification creation skipped for user ${recipientId}: ${error}`,
      );
    }
  }

  /**
   * Create batch notifications
   */
  private async createBatchNotifications(
    recipientIds: string[],
    notification: NotificationJobData['notification'],
  ): Promise<void> {
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < recipientIds.length; i += batchSize) {
      const batch = recipientIds.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map((recipientId) =>
          this.createSingleNotification(recipientId, notification),
        ),
      );

      processed += batch.length;
      this.logger.debug(
        `Processed ${processed}/${recipientIds.length} batch notifications`,
      );
    }

    this.logger.log(`Batch notifications completed: ${processed} users`);
  }

  /**
   * Create broadcast notifications to all active users
   */
  private async createBroadcastNotifications(
    notification: NotificationJobData['notification'],
  ): Promise<void> {
    // Get all active users in batches
    const batchSize = 100;
    let skip = 0;
    let totalProcessed = 0;

    while (true) {
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          isSuspended: false,
        },
        select: { id: true },
        take: batchSize,
        skip,
      });

      if (users.length === 0) break;

      await Promise.allSettled(
        users.map((user) =>
          this.createSingleNotification(user.id, notification),
        ),
      );

      totalProcessed += users.length;
      skip += batchSize;

      this.logger.debug(`Broadcast progress: ${totalProcessed} users notified`);

      // Add small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(
      `Broadcast notifications completed: ${totalProcessed} users`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<NotificationJobData>): void {
    this.logger.debug(`Notification job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job<NotificationJobData>, error: Error): void {
    this.logger.error(`Notification job ${job.id} failed: ${error.message}`);
  }
}
