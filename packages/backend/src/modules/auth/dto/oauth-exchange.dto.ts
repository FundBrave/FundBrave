import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for OAuth code exchange endpoint
 * CWE-598 Fix: Exchange one-time code for tokens instead of passing tokens in URL
 */
export class OAuthCodeExchangeDto {
  @ApiProperty({
    description: 'One-time authorization code from OAuth callback',
    example: 'a1b2c3d4e5f6...',
    minLength: 64,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty({ message: 'Authorization code is required' })
  @Length(64, 64, { message: 'Invalid authorization code format' })
  code: string;
}

/**
 * Response DTO for OAuth code exchange
 * Tokens are returned via HttpOnly cookies, this contains user info only
 */
export class OAuthCodeExchangeResponseDto {
  @ApiProperty({ description: 'User email address' })
  email?: string;

  @ApiProperty({ description: 'Username' })
  username?: string;

  @ApiProperty({ description: 'Display name' })
  displayName?: string;

  @ApiProperty({ description: 'Exchange was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;
}
