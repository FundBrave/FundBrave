import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  ReportReason as PrismaReportReason,
  ReportStatus as PrismaReportStatus,
} from '@prisma/client';
import {
  Report,
  ReportUser,
  ReportedPost,
  PaginatedReports,
  ReportOperationResult,
  ModerationStats,
  ReportReason,
  ReportStatus,
  ModerationAction,
  CreateReportInput,
  GetReportsInput,
  ReviewReportInput,
} from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
  InvalidInputException,
  UnauthorizedException,
} from '../../common/exceptions';

// Type for Prisma report with relations
type ReportWithRelations = Prisma.ReportGetPayload<{
  include: {
    reporter: {
      select: {
        id: true;
        walletAddress: true;
        username: true;
        displayName: true;
        avatarUrl: true;
      };
    };
    reported: {
      select: {
        id: true;
        walletAddress: true;
        username: true;
        displayName: true;
        avatarUrl: true;
      };
    };
    post: {
      select: {
        id: true;
        content: true;
        mediaUrls: true;
        createdAt: true;
      };
    };
  };
}>;

/**
 * Service for content moderation and report management
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ==================== Query Methods ====================

  /**
   * Get reports with filtering (admin only)
   */
  async getReports(input: GetReportsInput): Promise<PaginatedReports> {
    const { limit, offset, status, reason, reportedId } = input;

    const where: Prisma.ReportWhereInput = {
      ...(status && { status: status as PrismaReportStatus }),
      ...(reason && { reason: reason as PrismaReportReason }),
      ...(reportedId && { reportedId }),
    };

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          reported: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              mediaUrls: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.report.count({ where }),
    ]);

    const items = reports.map((r) => this.mapToReportDto(r));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get user's submitted reports
   */
  async getMyReports(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedReports> {
    const where: Prisma.ReportWhereInput = {
      reporterId: userId,
    };

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          reported: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              mediaUrls: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.report.count({ where }),
    ]);

    const items = reports.map((r) => this.mapToReportDto(r));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a single report by ID
   */
  async getReportById(reportId: string): Promise<Report | null> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reported: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            mediaUrls: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      return null;
    }

    return this.mapToReportDto(report);
  }

  /**
   * Get report details for specific content
   */
  async getReportedContent(
    entityType: string,
    entityId: string,
  ): Promise<PaginatedReports> {
    const where: Prisma.ReportWhereInput = {
      entityType,
      entityId,
    };

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          reported: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              mediaUrls: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    const items = reports.map((r) => this.mapToReportDto(r));

    return {
      items,
      total,
      hasMore: false,
    };
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<ModerationStats> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [pendingReports, reviewedToday, resolvedThisWeek, totalReports] =
      await Promise.all([
        this.prisma.report.count({
          where: { status: 'PENDING' },
        }),
        this.prisma.report.count({
          where: {
            status: { in: ['REVIEWED', 'RESOLVED', 'DISMISSED'] },
            resolvedAt: { gte: startOfDay },
          },
        }),
        this.prisma.report.count({
          where: {
            status: 'RESOLVED',
            resolvedAt: { gte: startOfWeek },
          },
        }),
        this.prisma.report.count(),
      ]);

    return {
      pendingReports,
      reviewedToday,
      resolvedThisWeek,
      totalReports,
    };
  }

  /**
   * Check if user has already reported content
   */
  async hasUserReported(
    userId: string,
    reportedId: string,
    entityId?: string,
  ): Promise<boolean> {
    const where: Prisma.ReportWhereInput = {
      reporterId: userId,
      reportedId,
      ...(entityId && { entityId }),
    };

    const count = await this.prisma.report.count({ where });
    return count > 0;
  }

  // ==================== Mutation Methods ====================

  /**
   * Create a new report
   */
  async createReport(
    reporterId: string,
    input: CreateReportInput,
  ): Promise<ReportOperationResult> {
    const { reportedId, reason, description, postId, entityId, entityType } =
      input;

    // Prevent self-reporting
    if (reporterId === reportedId) {
      throw new InvalidInputException('You cannot report yourself');
    }

    // Check if user exists
    const reportedUser = await this.prisma.user.findUnique({
      where: { id: reportedId },
    });

    if (!reportedUser) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check for duplicate report
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reporterId,
        reportedId,
        ...(postId && { postId }),
        ...(entityId && { entityId }),
        status: 'PENDING',
      },
    });

    if (existingReport) {
      return {
        success: false,
        message: 'You have already reported this content',
        reportId: existingReport.id,
      };
    }

    // Create report
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason: reason as PrismaReportReason,
        description,
        postId,
        entityId,
        entityType,
      },
    });

    this.logger.log(
      `Report ${report.id} created by ${reporterId} against ${reportedId} for ${reason}`,
    );

    return {
      success: true,
      message: 'Report submitted successfully',
      reportId: report.id,
    };
  }

  /**
   * Review and act on a report (admin only)
   */
  async reviewReport(
    adminId: string,
    input: ReviewReportInput,
  ): Promise<ReportOperationResult> {
    const {
      reportId,
      status,
      action,
      notes,
      suspensionReason,
      suspensionDays,
    } = input;

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reported: true,
      },
    });

    if (!report) {
      return {
        success: false,
        message: 'Report not found',
      };
    }

    // Update report status
    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as PrismaReportStatus,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    // Take action based on decision
    await this.executeAction(
      report.reportedId,
      action,
      report.postId || undefined,
      suspensionReason,
      suspensionDays,
    );

    // Notify reporter of resolution
    await this.notificationsService.notifySystem(
      report.reporterId,
      'Report Reviewed',
      `Your report has been reviewed and marked as ${status.toLowerCase()}.`,
      { reportId, status },
    );

    this.logger.log(
      `Report ${reportId} reviewed by ${adminId}: ${status}, action: ${action}`,
    );

    return {
      success: true,
      message: `Report ${status.toLowerCase()} with action: ${action}`,
      reportId,
    };
  }

  /**
   * Dismiss a report (admin only)
   */
  async dismissReport(
    adminId: string,
    reportId: string,
  ): Promise<ReportOperationResult> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return {
        success: false,
        message: 'Report not found',
      };
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'DISMISSED',
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    this.logger.log(`Report ${reportId} dismissed by ${adminId}`);

    return {
      success: true,
      message: 'Report dismissed',
      reportId,
    };
  }

  // ==================== Action Execution ====================

  /**
   * Execute moderation action
   */
  private async executeAction(
    userId: string,
    action: ModerationAction,
    postId?: string,
    suspensionReason?: string,
    suspensionDays?: number,
  ): Promise<void> {
    switch (action) {
      case ModerationAction.NONE:
        // No action needed
        break;

      case ModerationAction.WARNING:
        await this.sendWarning(userId);
        break;

      case ModerationAction.HIDE_CONTENT:
        if (postId) {
          await this.hidePost(postId);
        }
        break;

      case ModerationAction.REMOVE_CONTENT:
        if (postId) {
          await this.removePost(postId);
        }
        break;

      case ModerationAction.SUSPEND_USER:
        await this.suspendUser(userId, suspensionReason, suspensionDays);
        break;

      case ModerationAction.BAN_USER:
        await this.banUser(userId);
        break;
    }
  }

  /**
   * Send warning notification to user
   */
  private async sendWarning(userId: string): Promise<void> {
    await this.notificationsService.notifySystem(
      userId,
      'Content Warning',
      'Your content has been flagged for violating community guidelines. Please review our policies to avoid further action.',
    );
  }

  /**
   * Hide a post (set visibility to private)
   */
  private async hidePost(postId: string): Promise<void> {
    await this.prisma.post.update({
      where: { id: postId },
      data: { visibility: 'PRIVATE' },
    });

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (post) {
      await this.notificationsService.notifySystem(
        post.authorId,
        'Content Hidden',
        'One of your posts has been hidden due to a community guidelines violation.',
        { postId },
      );
    }
  }

  /**
   * Remove (delete) a post
   */
  private async removePost(postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (post) {
      await this.prisma.post.delete({
        where: { id: postId },
      });

      await this.notificationsService.notifySystem(
        post.authorId,
        'Content Removed',
        'One of your posts has been removed for violating community guidelines.',
        { postId },
      );
    }
  }

  /**
   * Suspend a user temporarily
   */
  private async suspendUser(
    userId: string,
    reason?: string,
    days?: number,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspensionReason: reason || 'Violation of community guidelines',
      },
    });

    await this.notificationsService.notifySystem(
      userId,
      'Account Suspended',
      `Your account has been suspended${days ? ` for ${days} days` : ''} due to: ${reason || 'Violation of community guidelines'}`,
    );

    // Schedule unsuspension if days specified
    if (days) {
      // In a real implementation, this would use a job queue
      this.logger.log(`User ${userId} suspended for ${days} days`);
    }
  }

  /**
   * Ban a user permanently
   */
  private async banUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        isSuspended: true,
        suspensionReason: 'Permanent ban due to severe violations',
      },
    });

    this.logger.log(`User ${userId} permanently banned`);
  }

  // ==================== Helper Methods ====================

  /**
   * Map Prisma report to DTO
   */
  private mapToReportDto(report: ReportWithRelations): Report {
    const reporter: ReportUser = {
      id: report.reporter.id,
      walletAddress: report.reporter.walletAddress,
      username: report.reporter.username ?? undefined,
      displayName: report.reporter.displayName ?? undefined,
      avatarUrl: report.reporter.avatarUrl ?? undefined,
    };

    const reported: ReportUser = {
      id: report.reported.id,
      walletAddress: report.reported.walletAddress,
      username: report.reported.username ?? undefined,
      displayName: report.reported.displayName ?? undefined,
      avatarUrl: report.reported.avatarUrl ?? undefined,
    };

    const post: ReportedPost | undefined = report.post
      ? {
          id: report.post.id,
          content: report.post.content ?? undefined,
          mediaUrls: report.post.mediaUrls,
          createdAt: report.post.createdAt,
        }
      : undefined;

    return {
      id: report.id,
      reporter,
      reported,
      post,
      entityId: report.entityId ?? undefined,
      entityType: report.entityType ?? undefined,
      reason: report.reason as ReportReason,
      description: report.description ?? undefined,
      status: report.status as ReportStatus,
      resolvedAt: report.resolvedAt ?? undefined,
      resolvedBy: report.resolvedBy ?? undefined,
      createdAt: report.createdAt,
    };
  }
}
