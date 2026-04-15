import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Web3ChatService } from './web3-chat.service';
import {
  AuthorizeKeyRotationDto,
  AuthorizeKeyRotationResponseDto,
  CreateArchiveDto,
  CreateArchiveResponseDto,
  EncryptionKeyHashResponseDto,
  GetArchivesQueryDto,
  GetArchivesResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  walletAddress: string;
}

/**
 * Web3ChatController
 *
 * Five REST endpoints supporting the Web3 Chat Tier 3 feature:
 *
 * 1. GET  /api/users/:userId/encryption-key-hash   — Public. Fetch a user's key hash.
 * 2. POST /api/users/:userId/authorize-key-rotation — Auth. Rotate own encryption key.
 * 3. POST /api/messages/archive                    — Auth. Upload an encrypted archive chunk.
 * 4. GET  /api/messages/archive/:conversationHash  — Auth. Paginate own archives.
 * 5. DELETE /api/messages/archive/:id              — Auth. Delete own archive (right to be forgotten).
 *
 * The controller is split across two route prefixes to match the task spec:
 * - /api/users/:userId/* is handled here alongside the existing UsersController
 *   by registering this controller under the 'users' tag with no route conflict.
 * - /api/messages/archive/* is registered under the 'messages' tag.
 *
 * NestJS resolves route conflicts by declaration order in the module; the
 * specific paths here (/encryption-key-hash, /authorize-key-rotation, /archive/*)
 * do not clash with anything in UsersController or MessagingController.
 */
@ApiTags('Web3 Chat')
@Controller()
export class Web3ChatController {
  constructor(private readonly web3ChatService: Web3ChatService) {}

  // ==================== Endpoint 1: Get Encryption Key Hash ====================

  /**
   * GET /api/users/:userId/encryption-key-hash
   *
   * Public endpoint — no authentication required.
   * Returns the SHA-256 hash of the user's X25519 encryption public key.
   * Peers use this to verify a counterpart has registered a key before
   * opening an encrypted channel, and to detect key rotation events.
   */
  @Get('users/:userId/encryption-key-hash')
  @ApiOperation({
    summary: "Fetch a user's encryption public key hash",
    description:
      'Public endpoint. Returns the SHA-256 hash of the target user\'s ' +
      'X25519 encryption public key. Null if the user has not registered a key. ' +
      'The actual key is never stored server-side — only its hash.',
  })
  @ApiParam({ name: 'userId', type: String, description: 'Target user UUID' })
  @ApiResponse({
    status: 200,
    description: 'Key hash returned (may be null)',
    type: EncryptionKeyHashResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getEncryptionKeyHash(
    @Param('userId') userId: string,
  ): Promise<EncryptionKeyHashResponseDto> {
    return this.web3ChatService.getEncryptionKeyHash(userId);
  }

  // ==================== Endpoint 2: Authorize Key Rotation ====================

  /**
   * POST /api/users/:userId/authorize-key-rotation
   *
   * Auth required. Only the authenticated user can rotate their own key.
   * The oldKeyHash must match the currently stored hash on the server —
   * this proves the caller controlled the previous key and prevents
   * third parties from hijacking a user's encryption identity.
   *
   * For first-time key registration (when no key has been stored yet)
   * pass oldKeyHash = 'initial' as a sentinel value.
   */
  @Post('users/:userId/authorize-key-rotation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Authorize an encryption key rotation',
    description:
      "Auth required. Validates oldKeyHash against the stored hash, then updates " +
      "the user's encryptionPubKeyHash to newKeyHash. Use oldKeyHash='initial' for " +
      "first-time key registration.",
  })
  @ApiParam({ name: 'userId', type: String, description: 'Target user UUID (must match JWT)' })
  @ApiResponse({
    status: 200,
    description: 'Key rotation authorized',
    type: AuthorizeKeyRotationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'oldKeyHash mismatch or invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden — can only rotate own key' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async authorizeKeyRotation(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AuthorizeKeyRotationDto,
  ): Promise<AuthorizeKeyRotationResponseDto> {
    return this.web3ChatService.authorizeKeyRotation(
      userId,
      user.id,
      dto.oldKeyHash,
      dto.newKeyHash,
      dto.walletType,
    );
  }

  // ==================== Endpoint 3: Upload Encrypted Archive ====================

  /**
   * POST /api/messages/archive
   *
   * Auth required. Accepts a base64-encoded encrypted blob and stores it.
   * The server has no ability to decrypt the content (client-side encryption).
   * Max blob size is 5 MB (enforced both in the DTO and in the service layer).
   */
  @Post('messages/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload an encrypted message archive chunk',
    description:
      'Auth required. Stores an opaque encrypted blob against the given ' +
      'conversationHash. The server cannot read the encrypted content. ' +
      'Maximum payload size is 5 MB (base64-encoded).',
  })
  @ApiResponse({
    status: 201,
    description: 'Archive stored. Returns the new record id and timestamp.',
    type: CreateArchiveResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or payload too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT required' })
  async createArchive(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateArchiveDto,
  ): Promise<CreateArchiveResponseDto> {
    return this.web3ChatService.createArchive(user.id, dto);
  }

  // ==================== Endpoint 4: List Encrypted Archives ====================

  /**
   * GET /api/messages/archive/:conversationHash
   *
   * Auth required. Returns cursor-paginated encrypted archives for the
   * authenticated user in the specified conversation.
   * Only archives where senderUserId === authenticated user are returned
   * (privacy guarantee — users cannot read each other's uploads).
   */
  @Get('messages/archive/:conversationHash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List own encrypted archives for a conversation',
    description:
      'Auth required. Returns cursor-paginated archives uploaded by the ' +
      'authenticated user for the given conversationHash. ' +
      'Results are newest-first. Pass ?cursor=<lastId> to fetch the next page.',
  })
  @ApiParam({
    name: 'conversationHash',
    type: String,
    description: 'keccak256 hex hash identifying the conversation',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1–100, default 20)' })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Pagination cursor (archive id)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of encrypted archive chunks',
    type: GetArchivesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT required' })
  async getArchives(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationHash') conversationHash: string,
    @Query() query: GetArchivesQueryDto,
  ): Promise<GetArchivesResponseDto> {
    return this.web3ChatService.getArchives(user.id, conversationHash, query);
  }

  // ==================== Endpoint 5: Delete Archive (Right to be Forgotten) ====================

  /**
   * DELETE /api/messages/archive/:id
   *
   * Auth required. Permanently deletes the archive record.
   * Only the original sender may delete their own archives.
   * Satisfies GDPR Article 17 / CCPA "right to erasure" requirements.
   */
  @Delete('messages/archive/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an encrypted archive record (right to be forgotten)',
    description:
      'Auth required. Permanently deletes the specified archive. ' +
      'Only the original sender can delete their own records. ' +
      'This operation is irreversible.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Archive record UUID' })
  @ApiResponse({ status: 200, description: 'Archive deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT required' })
  @ApiResponse({ status: 403, description: 'Forbidden — can only delete own archives' })
  @ApiResponse({ status: 404, description: 'Archive not found' })
  async deleteArchive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true }> {
    return this.web3ChatService.deleteArchive(id, user.id);
  }
}
