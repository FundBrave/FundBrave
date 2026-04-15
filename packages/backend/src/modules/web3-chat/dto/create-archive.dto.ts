import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 5 MB expressed in base64 characters.
// base64 expands binary by 4/3, so 5 * 1024 * 1024 * (4/3) ≈ 6,990,507 chars.
// We use 7_000_000 as a slightly generous ceiling to avoid off-by-one issues.
export const MAX_ENCRYPTED_DATA_BASE64_CHARS = 7_000_000;

/**
 * Request body for POST /api/messages/archive
 *
 * The client encrypts the conversation chunk before uploading.
 * The server treats encryptedData as an opaque binary blob — it stores
 * but never attempts to read or index the plaintext content.
 *
 * conversationHash must be a keccak256 hex string (64 chars) derived from
 * the sorted array of participant user IDs joined by ':' — the same
 * derivation the frontend uses so both sides agree on the key.
 */
export class CreateArchiveDto {
  @ApiProperty({
    description:
      'keccak256 hex hash derived from sorted participant user IDs. Server never stores raw IDs.',
    example: '5d41402abc4b2a76b9719d911017c592',
  })
  @IsString()
  @IsNotEmpty({ message: 'conversationHash is required' })
  @Length(64, 64, {
    message: 'conversationHash must be a 64-character keccak256 hex string',
  })
  @Matches(/^[0-9a-f]+$/i, {
    message: 'conversationHash must be a valid hex string',
  })
  conversationHash: string;

  @ApiProperty({
    description:
      'Base64-encoded encrypted binary blob. Max 5 MB (≈ 7 000 000 base64 chars). The server cannot decrypt this.',
    example: 'SGVsbG8gV29ybGQ=',
  })
  @IsString()
  @IsNotEmpty({ message: 'encryptedData is required' })
  @MaxLength(MAX_ENCRYPTED_DATA_BASE64_CHARS, {
    message: 'encryptedData exceeds the 5 MB maximum size',
  })
  encryptedData: string;

  @ApiPropertyOptional({
    description:
      'Optional ISO 8601 expiry timestamp. The server may delete the record on or after this time (right-to-be-forgotten TTL).',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'expiresAt must be a valid ISO 8601 date string' })
  expiresAt?: string;
}

/**
 * Response DTO for POST /api/messages/archive
 */
export class CreateArchiveResponseDto {
  @ApiProperty({ description: 'UUID of the newly created archive record.' })
  id: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the archive was stored.',
    example: '2026-02-21T12:00:00.000Z',
  })
  createdAt: string;
}
