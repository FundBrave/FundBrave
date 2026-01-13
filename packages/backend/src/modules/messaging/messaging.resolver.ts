import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import {
  StartConversationInput,
  SendMessageInput,
  SendDirectMessageInput,
  GetMessagesInput,
  MarkMessagesReadInput,
  Message,
  Conversation,
  PaginatedMessages,
  PaginatedConversations,
  UnreadMessagesSummary,
  MarkReadResult,
  TypingIndicatorPayload,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EventsGateway } from '../websockets/events.gateway';

/**
 * GraphQL Resolver for Messaging operations
 * Handles conversations, messages, read receipts via GraphQL
 *
 * Real-time features are delivered via WebSocket (Socket.IO):
 * - Subscribe to 'subscribeConversation' with conversationId for updates
 * - Listen for 'newMessage' event for new messages
 * - Listen for 'userTyping' event for typing indicators
 * - Listen for 'messagesRead' event for read receipts
 * - Listen for 'messageReceived' on user room for notifications
 */
@Resolver(() => Message)
export class MessagingResolver {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ==================== Queries ====================

  /**
   * Get all conversations for the current user
   */
  @Query(() => PaginatedConversations, {
    name: 'conversations',
    description:
      'Get all conversations for the current user sorted by last message time',
  })
  @UseGuards(JwtAuthGuard)
  async getConversations(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedConversations> {
    return this.messagingService.getConversations(user.id, limit, offset);
  }

  /**
   * Get a specific conversation by ID
   */
  @Query(() => Conversation, {
    name: 'conversation',
    description: 'Get a specific conversation by ID',
  })
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @CurrentUser() user: { id: string },
    @Args('conversationId', { type: () => ID }) conversationId: string,
  ): Promise<Conversation> {
    return this.messagingService.getConversation(conversationId, user.id);
  }

  /**
   * Get messages for a conversation with pagination
   */
  @Query(() => PaginatedMessages, {
    name: 'messages',
    description: 'Get messages for a conversation with pagination',
  })
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @CurrentUser() user: { id: string },
    @Args('input') input: GetMessagesInput,
  ): Promise<PaginatedMessages> {
    return this.messagingService.getMessages(user.id, input);
  }

  /**
   * Get unread message counts across all conversations
   */
  @Query(() => UnreadMessagesSummary, {
    name: 'unreadMessages',
    description: 'Get unread message counts across all conversations',
  })
  @UseGuards(JwtAuthGuard)
  async getUnreadMessages(
    @CurrentUser() user: { id: string },
  ): Promise<UnreadMessagesSummary> {
    return this.messagingService.getUnreadCounts(user.id);
  }

  /**
   * Get total unread count (simplified)
   */
  @Query(() => Int, {
    name: 'totalUnreadMessages',
    description: 'Get total number of unread messages',
  })
  @UseGuards(JwtAuthGuard)
  async getTotalUnreadMessages(
    @CurrentUser() user: { id: string },
  ): Promise<number> {
    const summary = await this.messagingService.getUnreadCounts(user.id);
    return summary.totalUnread;
  }

  // ==================== Mutations ====================

  /**
   * Start a new conversation with a user
   */
  @Mutation(() => Conversation, {
    description: 'Start a new conversation with a user (or get existing one)',
  })
  @UseGuards(JwtAuthGuard)
  async startConversation(
    @CurrentUser() user: { id: string },
    @Args('input') input: StartConversationInput,
  ): Promise<Conversation> {
    return this.messagingService.startConversation(user.id, input);
  }

  /**
   * Send a message in a conversation
   */
  @Mutation(() => Message, {
    description: 'Send a message in a conversation',
  })
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @CurrentUser() user: { id: string },
    @Args('input') input: SendMessageInput,
  ): Promise<Message> {
    const message = await this.messagingService.sendMessage(user.id, input);

    // Emit via WebSocket for real-time delivery
    this.eventsGateway.emitNewMessage({
      conversationId: input.conversationId,
      message,
      receiverId: message.receiver.id,
    });

    return message;
  }

  /**
   * Send a direct message to a user (creates conversation if needed)
   */
  @Mutation(() => Message, {
    description:
      'Send a direct message to a user (creates conversation if needed)',
  })
  @UseGuards(JwtAuthGuard)
  async sendDirectMessage(
    @CurrentUser() user: { id: string },
    @Args('input') input: SendDirectMessageInput,
  ): Promise<Message> {
    const message = await this.messagingService.sendDirectMessage(
      user.id,
      input,
    );

    // Emit via WebSocket for real-time delivery
    this.eventsGateway.emitNewMessage({
      conversationId: message.conversationId,
      message,
      receiverId: input.receiverId,
    });

    return message;
  }

  /**
   * Mark messages as read in a conversation
   */
  @Mutation(() => MarkReadResult, {
    description: 'Mark messages as read in a conversation',
  })
  @UseGuards(JwtAuthGuard)
  async markMessagesAsRead(
    @CurrentUser() user: { id: string },
    @Args('input') input: MarkMessagesReadInput,
  ): Promise<MarkReadResult> {
    const beforeMark = new Date();
    const result = await this.messagingService.markMessagesAsRead(
      user.id,
      input,
    );

    if (result.messagesMarkedRead > 0) {
      // Get the message IDs that were marked as read
      const messageIds = await this.messagingService.getRecentlyReadMessageIds(
        input.conversationId,
        user.id,
        beforeMark,
      );

      // Emit via WebSocket for real-time read receipts
      this.eventsGateway.emitMessageRead({
        conversationId: input.conversationId,
        messageIds,
        readByUserId: user.id,
        readAt: new Date(),
      });
    }

    return result;
  }

  /**
   * Send typing indicator via GraphQL mutation
   * Note: Can also be sent directly via WebSocket for lower latency
   */
  @Mutation(() => Boolean, {
    description: 'Send typing indicator to a conversation',
  })
  @UseGuards(JwtAuthGuard)
  async sendTypingIndicator(
    @CurrentUser() user: { id: string },
    @Args('conversationId', { type: () => ID }) conversationId: string,
    @Args('isTyping') isTyping: boolean,
  ): Promise<boolean> {
    // Get user details for the payload
    const conversation = await this.messagingService.getConversation(
      conversationId,
      user.id,
    );

    // Find the current user in participants
    const currentUserParticipant = conversation.participants.find(
      (p) => p.user.id === user.id,
    );

    if (!currentUserParticipant) {
      return false;
    }

    // Build typing indicator payload
    const payload: TypingIndicatorPayload = {
      conversationId,
      user: currentUserParticipant.user,
      isTyping,
      timestamp: new Date(),
    };

    // Emit via WebSocket
    this.eventsGateway.emitTypingIndicator(payload);

    return true;
  }
}
