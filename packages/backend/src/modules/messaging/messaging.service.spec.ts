import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserNotFoundException,
  ConversationNotFoundException,
  CannotMessageSelfException,
  NotConversationParticipantException,
} from '../../common/exceptions';

// Mock data
const mockUser1 = {
  id: 'user-1',
  walletAddress: '0x1234567890123456789012345678901234567890',
  username: 'user1',
  displayName: 'User One',
  avatarUrl: 'https://example.com/avatar1.png',
  isVerifiedCreator: false,
  verificationBadge: null,
};

const mockUser2 = {
  id: 'user-2',
  walletAddress: '0x0987654321098765432109876543210987654321',
  username: 'user2',
  displayName: 'User Two',
  avatarUrl: 'https://example.com/avatar2.png',
  isVerifiedCreator: false,
  verificationBadge: null,
};

const mockConversation = {
  id: 'conv-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastMessageAt: null,
  participants: [
    {
      id: 'part-1',
      userId: mockUser1.id,
      conversationId: 'conv-1',
      joinedAt: new Date(),
      lastReadAt: null,
      user: mockUser1,
    },
    {
      id: 'part-2',
      userId: mockUser2.id,
      conversationId: 'conv-1',
      joinedAt: new Date(),
      lastReadAt: null,
      user: mockUser2,
    },
  ],
  messages: [],
};

const mockMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: mockUser1.id,
  receiverId: mockUser2.id,
  content: 'Hello, World!',
  mediaUrl: null,
  read: false,
  readAt: null,
  createdAt: new Date(),
  sender: mockUser1,
  receiver: mockUser2,
};

// Create mock Prisma service
const createMockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
  },
  conversation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  conversationParticipant: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  block: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((callback) =>
    callback({
      message: {
        create: jest.fn().mockResolvedValue(mockMessage),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      conversation: {
        update: jest.fn(),
      },
      conversationParticipant: {
        update: jest.fn(),
      },
    }),
  ),
});

describe('MessagingService', () => {
  let service: MessagingService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startConversation', () => {
    it('should throw CannotMessageSelfException when trying to message self', async () => {
      await expect(
        service.startConversation(mockUser1.id, {
          participantId: mockUser1.id,
        }),
      ).rejects.toThrow(CannotMessageSelfException);
    });

    it('should throw UserNotFoundException when participant does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.startConversation(mockUser1.id, {
          participantId: mockUser2.id,
        }),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('should return existing conversation if one exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.block.findFirst.mockResolvedValue(null);
      prismaService.conversation.findMany.mockResolvedValue([mockConversation]);
      prismaService.message.count.mockResolvedValue(0);

      const result = await service.startConversation(mockUser1.id, {
        participantId: mockUser2.id,
      });

      expect(result.id).toBe(mockConversation.id);
      expect(prismaService.conversation.create).not.toHaveBeenCalled();
    });

    it('should create new conversation if none exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.block.findFirst.mockResolvedValue(null);
      prismaService.conversation.findMany.mockResolvedValue([]);
      prismaService.conversation.create.mockResolvedValue(mockConversation);
      prismaService.message.count.mockResolvedValue(0);

      const result = await service.startConversation(mockUser1.id, {
        participantId: mockUser2.id,
      });

      expect(result.id).toBe(mockConversation.id);
      expect(prismaService.conversation.create).toHaveBeenCalled();
    });
  });

  describe('getConversation', () => {
    it('should throw ConversationNotFoundException when conversation does not exist', async () => {
      prismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.getConversation('non-existent', mockUser1.id),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('should throw NotConversationParticipantException when user is not a participant', async () => {
      prismaService.conversation.findUnique.mockResolvedValue({
        ...mockConversation,
        participants: [mockConversation.participants[1]], // Only user2
      });

      await expect(
        service.getConversation(mockConversation.id, mockUser1.id),
      ).rejects.toThrow(NotConversationParticipantException);
    });

    it('should return conversation when user is a participant', async () => {
      prismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      prismaService.message.count.mockResolvedValue(0);

      const result = await service.getConversation(
        mockConversation.id,
        mockUser1.id,
      );

      expect(result.id).toBe(mockConversation.id);
      expect(result.participants).toHaveLength(2);
    });
  });

  describe('getMessages', () => {
    it('should throw NotConversationParticipantException when user is not a participant', async () => {
      prismaService.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.getMessages(mockUser1.id, {
          conversationId: mockConversation.id,
        }),
      ).rejects.toThrow(NotConversationParticipantException);
    });

    it('should return paginated messages', async () => {
      prismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        userId: mockUser1.id,
        conversationId: mockConversation.id,
      });
      prismaService.message.findMany.mockResolvedValue([mockMessage]);
      prismaService.message.count.mockResolvedValue(1);

      const result = await service.getMessages(mockUser1.id, {
        conversationId: mockConversation.id,
        limit: 50,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getUnreadCounts', () => {
    it('should return unread message summary', async () => {
      prismaService.message.findMany.mockResolvedValue([
        { ...mockMessage, conversationId: 'conv-1' },
        { ...mockMessage, id: 'msg-2', conversationId: 'conv-1' },
      ]);

      const result = await service.getUnreadCounts(mockUser2.id);

      expect(result.totalUnread).toBe(2);
      expect(result.conversationsWithUnread).toBe(1);
    });

    it('should return zero counts when no unread messages', async () => {
      prismaService.message.findMany.mockResolvedValue([]);

      const result = await service.getUnreadCounts(mockUser1.id);

      expect(result.totalUnread).toBe(0);
      expect(result.conversationsWithUnread).toBe(0);
      expect(result.byConversation).toHaveLength(0);
    });
  });

  describe('markMessagesAsRead', () => {
    it('should throw NotConversationParticipantException when user is not a participant', async () => {
      prismaService.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.markMessagesAsRead(mockUser1.id, {
          conversationId: mockConversation.id,
        }),
      ).rejects.toThrow(NotConversationParticipantException);
    });

    it('should mark messages as read and return count', async () => {
      prismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        userId: mockUser1.id,
        conversationId: mockConversation.id,
      });

      const result = await service.markMessagesAsRead(mockUser1.id, {
        conversationId: mockConversation.id,
      });

      expect(result.success).toBe(true);
      expect(result.conversationId).toBe(mockConversation.id);
    });
  });
});
