import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingResolver } from './messaging.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebSocketsModule } from '../websockets/websockets.module';

/**
 * Messaging Module
 * Provides direct messaging functionality including:
 * - Starting conversations between users
 * - Sending and receiving messages
 * - Read receipts and typing indicators
 * - Real-time message delivery via WebSockets
 * - GraphQL subscriptions for real-time updates
 */
@Module({
  imports: [
    PrismaModule,
    WebSocketsModule,
  ],
  providers: [
    MessagingService,
    MessagingResolver,
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
