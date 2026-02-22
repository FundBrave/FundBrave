import { Module } from '@nestjs/common';
import { Web3ChatService } from './web3-chat.service';
import { Web3ChatController } from './web3-chat.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Web3ChatModule
 *
 * Provides the Tier 3 encrypted message archive and encryption key management
 * features for the Web3 Chat system.
 *
 * Registered endpoints (see Web3ChatController for full docs):
 *   GET    /api/users/:userId/encryption-key-hash      — public
 *   POST   /api/users/:userId/authorize-key-rotation   — auth required
 *   POST   /api/messages/archive                       — auth required
 *   GET    /api/messages/archive/:conversationHash     — auth required
 *   DELETE /api/messages/archive/:id                   — auth required
 *
 * Security model:
 * - All archive content is encrypted client-side before upload.
 * - The server stores an opaque Bytes blob and cannot decrypt it.
 * - Key hashes (SHA-256) are stored instead of actual public keys.
 * - Ownership checks (senderUserId === authenticated user) are enforced
 *   in the service layer for every read and delete operation.
 */
@Module({
  imports: [PrismaModule],
  controllers: [Web3ChatController],
  providers: [Web3ChatService],
  exports: [Web3ChatService],
})
export class Web3ChatModule {}
