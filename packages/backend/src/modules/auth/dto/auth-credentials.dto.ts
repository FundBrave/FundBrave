import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Authentication redirect paths
 * Used by backend to tell frontend where to navigate after auth
 */
export const AUTH_REDIRECT_PATHS = {
  /** After email/password signup - user needs onboarding */
  ONBOARDING: '/onboarding',
  /** After successful login or OAuth - go to homepage */
  HOME: '/',
  /** After OTP verification - go to onboarding */
  OTP_VERIFICATION: '/auth/verify-otp',
} as const;

/**
 * DTO for user registration with email/password
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (min 8 characters, must contain uppercase, lowercase, number)',
    example: 'SecurePass123',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Display name for the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  @MinLength(2, { message: 'Display name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
  displayName: string;
}

/**
 * DTO for user login with email/password
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address or username',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty({ message: 'Email or username is required' })
  emailOrUsername: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

/**
 * User information returned after authentication
 * Sensitive data like tokens are excluded (delivered via cookies)
 */
export class AuthUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Wallet address' })
  walletAddress: string;

  @ApiPropertyOptional({ description: 'User email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Username' })
  username?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Whether email is verified' })
  emailVerified?: boolean;
}

/**
 * Response DTO for successful authentication
 * Tokens are delivered via HttpOnly cookies, not in response body
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'Authentication was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'User information' })
  user: AuthUserDto;

  @ApiPropertyOptional({
    description: 'Redirect URL for frontend navigation after auth',
    example: '/onboarding',
  })
  redirectUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether OTP verification is required before full access',
    example: true,
  })
  requiresOtpVerification?: boolean;
}
