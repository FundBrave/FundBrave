import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../websockets/events.gateway';
import { NotificationType } from './dto/notification.dto';

// Mock data
const mockUser = {
  id: 'user-1',
  walletAddress: '0x1234567890123456789012345678901234567890',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  notificationSettings: {
    id: 'settings-1',
    userId: 'user-1',
    likesEnabled: true,
    commentsEnabled: true,
    mentionsEnabled: true,
    followsEnabled: true,
    donationsEnabled: true,
    proposalsEnabled: true,
    milestonesEnabled: true,
    systemEnabled: true,
    emailNotifications: false,
    pushNotifications: true,
  },
};

const mockActor = {
  id: 'actor-1',
  walletAddress: '0x0987654321098765432109876543210987654321',
  username: 'actoruser',
  displayName: 'Actor User',
  avatarUrl: 'https://example.com/actor-avatar.png',
};

const mockNotification = {
  id: 'notif-1',
  userId: mockUser.id,
  type: NotificationType.LIKE,
  actorId: mockActor.id,
  targetType: 'Post',
  targetId: 'post-1',
  message: 'Actor User liked your post',
  read: false,
  readAt: null,
  createdAt: new Date(),
  actor: mockActor,
};

const mockPost = {
  id: 'post-1',
  authorId: mockUser.id,
  content: 'Test post content',
};

const mockComment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: mockUser.id,
  post: mockPost,
};

// Create mock Prisma service
const createMockPrismaService = () => ({
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  notificationSettings: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
  },
  comment: {
    findUnique: jest.fn(),
  },
  fundraiser: {
    findUnique: jest.fn(),
  },
});

// Create mock EventsGateway
const createMockEventsGateway = () => ({
  emitToUser: jest.fn(),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let eventsGateway: ReturnType<typeof createMockEventsGateway>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    eventsGateway = createMockEventsGateway();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: EventsGateway,
          useValue: eventsGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification and emit via WebSocket', async () => {
      prismaService.notification.create.mockResolvedValue(mockNotification);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.createNotification({
        userId: mockUser.id,
        type: NotificationType.LIKE,
        actorId: mockActor.id,
        targetType: 'Post',
        targetId: 'post-1',
        message: 'Actor User liked your post',
      });

      expect(result).toEqual(mockNotification);
      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          type: NotificationType.LIKE,
          actorId: mockActor.id,
          targetType: 'Post',
          targetId: 'post-1',
          message: 'Actor User liked your post',
        },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              walletAddress: true,
            },
          },
        },
      });
      expect(eventsGateway.emitToUser).toHaveBeenCalledWith(
        mockUser.id,
        'notification',
        mockNotification,
      );
    });

    it('should not create notification if user has disabled that notification type', async () => {
      const userWithDisabledLikes = {
        ...mockUser,
        notificationSettings: {
          ...mockUser.notificationSettings,
          likesEnabled: false,
        },
      };
      prismaService.user.findUnique.mockResolvedValue(userWithDisabledLikes);

      const result = await service.createNotification({
        userId: mockUser.id,
        type: NotificationType.LIKE,
        actorId: mockActor.id,
        targetType: 'Post',
        targetId: 'post-1',
        message: 'Actor User liked your post',
      });

      expect(result).toBeNull();
      expect(prismaService.notification.create).not.toHaveBeenCalled();
      expect(eventsGateway.emitToUser).not.toHaveBeenCalled();
    });

    it('should not create self-notification', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.createNotification({
        userId: mockUser.id,
        type: NotificationType.LIKE,
        actorId: mockUser.id, // Same as userId - self notification
        targetType: 'Post',
        targetId: 'post-1',
        message: 'You liked your own post',
      });

      expect(result).toBeNull();
      expect(prismaService.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const notifications = [mockNotification];
      prismaService.notification.findMany.mockResolvedValue(notifications);
      prismaService.notification.count.mockResolvedValue(1);

      const result = await service.getNotifications(mockUser.id, {
        limit: 20,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
    });

    it('should filter notifications by type', async () => {
      prismaService.notification.findMany.mockResolvedValue([]);
      prismaService.notification.count.mockResolvedValue(0);

      await service.getNotifications(mockUser.id, {
        limit: 20,
        offset: 0,
        type: NotificationType.LIKE,
      });

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id, type: NotificationType.LIKE },
        }),
      );
    });

    it('should filter notifications by unread status', async () => {
      prismaService.notification.findMany.mockResolvedValue([]);
      prismaService.notification.count.mockResolvedValue(0);

      await service.getNotifications(mockUser.id, {
        limit: 20,
        offset: 0,
        unreadOnly: true,
      });

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id, read: false },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const readNotification = { ...mockNotification, read: true, readAt: new Date() };
      prismaService.notification.update.mockResolvedValue(readNotification);

      const result = await service.markAsRead(mockNotification.id, mockUser.id);

      expect(result.read).toBe(true);
      expect(result.readAt).toBeDefined();
      expect(prismaService.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotification.id, userId: mockUser.id },
        data: { read: true, readAt: expect.any(Date) },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              walletAddress: true,
            },
          },
        },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      prismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(mockUser.id);

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, read: false },
        data: { read: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      prismaService.notification.count.mockResolvedValue(10);

      const result = await service.getUnreadCount(mockUser.id);

      expect(result).toBe(10);
      expect(prismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: mockUser.id, read: false },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      prismaService.notification.delete.mockResolvedValue(mockNotification);

      const result = await service.deleteNotification(mockNotification.id, mockUser.id);

      expect(result.success).toBe(true);
      expect(prismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: mockNotification.id, userId: mockUser.id },
      });
    });
  });

  describe('notifyLike', () => {
    it('should create a like notification for post author', async () => {
      prismaService.post.findUnique.mockResolvedValue(mockPost);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.notification.create.mockResolvedValue(mockNotification);

      await service.notifyLike(mockActor.id, 'Post', mockPost.id);

      expect(prismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPost.id },
        select: { authorId: true },
      });
      expect(prismaService.notification.create).toHaveBeenCalled();
    });

    it('should not create notification when liking own post', async () => {
      const ownPost = { ...mockPost, authorId: mockActor.id };
      prismaService.post.findUnique.mockResolvedValue(ownPost);
      prismaService.user.findUnique.mockResolvedValue({ ...mockUser, id: mockActor.id });

      await service.notifyLike(mockActor.id, 'Post', mockPost.id);

      expect(prismaService.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('notifyComment', () => {
    it('should create a comment notification for post author', async () => {
      prismaService.comment.findUnique.mockResolvedValue(mockComment);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.notification.create.mockResolvedValue({
        ...mockNotification,
        type: NotificationType.COMMENT,
      });

      await service.notifyComment(mockActor.id, mockComment.id);

      expect(prismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id: mockComment.id },
        include: {
          post: { select: { authorId: true } },
        },
      });
      expect(prismaService.notification.create).toHaveBeenCalled();
    });
  });

  describe('notifyDonation', () => {
    it('should create a donation notification for fundraiser creator', async () => {
      const mockFundraiser = {
        id: 'fundraiser-1',
        creatorId: mockUser.id,
        title: 'Test Fundraiser',
      };
      prismaService.fundraiser.findUnique.mockResolvedValue(mockFundraiser);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.notification.create.mockResolvedValue({
        ...mockNotification,
        type: NotificationType.DONATION_RECEIVED,
      });

      await service.notifyDonation(mockActor.id, mockFundraiser.id, '100', 'USDC');

      expect(prismaService.fundraiser.findUnique).toHaveBeenCalledWith({
        where: { id: mockFundraiser.id },
        select: { creatorId: true, title: true },
      });
      expect(prismaService.notification.create).toHaveBeenCalled();
    });
  });

  describe('notifyFollow', () => {
    it('should create a follow notification', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.notification.create.mockResolvedValue({
        ...mockNotification,
        type: NotificationType.FOLLOW,
      });

      await service.notifyFollow(mockActor.id, mockUser.id);

      expect(prismaService.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: NotificationType.FOLLOW,
            userId: mockUser.id,
            actorId: mockActor.id,
          }),
        }),
      );
    });
  });

  describe('getNotificationCounts', () => {
    it('should return notification counts grouped by type', async () => {
      const groupedCounts = [
        { type: NotificationType.LIKE, _count: { type: 5 } },
        { type: NotificationType.COMMENT, _count: { type: 3 } },
        { type: NotificationType.FOLLOW, _count: { type: 2 } },
      ];
      prismaService.notification.groupBy.mockResolvedValue(groupedCounts);

      const result = await service.getNotificationCounts(mockUser.id);

      expect(result).toEqual({
        [NotificationType.LIKE]: 5,
        [NotificationType.COMMENT]: 3,
        [NotificationType.FOLLOW]: 2,
      });
      expect(prismaService.notification.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { userId: mockUser.id, read: false },
        _count: { type: true },
      });
    });
  });
});
