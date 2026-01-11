import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for OTP verification request
 * POST /api/auth/verify-otp
 */
export class VerifyOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: '4-digit OTP code sent to email',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP code is required' })
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'OTP must contain only 4 digits' })
  otp: string;
}

/**
 * DTO for resending OTP request
 * POST /api/auth/resend-otp
 */
export class ResendOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

/**
 * Response type for OTP verification
 */
export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  emailVerified?: boolean;
}

/**
 * Response type for OTP sending/resending
 */
export interface SendOtpResponse {
  success: boolean;
  message: string;
  /** Number of seconds until user can request another OTP */
  cooldownSeconds?: number;
}

/**
 * OTP configuration constants
 */
export const OTP_CONFIG = {
  /** OTP expiration time in milliseconds (10 minutes) */
  expiryMs: 10 * 60 * 1000,
  /** Maximum OTP verification attempts before lockout */
  maxAttempts: 3,
  /** Rate limit window for OTP requests in milliseconds (10 minutes) */
  rateLimitWindowMs: 10 * 60 * 1000,
  /** Maximum OTP requests per rate limit window */
  maxRequestsPerWindow: 3,
  /** Cooldown between OTP resend requests in milliseconds (60 seconds) */
  resendCooldownMs: 60 * 1000,
  /** OTP length (4 digits) */
  otpLength: 4,
} as const;
