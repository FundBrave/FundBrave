import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ReportReason,
  ReportStatus,
  ModerationAction,
} from './dto/moderation.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock data
const mockReporter = {
  id: 'reporter-1',
  walletAddress: '0x1111111111111111111111111111111111111111',
  username: 'reporter',
  displayName: 'Reporter User',
};

const mockReportedUser = {
  id: 'reported-1',
  walletAddress: '0x2222222222222222222222222222222222222222',
  username: 'reported',
  displayName: 'Reported User',
  isSuspended: false,
  isBanned: false,
};

const mockPost = {
  id: 'post-1',
  authorId: mockReportedUser.id,
  content: 'Reported post content',
  isHidden: false,
  author: mockReportedUser,
};

const mockReport = {
  id: 'report-1',
  reporterId: mockReporter.id,
  targetType: 'Post',
  targetId: mockPost.id,
  reason: ReportReason.SPAM,
  description: 'This is spam content',
  status: ReportStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
  resolvedBy: null,
  resolution: null,
  actionTaken: null,
  reporter: mockReporter,
};

const mockModerator = {
  id: 'moderator-1',
  walletAddress: '0x3333333333333333333333333333333333333333',
  username: 'moderator',
  displayName: 'Moderator User',
  verificationBadge: 'MODERATOR',
};

// Create mock Prisma service
const createMockPrismaService = () => ({
  report: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  comment: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  fundraiser: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

// Create mock NotificationsService
const createMockNotificationsService = () => ({
  createNotification: jest.fn(),
});

describe('ModerationService', () => {
  let service: ModerationService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let notificationsService: ReturnType<typeof createMockNotificationsService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    notificationsService = createMockNotificationsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a new report', async () => {
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.report.findFirst.mockResolvedValue(null); // No duplicate report
      prismaService.report.create.mockResolvedValue(mockReport);

      const result = await service.createReport(mockReporter.id, {
        targetType: 'Post',
        targetId: mockPost.id,
        reason: ReportReason.SPAM,
        description: 'This is spam content',
      });

      expect(result).toEqual(mockReport);
      expect(prismaService.report.create).toHaveBeenCalledWith({
        data: {
          reporterId: mockReporter.id,
          targetType: 'Post',
          targetId: mockPost.id,
          reason: ReportReason.SPAM,
          description: 'This is spam content',
        },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when target does not exist', async () => {
      prismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.createReport(mockReporter.id, {
          targetType: 'Post',
          targetId: 'non-existent',
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when reporting own content', async () => {
      const ownPost = { ...mockPost, authorId: mockReporter.id };
      prismaService.post.findUnique.mockResolvedValue(ownPost);

      await expect(
        service.createReport(mockReporter.id, {
          targetType: 'Post',
          targetId: ownPost.id,
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when duplicate report exists', async () => {
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.report.findFirst.mockResolvedValue(mockReport); // Duplicate exists

      await expect(
        service.createReport(mockReporter.id, {
          targetType: 'Post',
          targetId: mockPost.id,
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getReports', () => {
    it('should return paginated reports', async () => {
      const reports = [mockReport];
      prismaService.report.findMany.mockResolvedValue(reports);
      prismaService.report.count.mockResolvedValue(1);

      const result = await service.getReports({
        limit: 20,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should filter reports by status', async () => {
      prismaService.report.findMany.mockResolvedValue([]);
      prismaService.report.count.mockResolvedValue(0);

      await service.getReports({
        limit: 20,
        offset: 0,
        status: ReportStatus.PENDING,
      });

      expect(prismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReportStatus.PENDING },
        }),
      );
    });

    it('should filter reports by target type', async () => {
      prismaService.report.findMany.mockResolvedValue([]);
      prismaService.report.count.mockResolvedValue(0);

      await service.getReports({
        limit: 20,
        offset: 0,
        targetType: 'Post',
      });

      expect(prismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { targetType: 'Post' },
        }),
      );
    });

    it('should filter reports by reason', async () => {
      prismaService.report.findMany.mockResolvedValue([]);
      prismaService.report.count.mockResolvedValue(0);

      await service.getReports({
        limit: 20,
        offset: 0,
        reason: ReportReason.SCAM,
      });

      expect(prismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reason: ReportReason.SCAM },
        }),
      );
    });
  });

  describe('reviewReport', () => {
    it('should review a report with NO_ACTION', async () => {
      const reviewedReport = {
        ...mockReport,
        status: ReportStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: mockModerator.id,
        resolution: 'No violation found',
        actionTaken: ModerationAction.NO_ACTION,
      };
      prismaService.report.findUnique.mockResolvedValue(mockReport);
      prismaService.report.update.mockResolvedValue(reviewedReport);

      const result = await service.reviewReport(mockModerator.id, {
        reportId: mockReport.id,
        action: ModerationAction.NO_ACTION,
        resolution: 'No violation found',
      });

      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(result.actionTaken).toBe(ModerationAction.NO_ACTION);
      expect(result.resolvedBy).toBe(mockModerator.id);
    });

    it('should review a report with WARNING action', async () => {
      prismaService.report.findUnique.mockResolvedValue(mockReport);
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
        actionTaken: ModerationAction.WARNING,
      });
      notificationsService.createNotification.mockResolvedValue({});

      await service.reviewReport(mockModerator.id, {
        reportId: mockReport.id,
        action: ModerationAction.WARNING,
        resolution: 'Warning issued to user',
      });

      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MODERATION_WARNING',
          userId: mockPost.authorId,
        }),
      );
    });

    it('should review a report with HIDE_POST action', async () => {
      prismaService.report.findUnique.mockResolvedValue(mockReport);
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.post.update.mockResolvedValue({
        ...mockPost,
        isHidden: true,
      });
      prismaService.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
        actionTaken: ModerationAction.HIDE_POST,
      });

      await service.reviewReport(mockModerator.id, {
        reportId: mockReport.id,
        action: ModerationAction.HIDE_POST,
        resolution: 'Post hidden due to policy violation',
      });

      expect(prismaService.post.update).toHaveBeenCalledWith({
        where: { id: mockPost.id },
        data: { isHidden: true },
      });
    });

    it('should review a report with REMOVE_POST action', async () => {
      prismaService.report.findUnique.mockResolvedValue(mockReport);
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.post.delete.mockResolvedValue(mockPost);
      prismaService.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
        actionTaken: ModerationAction.REMOVE_POST,
      });

      await service.reviewReport(mockModerator.id, {
        reportId: mockReport.id,
        action: ModerationAction.REMOVE_POST,
        resolution: 'Post removed due to severe violation',
      });

      expect(prismaService.post.delete).toHaveBeenCalledWith({
        where: { id: mockPost.id },
      });
    });

    it('should review a report with SUSPEND_USER action', async () => {
      prismaService.report.findUnique.mockResolvedValue(mockReport);
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.user.update.mockResolvedValue({
        ...mockReportedUser,
        isSuspended: true,
        suspendedUntil: expect.any(Date),
      });
      prismaService.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
        actionTaken: ModerationAction.SUSPEND_USER,
      });

      await service.reviewReport(mockModerator.id, {
        reportId: mockReport.id,
        action: ModerationAction.SUSPEND_USER,
        resolution: 'User suspended for 7 days',
        suspensionDays: 7,
      });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockPost.authorId },
        data: {
          isSuspended: true,
          suspendedUntil: expect.any(Date),
        },
      });
    });

    it('should review a report with BAN_USER action', async () => {
      prismaService.report.findUnique.mockResolvedValue(mockReport);
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.user.update.mockResolvedValue({
        ...mockReportedUser,
        isBanned: true,
      });
      prismaService.report.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
        actionTaken: ModerationAction.BAN_USER,
      });

      await service.reviewReport(mockModerator.id, {
        reportId: mockReport.id,
        action: ModerationAction.BAN_USER,
        resolution: 'User permanently banned',
      });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockPost.authorId },
        data: { isBanned: true },
      });
    });

    it('should throw NotFoundException when report does not exist', async () => {
      prismaService.report.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewReport(mockModerator.id, {
          reportId: 'non-existent',
          action: ModerationAction.NO_ACTION,
          resolution: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when report is already resolved', async () => {
      prismaService.report.findUnique.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
      });

      await expect(
        service.reviewReport(mockModerator.id, {
          reportId: mockReport.id,
          action: ModerationAction.NO_ACTION,
          resolution: 'Test',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getModerationStats', () => {
    it('should return moderation statistics', async () => {
      prismaService.report.count
        .mockResolvedValueOnce(100) // Total reports
        .mockResolvedValueOnce(30) // Pending reports
        .mockResolvedValueOnce(60) // Resolved reports
        .mockResolvedValueOnce(10); // Dismissed reports

      prismaService.report.groupBy.mockResolvedValue([
        { reason: ReportReason.SPAM, _count: { reason: 40 } },
        { reason: ReportReason.HARASSMENT, _count: { reason: 30 } },
        { reason: ReportReason.SCAM, _count: { reason: 20 } },
        { reason: ReportReason.INAPPROPRIATE, _count: { reason: 10 } },
      ]);

      const result = await service.getModerationStats();

      expect(result.totalReports).toBe(100);
      expect(result.pendingReports).toBe(30);
      expect(result.resolvedReports).toBe(60);
      expect(result.dismissedReports).toBe(10);
      expect(result.reportsByReason).toEqual({
        [ReportReason.SPAM]: 40,
        [ReportReason.HARASSMENT]: 30,
        [ReportReason.SCAM]: 20,
        [ReportReason.INAPPROPRIATE]: 10,
      });
    });
  });

  describe('getReportsByTarget', () => {
    it('should return all reports for a specific target', async () => {
      const reports = [mockReport];
      prismaService.report.findMany.mockResolvedValue(reports);

      const result = await service.getReportsByTarget('Post', mockPost.id);

      expect(result).toEqual(reports);
      expect(prismaService.report.findMany).toHaveBeenCalledWith({
        where: {
          targetType: 'Post',
          targetId: mockPost.id,
        },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getUserReportHistory', () => {
    it('should return reports filed by a user', async () => {
      const reports = [mockReport];
      prismaService.report.findMany.mockResolvedValue(reports);
      prismaService.report.count.mockResolvedValue(1);

      const result = await service.getUserReportHistory(mockReporter.id, {
        limit: 20,
        offset: 0,
      });

      expect(result.items).toEqual(reports);
      expect(result.total).toBe(1);
      expect(prismaService.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reporterId: mockReporter.id },
        }),
      );
    });
  });
});
