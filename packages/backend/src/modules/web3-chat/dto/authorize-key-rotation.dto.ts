import { IsIn, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request body for POST /api/users/:userId/authorize-key-rotation
 *
 * Before updating the stored encryption public key hash the server validates
 * that the caller knows the *current* hash (proving they still control the
 * previous key material or have a legitimate migration path).
 *
 * Wallet type is recorded so the server can apply different rotation policies
 * in the future (e.g., rate-limit temp-wallet rotations more aggressively).
 */
export class AuthorizeKeyRotationDto {
  @ApiProperty({
    description:
      "SHA-256 hex hash of the user's CURRENT encryption public key, OR the " +
      "sentinel value 'initial' for first-time key registration (when no key " +
      "has been stored yet).",
    example: 'a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
  })
  @IsString()
  @IsNotEmpty({ message: 'oldKeyHash is required' })
  // Accept either the sentinel 'initial' (first-time registration) or a
  // standard 64-character lowercase hex SHA-256 string.
  @Matches(/^(initial|[0-9a-f]{64})$/i, {
    message:
      "oldKeyHash must be 'initial' (for first-time registration) or a valid 64-character SHA-256 hex string",
  })
  oldKeyHash: string;

  @ApiProperty({
    description: "SHA-256 hex hash of the user's NEW encryption public key.",
    example: 'b4g2c3d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
  })
  @IsString()
  @IsNotEmpty({ message: 'newKeyHash is required' })
  @Length(64, 64, { message: 'newKeyHash must be a 64-character SHA-256 hex string' })
  @Matches(/^[0-9a-f]+$/i, { message: 'newKeyHash must be a valid hex string' })
  newKeyHash: string;

  @ApiProperty({
    description:
      "Identifies whether this is a temporary (anonymous) wallet or a real (connected) wallet. Used for rate-limiting policy.",
    enum: ['temp', 'real'],
    example: 'real',
  })
  @IsString()
  @IsNotEmpty({ message: 'walletType is required' })
  @IsIn(['temp', 'real'], { message: "walletType must be 'temp' or 'real'" })
  walletType: 'temp' | 'real';
}

/**
 * Response DTO for POST /api/users/:userId/authorize-key-rotation
 */
export class AuthorizeKeyRotationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'ISO 8601 timestamp of when the rotation was authorized.',
    example: '2026-02-21T12:00:00.000Z',
  })
  authorizedAt: string;
}
