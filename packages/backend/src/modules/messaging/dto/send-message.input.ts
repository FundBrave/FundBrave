import { Field, InputType, ID } from '@nestjs/graphql';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Input DTO for sending a message in a conversation
 */
@InputType()
export class SendMessageInput {
  @Field(() => ID, { description: 'The ID of the conversation to send the message to' })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @Field({ description: 'The text content of the message' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @Field({ nullable: true, description: 'Optional media URL attached to the message' })
  @IsOptional()
  @IsUrl()
  mediaUrl?: string;
}

/**
 * Input DTO for sending a direct message to a user (creates conversation if needed)
 */
@InputType()
export class SendDirectMessageInput {
  @Field(() => ID, { description: 'The ID of the user to send the message to' })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @Field({ description: 'The text content of the message' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @Field({ nullable: true, description: 'Optional media URL attached to the message' })
  @IsOptional()
  @IsUrl()
  mediaUrl?: string;
}
