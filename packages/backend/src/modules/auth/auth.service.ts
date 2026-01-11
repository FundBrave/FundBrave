import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SiweMessage } from 'siwe';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ethers } from 'ethers';
import {
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyResetTokenResponse,
  VerifyOtpResponse,
  SendOtpResponse,
  OTP_CONFIG,
} from './dto';
import {
  EncryptedWalletData,
  SessionInvalidationReason,
  SecurityEventType,
  OAuthCodeExchangeResult,
  CreateOAuthHandoffData,
  RedirectUrlValidationResult,
  OAuthStateValidationResult,
  GoogleUserData,
  RequestSecurityContext,
  ENCRYPTION_CONFIG,
  OAUTH_STATE_CONFIG,
  OAUTH_HANDOFF_CONFIG,
  SESSION_CONFIG,
} from './types';

/**
 * AuthService - Secure Authentication Service
 *
 * Security Fixes Implemented:
 * - CWE-598: One-time code exchange pattern for OAuth tokens
 * - CWE-352: CSRF state validation for OAuth flows
 * - CWE-601: Strict redirect URL validation with domain allowlist
 * - CWE-384: Session fixation prevention - invalidate all old sessions on new login
 * - CWE-640: Block weak account linking - prevent auto-linking to password accounts
 * - CWE-326: AES-256-GCM encryption with PBKDF2 key derivation for wallet keys
 * - CWE-522: HttpOnly cookies for token delivery
 */
@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  // In-memory nonce storage for SIWE (use Redis in production)
  private nonceCache = new Map<string, { nonce: string; timestamp: number }>();

  // Password reset token expiration time (1 hour in milliseconds)
  private readonly PASSWORD_RESET_EXPIRATION_MS = 60 * 60 * 1000;

  // Allowed redirect domains for OAuth (CWE-601 fix)
  private readonly allowedRedirectDomains: string[];

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    // Initialize allowed redirect domains from config
    this.allowedRedirectDomains = this.initializeAllowedDomains();
  }

  /**
   * OnModuleInit - Validate critical security configuration at startup
   */
  async onModuleInit(): Promise<void> {
    await this.validateEncryptionKeyAtStartup();
    this.validateSecurityConfiguration();
  }

  /**
   * CWE-326 Fix: Validate encryption key at startup
   * Fails fast if encryption key is not properly configured
   */
  private async validateEncryptionKeyAtStartup(): Promise<void> {
    const encryptionKey = this.configService.get<string>('WALLET_ENCRYPTION_KEY');

    if (!encryptionKey) {
      this.logger.error('CRITICAL: WALLET_ENCRYPTION_KEY is not configured');
      throw new Error('WALLET_ENCRYPTION_KEY environment variable must be set');
    }

    // Validate key format (should be 64 hex characters for 32 bytes)
    if (!/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
      this.logger.error('CRITICAL: WALLET_ENCRYPTION_KEY has invalid format');
      throw new Error('WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    // Check for weak/default keys
    const weakKeys = [
      '0'.repeat(64),
      'a'.repeat(64),
      '1234567890'.repeat(6) + '1234',
    ];

    if (weakKeys.includes(encryptionKey.toLowerCase())) {
      this.logger.error('CRITICAL: WALLET_ENCRYPTION_KEY appears to be a weak/default key');
      throw new Error('WALLET_ENCRYPTION_KEY cannot be a weak or default value');
    }

    this.logSecurityEvent(SecurityEventType.ENCRYPTION_KEY_VALIDATED, undefined, {
      message: 'Encryption key validated successfully at startup',
    });

    this.logger.log('Wallet encryption key validated successfully');
  }

  /**
   * Validate additional security configuration
   */
  private validateSecurityConfiguration(): void {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      this.logger.warn('WARNING: JWT_SECRET is not properly configured');
    }

    if (!jwtRefreshSecret || jwtRefreshSecret === 'refresh-secret-key') {
      this.logger.warn('WARNING: JWT_REFRESH_SECRET is not properly configured');
    }

    if (this.allowedRedirectDomains.length === 0) {
      this.logger.warn('WARNING: No allowed redirect domains configured');
    }
  }

  /**
   * CWE-601 Fix: Initialize allowed redirect domains
   */
  private initializeAllowedDomains(): string[] {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const additionalDomains = this.configService.get<string>('ALLOWED_REDIRECT_DOMAINS', '');

    const domains: string[] = [];

    // Add frontend URL domain
    try {
      const url = new URL(frontendUrl);
      domains.push(url.hostname);
    } catch {
      this.logger.warn(`Invalid FRONTEND_URL: ${frontendUrl}`);
    }

    // Add additional configured domains
    if (additionalDomains) {
      additionalDomains.split(',').forEach((domain) => {
        const trimmed = domain.trim().toLowerCase();
        if (trimmed) {
          domains.push(trimmed);
        }
      });
    }

    // In development, allow localhost
    if (nodeEnv === 'development') {
      domains.push('localhost', '127.0.0.1');
    }

    this.logger.log(`Allowed redirect domains: ${domains.join(', ')}`);
    return [...new Set(domains)]; // Remove duplicates
  }

  // ==================== OAUTH STATE MANAGEMENT (CWE-352) ====================

  /**
   * CWE-352 Fix: Generate and store OAuth state for CSRF protection
   */
  async generateOAuthState(context?: RequestSecurityContext): Promise<string> {
    const state = crypto.randomBytes(OAUTH_STATE_CONFIG.codeLength).toString('hex');
    const expiresAt = new Date(Date.now() + OAUTH_STATE_CONFIG.expiryMs);

    await this.prisma.oAuthState.create({
      data: {
        state,
        expiresAt,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    });

    // Clean up expired states
    await this.cleanupExpiredOAuthStates();

    this.logSecurityEvent(SecurityEventType.OAUTH_STATE_GENERATED, undefined, {
      ipAddress: context?.ipAddress,
    });

    return state;
  }

  /**
   * CWE-352 Fix: Validate OAuth state (one-time use)
   */
  async validateOAuthState(state: string): Promise<OAuthStateValidationResult> {
    if (!state || typeof state !== 'string') {
      this.logSecurityEvent(SecurityEventType.OAUTH_STATE_INVALID, undefined, {
        reason: 'Missing or invalid state parameter',
      });
      return { valid: false, errorMessage: 'Invalid state parameter' };
    }

    const oauthState = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!oauthState) {
      this.logSecurityEvent(SecurityEventType.OAUTH_STATE_INVALID, undefined, {
        reason: 'State not found',
      });
      return { valid: false, errorMessage: 'Invalid or expired state' };
    }

    // Check expiration
    if (oauthState.expiresAt < new Date()) {
      await this.prisma.oAuthState.delete({ where: { id: oauthState.id } });
      this.logSecurityEvent(SecurityEventType.OAUTH_STATE_EXPIRED, undefined, {
        reason: 'State expired',
      });
      return { valid: false, errorMessage: 'State has expired' };
    }

    // Delete state after validation (one-time use)
    await this.prisma.oAuthState.delete({ where: { id: oauthState.id } });

    this.logSecurityEvent(SecurityEventType.OAUTH_STATE_VALIDATED, undefined, {
      ipAddress: oauthState.ipAddress,
    });

    return { valid: true };
  }

  /**
   * Clean up expired OAuth states
   */
  private async cleanupExpiredOAuthStates(): Promise<void> {
    try {
      await this.prisma.oAuthState.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
    } catch (error) {
      this.logger.warn('Failed to cleanup expired OAuth states', error);
    }
  }

  // ==================== REDIRECT URL VALIDATION (CWE-601) ====================

  /**
   * CWE-601 Fix: Validate and sanitize redirect URL
   */
  validateRedirectUrl(url: string): RedirectUrlValidationResult {
    if (!url || typeof url !== 'string') {
      this.logSecurityEvent(SecurityEventType.REDIRECT_URL_INVALID, undefined, {
        reason: 'Missing or invalid URL',
      });
      return { valid: false, errorMessage: 'Invalid redirect URL' };
    }

    try {
      const parsedUrl = new URL(url);

      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        this.logSecurityEvent(SecurityEventType.REDIRECT_URL_INVALID, undefined, {
          reason: 'Invalid protocol',
          protocol: parsedUrl.protocol,
        });
        return { valid: false, errorMessage: 'Invalid URL protocol' };
      }

      // Check if hostname is in allowed domains
      const hostname = parsedUrl.hostname.toLowerCase();
      const isAllowed = this.allowedRedirectDomains.some((domain) => {
        return hostname === domain || hostname.endsWith(`.${domain}`);
      });

      if (!isAllowed) {
        this.logSecurityEvent(SecurityEventType.REDIRECT_URL_INVALID, undefined, {
          reason: 'Domain not allowed',
          hostname,
          allowedDomains: this.allowedRedirectDomains,
        });
        return { valid: false, errorMessage: 'Redirect domain not allowed' };
      }

      // Sanitize URL (remove any dangerous characters)
      const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;

      return { valid: true, sanitizedUrl };
    } catch {
      this.logSecurityEvent(SecurityEventType.REDIRECT_URL_INVALID, undefined, {
        reason: 'URL parsing failed',
        url: url.substring(0, 100), // Truncate for logging
      });
      return { valid: false, errorMessage: 'Invalid URL format' };
    }
  }

  /**
   * Get safe redirect URL with fallback
   */
  getSafeRedirectUrl(path: string = '/auth/callback'): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const baseUrl = frontendUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${baseUrl}${path}`;
  }

  // ==================== OAUTH HANDOFF CODE (CWE-598) ====================

  /**
   * CWE-598 Fix: Create one-time OAuth handoff code
   * Instead of passing tokens in URL, we pass a short-lived code that can be exchanged
   */
  async createOAuthHandoff(data: CreateOAuthHandoffData): Promise<string> {
    const code = crypto.randomBytes(OAUTH_HANDOFF_CONFIG.codeLength).toString('hex');
    const expiresAt = new Date(Date.now() + OAUTH_HANDOFF_CONFIG.expiryMs);

    await this.prisma.oAuthHandoff.create({
      data: {
        code,
        userId: data.userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    // Clean up expired handoffs
    await this.cleanupExpiredHandoffs();

    this.logSecurityEvent(SecurityEventType.OAUTH_CODE_GENERATED, data.userId, {
      ipAddress: data.ipAddress,
    });

    return code;
  }

  /**
   * CWE-598 Fix: Exchange one-time code for tokens
   * This endpoint is called via POST from the frontend
   */
  async exchangeOAuthCode(code: string): Promise<OAuthCodeExchangeResult> {
    if (!code || typeof code !== 'string' || code.length !== 64) {
      this.logSecurityEvent(SecurityEventType.OAUTH_CODE_INVALID, undefined, {
        reason: 'Invalid code format',
      });
      throw new BadRequestException('Invalid authorization code');
    }

    const handoff = await this.prisma.oAuthHandoff.findUnique({
      where: { code },
    });

    if (!handoff) {
      this.logSecurityEvent(SecurityEventType.OAUTH_CODE_INVALID, undefined, {
        reason: 'Code not found',
      });
      throw new BadRequestException('Invalid or expired authorization code');
    }

    // Check if already used
    if (handoff.usedAt) {
      this.logSecurityEvent(SecurityEventType.OAUTH_CODE_ALREADY_USED, handoff.userId, {
        reason: 'Code already used',
        originalUseTime: handoff.usedAt,
      });
      // Delete the handoff for security
      await this.prisma.oAuthHandoff.delete({ where: { id: handoff.id } });
      throw new BadRequestException('Authorization code has already been used');
    }

    // Check expiration
    if (handoff.expiresAt < new Date()) {
      this.logSecurityEvent(SecurityEventType.OAUTH_CODE_EXPIRED, handoff.userId, {
        reason: 'Code expired',
        expiresAt: handoff.expiresAt,
      });
      await this.prisma.oAuthHandoff.delete({ where: { id: handoff.id } });
      throw new BadRequestException('Authorization code has expired');
    }

    // Mark as used and delete (one-time use)
    await this.prisma.oAuthHandoff.update({
      where: { id: handoff.id },
      data: { usedAt: new Date() },
    });

    // Delete the handoff after successful exchange
    await this.prisma.oAuthHandoff.delete({ where: { id: handoff.id } });

    this.logSecurityEvent(SecurityEventType.OAUTH_CODE_EXCHANGED, handoff.userId, {
      email: handoff.email,
    });

    // Google OAuth users always have verified emails (verified by Google)
    return {
      accessToken: handoff.accessToken,
      refreshToken: handoff.refreshToken,
      user: {
        id: handoff.userId,
        email: handoff.email ?? undefined,
        username: handoff.username ?? undefined,
        displayName: handoff.displayName ?? undefined,
        emailVerified: true, // OAuth users have verified emails
      },
    };
  }

  /**
   * Clean up expired OAuth handoffs
   */
  private async cleanupExpiredHandoffs(): Promise<void> {
    try {
      await this.prisma.oAuthHandoff.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { usedAt: { not: null } }, // Also clean up used codes
          ],
        },
      });
    } catch (error) {
      this.logger.warn('Failed to cleanup expired OAuth handoffs', error);
    }
  }

  // ==================== SESSION MANAGEMENT (CWE-384) ====================

  /**
   * CWE-384 Fix: Invalidate all existing sessions for a user
   * Called on new login to prevent session fixation attacks
   */
  async invalidateAllUserSessions(
    userId: string,
    reason: SessionInvalidationReason,
  ): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        invalidatedAt: new Date(),
        invalidationReason: reason,
      },
    });

    this.logSecurityEvent(SecurityEventType.ALL_SESSIONS_INVALIDATED, userId, {
      reason,
      sessionsInvalidated: result.count,
    });

    this.logger.log(`Invalidated ${result.count} sessions for user ${userId}: ${reason}`);
    return result.count;
  }

  /**
   * Create new session after login
   */
  private async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    context?: RequestSecurityContext,
  ): Promise<void> {
    await this.prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + SESSION_CONFIG.refreshTokenExpiryMs),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    });
  }

  // ==================== WALLET ENCRYPTION (CWE-326) ====================

  /**
   * CWE-326 Fix: Encrypt private key using AES-256-GCM with PBKDF2
   * - Uses authenticated encryption (GCM mode) for tampering detection
   * - Uses PBKDF2 for key derivation with high iteration count
   * - Includes random salt and IV for each encryption
   */
  async encryptPrivateKey(privateKey: string): Promise<EncryptedWalletData> {
    const masterKey = this.configService.get<string>('WALLET_ENCRYPTION_KEY');

    if (!masterKey) {
      throw new Error('Encryption key not configured');
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      Buffer.from(masterKey, 'hex'),
      salt,
      ENCRYPTION_CONFIG.pbkdf2.iterations,
      ENCRYPTION_CONFIG.pbkdf2.keyLength,
      ENCRYPTION_CONFIG.pbkdf2.digest,
    );

    // Create cipher using AES-256-GCM
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONFIG.algorithm,
      derivedKey,
      iv,
    ) as crypto.CipherGCM;

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    this.logSecurityEvent(SecurityEventType.WALLET_ENCRYPTED, undefined, {
      algorithm: ENCRYPTION_CONFIG.algorithm,
      pbkdf2Iterations: ENCRYPTION_CONFIG.pbkdf2.iterations,
    });

    return {
      encryptedPrivateKey: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex'),
    };
  }

  /**
   * CWE-326 Fix: Decrypt private key using AES-256-GCM with PBKDF2
   */
  async decryptPrivateKey(encryptedData: EncryptedWalletData): Promise<string> {
    const masterKey = this.configService.get<string>('WALLET_ENCRYPTION_KEY');

    if (!masterKey) {
      throw new Error('Encryption key not configured');
    }

    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      Buffer.from(masterKey, 'hex'),
      salt,
      ENCRYPTION_CONFIG.pbkdf2.iterations,
      ENCRYPTION_CONFIG.pbkdf2.keyLength,
      ENCRYPTION_CONFIG.pbkdf2.digest,
    );

    // Create decipher using AES-256-GCM
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.algorithm,
      derivedKey,
      iv,
    ) as crypto.DecipherGCM;

    // Set authentication tag for verification
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encryptedData.encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    this.logSecurityEvent(SecurityEventType.WALLET_DECRYPTED, undefined, {
      algorithm: ENCRYPTION_CONFIG.algorithm,
    });

    return decrypted;
  }

  // ==================== GOOGLE OAUTH (CWE-640) ====================

  /**
   * CWE-640 Fix: Find or create user from Google OAuth
   * SECURITY: Blocks automatic linking to existing password accounts
   *
   * Google OAuth users always have emailVerified: true because:
   * 1. Google has already verified their email address
   * 2. No OTP verification is required for OAuth users
   */
  async findOrCreateGoogleUser(data: GoogleUserData): Promise<{
    id: string;
    walletAddress: string;
    email?: string | null;
    username?: string | null;
    displayName?: string | null;
    emailVerified: boolean;
  }> {
    const { googleId, email, displayName, avatarUrl } = data;

    // First, try to find existing user by Google ID
    let user = await this.prisma.user.findFirst({
      where: { googleId },
    });

    if (user) {
      // Update user info if needed (including ensuring emailVerified is true)
      const needsUpdate = displayName || avatarUrl || !user.emailVerified;
      if (needsUpdate) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true, // Always ensure Google users have verified email
            ...(displayName && !user.displayName && { displayName }),
            ...(avatarUrl && !user.avatarUrl && { avatarUrl }),
          },
        });
      }
      return { ...user, emailVerified: true };
    }

    // Try to find by email
    const existingUserByEmail = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUserByEmail) {
      // CWE-640 Fix: Block linking if user has a password
      if (existingUserByEmail.passwordHash) {
        this.logSecurityEvent(
          SecurityEventType.WEAK_ACCOUNT_LINK_BLOCKED,
          existingUserByEmail.id,
          {
            email: this.maskEmail(email),
            reason: 'Attempted to link Google to password-protected account',
          },
        );

        throw new ForbiddenException(
          'An account with this email already exists. ' +
          'Please sign in with your password and link your Google account from settings.',
        );
      }

      // Safe to link - user has no password (created via OAuth or wallet)
      user = await this.prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          googleId,
          emailVerified: true,
          ...(displayName && !existingUserByEmail.displayName && { displayName }),
          ...(avatarUrl && !existingUserByEmail.avatarUrl && { avatarUrl }),
        },
      });

      this.logger.log(`Linked Google account to existing user: ${user.id}`);
      return { ...user, emailVerified: true };
    }

    // Create new user with managed wallet
    const wallet = ethers.Wallet.createRandom();
    const encryptedWallet = await this.encryptPrivateKey(wallet.privateKey);

    user = await this.prisma.user.create({
      data: {
        walletAddress: wallet.address.toLowerCase(),
        googleId,
        email: email.toLowerCase(),
        emailVerified: true, // Google OAuth users have verified emails
        displayName,
        avatarUrl,
        encryptedPrivateKey: encryptedWallet.encryptedPrivateKey,
        encryptionIv: encryptedWallet.iv,
        encryptionAuthTag: encryptedWallet.authTag,
        encryptionSalt: encryptedWallet.salt,
        username: `user_${wallet.address.slice(2, 10)}`,
      },
    });

    this.logger.log(`Created new user from Google OAuth: ${user.id}`);
    return { ...user, emailVerified: true };
  }

  /**
   * Login with Google (called after OAuth callback)
   * CWE-384 Fix: Invalidates all existing sessions before creating new one
   */
  async loginWithGoogle(
    user: { id: string; walletAddress: string },
    context?: RequestSecurityContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // CWE-384 Fix: Invalidate all existing sessions
    await this.invalidateAllUserSessions(user.id, SessionInvalidationReason.OAUTH_LOGIN);

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.walletAddress);

    // Create new session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken, context);

    this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, user.id, {
      method: 'google_oauth',
      ipAddress: context?.ipAddress,
    });

    return tokens;
  }

  // ==================== SIWE AUTHENTICATION ====================

  /**
   * Generate nonce for SIWE
   */
  async generateNonce(walletAddress: string): Promise<string> {
    const nonce = ethers.hexlify(ethers.randomBytes(32));

    // Store nonce with timestamp for expiration check
    this.nonceCache.set(walletAddress.toLowerCase(), {
      nonce,
      timestamp: Date.now(),
    });

    // Clean up old nonces (older than 5 minutes)
    this.cleanupExpiredNonces();

    return nonce;
  }

  /**
   * Clean up expired nonces
   */
  private cleanupExpiredNonces(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, value] of this.nonceCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        this.nonceCache.delete(key);
      }
    }
  }

  /**
   * Verify SIWE signature and create session
   * CWE-384 Fix: Invalidates all existing sessions before creating new one
   */
  async verifySiweAndLogin(
    message: string,
    signature: string,
    context?: RequestSecurityContext,
  ) {
    const siweMessage = new SiweMessage(message);

    // Validate domain (prevent phishing attacks)
    const expectedDomain = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001')
      .replace(/^https?:\/\//, ''); // Remove protocol
    if (siweMessage.domain !== expectedDomain.split(':')[0]) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, undefined, {
        method: 'siwe',
        reason: 'Domain mismatch',
        expected: expectedDomain,
        received: siweMessage.domain,
      });
      throw new UnauthorizedException('Invalid domain in SIWE message');
    }

    // Validate chain ID (ensure correct network)
    const expectedChainId = parseInt(this.configService.get<string>('CHAIN_ID', '8453')); // Base mainnet
    if (siweMessage.chainId !== expectedChainId) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, undefined, {
        method: 'siwe',
        reason: 'Chain ID mismatch',
        expected: expectedChainId,
        received: siweMessage.chainId,
      });
      throw new UnauthorizedException('Invalid chain ID in SIWE message');
    }

    // Validate nonce exists
    if (!siweMessage.nonce) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, undefined, {
        method: 'siwe',
        reason: 'Missing nonce',
      });
      throw new UnauthorizedException('Nonce is required in SIWE message');
    }

    // Verify signature
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, undefined, {
        method: 'siwe',
        reason: 'Invalid signature',
      });
      throw new UnauthorizedException('Invalid signature');
    }

    const walletAddress = fields.data.address.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress,
          username: `user_${walletAddress.slice(2, 10)}`,
        },
      });
    }

    // CWE-384 Fix: Invalidate all existing sessions
    await this.invalidateAllUserSessions(user.id, SessionInvalidationReason.NEW_LOGIN);

    // Create JWT tokens
    const tokens = await this.generateTokens(user.id, walletAddress);

    // Create new session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken, context);

    this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, user.id, {
      method: 'siwe',
      ipAddress: context?.ipAddress,
    });

    return {
      user,
      ...tokens,
    };
  }

  // ==================== EMAIL/PASSWORD AUTHENTICATION ====================

  /**
   * Web2 email/password registration
   * CWE-326 Fix: Uses AES-256-GCM encryption for wallet private key
   * CWE-384 Fix: Creates secure session after registration
   */
  async registerWithEmail(
    email: string,
    password: string,
    displayName: string,
    context?: RequestSecurityContext,
  ): Promise<{
    user: {
      id: string;
      walletAddress: string;
      email: string;
      username: string;
      displayName: string;
      emailVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, undefined, {
        method: 'email_registration',
        reason: 'Email already exists',
        email: this.maskEmail(email),
      });
      throw new BadRequestException('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 14);

    // Generate managed wallet with secure encryption
    const wallet = ethers.Wallet.createRandom();
    const encryptedWallet = await this.encryptPrivateKey(wallet.privateKey);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        walletAddress: wallet.address.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        encryptedPrivateKey: encryptedWallet.encryptedPrivateKey,
        encryptionIv: encryptedWallet.iv,
        encryptionAuthTag: encryptedWallet.authTag,
        encryptionSalt: encryptedWallet.salt,
        username: `user_${wallet.address.slice(2, 10)}`,
      },
    });

    const tokens = await this.generateTokens(user.id, user.walletAddress);

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken, context);

    this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, user.id, {
      method: 'email_registration',
      ipAddress: context?.ipAddress,
    });

    // Send OTP verification email (non-blocking - don't fail registration if email fails)
    this.generateAndSendOtp(user.id).catch((error) => {
      this.logger.error(`Failed to send OTP after registration for user ${user.id}:`, error);
    });

    return {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email!,
        username: user.username!,
        displayName: user.displayName!,
        emailVerified: user.emailVerified,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Web2 email/password login
   * CWE-384 Fix: Invalidates all existing sessions before creating new one
   */
  async loginWithEmail(
    emailOrUsername: string,
    password: string,
    context?: RequestSecurityContext,
  ): Promise<{
    user: {
      id: string;
      walletAddress: string;
      email?: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string;
      emailVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    const normalizedInput = emailOrUsername.toLowerCase().trim();

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedInput },
          { username: normalizedInput },
        ],
        isActive: true,
        isSuspended: false,
      },
    });

    // Generic error message to prevent user enumeration
    if (!user) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, undefined, {
        method: 'email_login',
        reason: 'User not found',
        identifier: this.maskEmail(normalizedInput),
      });
      // Add artificial delay to prevent timing attacks
      await this.artificialDelay();
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (might be OAuth-only or wallet-only user)
    if (!user.passwordHash) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, user.id, {
        method: 'email_login',
        reason: 'No password set',
      });
      await this.artificialDelay();
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, user.id, {
        method: 'email_login',
        reason: 'Invalid password',
        ipAddress: context?.ipAddress,
      });
      await this.artificialDelay();
      throw new UnauthorizedException('Invalid credentials');
    }

    // CWE-384 Fix: Invalidate all existing sessions
    await this.invalidateAllUserSessions(user.id, SessionInvalidationReason.NEW_LOGIN);

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.walletAddress);

    // Create new session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken, context);

    this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, user.id, {
      method: 'email_login',
      ipAddress: context?.ipAddress,
    });

    return {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email ?? undefined,
        username: user.username ?? undefined,
        displayName: user.displayName ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
        emailVerified: user.emailVerified,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, walletAddress: string) {
    const accessTokenExpiresIn = this.parseJwtDuration(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    );
    const refreshTokenExpiresIn = this.parseJwtDuration(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, walletAddress },
        { expiresIn: accessTokenExpiresIn },
      ),
      this.jwtService.signAsync(
        { sub: userId, walletAddress },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret-key'),
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Parse JWT duration string to seconds
   */
  private parseJwtDuration(duration: string): number {
    const match = duration.match(/^(\d+)([dhms]?)$/);
    if (!match) {
      return 15 * 60; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60;
      case 'h':
        return value * 60 * 60;
      case 'm':
        return value * 60;
      case 's':
      default:
        return value;
    }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Check if session exists and is valid
      const session = await this.prisma.session.findFirst({
        where: {
          refreshToken,
          userId: payload.sub,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.sub, payload.walletAddress);

      // Update session
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + SESSION_CONFIG.refreshTokenExpiryMs),
        },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ==================== LOGOUT ====================

  /**
   * Logout current session
   */
  async logout(userId: string, token: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        isActive: false,
        invalidatedAt: new Date(),
        invalidationReason: SessionInvalidationReason.USER_LOGOUT,
      },
    });

    this.logSecurityEvent(SecurityEventType.SESSION_INVALIDATED, userId, {
      reason: SessionInvalidationReason.USER_LOGOUT,
    });

    return { success: true };
  }

  /**
   * Logout all sessions
   */
  async logoutAll(userId: string) {
    const count = await this.invalidateAllUserSessions(
      userId,
      SessionInvalidationReason.USER_LOGOUT,
    );

    return { success: true, sessionsInvalidated: count };
  }

  // ==================== PASSWORD RESET ====================

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    this.logger.log(`Password reset requested for email: ${this.maskEmail(normalizedEmail)}`);

    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          isActive: true,
          isSuspended: false,
        },
      });

      // Generic response to prevent email enumeration
      if (!user) {
        this.logger.warn(`Password reset attempted for non-existent/inactive email: ${this.maskEmail(normalizedEmail)}`);
        await this.artificialDelay();
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Web3-only users don't have passwords
      if (!user.passwordHash) {
        this.logger.warn(`Password reset attempted for web3-only user: ${user.id}`);
        await this.artificialDelay();
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Generate secure reset token
      const resetToken = this.generateSecureToken();
      const hashedToken = this.hashToken(resetToken);
      const expiresAt = new Date(Date.now() + this.PASSWORD_RESET_EXPIRATION_MS);

      // Store hashed token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
        },
      });

      // Send password reset email
      const emailSent = await this.emailService.sendPasswordResetEmail(
        normalizedEmail,
        resetToken,
        user.displayName || user.username || undefined,
      );

      if (!emailSent) {
        this.logger.error(`Failed to send password reset email to: ${this.maskEmail(normalizedEmail)}`);
      }

      this.logger.log(`Password reset email sent to user: ${user.id}`);

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in forgotPassword: ${errorMessage}`);
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }
  }

  /**
   * Verify if a password reset token is valid
   */
  async verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
    try {
      const hashedToken = this.hashToken(token);

      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: { gt: new Date() },
          isActive: true,
          isSuspended: false,
        },
        select: {
          id: true,
          passwordResetExpires: true,
        },
      });

      if (!user) {
        this.logger.warn('Invalid or expired password reset token verification attempted');
        return {
          valid: false,
          message: 'Password reset link is invalid or has expired.',
        };
      }

      return {
        valid: true,
        message: 'Password reset link is valid.',
        expiresAt: user.passwordResetExpires!,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in verifyResetToken: ${errorMessage}`);
      return {
        valid: false,
        message: 'An error occurred while validating the reset token.',
      };
    }
  }

  /**
   * Reset password using the reset token
   * CWE-384 Fix: Invalidates all sessions after password reset
   */
  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    try {
      const hashedToken = this.hashToken(token);

      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: { gt: new Date() },
          isActive: true,
          isSuspended: false,
        },
      });

      if (!user) {
        this.logger.warn('Password reset attempted with invalid or expired token');
        throw new BadRequestException('Password reset link is invalid or has expired.');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 14);

      // Update password and invalidate all sessions in transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            passwordResetToken: null,
            passwordResetExpires: null,
          },
        });

        // CWE-384 Fix: Invalidate all existing sessions
        await tx.session.updateMany({
          where: { userId: user.id },
          data: {
            isActive: false,
            invalidatedAt: new Date(),
            invalidationReason: SessionInvalidationReason.PASSWORD_RESET,
          },
        });
      });

      this.logSecurityEvent(SecurityEventType.ALL_SESSIONS_INVALIDATED, user.id, {
        reason: SessionInvalidationReason.PASSWORD_RESET,
      });

      this.logger.log(`Password reset successful for user: ${user.id}`);

      return {
        success: true,
        message: 'Your password has been reset successfully. Please log in with your new password.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in resetPassword: ${errorMessage}`);
      throw new BadRequestException('An error occurred while resetting your password. Please try again.');
    }
  }

  // ==================== OTP EMAIL VERIFICATION ====================

  /**
   * Generate a cryptographically secure 4-digit OTP
   * Uses crypto.randomInt for secure random number generation
   */
  private generateOtp(): string {
    // Generate random number between 0-9999, then pad to 4 digits
    const randomNum = crypto.randomInt(0, 10000);
    return randomNum.toString().padStart(OTP_CONFIG.otpLength, '0');
  }

  /**
   * Hash OTP for secure storage (using bcrypt for timing attack resistance)
   */
  private async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  /**
   * Verify OTP against stored hash
   */
  private async verifyOtpHash(otp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(otp, hashedOtp);
  }

  /**
   * Generate and send OTP email after user registration
   *
   * @param userId - User ID to send OTP to
   * @returns SendOtpResponse indicating success/failure
   *
   * Security measures:
   * - OTP is hashed before storage (bcrypt)
   * - 10-minute expiration
   * - Rate limiting enforced at controller level
   */
  async generateAndSendOtp(userId: string): Promise<SendOtpResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        displayName: true,
        username: true,
        otpLastAttemptAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`OTP requested for non-existent user: ${userId}`);
      return {
        success: false,
        message: 'User not found',
      };
    }

    if (!user.email) {
      return {
        success: false,
        message: 'No email address associated with this account',
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      };
    }

    // Check resend cooldown (60 seconds between requests)
    if (user.otpLastAttemptAt) {
      const timeSinceLastOtp = Date.now() - user.otpLastAttemptAt.getTime();
      if (timeSinceLastOtp < OTP_CONFIG.resendCooldownMs) {
        const cooldownRemaining = Math.ceil(
          (OTP_CONFIG.resendCooldownMs - timeSinceLastOtp) / 1000,
        );
        this.logSecurityEvent(SecurityEventType.OTP_RATE_LIMITED, userId, {
          email: this.maskEmail(user.email),
          cooldownRemaining,
        });
        return {
          success: false,
          message: 'Please wait before requesting another verification code',
          cooldownSeconds: cooldownRemaining,
        };
      }
    }

    // Generate new OTP
    const otp = this.generateOtp();
    const hashedOtp = await this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMs);

    // Store hashed OTP and reset attempt counter
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationOtp: hashedOtp,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        otpLastAttemptAt: new Date(),
      },
    });

    this.logSecurityEvent(SecurityEventType.OTP_GENERATED, userId, {
      email: this.maskEmail(user.email),
      expiresAt,
    });

    // Send OTP email
    const emailSent = await this.emailService.sendOtpEmail(
      user.email,
      otp,
      user.displayName || user.username || undefined,
      OTP_CONFIG.expiryMs / (60 * 1000), // Convert to minutes
    );

    if (!emailSent) {
      this.logger.error(`Failed to send OTP email to user: ${userId}`);
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.',
      };
    }

    this.logSecurityEvent(SecurityEventType.OTP_SENT, userId, {
      email: this.maskEmail(user.email),
    });

    this.logger.log(`OTP sent to user: ${userId}`);

    return {
      success: true,
      message: 'Verification code sent to your email address',
    };
  }

  /**
   * Resend OTP verification email
   *
   * @param email - User email address
   * @returns SendOtpResponse indicating success/failure
   *
   * Security measures:
   * - Generic response to prevent email enumeration
   * - Rate limiting enforced at controller level
   * - Cooldown between resend requests
   */
  async resendOtp(email: string): Promise<SendOtpResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isActive: true,
        isSuspended: false,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        displayName: true,
        username: true,
        otpLastAttemptAt: true,
      },
    });

    // Generic response for security (prevent email enumeration)
    if (!user) {
      this.logger.warn(`OTP resend requested for non-existent email: ${this.maskEmail(normalizedEmail)}`);
      await this.artificialDelay();
      return {
        success: true,
        message: 'If an account with that email exists, a verification code has been sent.',
      };
    }

    if (user.emailVerified) {
      // Still return generic message
      return {
        success: true,
        message: 'If an account with that email exists, a verification code has been sent.',
      };
    }

    // Check resend cooldown
    if (user.otpLastAttemptAt) {
      const timeSinceLastOtp = Date.now() - user.otpLastAttemptAt.getTime();
      if (timeSinceLastOtp < OTP_CONFIG.resendCooldownMs) {
        const cooldownRemaining = Math.ceil(
          (OTP_CONFIG.resendCooldownMs - timeSinceLastOtp) / 1000,
        );
        this.logSecurityEvent(SecurityEventType.OTP_RATE_LIMITED, user.id, {
          email: this.maskEmail(normalizedEmail),
          cooldownRemaining,
        });
        return {
          success: false,
          message: 'Please wait before requesting another verification code',
          cooldownSeconds: cooldownRemaining,
        };
      }
    }

    // Generate new OTP
    const otp = this.generateOtp();
    const hashedOtp = await this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMs);

    // Store hashed OTP and reset attempt counter
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: hashedOtp,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        otpLastAttemptAt: new Date(),
      },
    });

    this.logSecurityEvent(SecurityEventType.OTP_GENERATED, user.id, {
      email: this.maskEmail(normalizedEmail),
      expiresAt,
    });

    // Send OTP email
    const emailSent = await this.emailService.sendOtpEmail(
      user.email!,
      otp,
      user.displayName || user.username || undefined,
      OTP_CONFIG.expiryMs / (60 * 1000),
    );

    if (!emailSent) {
      this.logger.error(`Failed to resend OTP email to: ${this.maskEmail(normalizedEmail)}`);
    } else {
      this.logSecurityEvent(SecurityEventType.OTP_SENT, user.id, {
        email: this.maskEmail(normalizedEmail),
      });
    }

    return {
      success: true,
      message: 'If an account with that email exists, a verification code has been sent.',
    };
  }

  /**
   * Verify OTP code and mark email as verified
   *
   * @param email - User email address
   * @param otp - 4-digit OTP code to verify
   * @returns VerifyOtpResponse indicating success/failure
   *
   * Security measures:
   * - Maximum 3 attempts before lockout
   * - OTP cleared after successful verification
   * - Rate limiting enforced at controller level
   * - Timing attack resistant via bcrypt comparison
   */
  async verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isActive: true,
        isSuspended: false,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerificationOtp: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });

    // Generic error for security
    if (!user) {
      this.logger.warn(`OTP verification attempted for non-existent email: ${this.maskEmail(normalizedEmail)}`);
      await this.artificialDelay();
      return {
        success: false,
        message: 'Invalid email or verification code',
      };
    }

    // Already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: 'Email is already verified',
        emailVerified: true,
      };
    }

    // Check if OTP was ever set
    if (!user.emailVerificationOtp || !user.otpExpiresAt) {
      return {
        success: false,
        message: 'No verification code found. Please request a new one.',
      };
    }

    // Check max attempts (lockout protection)
    if (user.otpAttempts >= OTP_CONFIG.maxAttempts) {
      this.logSecurityEvent(SecurityEventType.OTP_MAX_ATTEMPTS_EXCEEDED, user.id, {
        email: this.maskEmail(normalizedEmail),
        attempts: user.otpAttempts,
      });

      // Clear OTP to force new request
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationOtp: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        },
      });

      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Check expiration
    if (user.otpExpiresAt < new Date()) {
      this.logSecurityEvent(SecurityEventType.OTP_EXPIRED, user.id, {
        email: this.maskEmail(normalizedEmail),
        expiredAt: user.otpExpiresAt,
      });

      // Clear expired OTP
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationOtp: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        },
      });

      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      };
    }

    // Verify OTP (timing-attack resistant via bcrypt)
    const isValidOtp = await this.verifyOtpHash(otp, user.emailVerificationOtp);

    if (!isValidOtp) {
      // Increment attempt counter
      const newAttempts = user.otpAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: newAttempts },
      });

      this.logSecurityEvent(SecurityEventType.OTP_INVALID, user.id, {
        email: this.maskEmail(normalizedEmail),
        attempts: newAttempts,
        maxAttempts: OTP_CONFIG.maxAttempts,
      });

      const remainingAttempts = OTP_CONFIG.maxAttempts - newAttempts;

      return {
        success: false,
        message: remainingAttempts > 0
          ? `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
          : 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // OTP is valid - mark email as verified and clear OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationOtp: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpLastAttemptAt: null,
      },
    });

    this.logSecurityEvent(SecurityEventType.OTP_VERIFIED, user.id, {
      email: this.maskEmail(normalizedEmail),
    });

    this.logSecurityEvent(SecurityEventType.EMAIL_VERIFIED, user.id, {
      email: this.maskEmail(normalizedEmail),
    });

    this.logger.log(`Email verified for user: ${user.id}`);

    return {
      success: true,
      message: 'Email verified successfully',
      emailVerified: true,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate a cryptographically secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a token using SHA-256 for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Mask email for logging (privacy protection)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***';
    const maskedLocal = local.length > 2
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '*'.repeat(local.length);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Add artificial delay to prevent timing attacks
   */
  private async artificialDelay(): Promise<void> {
    const delay = 100 + Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Log security event for audit trail
   */
  private logSecurityEvent(
    eventType: SecurityEventType,
    userId?: string,
    details?: Record<string, unknown>,
  ): void {
    const logEntry = {
      eventType,
      userId,
      details,
      timestamp: new Date().toISOString(),
    };

    // Log to standard logger (in production, send to security monitoring system)
    this.logger.log(`[SECURITY] ${eventType}: ${JSON.stringify(logEntry)}`);
  }
}
