import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  PaginatedNotifications,
  NotificationCount,
  NotificationOperationResult,
  NotificationType,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  walletAddress: string;
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ==================== GET Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 20, max: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination (default: 0)' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Filter to unread only (default: false)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated notifications',
    type: PaginatedNotifications,
  })
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<PaginatedNotifications> {
    return this.notificationsService.getNotifications(user.id, {
      limit: Math.min(limit, 50),
      offset,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('count')
  @ApiOperation({ summary: 'Get notification counts (total and unread)' })
  @ApiResponse({
    status: 200,
    description: 'Returns notification counts',
    type: NotificationCount,
  })
  async getNotificationCounts(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationCount> {
    return this.notificationsService.getNotificationCounts(user.id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Returns unread count',
  })
  async getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single notification by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns notification details',
    type: Notification,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<Notification | null> {
    return this.notificationsService.getNotificationById(id, user.id);
  }

  // ==================== PUT Endpoints ====================

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationOperationResult,
  })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.markAsRead(id, user.id);
  }

  // ==================== POST Endpoints ====================

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    type: NotificationOperationResult,
  })
  async markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post('read-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read',
    type: NotificationOperationResult,
  })
  async markMultipleAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Body('notificationIds') notificationIds: string[],
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.markMultipleAsRead(notificationIds, user.id);
  }

  // ==================== DELETE Endpoints ====================

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted',
    type: NotificationOperationResult,
  })
  async deleteNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.deleteNotification(id, user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({
    status: 200,
    description: 'All notifications deleted',
    type: NotificationOperationResult,
  })
  async deleteAllNotifications(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationOperationResult> {
    return this.notificationsService.deleteAllNotifications(user.id);
  }
}
