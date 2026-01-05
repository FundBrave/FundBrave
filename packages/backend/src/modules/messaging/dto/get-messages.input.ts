import { Field, InputType, Int, ID } from '@nestjs/graphql';
import { IsUUID, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * Input DTO for retrieving messages from a conversation with pagination
 */
@InputType()
export class GetMessagesInput {
  @Field(() => ID, { description: 'The ID of the conversation to retrieve messages from' })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @Field(() => Int, {
    defaultValue: 50,
    description: 'Maximum number of messages to retrieve (default: 50)'
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @Field(() => Int, {
    defaultValue: 0,
    description: 'Number of messages to skip for pagination (default: 0)'
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @Field(() => ID, {
    nullable: true,
    description: 'Cursor-based pagination: get messages before this message ID'
  })
  @IsOptional()
  @IsUUID()
  beforeMessageId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Cursor-based pagination: get messages after this message ID'
  })
  @IsOptional()
  @IsUUID()
  afterMessageId?: string;
}

/**
 * Input DTO for marking messages as read
 */
@InputType()
export class MarkMessagesReadInput {
  @Field(() => ID, { description: 'The ID of the conversation to mark messages as read' })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Optional: mark messages up to this specific message ID as read'
  })
  @IsOptional()
  @IsUUID()
  upToMessageId?: string;
}
