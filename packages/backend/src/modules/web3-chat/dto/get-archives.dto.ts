import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query params for GET /api/messages/archive/:conversationHash
 *
 * Uses cursor-based pagination rather than offset pagination so that
 * newly arriving archives do not shift pages and cause duplicates
 * or gaps in the client's local list.
 *
 * cursor is the id of the last archive seen by the client.
 * The server returns records created BEFORE that archive (newest-first).
 */
export class GetArchivesQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of records to return. Defaults to 20, max 100.',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Cursor — the id of the last archive the client already has. Omit to fetch the most recent page.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * A single archive item in a paginated response.
 * encryptedData is re-encoded as base64 for the JSON transport layer.
 */
export class ArchiveItemDto {
  id: string;
  encryptedData: string; // base64-encoded bytes
  createdAt: string; // ISO 8601
}

/**
 * Response DTO for GET /api/messages/archive/:conversationHash
 */
export class GetArchivesResponseDto {
  archives: ArchiveItemDto[];

  /**
   * Pass this as ?cursor= in the next request to fetch the next page.
   * Null when there are no more pages.
   */
  nextCursor: string | null;
}
