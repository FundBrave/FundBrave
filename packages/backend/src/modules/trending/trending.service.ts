import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  TrendingHashtag,
  TrendingFundraiser,
  TrendingUser,
  TrendingType,
  TrendingPeriod,
} from './dto';

/**
 * Service for calculating and retrieving trending content
 * Uses engagement-based scoring with time decay
 */
@Injectable()
export class TrendingService {
  private readonly logger = new Logger(TrendingService.name);

  // Time decay constants
  private readonly DECAY_RATE = 0.1; // Score decays by 10% per hour
  private readonly MIN_ENGAGEMENT = 2; // Minimum engagement to be considered

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get trending items by type and period
   */
  async getTrending(
    type: TrendingType,
    period: TrendingPeriod = TrendingPeriod.TWENTY_FOUR_HOURS,
    limit: number = 10,
  ): Promise<TrendingHashtag[] | TrendingFundraiser[] | TrendingUser[]> {
    switch (type) {
      case TrendingType.HASHTAG:
        return this.getTrendingHashtags(period, limit);
      case TrendingType.FUNDRAISER:
        return this.getTrendingFundraisers(period, limit);
      case TrendingType.USER:
        return this.getTrendingUsers(period, limit);
      default:
        return [];
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(
    period: TrendingPeriod = TrendingPeriod.TWENTY_FOUR_HOURS,
    limit: number = 10,
  ): Promise<TrendingHashtag[]> {
    const trends = await this.prisma.trending.findMany({
      where: {
        type: 'hashtag',
        period,
      },
      orderBy: { score: 'desc' },
      take: limit,
    });

    return trends.map((t) => ({
      id: t.id,
      tag: t.value,
      score: t.score,
      postsCount: t.postsCount,
      period: period,
      calculatedAt: t.calculatedAt,
    }));
  }

  /**
   * Get trending fundraisers
   */
  async getTrendingFundraisers(
    period: TrendingPeriod = TrendingPeriod.TWENTY_FOUR_HOURS,
    limit: number = 10,
  ): Promise<TrendingFundraiser[]> {
    const trends = await this.prisma.trending.findMany({
      where: {
        type: 'fundraiser',
        period,
      },
      orderBy: { score: 'desc' },
      take: limit,
    });

    // Fetch fundraiser details
    const fundraiserIds = trends.map((t) => t.value);
    const fundraisers = await this.prisma.fundraiser.findMany({
      where: { id: { in: fundraiserIds } },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        goalAmount: true,
        raisedAmount: true,
        donorsCount: true,
      },
    });

    const fundraiserMap = new Map(fundraisers.map((f) => [f.id, f]));

    return trends
      .filter((t) => fundraiserMap.has(t.value))
      .map((t) => {
        const f = fundraiserMap.get(t.value)!;
        return {
          id: t.id,
          fundraiserId: t.value,
          name: f.name,
          description: f.description ?? undefined,
          images: f.images,
          goalAmount: f.goalAmount,
          raisedAmount: f.raisedAmount.toString(),
          donorsCount: f.donorsCount,
          score: t.score,
          period: period,
          calculatedAt: t.calculatedAt,
        };
      });
  }

  /**
   * Get trending users
   */
  async getTrendingUsers(
    period: TrendingPeriod = TrendingPeriod.TWENTY_FOUR_HOURS,
    limit: number = 10,
  ): Promise<TrendingUser[]> {
    const trends = await this.prisma.trending.findMany({
      where: {
        type: 'user',
        period,
      },
      orderBy: { score: 'desc' },
      take: limit,
    });

    // Fetch user details
    const userIds = trends.map((t) => t.value);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        followersCount: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return trends
      .filter((t) => userMap.has(t.value))
      .map((t) => {
        const u = userMap.get(t.value)!;
        return {
          id: t.id,
          userId: t.value,
          walletAddress: u.walletAddress,
          username: u.username ?? undefined,
          displayName: u.displayName ?? undefined,
          avatarUrl: u.avatarUrl ?? undefined,
          followersCount: u.followersCount,
          score: t.score,
          period: period,
          calculatedAt: t.calculatedAt,
        };
      });
  }

  // ==================== Calculation Methods ====================

  /**
   * Calculate and update trending hashtags
   */
  async calculateTrendingHashtags(): Promise<void> {
    this.logger.log('Calculating trending hashtags...');

    for (const period of Object.values(TrendingPeriod)) {
      const since = this.getPeriodStartDate(period);

      // Get hashtag usage with engagement
      const hashtagStats = await this.prisma.postHashtag.groupBy({
        by: ['hashtagId'],
        where: {
          createdAt: { gte: since },
        },
        _count: { postId: true },
      });

      // Fetch hashtag details and calculate scores
      const hashtagIds = hashtagStats.map((h) => h.hashtagId);
      const hashtags = await this.prisma.hashtag.findMany({
        where: { id: { in: hashtagIds } },
        select: { id: true, tag: true },
      });

      const hashtagMap = new Map(hashtags.map((h) => [h.id, h]));

      // Calculate scores with time decay
      const trendingData = hashtagStats
        .filter((h) => h._count.postId >= this.MIN_ENGAGEMENT)
        .map((h) => ({
          type: 'hashtag',
          value: hashtagMap.get(h.hashtagId)?.tag || h.hashtagId,
          score: this.calculateScore(h._count.postId),
          postsCount: h._count.postId,
          period,
        }));

      // Upsert trending records
      await this.upsertTrendingRecords(trendingData);
    }

    this.logger.log('Trending hashtags calculated');
  }

  /**
   * Calculate and update trending fundraisers
   */
  async calculateTrendingFundraisers(): Promise<void> {
    this.logger.log('Calculating trending fundraisers...');

    for (const period of Object.values(TrendingPeriod)) {
      const since = this.getPeriodStartDate(period);

      // Get fundraisers with recent activity
      const fundraisers = await this.prisma.fundraiser.findMany({
        where: {
          isActive: true,
          OR: [
            { donations: { some: { createdAt: { gte: since } } } },
            { stakes: { some: { stakedAt: { gte: since } } } },
            { posts: { some: { createdAt: { gte: since } } } },
          ],
        },
        select: {
          id: true,
          _count: {
            select: {
              donations: { where: { createdAt: { gte: since } } },
              stakes: { where: { stakedAt: { gte: since } } },
              posts: { where: { createdAt: { gte: since } } },
            },
          },
        },
      });

      const trendingData = fundraisers
        .map((f) => {
          const engagement =
            f._count.donations * 3 + // Donations weighted 3x
            f._count.stakes * 2 + // Stakes weighted 2x
            f._count.posts; // Posts weighted 1x
          return {
            type: 'fundraiser',
            value: f.id,
            score: this.calculateScore(engagement),
            postsCount: f._count.posts,
            period,
          };
        })
        .filter((f) => f.score > 0);

      await this.upsertTrendingRecords(trendingData);
    }

    this.logger.log('Trending fundraisers calculated');
  }

  /**
   * Calculate and update trending users
   */
  async calculateTrendingUsers(): Promise<void> {
    this.logger.log('Calculating trending users...');

    for (const period of Object.values(TrendingPeriod)) {
      const since = this.getPeriodStartDate(period);

      // Get users with recent engagement
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          isSuspended: false,
          OR: [
            { posts: { some: { createdAt: { gte: since } } } },
            { followedBy: { some: { createdAt: { gte: since } } } },
            { donations: { some: { createdAt: { gte: since } } } },
          ],
        },
        select: {
          id: true,
          _count: {
            select: {
              posts: { where: { createdAt: { gte: since } } },
              followedBy: { where: { createdAt: { gte: since } } },
              donations: { where: { createdAt: { gte: since } } },
              likes: { where: { createdAt: { gte: since } } },
            },
          },
        },
      });

      const trendingData = users
        .map((u) => {
          const engagement =
            u._count.followedBy * 3 + // New followers weighted 3x
            u._count.donations * 2 + // Donations weighted 2x
            u._count.posts + // Posts weighted 1x
            u._count.likes * 0.5; // Likes weighted 0.5x
          return {
            type: 'user',
            value: u.id,
            score: this.calculateScore(engagement),
            postsCount: u._count.posts,
            period,
          };
        })
        .filter((u) => u.score > 0);

      await this.upsertTrendingRecords(trendingData);
    }

    this.logger.log('Trending users calculated');
  }

  /**
   * Update all trending scores (cron job)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateTrendingScores(): Promise<void> {
    this.logger.log('Starting hourly trending update...');

    try {
      await Promise.all([
        this.calculateTrendingHashtags(),
        this.calculateTrendingFundraisers(),
        this.calculateTrendingUsers(),
      ]);

      // Clean up old trending records
      await this.cleanupOldTrending();

      this.logger.log('Hourly trending update completed');
    } catch (error) {
      this.logger.error(`Failed to update trending: ${error}`);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Calculate trending score with time decay
   */
  private calculateScore(engagement: number): number {
    // Simple scoring: engagement count with diminishing returns
    return Math.log2(engagement + 1) * 10;
  }

  /**
   * Get start date for a period
   */
  private getPeriodStartDate(period: TrendingPeriod): Date {
    const now = new Date();
    switch (period) {
      case TrendingPeriod.ONE_HOUR:
        return new Date(now.getTime() - 60 * 60 * 1000);
      case TrendingPeriod.TWENTY_FOUR_HOURS:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case TrendingPeriod.SEVEN_DAYS:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Upsert trending records
   */
  private async upsertTrendingRecords(
    data: Array<{
      type: string;
      value: string;
      score: number;
      postsCount: number;
      period: string;
    }>,
  ): Promise<void> {
    for (const item of data) {
      await this.prisma.trending.upsert({
        where: {
          type_value_period: {
            type: item.type,
            value: item.value,
            period: item.period,
          },
        },
        create: {
          type: item.type,
          value: item.value,
          score: item.score,
          postsCount: item.postsCount,
          period: item.period,
          calculatedAt: new Date(),
        },
        update: {
          score: item.score,
          postsCount: item.postsCount,
          calculatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Clean up old trending records
   */
  private async cleanupOldTrending(): Promise<void> {
    // Delete records older than 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await this.prisma.trending.deleteMany({
      where: {
        calculatedAt: { lt: cutoff },
      },
    });
  }

  /**
   * Force recalculation of all trending (manual trigger)
   */
  async forceRecalculate(): Promise<void> {
    this.logger.log('Force recalculating all trending...');
    await this.updateTrendingScores();
  }
}
