import {
  Field,
  ObjectType,
  InputType,
  Int,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

// ==================== Enums ====================

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  REPOST = 'REPOST',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  DONATION_RECEIVED = 'DONATION_RECEIVED',
  STAKE_RECEIVED = 'STAKE_RECEIVED',
  GOAL_REACHED = 'GOAL_REACHED',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  PROPOSAL_CREATED = 'PROPOSAL_CREATED',
  PROPOSAL_EXECUTED = 'PROPOSAL_EXECUTED',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  YIELD_HARVESTED = 'YIELD_HARVESTED',
  STOCK_PURCHASED = 'STOCK_PURCHASED',
  FBT_VESTED = 'FBT_VESTED',
  FBT_REWARD = 'FBT_REWARD',
  DAO_VOTE_STARTED = 'DAO_VOTE_STARTED',
  DAO_VOTE_ENDED = 'DAO_VOTE_ENDED',
}

registerEnumType(NotificationType, { name: 'NotificationType' });

// ==================== Output DTOs ====================

@ObjectType()
export class NotificationActor {
  @Field(() => ID)
  id: string;

  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  message?: string;

  @Field(() => NotificationActor, { nullable: true })
  actor?: NotificationActor;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  entityType?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, unknown>;

  @Field()
  read: boolean;

  @Field({ nullable: true })
  readAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaginatedNotifications {
  @Field(() => [Notification])
  items: Notification[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;

  @Field(() => Int)
  unreadCount: number;
}

@ObjectType()
export class NotificationCount {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  unread: number;
}

@ObjectType()
export class NotificationOperationResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => Int, { nullable: true })
  affectedCount?: number;
}

// ==================== Input DTOs ====================

@InputType()
export class CreateNotificationInput {
  @Field()
  @IsUUID()
  recipientId: string;

  @Field(() => NotificationType)
  @IsEnum(NotificationType)
  type: NotificationType;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  entityId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

@InputType()
export class GetNotificationsInput {
  @Field(() => Int, { defaultValue: 20 })
  limit: number;

  @Field(() => Int, { defaultValue: 0 })
  offset: number;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @Field(() => [NotificationType], { nullable: true })
  @IsOptional()
  types?: NotificationType[];
}

@InputType()
export class MarkNotificationsReadInput {
  @Field(() => [ID])
  notificationIds: string[];
}
