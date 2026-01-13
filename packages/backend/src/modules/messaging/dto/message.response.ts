import { Field, ObjectType, Int, ID, registerEnumType } from '@nestjs/graphql';
import { UserMinimal } from '../../users/dto';

// ==================== Enums ====================

export enum MessageDeliveryStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

registerEnumType(MessageDeliveryStatus, {
  name: 'MessageDeliveryStatus',
  description: 'The delivery status of a message',
});

// ==================== Output DTOs ====================

/**
 * Represents a single message in a conversation
 */
@ObjectType()
export class Message {
  @Field(() => ID)
  id: string;

  @Field(() => ID, {
    description: 'The ID of the conversation this message belongs to',
  })
  conversationId: string;

  @Field(() => UserMinimal, { description: 'The user who sent the message' })
  sender: UserMinimal;

  @Field(() => UserMinimal, {
    description: 'The user who received the message',
  })
  receiver: UserMinimal;

  @Field({ description: 'The text content of the message' })
  content: string;

  @Field({
    nullable: true,
    description: 'Optional media URL attached to the message',
  })
  mediaUrl?: string;

  @Field({ description: 'Whether the message has been read by the recipient' })
  read: boolean;

  @Field({ nullable: true, description: 'Timestamp when the message was read' })
  readAt?: Date;

  @Field({ description: 'Timestamp when the message was created' })
  createdAt: Date;

  @Field(() => MessageDeliveryStatus, {
    description: 'Current delivery status of the message',
  })
  deliveryStatus: MessageDeliveryStatus;
}

/**
 * Represents a conversation participant
 */
@ObjectType()
export class ConversationParticipant {
  @Field(() => ID)
  id: string;

  @Field(() => UserMinimal, { description: 'The participant user' })
  user: UserMinimal;

  @Field({ description: 'Timestamp when the user joined the conversation' })
  joinedAt: Date;

  @Field({
    nullable: true,
    description: 'Timestamp when the user last read messages',
  })
  lastReadAt?: Date;

  @Field(() => Int, {
    description: 'Count of unread messages for this participant',
  })
  unreadCount: number;
}

/**
 * Represents a conversation between users
 */
@ObjectType()
export class Conversation {
  @Field(() => ID)
  id: string;

  @Field(() => [ConversationParticipant], {
    description: 'Participants in this conversation',
  })
  participants: ConversationParticipant[];

  @Field(() => Message, {
    nullable: true,
    description: 'The most recent message in the conversation',
  })
  lastMessage?: Message;

  @Field({
    nullable: true,
    description: 'Timestamp of the last message in the conversation',
  })
  lastMessageAt?: Date;

  @Field({ description: 'Timestamp when the conversation was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the conversation was last updated' })
  updatedAt: Date;

  @Field(() => Int, {
    description: 'Total number of unread messages for the current user',
  })
  unreadCount: number;
}

/**
 * Paginated list of messages
 */
@ObjectType()
export class PaginatedMessages {
  @Field(() => [Message], { description: 'List of messages' })
  items: Message[];

  @Field(() => Int, {
    description: 'Total number of messages in the conversation',
  })
  total: number;

  @Field({ description: 'Whether there are more messages to load' })
  hasMore: boolean;

  @Field(() => ID, {
    nullable: true,
    description:
      'ID of the oldest message in this batch (for cursor pagination)',
  })
  oldestMessageId?: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'ID of the newest message in this batch (for cursor pagination)',
  })
  newestMessageId?: string;
}

/**
 * Paginated list of conversations
 */
@ObjectType()
export class PaginatedConversations {
  @Field(() => [Conversation], { description: 'List of conversations' })
  items: Conversation[];

  @Field(() => Int, { description: 'Total number of conversations' })
  total: number;

  @Field({ description: 'Whether there are more conversations to load' })
  hasMore: boolean;
}

/**
 * Summary of unread messages across all conversations
 */
@ObjectType()
export class UnreadMessagesSummary {
  @Field(() => Int, { description: 'Total number of unread messages' })
  totalUnread: number;

  @Field(() => Int, {
    description: 'Number of conversations with unread messages',
  })
  conversationsWithUnread: number;

  @Field(() => [ConversationUnreadCount], {
    description: 'Unread counts per conversation',
  })
  byConversation: ConversationUnreadCount[];
}

/**
 * Unread count for a specific conversation
 */
@ObjectType()
export class ConversationUnreadCount {
  @Field(() => ID)
  conversationId: string;

  @Field(() => Int)
  unreadCount: number;

  @Field({ nullable: true, description: 'Preview of the last unread message' })
  lastMessagePreview?: string;

  @Field(() => UserMinimal, {
    nullable: true,
    description: 'Sender of the last unread message',
  })
  lastMessageSender?: UserMinimal;
}

/**
 * Result of marking messages as read
 */
@ObjectType()
export class MarkReadResult {
  @Field({ description: 'Whether the operation was successful' })
  success: boolean;

  @Field(() => Int, { description: 'Number of messages marked as read' })
  messagesMarkedRead: number;

  @Field(() => ID, { description: 'The conversation ID' })
  conversationId: string;
}

// ==================== Subscription Payloads ====================

/**
 * Payload for new message subscription
 */
@ObjectType()
export class NewMessagePayload {
  @Field(() => Message, { description: 'The new message' })
  message: Message;

  @Field(() => ID, { description: 'The conversation ID' })
  conversationId: string;
}

/**
 * Payload for typing indicator subscription
 */
@ObjectType()
export class TypingIndicatorPayload {
  @Field(() => ID, { description: 'The conversation ID' })
  conversationId: string;

  @Field(() => UserMinimal, { description: 'The user who is typing' })
  user: UserMinimal;

  @Field({ description: 'Whether the user is currently typing' })
  isTyping: boolean;

  @Field({ description: 'Timestamp of the typing event' })
  timestamp: Date;
}

/**
 * Payload for message read receipt subscription
 */
@ObjectType()
export class MessageReadPayload {
  @Field(() => ID, { description: 'The conversation ID' })
  conversationId: string;

  @Field(() => [ID], { description: 'IDs of messages that were read' })
  messageIds: string[];

  @Field(() => ID, { description: 'User who read the messages' })
  readByUserId: string;

  @Field({ description: 'Timestamp when messages were read' })
  readAt: Date;
}
