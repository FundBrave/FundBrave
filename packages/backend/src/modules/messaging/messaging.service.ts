import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  Message as PrismaMessage,
  User as PrismaUser,
} from '@prisma/client';
import {
  StartConversationInput,
  SendMessageInput,
  SendDirectMessageInput,
  GetMessagesInput,
  MarkMessagesReadInput,
  Message,
  Conversation,
  ConversationParticipant,
  PaginatedMessages,
  PaginatedConversations,
  UnreadMessagesSummary,
  ConversationUnreadCount,
  MarkReadResult,
  MessageDeliveryStatus,
} from './dto';
import { UserMinimal, VerificationBadge } from '../users/dto';
import {
  UserNotFoundException,
  ConversationNotFoundException,
  CannotMessageBlockedUserException,
  NotConversationParticipantException,
  CannotMessageSelfException,
} from '../../common/exceptions';

// Type for Prisma message with relations
type MessageWithRelations = PrismaMessage & {
  sender: PrismaUser;
  receiver: PrismaUser;
};

// Type for participant with user relation
type ParticipantWithUser = {
  id: string;
  userId: string;
  conversationId: string;
  joinedAt: Date;
  lastReadAt: Date | null;
  user: PrismaUser;
};

/**
 * Service for managing direct messaging operations
 * Handles conversations, messages, read receipts, and unread counts
 */
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Conversation Methods ====================

  /**
   * Start a new conversation with a user or return existing one
   */
  async startConversation(
    currentUserId: string,
    input: StartConversationInput,
  ): Promise<Conversation> {
    const { participantId } = input;

    // Prevent self-messaging
    if (currentUserId === participantId) {
      throw new CannotMessageSelfException();
    }

    // Verify participant exists
    const participant = await this.prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new UserNotFoundException(participantId);
    }

    // Check if blocked
    const isBlocked = await this.checkIfBlocked(currentUserId, participantId);
    if (isBlocked) {
      throw new CannotMessageBlockedUserException();
    }

    // Check for existing conversation between these users
    const existingConversation = await this.findExistingConversation(
      currentUserId,
      participantId,
    );

    if (existingConversation) {
      return this.mapToConversationDto(existingConversation, currentUserId);
    }

    // Create new conversation with participants
    const newConversation = await this.prisma.conversation.create({
      data: {
        participants: {
          createMany: {
            data: [{ userId: currentUserId }, { userId: participantId }],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
            receiver: true,
          },
        },
      },
    });

    this.logger.log(
      `Created conversation ${newConversation.id} between ${currentUserId} and ${participantId}`,
    );

    return this.mapToConversationDto(newConversation, currentUserId);
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(
    currentUserId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaginatedConversations> {
    // Get conversations where user is a participant
    const where: Prisma.ConversationWhereInput = {
      participants: {
        some: {
          userId: currentUserId,
        },
      },
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: true,
              receiver: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: { sort: 'desc', nulls: 'last' },
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const items = await Promise.all(
      conversations.map((c) => this.mapToConversationDto(c, currentUserId)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(
    conversationId: string,
    currentUserId: string,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
            receiver: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === currentUserId,
    );

    if (!isParticipant) {
      throw new NotConversationParticipantException(conversationId);
    }

    return this.mapToConversationDto(conversation, currentUserId);
  }

  // ==================== Message Methods ====================

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    currentUserId: string,
    input: SendMessageInput,
  ): Promise<Message> {
    const { conversationId, content, mediaUrl } = input;

    // Get conversation and verify participation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }

    const senderParticipant = conversation.participants.find(
      (p) => p.userId === currentUserId,
    );

    if (!senderParticipant) {
      throw new NotConversationParticipantException(conversationId);
    }

    // Get the other participant (receiver)
    const receiverParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId,
    );

    if (!receiverParticipant) {
      throw new UserNotFoundException('receiver');
    }

    // Check if blocked
    const isBlocked = await this.checkIfBlocked(
      currentUserId,
      receiverParticipant.userId,
    );

    if (isBlocked) {
      throw new CannotMessageBlockedUserException();
    }

    // Create message and update conversation in a transaction
    const message = await this.prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          conversationId,
          senderId: currentUserId,
          receiverId: receiverParticipant.userId,
          content,
          mediaUrl,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      // Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return newMessage;
    });

    this.logger.log(
      `Message ${message.id} sent in conversation ${conversationId}`,
    );

    return this.mapToMessageDto(message);
  }

  /**
   * Send a direct message to a user (creates conversation if needed)
   */
  async sendDirectMessage(
    currentUserId: string,
    input: SendDirectMessageInput,
  ): Promise<Message> {
    const { receiverId, content, mediaUrl } = input;

    // Prevent self-messaging
    if (currentUserId === receiverId) {
      throw new CannotMessageSelfException();
    }

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new UserNotFoundException(receiverId);
    }

    // Check if blocked
    const isBlocked = await this.checkIfBlocked(currentUserId, receiverId);
    if (isBlocked) {
      throw new CannotMessageBlockedUserException();
    }

    // Find or create conversation
    let conversation = await this.findExistingConversation(
      currentUserId,
      receiverId,
    );

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participants: {
            createMany: {
              data: [{ userId: currentUserId }, { userId: receiverId }],
            },
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: true,
              receiver: true,
            },
          },
        },
      });
    }

    // Send the message
    return this.sendMessage(currentUserId, {
      conversationId: conversation.id,
      content,
      mediaUrl,
    });
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    currentUserId: string,
    input: GetMessagesInput,
  ): Promise<PaginatedMessages> {
    const {
      conversationId,
      limit = 50,
      offset = 0,
      beforeMessageId,
      afterMessageId,
    } = input;

    // Verify user is a participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },
    });

    if (!participant) {
      throw new NotConversationParticipantException(conversationId);
    }

    // Build query conditions
    const where: Prisma.MessageWhereInput = { conversationId };

    // Cursor-based pagination
    if (beforeMessageId) {
      const beforeMessage = await this.prisma.message.findUnique({
        where: { id: beforeMessageId },
        select: { createdAt: true },
      });

      if (beforeMessage) {
        where.createdAt = { lt: beforeMessage.createdAt };
      }
    } else if (afterMessageId) {
      const afterMessage = await this.prisma.message.findUnique({
        where: { id: afterMessageId },
        select: { createdAt: true },
      });

      if (afterMessage) {
        where.createdAt = { gt: afterMessage.createdAt };
      }
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: true,
          receiver: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: afterMessageId || beforeMessageId ? 0 : offset,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    const items = messages.map((m) => this.mapToMessageDto(m));

    return {
      items,
      total,
      hasMore: offset + limit < total,
      oldestMessageId:
        items.length > 0 ? items[items.length - 1].id : undefined,
      newestMessageId: items.length > 0 ? items[0].id : undefined,
    };
  }

  // ==================== Read Receipt Methods ====================

  /**
   * Mark messages as read in a conversation
   */
  async markMessagesAsRead(
    currentUserId: string,
    input: MarkMessagesReadInput,
  ): Promise<MarkReadResult> {
    const { conversationId, upToMessageId } = input;

    // Verify user is a participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },
    });

    if (!participant) {
      throw new NotConversationParticipantException(conversationId);
    }

    const now = new Date();

    // Build query to find unread messages
    const where: Prisma.MessageWhereInput = {
      conversationId,
      receiverId: currentUserId,
      read: false,
    };

    // If specific message ID provided, only mark messages up to that one
    if (upToMessageId) {
      const targetMessage = await this.prisma.message.findUnique({
        where: { id: upToMessageId },
        select: { createdAt: true },
      });

      if (targetMessage) {
        where.createdAt = { lte: targetMessage.createdAt };
      }
    }

    // Update messages and participant in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Mark messages as read
      const updateResult = await tx.message.updateMany({
        where,
        data: {
          read: true,
          readAt: now,
        },
      });

      // Update participant's lastReadAt
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: currentUserId,
          },
        },
        data: { lastReadAt: now },
      });

      return updateResult.count;
    });

    this.logger.log(
      `Marked ${result} messages as read in conversation ${conversationId}`,
    );

    return {
      success: true,
      messagesMarkedRead: result,
      conversationId,
    };
  }

  /**
   * Get unread message counts for the current user
   */
  async getUnreadCounts(currentUserId: string): Promise<UnreadMessagesSummary> {
    // Get all unread messages for this user
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        receiverId: currentUserId,
        read: false,
      },
      select: {
        id: true,
        conversationId: true,
        content: true,
        senderId: true,
        sender: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
            verificationBadge: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation
    const conversationMap = new Map<
      string,
      {
        count: number;
        lastMessage: (typeof unreadMessages)[0];
      }
    >();

    for (const message of unreadMessages) {
      const existing = conversationMap.get(message.conversationId);
      if (existing) {
        existing.count++;
      } else {
        conversationMap.set(message.conversationId, {
          count: 1,
          lastMessage: message,
        });
      }
    }

    const byConversation: ConversationUnreadCount[] = Array.from(
      conversationMap.entries(),
    ).map(([conversationId, data]) => ({
      conversationId,
      unreadCount: data.count,
      lastMessagePreview: data.lastMessage.content.substring(0, 100),
      lastMessageSender: this.mapToUserMinimal(
        data.lastMessage.sender as PrismaUser,
      ),
    }));

    return {
      totalUnread: unreadMessages.length,
      conversationsWithUnread: conversationMap.size,
      byConversation,
    };
  }

  /**
   * Get unread count for a specific conversation
   */
  async getConversationUnreadCount(
    conversationId: string,
    currentUserId: string,
  ): Promise<number> {
    return this.prisma.message.count({
      where: {
        conversationId,
        receiverId: currentUserId,
        read: false,
      },
    });
  }

  // ==================== Helper Methods ====================

  /**
   * Find existing conversation between two users
   */
  private async findExistingConversation(userId1: string, userId2: string) {
    // Find conversations where both users are participants
    const conversations = await this.prisma.conversation.findMany({
      where: {
        AND: [
          {
            participants: {
              some: { userId: userId1 },
            },
          },
          {
            participants: {
              some: { userId: userId2 },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true,
            receiver: true,
          },
        },
      },
    });

    // For direct messaging, we want exactly 2 participants
    return conversations.find((c) => c.participants.length === 2) || null;
  }

  /**
   * Check if users are blocked from messaging each other
   */
  private async checkIfBlocked(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });

    return !!block;
  }

  /**
   * Map Prisma user to UserMinimal DTO
   */
  private mapToUserMinimal(user: PrismaUser): UserMinimal {
    return {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username ?? undefined,
      displayName: user.displayName ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      isVerifiedCreator: user.isVerifiedCreator,
      verificationBadge:
        (user.verificationBadge as VerificationBadge) ?? undefined,
    };
  }

  /**
   * Map Prisma message to Message DTO
   */
  private mapToMessageDto(message: MessageWithRelations): Message {
    let deliveryStatus: MessageDeliveryStatus;
    if (message.read) {
      deliveryStatus = MessageDeliveryStatus.READ;
    } else {
      deliveryStatus = MessageDeliveryStatus.SENT;
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: this.mapToUserMinimal(message.sender),
      receiver: this.mapToUserMinimal(message.receiver),
      content: message.content,
      mediaUrl: message.mediaUrl ?? undefined,
      read: message.read,
      readAt: message.readAt ?? undefined,
      createdAt: message.createdAt,
      deliveryStatus,
    };
  }

  /**
   * Map conversation to DTO with calculated unread counts
   */
  private async mapToConversationDto(
    conversation: {
      id: string;
      lastMessageAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      participants: ParticipantWithUser[];
      messages: MessageWithRelations[];
    },
    currentUserId: string,
  ): Promise<Conversation> {
    // Calculate unread count for current user
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: conversation.id,
        receiverId: currentUserId,
        read: false,
      },
    });

    // Map participants with their unread counts
    const participantsWithCounts = await Promise.all(
      conversation.participants.map(async (p) => {
        const participantUnread = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            receiverId: p.userId,
            read: false,
          },
        });

        return {
          id: p.id,
          user: this.mapToUserMinimal(p.user),
          joinedAt: p.joinedAt,
          lastReadAt: p.lastReadAt ?? undefined,
          unreadCount: participantUnread,
        } as ConversationParticipant;
      }),
    );

    // Get last message if exists
    const lastMessage = conversation.messages[0]
      ? this.mapToMessageDto(conversation.messages[0])
      : undefined;

    return {
      id: conversation.id,
      participants: participantsWithCounts,
      lastMessage,
      lastMessageAt: conversation.lastMessageAt ?? undefined,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      unreadCount,
    };
  }

  /**
   * Get message IDs that were just marked as read (for real-time notifications)
   */
  async getRecentlyReadMessageIds(
    conversationId: string,
    readByUserId: string,
    since: Date,
  ): Promise<string[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        receiverId: readByUserId,
        read: true,
        readAt: { gte: since },
      },
      select: { id: true },
    });

    return messages.map((m) => m.id);
  }
}
