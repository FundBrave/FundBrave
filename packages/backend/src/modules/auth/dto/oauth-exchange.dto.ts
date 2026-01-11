import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
 *
 * Google OAuth users:
 * - Email is automatically verified (verified by Google)
 * - No OTP verification required
 * - Redirect to homepage
 */
export class OAuthCodeExchangeResponseDto {
  @ApiProperty({ description: 'Exchange was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      username: { type: 'string' },
      displayName: { type: 'string' },
      emailVerified: { type: 'boolean' },
    },
  })
  user: {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    emailVerified?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Redirect URL for frontend navigation after auth',
    example: '/',
  })
  redirectUrl?: string;
}
