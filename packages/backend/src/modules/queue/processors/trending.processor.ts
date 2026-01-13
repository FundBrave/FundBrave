import {
  Process,
  Processor,
  OnQueueFailed,
  OnQueueCompleted,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES, TrendingJobData } from '../queue.service';
import { TrendingService } from '../../trending/trending.service';

/**
 * Trending queue processor
 * Handles recalculating trending scores
 */
@Processor(QUEUE_NAMES.TRENDING)
export class TrendingProcessor {
  private readonly logger = new Logger(TrendingProcessor.name);

  constructor(private readonly trendingService: TrendingService) {}

  @Process()
  async handleTrendingJob(job: Job<TrendingJobData>): Promise<void> {
    this.logger.debug(`Processing trending job ${job.id}: ${job.data.type}`);

    const { type, force } = job.data;

    try {
      switch (type) {
        case 'hashtags':
          await this.trendingService.calculateTrendingHashtags();
          break;

        case 'fundraisers':
          await this.trendingService.calculateTrendingFundraisers();
          break;

        case 'users':
          await this.trendingService.calculateTrendingUsers();
          break;

        case 'all':
        default:
          await this.trendingService.updateTrendingScores();
          break;
      }

      this.logger.log(`Trending calculation completed: ${type}`);
    } catch (error) {
      this.logger.error(`Failed to calculate trending: ${error}`);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<TrendingJobData>): void {
    this.logger.debug(`Trending job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job<TrendingJobData>, error: Error): void {
    this.logger.error(`Trending job ${job.id} failed: ${error.message}`);
  }
}
