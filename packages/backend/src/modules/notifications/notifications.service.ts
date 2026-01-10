import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, NotificationType as PrismaNotificationType } from '@prisma/client';
import {
  Notification,
  NotificationActor,
  PaginatedNotifications,
  NotificationCount,
  NotificationOperationResult,
  NotificationType,
  GetNotificationsInput,
} from './dto';
import { EventsGateway } from '../websockets/events.gateway';

// Type for Prisma notification with relations
type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: {
    actor: {
      select: {
        id: true;
        walletAddress: true;
        username: true;
        displayName: true;
        avatarUrl: true;
      };
    };
  };
}>;

/**
 * Service for managing notifications
 * Handles creation, retrieval, and management of user notifications
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ==================== Query Methods ====================

  /**
   * Get notifications for a user with pagination
   */
  async getNotifications(
    userId: string,
    input: GetNotificationsInput,
  ): Promise<PaginatedNotifications> {
    const { limit, offset, unreadOnly, types } = input;

    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
      ...(unreadOnly && { read: false }),
      ...(types && types.length > 0 && { type: { in: types as PrismaNotificationType[] } }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientId: userId, read: false },
      }),
    ]);

    const items = notifications.map((n) => this.mapToNotificationDto(n));

    return {
      items,
      total,
      hasMore: offset + limit < total,
      unreadCount,
    };
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      include: {
        actor: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!notification) {
      return null;
    }

    return this.mapToNotificationDto(notification);
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });
  }

  /**
   * Get notification counts (total and unread)
   */
  async getNotificationCounts(userId: string): Promise<NotificationCount> {
    const [total, unread] = await Promise.all([
      this.prisma.notification.count({
        where: { recipientId: userId },
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, read: false },
      }),
    ]);

    return { total, unread };
  }

  // ==================== Mutation Methods ====================

  /**
   * Create a notification
   */
  async createNotification(
    recipientId: string,
    type: NotificationType,
    actorId?: string,
    entityId?: string,
    entityType?: string,
    metadata?: Record<string, unknown>,
    title?: string,
    message?: string,
  ): Promise<Notification> {
    // Don't notify self
    if (actorId && actorId === recipientId) {
      this.logger.debug(`Skipping self-notification for user ${recipientId}`);
      throw new Error('Cannot create notification for self');
    }

    // Check if user wants this notification type
    const settings = await this.prisma.notificationSetting.findUnique({
      where: { userId: recipientId },
    });

    if (settings && !this.shouldNotify(settings, type)) {
      this.logger.debug(
        `User ${recipientId} has disabled notifications for type ${type}`,
      );
      throw new Error('User has disabled this notification type');
    }

    const notification = await this.prisma.notification.create({
      data: {
        recipientId,
        actorId,
        type: type as PrismaNotificationType,
        title: title || this.getDefaultTitle(type),
        message: message || this.getDefaultMessage(type),
        entityId,
        entityType,
        metadata: (metadata as Prisma.InputJsonValue) || undefined,
      },
      include: {
        actor: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const notificationDto = this.mapToNotificationDto(notification);

    // Emit real-time notification via WebSocket
    this.eventsGateway.emitNotification(recipientId, {
      id: notification.id,
      type: notification.type,
      title: notification.title || '',
      message: notification.message || '',
      link: this.getNotificationLink(type, entityId, entityType),
      createdAt: notification.createdAt,
    });

    this.logger.log(
      `Created notification ${notification.id} of type ${type} for user ${recipientId}`,
    );

    return notificationDto;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationOperationResult> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    if (notification.read) {
      return {
        success: true,
        message: 'Notification already read',
      };
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Notification marked as read',
      affectedCount: 1,
    };
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(
    notificationIds: string[],
    userId: string,
  ): Promise<NotificationOperationResult> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        recipientId: userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: `${result.count} notifications marked as read`,
      affectedCount: result.count,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<NotificationOperationResult> {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: `${result.count} notifications marked as read`,
      affectedCount: result.count,
    };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<NotificationOperationResult> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      message: 'Notification deleted',
      affectedCount: 1,
    };
  }

  /**
   * Delete all notifications for a user (cleanup)
   */
  async deleteAllNotifications(userId: string): Promise<NotificationOperationResult> {
    const result = await this.prisma.notification.deleteMany({
      where: { recipientId: userId },
    });

    return {
      success: true,
      message: `${result.count} notifications deleted`,
      affectedCount: result.count,
    };
  }

  // ==================== Notification Creation Helpers ====================

  /**
   * Create a like notification
   */
  async notifyLike(
    recipientId: string,
    actorId: string,
    postId: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.LIKE,
        actorId,
        postId,
        'post',
        undefined,
        'New Like',
        'Someone liked your post',
      );
    } catch (error) {
      this.logger.debug(`Like notification skipped: ${error}`);
    }
  }

  /**
   * Create a comment notification
   */
  async notifyComment(
    recipientId: string,
    actorId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.COMMENT,
        actorId,
        postId,
        'post',
        { commentId },
        'New Comment',
        'Someone commented on your post',
      );
    } catch (error) {
      this.logger.debug(`Comment notification skipped: ${error}`);
    }
  }

  /**
   * Create a repost notification
   */
  async notifyRepost(
    recipientId: string,
    actorId: string,
    postId: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.REPOST,
        actorId,
        postId,
        'post',
        undefined,
        'New Repost',
        'Someone reposted your post',
      );
    } catch (error) {
      this.logger.debug(`Repost notification skipped: ${error}`);
    }
  }

  /**
   * Create a follow notification
   */
  async notifyFollow(recipientId: string, actorId: string): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.FOLLOW,
        actorId,
        actorId,
        'user',
        undefined,
        'New Follower',
        'Someone started following you',
      );
    } catch (error) {
      this.logger.debug(`Follow notification skipped: ${error}`);
    }
  }

  /**
   * Create a mention notification
   */
  async notifyMention(
    recipientId: string,
    actorId: string,
    postId: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.MENTION,
        actorId,
        postId,
        'post',
        undefined,
        'New Mention',
        'You were mentioned in a post',
      );
    } catch (error) {
      this.logger.debug(`Mention notification skipped: ${error}`);
    }
  }

  /**
   * Create a donation received notification
   */
  async notifyDonation(
    recipientId: string,
    donorId: string,
    fundraiserId: string,
    amount: string,
    token: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.DONATION_RECEIVED,
        donorId,
        fundraiserId,
        'fundraiser',
        { amount, token },
        'New Donation',
        `Someone donated ${amount} ${token} to your fundraiser`,
      );
    } catch (error) {
      this.logger.debug(`Donation notification skipped: ${error}`);
    }
  }

  /**
   * Create a stake received notification
   */
  async notifyStake(
    recipientId: string,
    stakerId: string,
    fundraiserId: string,
    amount: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.STAKE_RECEIVED,
        stakerId,
        fundraiserId,
        'fundraiser',
        { amount },
        'New Stake',
        `Someone staked ${amount} USDC for your fundraiser`,
      );
    } catch (error) {
      this.logger.debug(`Stake notification skipped: ${error}`);
    }
  }

  /**
   * Create a goal reached notification
   */
  async notifyGoalReached(
    recipientId: string,
    fundraiserId: string,
    goalAmount: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.GOAL_REACHED,
        undefined,
        fundraiserId,
        'fundraiser',
        { goalAmount },
        'Goal Reached!',
        `Your fundraiser reached its goal of ${goalAmount} USDC!`,
      );
    } catch (error) {
      this.logger.debug(`Goal reached notification skipped: ${error}`);
    }
  }

  /**
   * Create a message notification
   */
  async notifyMessage(
    recipientId: string,
    senderId: string,
    conversationId: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.MESSAGE,
        senderId,
        conversationId,
        'conversation',
        undefined,
        'New Message',
        'You have a new message',
      );
    } catch (error) {
      this.logger.debug(`Message notification skipped: ${error}`);
    }
  }

  /**
   * Create a yield harvested notification
   */
  async notifyYieldHarvested(
    recipientId: string,
    amount: string,
    source: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.YIELD_HARVESTED,
        undefined,
        undefined,
        source,
        { amount },
        'Yield Harvested',
        `${amount} USDC yield has been harvested from your stake`,
      );
    } catch (error) {
      this.logger.debug(`Yield harvested notification skipped: ${error}`);
    }
  }

  /**
   * Create a stock purchased notification
   */
  async notifyStockPurchased(
    recipientId: string,
    stockSymbol: string,
    amount: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.STOCK_PURCHASED,
        undefined,
        undefined,
        'stock',
        { stockSymbol, amount },
        'Stock Purchased',
        `${amount} ${stockSymbol} tokens have been added to your portfolio`,
      );
    } catch (error) {
      this.logger.debug(`Stock purchased notification skipped: ${error}`);
    }
  }

  /**
   * Create a FBT vested notification
   */
  async notifyFBTVested(
    recipientId: string,
    amount: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.FBT_VESTED,
        undefined,
        undefined,
        'fbt',
        { amount },
        'FBT Tokens Vested',
        `${amount} FBT tokens are now claimable`,
      );
    } catch (error) {
      this.logger.debug(`FBT vested notification skipped: ${error}`);
    }
  }

  /**
   * Create a FBT reward notification
   */
  async notifyFBTReward(
    recipientId: string,
    amount: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.FBT_REWARD,
        undefined,
        undefined,
        'fbt',
        { amount, reason },
        'FBT Reward',
        `You earned ${amount} FBT for ${reason}`,
      );
    } catch (error) {
      this.logger.debug(`FBT reward notification skipped: ${error}`);
    }
  }

  /**
   * Create a DAO vote started notification
   */
  async notifyDAOVoteStarted(
    recipientId: string,
    proposalId: string,
    proposalTitle: string,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.DAO_VOTE_STARTED,
        undefined,
        proposalId,
        'proposal',
        { proposalTitle },
        'New DAO Proposal',
        `A new proposal is open for voting: ${proposalTitle}`,
      );
    } catch (error) {
      this.logger.debug(`DAO vote started notification skipped: ${error}`);
    }
  }

  /**
   * Create a DAO vote ended notification
   */
  async notifyDAOVoteEnded(
    recipientId: string,
    proposalId: string,
    proposalTitle: string,
    result: 'passed' | 'rejected',
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.DAO_VOTE_ENDED,
        undefined,
        proposalId,
        'proposal',
        { proposalTitle, result },
        'DAO Vote Ended',
        `The proposal "${proposalTitle}" has ${result}`,
      );
    } catch (error) {
      this.logger.debug(`DAO vote ended notification skipped: ${error}`);
    }
  }

  /**
   * Create a system notification
   */
  async notifySystem(
    recipientId: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.createNotification(
        recipientId,
        NotificationType.SYSTEM,
        undefined,
        undefined,
        'system',
        metadata,
        title,
        message,
      );
    } catch (error) {
      this.logger.debug(`System notification skipped: ${error}`);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Check if user wants to receive a notification type
   */
  private shouldNotify(
    settings: {
      notifyOnLike: boolean;
      notifyOnComment: boolean;
      notifyOnFollow: boolean;
      notifyOnMention: boolean;
      notifyOnDonation: boolean;
      notifyOnStake: boolean;
      notifyOnYieldHarvest: boolean;
      notifyOnStockPurchase: boolean;
      notifyOnFBTVesting: boolean;
      notifyOnDAOProposal: boolean;
    },
    type: NotificationType,
  ): boolean {
    const mapping: Record<NotificationType, boolean> = {
      [NotificationType.LIKE]: settings.notifyOnLike,
      [NotificationType.COMMENT]: settings.notifyOnComment,
      [NotificationType.REPOST]: true, // Always notify
      [NotificationType.FOLLOW]: settings.notifyOnFollow,
      [NotificationType.MENTION]: settings.notifyOnMention,
      [NotificationType.DONATION_RECEIVED]: settings.notifyOnDonation,
      [NotificationType.STAKE_RECEIVED]: settings.notifyOnStake,
      [NotificationType.GOAL_REACHED]: true, // Always notify
      [NotificationType.MILESTONE_REACHED]: true, // Always notify
      [NotificationType.PROPOSAL_CREATED]: settings.notifyOnDAOProposal,
      [NotificationType.PROPOSAL_EXECUTED]: settings.notifyOnDAOProposal,
      [NotificationType.MESSAGE]: true, // Always notify
      [NotificationType.SYSTEM]: true, // Always notify
      [NotificationType.YIELD_HARVESTED]: settings.notifyOnYieldHarvest,
      [NotificationType.STOCK_PURCHASED]: settings.notifyOnStockPurchase,
      [NotificationType.FBT_VESTED]: settings.notifyOnFBTVesting,
      [NotificationType.FBT_REWARD]: settings.notifyOnFBTVesting,
      [NotificationType.DAO_VOTE_STARTED]: settings.notifyOnDAOProposal,
      [NotificationType.DAO_VOTE_ENDED]: settings.notifyOnDAOProposal,
    };

    return mapping[type] ?? true;
  }

  /**
   * Get default title for notification type
   */
  private getDefaultTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.LIKE]: 'New Like',
      [NotificationType.COMMENT]: 'New Comment',
      [NotificationType.REPOST]: 'New Repost',
      [NotificationType.FOLLOW]: 'New Follower',
      [NotificationType.MENTION]: 'You were mentioned',
      [NotificationType.DONATION_RECEIVED]: 'New Donation',
      [NotificationType.STAKE_RECEIVED]: 'New Stake',
      [NotificationType.GOAL_REACHED]: 'Goal Reached!',
      [NotificationType.MILESTONE_REACHED]: 'Milestone Reached!',
      [NotificationType.PROPOSAL_CREATED]: 'New Proposal',
      [NotificationType.PROPOSAL_EXECUTED]: 'Proposal Executed',
      [NotificationType.MESSAGE]: 'New Message',
      [NotificationType.SYSTEM]: 'System Notification',
      [NotificationType.YIELD_HARVESTED]: 'Yield Harvested',
      [NotificationType.STOCK_PURCHASED]: 'Stock Purchased',
      [NotificationType.FBT_VESTED]: 'Tokens Vested',
      [NotificationType.FBT_REWARD]: 'FBT Reward',
      [NotificationType.DAO_VOTE_STARTED]: 'Vote Started',
      [NotificationType.DAO_VOTE_ENDED]: 'Vote Ended',
    };

    return titles[type] || 'Notification';
  }

  /**
   * Get default message for notification type
   */
  private getDefaultMessage(type: NotificationType): string {
    const messages: Record<NotificationType, string> = {
      [NotificationType.LIKE]: 'Someone liked your post',
      [NotificationType.COMMENT]: 'Someone commented on your post',
      [NotificationType.REPOST]: 'Someone reposted your content',
      [NotificationType.FOLLOW]: 'Someone started following you',
      [NotificationType.MENTION]: 'You were mentioned in a post',
      [NotificationType.DONATION_RECEIVED]: 'You received a donation',
      [NotificationType.STAKE_RECEIVED]: 'Someone staked for your cause',
      [NotificationType.GOAL_REACHED]: 'Your fundraiser reached its goal!',
      [NotificationType.MILESTONE_REACHED]: 'A milestone has been reached!',
      [NotificationType.PROPOSAL_CREATED]: 'A new proposal needs your vote',
      [NotificationType.PROPOSAL_EXECUTED]: 'A proposal has been executed',
      [NotificationType.MESSAGE]: 'You have a new message',
      [NotificationType.SYSTEM]: 'System notification',
      [NotificationType.YIELD_HARVESTED]: 'Yield has been harvested',
      [NotificationType.STOCK_PURCHASED]: 'Stock tokens added to portfolio',
      [NotificationType.FBT_VESTED]: 'Tokens are available to claim',
      [NotificationType.FBT_REWARD]: 'You earned FBT tokens',
      [NotificationType.DAO_VOTE_STARTED]: 'Voting has started on a proposal',
      [NotificationType.DAO_VOTE_ENDED]: 'Voting has ended on a proposal',
    };

    return messages[type] || 'You have a notification';
  }

  /**
   * Get notification link based on type and entity
   */
  private getNotificationLink(
    type: NotificationType,
    entityId?: string,
    entityType?: string,
  ): string | undefined {
    if (!entityId) return undefined;

    switch (entityType) {
      case 'post':
        return `/posts/${entityId}`;
      case 'user':
        return `/profile/${entityId}`;
      case 'fundraiser':
        return `/fundraisers/${entityId}`;
      case 'conversation':
        return `/messages/${entityId}`;
      case 'proposal':
        return `/dao/proposals/${entityId}`;
      default:
        return undefined;
    }
  }

  /**
   * Map Prisma notification to DTO
   */
  private mapToNotificationDto(
    notification: NotificationWithRelations,
  ): Notification {
    const actor: NotificationActor | undefined = notification.actor
      ? {
          id: notification.actor.id,
          walletAddress: notification.actor.walletAddress,
          username: notification.actor.username ?? undefined,
          displayName: notification.actor.displayName ?? undefined,
          avatarUrl: notification.actor.avatarUrl ?? undefined,
        }
      : undefined;

    return {
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title ?? undefined,
      message: notification.message ?? undefined,
      actor,
      entityId: notification.entityId ?? undefined,
      entityType: notification.entityType ?? undefined,
      metadata: notification.metadata as Record<string, unknown> | undefined,
      read: notification.read,
      readAt: notification.readAt ?? undefined,
      createdAt: notification.createdAt,
    };
  }
}
