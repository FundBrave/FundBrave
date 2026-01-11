/**
 * Authentication Security Types
 * Contains all types for security-related authentication features
 *
 * Security Fixes Implemented:
 * - CWE-598: One-time code exchange pattern
 * - CWE-352: CSRF state validation
 * - CWE-601: Redirect URL validation
 * - CWE-384: Session fixation prevention
 * - CWE-640: Weak account linking prevention
 * - CWE-326: Strong encryption (AES-256-GCM + PBKDF2)
 * - CWE-522: HttpOnly cookies for tokens
 */

/**
 * Result of one-time code exchange for OAuth tokens
 */
export interface OAuthCodeExchangeResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    emailVerified?: boolean;
  };
}

/**
 * OAuth handoff creation data
 */
export interface CreateOAuthHandoffData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  email?: string;
  username?: string;
  displayName?: string;
  emailVerified?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Encrypted wallet data structure (AES-256-GCM with PBKDF2)
 */
export interface EncryptedWalletData {
  encryptedPrivateKey: string;
  iv: string;
  authTag: string;
  salt: string;
}

/**
 * Session invalidation reason enum
 */
export enum SessionInvalidationReason {
  NEW_LOGIN = 'NEW_LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  USER_LOGOUT = 'USER_LOGOUT',
  ADMIN_REVOKE = 'ADMIN_REVOKE',
  SECURITY_CONCERN = 'SECURITY_CONCERN',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  OAUTH_LOGIN = 'OAUTH_LOGIN',
}

/**
 * OAuth state validation result
 */
export interface OAuthStateValidationResult {
  valid: boolean;
  errorMessage?: string;
}

/**
 * Redirect URL validation result
 */
export interface RedirectUrlValidationResult {
  valid: boolean;
  sanitizedUrl?: string;
  errorMessage?: string;
}

/**
 * Security event types for audit logging
 */
export enum SecurityEventType {
  OAUTH_STATE_GENERATED = 'OAUTH_STATE_GENERATED',
  OAUTH_STATE_VALIDATED = 'OAUTH_STATE_VALIDATED',
  OAUTH_STATE_INVALID = 'OAUTH_STATE_INVALID',
  OAUTH_STATE_EXPIRED = 'OAUTH_STATE_EXPIRED',
  OAUTH_CODE_GENERATED = 'OAUTH_CODE_GENERATED',
  OAUTH_CODE_EXCHANGED = 'OAUTH_CODE_EXCHANGED',
  OAUTH_CODE_INVALID = 'OAUTH_CODE_INVALID',
  OAUTH_CODE_EXPIRED = 'OAUTH_CODE_EXPIRED',
  OAUTH_CODE_ALREADY_USED = 'OAUTH_CODE_ALREADY_USED',
  SESSION_INVALIDATED = 'SESSION_INVALIDATED',
  ALL_SESSIONS_INVALIDATED = 'ALL_SESSIONS_INVALIDATED',
  WEAK_ACCOUNT_LINK_BLOCKED = 'WEAK_ACCOUNT_LINK_BLOCKED',
  REDIRECT_URL_INVALID = 'REDIRECT_URL_INVALID',
  ENCRYPTION_KEY_INVALID = 'ENCRYPTION_KEY_INVALID',
  ENCRYPTION_KEY_VALIDATED = 'ENCRYPTION_KEY_VALIDATED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  WALLET_ENCRYPTED = 'WALLET_ENCRYPTED',
  WALLET_DECRYPTED = 'WALLET_DECRYPTED',
  // OTP Email Verification Events
  OTP_GENERATED = 'OTP_GENERATED',
  OTP_SENT = 'OTP_SENT',
  OTP_VERIFIED = 'OTP_VERIFIED',
  OTP_INVALID = 'OTP_INVALID',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_RATE_LIMITED = 'OTP_RATE_LIMITED',
  OTP_MAX_ATTEMPTS_EXCEEDED = 'OTP_MAX_ATTEMPTS_EXCEEDED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
}

/**
 * Security event log entry
 */
export interface SecurityEventLog {
  eventType: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Cookie configuration for HttpOnly tokens
 */
export interface TokenCookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
}

/**
 * Environment configuration validation result
 */
export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Allowed redirect domains configuration
 */
export interface AllowedRedirectDomains {
  production: string[];
  staging: string[];
  development: string[];
}

/**
 * PBKDF2 key derivation configuration
 */
export interface PBKDF2Config {
  iterations: number;
  keyLength: number;
  digest: string;
}

/**
 * Encryption configuration constants
 */
export const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  ivLength: 16,
  saltLength: 32,
  authTagLength: 16,
  pbkdf2: {
    iterations: 100000,
    keyLength: 32,
    digest: 'sha256',
  } as PBKDF2Config,
} as const;

/**
 * OAuth state configuration
 */
export const OAUTH_STATE_CONFIG = {
  expiryMs: 10 * 60 * 1000, // 10 minutes
  codeLength: 32, // 32 bytes = 64 hex chars
} as const;

/**
 * OAuth handoff code configuration
 */
export const OAUTH_HANDOFF_CONFIG = {
  expiryMs: 5 * 60 * 1000, // 5 minutes
  codeLength: 32, // 32 bytes = 64 hex chars
} as const;

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  accessTokenExpiryMs: 15 * 60 * 1000, // 15 minutes
  refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Google user data from OAuth callback
 */
export interface GoogleUserData {
  googleId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Request metadata for security logging
 */
export interface RequestSecurityContext {
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
}
