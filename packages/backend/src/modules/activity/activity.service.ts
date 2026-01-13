import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  ActivityType as PrismaActivityType,
  Prisma as PrismaNamespace,
} from '@prisma/client';

// Activity types matching the Prisma schema
export enum ActivityType {
  POST_CREATE = 'POST_CREATE',
  POST_VIEW = 'POST_VIEW',
  POST_LIKE = 'POST_LIKE',
  POST_UNLIKE = 'POST_UNLIKE',
  POST_REPOST = 'POST_REPOST',
  POST_BOOKMARK = 'POST_BOOKMARK',
  COMMENT_CREATE = 'COMMENT_CREATE',
  FOLLOW = 'FOLLOW',
  UNFOLLOW = 'UNFOLLOW',
  DONATION_CREATE = 'DONATION_CREATE',
  STAKE_CREATE = 'STAKE_CREATE',
  PROPOSAL_CREATE = 'PROPOSAL_CREATE',
  VOTE_CAST = 'VOTE_CAST',
  PROFILE_VIEW = 'PROFILE_VIEW',
  FUNDRAISER_VIEW = 'FUNDRAISER_VIEW',
  SEARCH = 'SEARCH',
  IMPACT_DAO_STAKE = 'IMPACT_DAO_STAKE',
  IMPACT_DAO_UNSTAKE = 'IMPACT_DAO_UNSTAKE',
  WEALTH_BUILDING_DONATE = 'WEALTH_BUILDING_DONATE',
  FBT_STAKE = 'FBT_STAKE',
  FBT_UNSTAKE = 'FBT_UNSTAKE',
  FBT_VEST_CLAIM = 'FBT_VEST_CLAIM',
  DAO_VOTE = 'DAO_VOTE',
  YIELD_HARVEST = 'YIELD_HARVEST',
  STOCK_CLAIM = 'STOCK_CLAIM',
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: ActivityType;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface PaginatedActivityLogs {
  items: ActivityLog[];
  total: number;
  hasMore: boolean;
}

/**
 * Service for logging and retrieving user activities
 * Used for analytics, audit trails, and activity feeds
 */
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Logging Methods ====================

  /**
   * Log a user activity
   */
  async logActivity(
    userId: string | undefined,
    action: ActivityType,
    entityId?: string,
    entityType?: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ActivityLog> {
    try {
      const activity = await this.prisma.activityLog.create({
        data: {
          userId,
          action: action as PrismaActivityType,
          entityId,
          entityType,
          metadata: (metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          ipAddress,
          userAgent,
        },
      });

      this.logger.debug(
        `Activity logged: ${action} by user ${userId || 'anonymous'}`,
      );

      return this.mapToActivityLog(activity);
    } catch (error) {
      this.logger.error(`Failed to log activity: ${error}`);
      throw error;
    }
  }

  /**
   * Log multiple activities in a batch
   */
  async logActivities(
    activities: Array<{
      userId?: string;
      action: ActivityType;
      entityId?: string;
      entityType?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }>,
  ): Promise<number> {
    try {
      const result = await this.prisma.activityLog.createMany({
        data: activities.map((a) => ({
          userId: a.userId,
          action: a.action as PrismaActivityType,
          entityId: a.entityId,
          entityType: a.entityType,
          metadata: (a.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          ipAddress: a.ipAddress,
          userAgent: a.userAgent,
        })),
      });

      this.logger.debug(`Batch logged ${result.count} activities`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to batch log activities: ${error}`);
      throw error;
    }
  }

  // ==================== Query Methods ====================

  /**
   * Get user's activity history
   */
  async getUserActivity(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedActivityLogs> {
    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityLog.count({ where: { userId } }),
    ]);

    return {
      items: activities.map((a) => this.mapToActivityLog(a)),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get activities by type
   */
  async getActivityByType(
    action: ActivityType,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedActivityLogs> {
    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { action: action as PrismaActivityType },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityLog.count({
        where: { action: action as PrismaActivityType },
      }),
    ]);

    return {
      items: activities.map((a) => this.mapToActivityLog(a)),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get recent platform activity
   */
  async getRecentActivity(limit: number = 50): Promise<ActivityLog[]> {
    const activities = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map((a) => this.mapToActivityLog(a));
  }

  /**
   * Get activity for a specific entity
   */
  async getEntityActivity(
    entityType: string,
    entityId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedActivityLogs> {
    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityLog.count({ where: { entityType, entityId } }),
    ]);

    return {
      items: activities.map((a) => this.mapToActivityLog(a)),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get activity count for a user within a time period
   */
  async getUserActivityCount(
    userId: string,
    action?: ActivityType,
    since?: Date,
  ): Promise<number> {
    const where: Prisma.ActivityLogWhereInput = {
      userId,
      ...(action && { action: action as PrismaActivityType }),
      ...(since && { createdAt: { gte: since } }),
    };

    return this.prisma.activityLog.count({ where });
  }

  /**
   * Get activity summary for analytics
   */
  async getActivitySummary(
    since: Date,
    until?: Date,
  ): Promise<Record<ActivityType, number>> {
    const where: Prisma.ActivityLogWhereInput = {
      createdAt: {
        gte: since,
        ...(until && { lte: until }),
      },
    };

    const activities = await this.prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    });

    const summary: Record<string, number> = {};
    for (const activity of activities) {
      summary[activity.action] = activity._count.action;
    }

    return summary as Record<ActivityType, number>;
  }

  /**
   * Get daily active users count
   */
  async getDailyActiveUsers(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.activityLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        userId: { not: null },
      },
    });

    return result.length;
  }

  // ==================== Convenience Logging Methods ====================

  /**
   * Log post creation
   */
  async logPostCreate(userId: string, postId: string): Promise<void> {
    await this.logActivity(userId, ActivityType.POST_CREATE, postId, 'post');
  }

  /**
   * Log post view
   */
  async logPostView(userId: string | undefined, postId: string): Promise<void> {
    await this.logActivity(userId, ActivityType.POST_VIEW, postId, 'post');
  }

  /**
   * Log post like
   */
  async logPostLike(userId: string, postId: string): Promise<void> {
    await this.logActivity(userId, ActivityType.POST_LIKE, postId, 'post');
  }

  /**
   * Log follow action
   */
  async logFollow(followerId: string, followingId: string): Promise<void> {
    await this.logActivity(
      followerId,
      ActivityType.FOLLOW,
      followingId,
      'user',
    );
  }

  /**
   * Log unfollow action
   */
  async logUnfollow(followerId: string, followingId: string): Promise<void> {
    await this.logActivity(
      followerId,
      ActivityType.UNFOLLOW,
      followingId,
      'user',
    );
  }

  /**
   * Log donation creation
   */
  async logDonation(
    donorId: string,
    fundraiserId: string,
    amount: string,
  ): Promise<void> {
    await this.logActivity(
      donorId,
      ActivityType.DONATION_CREATE,
      fundraiserId,
      'fundraiser',
      { amount },
    );
  }

  /**
   * Log stake creation
   */
  async logStake(
    stakerId: string,
    fundraiserId: string,
    amount: string,
  ): Promise<void> {
    await this.logActivity(
      stakerId,
      ActivityType.STAKE_CREATE,
      fundraiserId,
      'fundraiser',
      { amount },
    );
  }

  /**
   * Log Impact DAO stake
   */
  async logImpactDAOStake(userId: string, amount: string): Promise<void> {
    await this.logActivity(
      userId,
      ActivityType.IMPACT_DAO_STAKE,
      undefined,
      'impact_dao',
      { amount },
    );
  }

  /**
   * Log wealth building donation
   */
  async logWealthBuildingDonate(
    donorId: string,
    fundraiserId: string,
    amount: string,
  ): Promise<void> {
    await this.logActivity(
      donorId,
      ActivityType.WEALTH_BUILDING_DONATE,
      fundraiserId,
      'fundraiser',
      { amount },
    );
  }

  /**
   * Log FBT vest claim
   */
  async logFBTVestClaim(userId: string, amount: string): Promise<void> {
    await this.logActivity(
      userId,
      ActivityType.FBT_VEST_CLAIM,
      undefined,
      'fbt',
      { amount },
    );
  }

  /**
   * Log DAO vote
   */
  async logDAOVote(
    voterId: string,
    proposalId: string,
    vote: string,
  ): Promise<void> {
    await this.logActivity(
      voterId,
      ActivityType.DAO_VOTE,
      proposalId,
      'proposal',
      { vote },
    );
  }

  /**
   * Log yield harvest
   */
  async logYieldHarvest(
    userId: string,
    source: string,
    amount: string,
  ): Promise<void> {
    await this.logActivity(
      userId,
      ActivityType.YIELD_HARVEST,
      undefined,
      source,
      { amount },
    );
  }

  /**
   * Log profile view
   */
  async logProfileView(
    viewerId: string | undefined,
    profileId: string,
  ): Promise<void> {
    await this.logActivity(
      viewerId,
      ActivityType.PROFILE_VIEW,
      profileId,
      'user',
    );
  }

  /**
   * Log fundraiser view
   */
  async logFundraiserView(
    viewerId: string | undefined,
    fundraiserId: string,
  ): Promise<void> {
    await this.logActivity(
      viewerId,
      ActivityType.FUNDRAISER_VIEW,
      fundraiserId,
      'fundraiser',
    );
  }

  /**
   * Log search action
   */
  async logSearch(userId: string | undefined, query: string): Promise<void> {
    await this.logActivity(userId, ActivityType.SEARCH, undefined, 'search', {
      query,
    });
  }

  // ==================== Cleanup Methods ====================

  /**
   * Delete old activity logs (for cleanup jobs)
   */
  async deleteOldActivities(olderThan: Date): Promise<number> {
    const result = await this.prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: olderThan },
      },
    });

    this.logger.log(`Deleted ${result.count} old activity logs`);
    return result.count;
  }

  // ==================== Helper Methods ====================

  /**
   * Map Prisma activity log to interface
   */
  private mapToActivityLog(
    activity: Prisma.ActivityLogGetPayload<object>,
  ): ActivityLog {
    return {
      id: activity.id,
      userId: activity.userId ?? undefined,
      action: activity.action as ActivityType,
      entityId: activity.entityId ?? undefined,
      entityType: activity.entityType ?? undefined,
      metadata: activity.metadata as Record<string, unknown> | undefined,
      ipAddress: activity.ipAddress ?? undefined,
      userAgent: activity.userAgent ?? undefined,
      createdAt: activity.createdAt,
    };
  }
}
