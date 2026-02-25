import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateArchiveDto } from './dto/create-archive.dto';
import type { GetArchivesQueryDto } from './dto/get-archives.dto';
import type {
  ArchiveItemDto,
  GetArchivesResponseDto,
} from './dto/get-archives.dto';

/**
 * Web3ChatService — Encrypted Message Archive + Key Management
 *
 * Security model:
 * - encryptedData is treated as an opaque binary blob at all times.
 *   The service reads its length only to enforce the 5 MB cap; it never
 *   inspects, indexes, or transforms the plaintext (there is none — it's
 *   encrypted client-side before upload).
 * - conversationHash is a keccak256 digest of sorted participant IDs.
 *   The server never reconstructs the participant list from this hash.
 * - Authorization is strictly scoped: users can only read/delete their own
 *   archives (senderUserId === authenticated user id).
 */
@Injectable()
export class Web3ChatService {
  private readonly logger = new Logger(Web3ChatService.name);

  // 5 MB ceiling enforced at the service layer in addition to DTO validation
  private static readonly MAX_BLOB_BYTES = 5 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Encryption Key Hash ====================

  /**
   * GET /api/users/:userId/encryption-key-hash
   *
   * Public endpoint. Returns the stored SHA-256 hash of the user's
   * X25519 encryption public key, or null if none has been registered.
   */
  async getEncryptionKeyHash(userId: string): Promise<{ keyHash: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionPubKeyHash: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ${userId} not found`,
      });
    }

    return { keyHash: user.encryptionPubKeyHash ?? null };
  }

  // ==================== Key Rotation ====================

  /**
   * POST /api/users/:userId/authorize-key-rotation
   *
   * Auth required. Only the authenticated user can rotate their own key.
   * The service validates that oldKeyHash matches the currently stored hash
   * before applying the update — preventing a third party from overwriting
   * a key they did not generate.
   *
   * Special case: if the user has never registered a key (encryptionPubKeyHash
   * is null) AND oldKeyHash is the sentinel value 'initial', we treat this as
   * a first-time registration rather than a rotation. This avoids a chicken-
   * and-egg problem on first key setup.
   */
  async authorizeKeyRotation(
    userId: string,
    requestingUserId: string,
    oldKeyHash: string,
    newKeyHash: string,
    walletType: 'temp' | 'real',
  ): Promise<{ success: true; authorizedAt: string }> {
    // Authorization: only the user themselves may rotate their key
    if (userId !== requestingUserId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only rotate your own encryption key',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionPubKeyHash: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ${userId} not found`,
      });
    }

    const currentHash = user.encryptionPubKeyHash;

    // Validate the old hash matches what is stored.
    // Allow 'initial' as oldKeyHash only when no key has been registered yet.
    const isFirstRegistration = currentHash === null && oldKeyHash === 'initial';
    const hashMatches = currentHash !== null && currentHash === oldKeyHash;

    if (!isFirstRegistration && !hashMatches) {
      throw new BadRequestException({
        code: 'KEY_HASH_MISMATCH',
        message:
          'oldKeyHash does not match the currently stored encryption key hash. ' +
          'Provide the correct current hash to authorize rotation.',
      });
    }

    // Prevent no-op updates
    if (newKeyHash === currentHash) {
      throw new BadRequestException({
        code: 'KEY_HASH_UNCHANGED',
        message: 'newKeyHash is identical to the current key hash. No update performed.',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { encryptionPubKeyHash: newKeyHash },
    });

    this.logger.log(
      `Key rotation authorized for user ${userId} (walletType=${walletType})`,
    );

    return {
      success: true,
      authorizedAt: new Date().toISOString(),
    };
  }

  // ==================== Message Archive — Create ====================

  /**
   * POST /api/messages/archive
   *
   * Auth required. Creates an encrypted archive record.
   * The encryptedData field is decoded from base64 and stored as Bytes.
   * Size is validated before the database write.
   */
  async createArchive(
    senderUserId: string,
    dto: CreateArchiveDto,
  ): Promise<{ id: string; createdAt: string }> {
    // Decode base64 → Buffer and enforce 5 MB ceiling
    let binaryData: Buffer;
    try {
      binaryData = Buffer.from(dto.encryptedData, 'base64');
    } catch {
      throw new BadRequestException({
        code: 'INVALID_ENCRYPTED_DATA',
        message: 'encryptedData must be a valid base64-encoded string',
      });
    }

    if (binaryData.byteLength > Web3ChatService.MAX_BLOB_BYTES) {
      throw new BadRequestException({
        code: 'ARCHIVE_TOO_LARGE',
        message: `Encrypted archive exceeds the 5 MB maximum size (received ${binaryData.byteLength} bytes)`,
      });
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    // Reject expiry dates in the past
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException({
        code: 'INVALID_EXPIRY',
        message: 'expiresAt must be a future date',
      });
    }

    const archive = await this.prisma.messageArchive.create({
      data: {
        conversationHash: dto.conversationHash,
        encryptedData: binaryData,
        senderUserId,
        expiresAt,
      },
      select: { id: true, createdAt: true },
    });

    this.logger.log(
      `Archive created: id=${archive.id} senderUserId=${senderUserId} ` +
        `conversationHash=${dto.conversationHash} size=${binaryData.byteLength}B`,
    );

    return {
      id: archive.id,
      createdAt: archive.createdAt.toISOString(),
    };
  }

  // ==================== Message Archive — List ====================

  /**
   * GET /api/messages/archive/:conversationHash
   *
   * Auth required. Returns cursor-paginated archives for the authenticated
   * sender. Results are ordered newest-first so the client can page backwards
   * through history without duplicating records as new ones arrive.
   *
   * Privacy: only archives where senderUserId === authenticatedUserId are returned.
   */
  async getArchives(
    senderUserId: string,
    conversationHash: string,
    query: GetArchivesQueryDto,
  ): Promise<GetArchivesResponseDto> {
    const limit = query.limit ?? 20;
    const cursor = query.cursor;

    // Fetch limit+1 to determine whether a next page exists
    const records = await this.prisma.messageArchive.findMany({
      where: {
        conversationHash,
        senderUserId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      // Cursor-based pagination: skip everything at or after the cursor record
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1, // skip the cursor record itself
          }
        : {}),
      select: {
        id: true,
        encryptedData: true,
        createdAt: true,
      },
    });

    const hasNextPage = records.length > limit;
    const page = hasNextPage ? records.slice(0, limit) : records;

    const archives: ArchiveItemDto[] = page.map((record) => ({
      id: record.id,
      encryptedData: Buffer.from(record.encryptedData).toString('base64'),
      createdAt: record.createdAt.toISOString(),
    }));

    const nextCursor = hasNextPage ? (page[page.length - 1]?.id ?? null) : null;

    return { archives, nextCursor };
  }

  // ==================== Message Archive — Delete ====================

  /**
   * DELETE /api/messages/archive/:id
   *
   * Auth required. Only the sender may delete their own archive.
   * Satisfies GDPR/CCPA "right to be forgotten" requirements.
   */
  async deleteArchive(
    id: string,
    requestingUserId: string,
  ): Promise<{ success: true }> {
    const archive = await this.prisma.messageArchive.findUnique({
      where: { id },
      select: { id: true, senderUserId: true },
    });

    if (!archive) {
      throw new NotFoundException({
        code: 'ARCHIVE_NOT_FOUND',
        message: `Message archive with ID ${id} not found`,
      });
    }

    if (archive.senderUserId !== requestingUserId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only delete your own message archives',
      });
    }

    await this.prisma.messageArchive.delete({ where: { id } });

    this.logger.log(
      `Archive deleted: id=${id} requestingUserId=${requestingUserId}`,
    );

    return { success: true };
  }
}
