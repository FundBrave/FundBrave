import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EventsGateway } from '../websockets/events.gateway';

interface AuthenticatedUser {
  id: string;
  walletAddress: string;
}

@ApiTags('Messaging')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ==================== GET Endpoints ====================

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns paginated conversations' })
  async getConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedConversations> {
    return this.messagingService.getConversations(user.id, limit, offset);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get a specific conversation' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiResponse({ status: 200, description: 'Returns conversation details' })
  async getConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ): Promise<Conversation> {
    return this.messagingService.getConversation(conversationId, user.id);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'beforeMessageId', required: false, type: String })
  @ApiQuery({ name: 'afterMessageId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns paginated messages' })
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('beforeMessageId') beforeMessageId?: string,
    @Query('afterMessageId') afterMessageId?: string,
  ): Promise<PaginatedMessages> {
    const input: GetMessagesInput = {
      conversationId,
      limit,
      offset,
      beforeMessageId,
      afterMessageId,
    };
    return this.messagingService.getMessages(user.id, input);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread message counts' })
  @ApiResponse({ status: 200, description: 'Returns unread message summary' })
  async getUnreadCounts(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UnreadMessagesSummary> {
    return this.messagingService.getUnreadCounts(user.id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Returns total unread count' })
  async getTotalUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ count: number }> {
    const summary = await this.messagingService.getUnreadCounts(user.id);
    return { count: summary.totalUnread };
  }

  // ==================== POST Endpoints ====================

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation with a user' })
  @ApiResponse({ status: 201, description: 'Conversation created or found' })
  async startConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: StartConversationInput,
  ): Promise<Conversation> {
    return this.messagingService.startConversation(user.id, input);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessageInConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string; mediaUrl?: string },
  ): Promise<Message> {
    const input: SendMessageInput = {
      conversationId,
      content: body.content,
      mediaUrl: body.mediaUrl,
    };
    const message = await this.messagingService.sendMessage(user.id, input);

    // Emit via WebSocket for real-time delivery
    this.eventsGateway.emitNewMessage({
      conversationId,
      message,
      receiverId: message.receiver.id,
    });

    return message;
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a direct message to a user' })
  @ApiResponse({ status: 201, description: 'Message sent, conversation created if needed' })
  async sendDirectMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SendDirectMessageInput,
  ): Promise<Message> {
    const message = await this.messagingService.sendDirectMessage(user.id, input);

    // Emit via WebSocket for real-time delivery
    this.eventsGateway.emitNewMessage({
      conversationId: message.conversationId,
      message,
      receiverId: input.receiverId,
    });

    return message;
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read in a conversation' })
  @ApiParam({ name: 'conversationId', type: String })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() body: { upToMessageId?: string },
  ): Promise<MarkReadResult> {
    const beforeMark = new Date();
    const input: MarkMessagesReadInput = {
      conversationId,
      upToMessageId: body.upToMessageId,
    };
    const result = await this.messagingService.markMessagesAsRead(user.id, input);

    if (result.messagesMarkedRead > 0) {
      // Get the message IDs that were marked as read
      const messageIds = await this.messagingService.getRecentlyReadMessageIds(
        conversationId,
        user.id,
        beforeMark,
      );

      // Emit via WebSocket for real-time read receipts
      this.eventsGateway.emitMessageRead({
        conversationId,
        messageIds,
        readByUserId: user.id,
        readAt: new Date(),
      });
    }

    return result;
  }

  @Post('typing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send typing indicator' })
  @ApiResponse({ status: 200, description: 'Typing indicator sent' })
  async sendTypingIndicator(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { conversationId: string; isTyping: boolean },
  ): Promise<{ success: boolean }> {
    const conversation = await this.messagingService.getConversation(
      body.conversationId,
      user.id,
    );

    const currentUserParticipant = conversation.participants.find(
      (p) => p.user.id === user.id,
    );

    if (!currentUserParticipant) {
      return { success: false };
    }

    this.eventsGateway.emitTypingIndicator({
      conversationId: body.conversationId,
      user: currentUserParticipant.user,
      isTyping: body.isTyping,
      timestamp: new Date(),
    });

    return { success: true };
  }
}
