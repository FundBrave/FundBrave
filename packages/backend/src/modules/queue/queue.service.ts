import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  TRENDING: 'trending-queue',
  BLOCKCHAIN_SYNC: 'blockchain-sync-queue',
} as const;

// Job types
export interface EmailJobData {
  type: 'verification' | 'password-reset' | 'welcome' | 'notification-digest' | 'custom';
  to: string;
  subject?: string;
  template?: string;
  data: Record<string, unknown>;
}

export interface NotificationJobData {
  type: 'single' | 'batch' | 'broadcast';
  recipientId?: string;
  recipientIds?: string[];
  notification: {
    type: string;
    title: string;
    message: string;
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface TrendingJobData {
  type: 'hashtags' | 'fundraisers' | 'users' | 'all';
  force?: boolean;
}

export interface BlockchainSyncJobData {
  chainId: number;
  contractAddress: string;
  contractName: string;
  fromBlock?: number;
  toBlock?: number;
}

/**
 * Service for managing job queues
 * Provides methods to add jobs to various queues
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue<EmailJobData>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue<NotificationJobData>,
    @InjectQueue(QUEUE_NAMES.TRENDING) private readonly trendingQueue: Queue<TrendingJobData>,
    @InjectQueue(QUEUE_NAMES.BLOCKCHAIN_SYNC) private readonly blockchainSyncQueue: Queue<BlockchainSyncJobData>,
  ) {}

  // ==================== Email Queue ====================

  /**
   * Add email job to queue
   */
  async addEmailJob(data: EmailJobData, options?: { delay?: number; priority?: number }): Promise<Job<EmailJobData>> {
    const job = await this.emailQueue.add(data, {
      delay: options?.delay,
      priority: options?.priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50, // Keep last 50 failed jobs
    });

    this.logger.debug(`Email job ${job.id} added to queue`);
    return job;
  }

  /**
   * Add verification email job
   */
  async sendVerificationEmail(email: string, token: string, username?: string): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'verification',
      to: email,
      data: { token, username },
    });
  }

  /**
   * Add password reset email job
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'password-reset',
      to: email,
      data: { token },
    });
  }

  /**
   * Add welcome email job
   */
  async sendWelcomeEmail(email: string, username: string): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'welcome',
      to: email,
      data: { username },
    });
  }

  /**
   * Add notification digest email job
   */
  async sendNotificationDigest(
    email: string,
    notifications: Array<{ title: string; message: string }>,
  ): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'notification-digest',
      to: email,
      data: { notifications },
    });
  }

  // ==================== Notification Queue ====================

  /**
   * Add notification job to queue
   */
  async addNotificationJob(
    data: NotificationJobData,
    options?: { delay?: number },
  ): Promise<Job<NotificationJobData>> {
    const job = await this.notificationQueue.add(data, {
      delay: options?.delay,
      attempts: 2,
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    this.logger.debug(`Notification job ${job.id} added to queue`);
    return job;
  }

  /**
   * Queue a single notification
   */
  async queueNotification(
    recipientId: string,
    notification: NotificationJobData['notification'],
  ): Promise<Job<NotificationJobData>> {
    return this.addNotificationJob({
      type: 'single',
      recipientId,
      notification,
    });
  }

  /**
   * Queue batch notifications
   */
  async queueBatchNotifications(
    recipientIds: string[],
    notification: NotificationJobData['notification'],
  ): Promise<Job<NotificationJobData>> {
    return this.addNotificationJob({
      type: 'batch',
      recipientIds,
      notification,
    });
  }

  /**
   * Queue broadcast notification (all users)
   */
  async queueBroadcastNotification(
    notification: NotificationJobData['notification'],
  ): Promise<Job<NotificationJobData>> {
    return this.addNotificationJob({
      type: 'broadcast',
      notification,
    });
  }

  // ==================== Trending Queue ====================

  /**
   * Add trending calculation job
   */
  async addTrendingJob(
    data: TrendingJobData,
    options?: { delay?: number },
  ): Promise<Job<TrendingJobData>> {
    const job = await this.trendingQueue.add(data, {
      delay: options?.delay,
      attempts: 1,
      removeOnComplete: 10,
    });

    this.logger.debug(`Trending job ${job.id} added to queue`);
    return job;
  }

  /**
   * Queue trending recalculation
   */
  async queueTrendingRecalculation(
    type: TrendingJobData['type'] = 'all',
    force: boolean = false,
  ): Promise<Job<TrendingJobData>> {
    return this.addTrendingJob({ type, force });
  }

  // ==================== Blockchain Sync Queue ====================

  /**
   * Add blockchain sync job
   */
  async addBlockchainSyncJob(
    data: BlockchainSyncJobData,
    options?: { delay?: number; priority?: number },
  ): Promise<Job<BlockchainSyncJobData>> {
    const job = await this.blockchainSyncQueue.add(data, {
      delay: options?.delay,
      priority: options?.priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
    });

    this.logger.debug(`Blockchain sync job ${job.id} added to queue`);
    return job;
  }

  /**
   * Queue blockchain sync for a contract
   */
  async queueContractSync(
    chainId: number,
    contractAddress: string,
    contractName: string,
    fromBlock?: number,
    toBlock?: number,
  ): Promise<Job<BlockchainSyncJobData>> {
    return this.addBlockchainSyncJob({
      chainId,
      contractAddress,
      contractName,
      fromBlock,
      toBlock,
    });
  }

  // ==================== Queue Management ====================

  /**
   * Get queue status
   */
  async getQueueStatus(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Get all queues status
   */
  async getAllQueuesStatus(): Promise<Record<string, {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>> {
    const statuses: Record<string, {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }> = {};

    for (const name of Object.values(QUEUE_NAMES)) {
      statuses[name] = await this.getQueueStatus(name);
    }

    return statuses;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.pause();
      this.logger.log(`Queue ${queueName} paused`);
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.resume();
      this.logger.log(`Queue ${queueName} resumed`);
    }
  }

  /**
   * Clean completed jobs from a queue
   */
  async cleanQueue(queueName: string, grace: number = 3600000): Promise<void> {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
      this.logger.log(`Queue ${queueName} cleaned`);
    }
  }

  // ==================== Helper Methods ====================

  private getQueue(name: string): Queue | undefined {
    switch (name) {
      case QUEUE_NAMES.EMAIL:
        return this.emailQueue;
      case QUEUE_NAMES.NOTIFICATION:
        return this.notificationQueue;
      case QUEUE_NAMES.TRENDING:
        return this.trendingQueue;
      case QUEUE_NAMES.BLOCKCHAIN_SYNC:
        return this.blockchainSyncQueue;
      default:
        return undefined;
    }
  }
}
