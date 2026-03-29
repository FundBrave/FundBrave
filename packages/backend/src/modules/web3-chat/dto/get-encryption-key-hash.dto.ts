import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for GET /api/users/:userId/encryption-key-hash
 *
 * Returns the SHA-256 hash of the user's X25519 encryption public key.
 * This is a public endpoint — the hash itself reveals nothing sensitive.
 * Callers use this hash to verify key rotation or to discover whether a
 * peer has registered a public key before attempting to open an encrypted channel.
 */
export class EncryptionKeyHashResponseDto {
  @ApiPropertyOptional({
    description:
      "SHA-256 hash of the user's X25519 encryption public key. Null if the user has not yet registered a key.",
    example: 'a3f1b2c4d5e6...',
    nullable: true,
  })
  keyHash: string | null;
}
