import { SetMetadata } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

/**
 * Rate limiting decorators for different endpoint types
 */

/**
 * Skip rate limiting for this endpoint
 */
export { SkipThrottle };

/**
 * Default rate limit: 100 requests per minute
 */
export const DefaultRateLimit = () => Throttle({ default: { limit: 100, ttl: 60000 } });

/**
 * Auth rate limit: 5 requests per minute (stricter for login/register)
 */
export const AuthRateLimit = () => Throttle({ default: { limit: 5, ttl: 60000 } });

/**
 * Upload rate limit: 10 requests per minute
 */
export const UploadRateLimit = () => Throttle({ default: { limit: 10, ttl: 60000 } });

/**
 * GraphQL rate limit: 200 requests per minute
 */
export const GraphQLRateLimit = () => Throttle({ default: { limit: 200, ttl: 60000 } });

/**
 * Search rate limit: 30 requests per minute
 */
export const SearchRateLimit = () => Throttle({ default: { limit: 30, ttl: 60000 } });

/**
 * Write operation rate limit: 20 requests per minute
 */
export const WriteRateLimit = () => Throttle({ default: { limit: 20, ttl: 60000 } });

/**
 * Sensitive operation rate limit: 3 requests per minute
 */
export const SensitiveRateLimit = () => Throttle({ default: { limit: 3, ttl: 60000 } });

/**
 * Password reset rate limit: 3 requests per 15 minutes per email
 * More restrictive to prevent enumeration attacks and abuse
 */
export const PasswordResetRateLimit = () => Throttle({ default: { limit: 3, ttl: 900000 } });

/**
 * OTP verification rate limit: 3 requests per 10 minutes
 * Prevents brute-force attacks on 4-digit OTP codes
 */
export const OtpVerificationRateLimit = () => Throttle({ default: { limit: 3, ttl: 600000 } });

/**
 * OTP resend rate limit: 3 requests per 10 minutes
 * Prevents OTP spam while allowing legitimate resend requests
 */
export const OtpResendRateLimit = () => Throttle({ default: { limit: 3, ttl: 600000 } });
