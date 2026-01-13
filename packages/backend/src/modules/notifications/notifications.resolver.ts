import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  PaginatedNotifications,
  NotificationCount,
  NotificationOperationResult,
  GetNotificationsInput,
  MarkNotificationsReadInput,
  NotificationType,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ==================== Queries ====================

  @Query(() => PaginatedNotifications, { name: 'notifications' })
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @CurrentUser() user: { id: string },
    @Args('input', { nullable: true }) input?: GetNotificationsInput,
  ): Promise<PaginatedNotifications> {
    const defaultInput: GetNotificationsInput = {
      limit: 20,
      offset: 0,
      unreadOnly: false,
      types: undefined,
      ...input,
    };
    return this.notificationsService.getNotifications(user.id, defaultInput);
  }

  @Query(() => Notification, { name: 'notification', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getNotification(
    @CurrentUser() user: { id: string },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Notification | null> {
    return this.notificationsService.getNotificationById(id, user.id);
  }

  @Query(() => Int, { name: 'unreadNotificationCount' })
  @UseGuards(JwtAuthGuard)
  async getUnreadNotificationCount(
    @CurrentUser() user: { id: string },
  ): Promise<number> {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Query(() => NotificationCount, { name: 'notificationCounts' })
  @UseGuards(JwtAuthGuard)
  async getNotificationCounts(
    @CurrentUser() user: { id: string },
  ): Promise<NotificationCount> {
    return this.notificationsService.getNotificationCounts(user.id);
  }

  @Query(() => PaginatedNotifications, { name: 'unreadNotifications' })
  @UseGuards(JwtAuthGuard)
  async getUnreadNotifications(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedNotifications> {
    return this.notificationsService.getNotifications(user.id, {
      limit,
      offset,
      unreadOnly: true,
    });
  }

  @Query(() => PaginatedNotifications, { name: 'notificationsByType' })
  @UseGuards(JwtAuthGuard)
  async getNotificationsByType(
    @CurrentUser() user: { id: string },
    @Args('types', { type: () => [NotificationType] })
    types: NotificationType[],
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedNotifications> {
    return this.notificationsService.getNotifications(user.id, {
      limit,
      offset,
      types,
    });
  }

  // ==================== Mutations ====================

  @Mutation(() => NotificationOperationResult)
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(
    @CurrentUser() user: { id: string },
    @Args('notificationId', { type: () => ID }) notificationId: string,
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.markAsRead(notificationId, user.id);
  }

  @Mutation(() => NotificationOperationResult)
  @UseGuards(JwtAuthGuard)
  async markNotificationsAsRead(
    @CurrentUser() user: { id: string },
    @Args('input') input: MarkNotificationsReadInput,
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.markMultipleAsRead(
      input.notificationIds,
      user.id,
    );
  }

  @Mutation(() => NotificationOperationResult)
  @UseGuards(JwtAuthGuard)
  async markAllNotificationsAsRead(
    @CurrentUser() user: { id: string },
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Mutation(() => NotificationOperationResult)
  @UseGuards(JwtAuthGuard)
  async deleteNotification(
    @CurrentUser() user: { id: string },
    @Args('notificationId', { type: () => ID }) notificationId: string,
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.deleteNotification(
      notificationId,
      user.id,
    );
  }

  @Mutation(() => NotificationOperationResult)
  @UseGuards(JwtAuthGuard)
  async deleteAllNotifications(
    @CurrentUser() user: { id: string },
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.deleteAllNotifications(user.id);
  }
}
