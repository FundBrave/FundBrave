import { Field, InputType, ID } from '@nestjs/graphql';
import { IsUUID, IsNotEmpty } from 'class-validator';

/**
 * Input DTO for starting a new conversation between users
 * Creates a direct message conversation between the current user and the participant
 */
@InputType()
export class StartConversationInput {
  @Field(() => ID, {
    description: 'The ID of the user to start a conversation with',
  })
  @IsUUID()
  @IsNotEmpty()
  participantId: string;
}
