import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SessionInvalidationReason } from './types';

/**
 * Security-focused unit tests for AuthService
 *
 * These tests verify the implementation of security fixes for:
 * - CWE-326: Wallet encryption (AES-256-GCM with PBKDF2)
 * - CWE-352: CSRF state validation
 * - CWE-384: Session fixation prevention
 * - CWE-598: One-time code exchange
 * - CWE-601: Redirect URL validation
 * - CWE-640: Weak account linking prevention
 */
describe('AuthService Security Tests', () => {
  let authService: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  // Valid 64-character hex encryption key for testing
  const VALID_ENCRYPTION_KEY = 'a'.repeat(64);
  const WEAK_ENCRYPTION_KEY = '0'.repeat(64);

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      oAuthState: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      oAuthHandoff: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(mockPrismaService)),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          WALLET_ENCRYPTION_KEY: VALID_ENCRYPTION_KEY,
          JWT_SECRET: 'test-jwt-secret-at-least-32-chars',
          JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars',
          FRONTEND_URL: 'http://localhost:3001',
          NODE_ENV: 'development',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key] || defaultValue;
      }),
    };

    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: jest.fn(),
    };

    const mockEmailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  // ==========================================================================
  // CWE-326: Wallet Encryption Tests
  // ==========================================================================
  describe('CWE-326: Wallet Encryption', () => {
    it('should encrypt private key using AES-256-GCM', async () => {
      const privateKey = '0x1234567890abcdef'.repeat(4);

      const encrypted = await authService.encryptPrivateKey(privateKey);

      expect(encrypted).toHaveProperty('encryptedPrivateKey');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('salt');

      // Verify all components are hex strings
      expect(encrypted.encryptedPrivateKey).toMatch(/^[a-f0-9]+$/);
      expect(encrypted.iv).toMatch(/^[a-f0-9]+$/);
      expect(encrypted.authTag).toMatch(/^[a-f0-9]+$/);
      expect(encrypted.salt).toMatch(/^[a-f0-9]+$/);

      // IV should be 32 hex chars (16 bytes)
      expect(encrypted.iv.length).toBe(32);

      // Salt should be 64 hex chars (32 bytes)
      expect(encrypted.salt.length).toBe(64);

      // Auth tag should be 32 hex chars (16 bytes)
      expect(encrypted.authTag.length).toBe(32);
    });

    it('should decrypt private key correctly', async () => {
      const originalKey = '0x1234567890abcdef'.repeat(4);

      const encrypted = await authService.encryptPrivateKey(originalKey);
      const decrypted = await authService.decryptPrivateKey(encrypted);

      expect(decrypted).toBe(originalKey);
    });

    it('should produce unique ciphertext for same input (random IV/salt)', async () => {
      const privateKey = '0x1234567890abcdef'.repeat(4);

      const encrypted1 = await authService.encryptPrivateKey(privateKey);
      const encrypted2 = await authService.encryptPrivateKey(privateKey);

      // Same plaintext should produce different ciphertext due to random IV/salt
      expect(encrypted1.encryptedPrivateKey).not.toBe(
        encrypted2.encryptedPrivateKey,
      );
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });
  });

  // ==========================================================================
  // CWE-352: CSRF State Validation Tests
  // ==========================================================================
  describe('CWE-352: CSRF State Validation', () => {
    it('should generate unique OAuth state', async () => {
      prismaService.oAuthState.create = jest.fn().mockResolvedValue({});
      prismaService.oAuthState.deleteMany = jest.fn().mockResolvedValue({});

      const state1 = await authService.generateOAuthState();
      const state2 = await authService.generateOAuthState();

      expect(state1).not.toBe(state2);
      expect(state1.length).toBe(64); // 32 bytes hex encoded
    });

    it('should validate state and delete after use (one-time)', async () => {
      const mockState = {
        id: 'state-id',
        state: 'valid-state',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins in future
        ipAddress: '127.0.0.1',
      };

      prismaService.oAuthState.findUnique = jest
        .fn()
        .mockResolvedValue(mockState);
      prismaService.oAuthState.delete = jest.fn().mockResolvedValue(mockState);

      const result = await authService.validateOAuthState('valid-state');

      expect(result.valid).toBe(true);
      expect(prismaService.oAuthState.delete).toHaveBeenCalledWith({
        where: { id: 'state-id' },
      });
    });

    it('should reject invalid state', async () => {
      prismaService.oAuthState.findUnique = jest.fn().mockResolvedValue(null);

      const result = await authService.validateOAuthState('invalid-state');

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('Invalid or expired state');
    });

    it('should reject expired state', async () => {
      const mockState = {
        id: 'state-id',
        state: 'expired-state',
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      prismaService.oAuthState.findUnique = jest
        .fn()
        .mockResolvedValue(mockState);
      prismaService.oAuthState.delete = jest.fn().mockResolvedValue(mockState);

      const result = await authService.validateOAuthState('expired-state');

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('State has expired');
    });
  });

  // ==========================================================================
  // CWE-384: Session Fixation Prevention Tests
  // ==========================================================================
  describe('CWE-384: Session Fixation Prevention', () => {
    it('should invalidate all user sessions on login', async () => {
      prismaService.session.updateMany = jest
        .fn()
        .mockResolvedValue({ count: 3 });

      const count = await authService.invalidateAllUserSessions(
        'user-id',
        SessionInvalidationReason.NEW_LOGIN,
      );

      expect(count).toBe(3);
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          isActive: true,
        },
        data: {
          isActive: false,
          invalidatedAt: expect.any(Date),
          invalidationReason: SessionInvalidationReason.NEW_LOGIN,
        },
      });
    });
  });

  // ==========================================================================
  // CWE-598: One-Time Code Exchange Tests
  // ==========================================================================
  describe('CWE-598: One-Time Code Exchange', () => {
    it('should create one-time handoff code', async () => {
      prismaService.oAuthHandoff.create = jest.fn().mockResolvedValue({});
      prismaService.oAuthHandoff.deleteMany = jest.fn().mockResolvedValue({});

      const code = await authService.createOAuthHandoff({
        userId: 'user-id',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'test@example.com',
      });

      expect(code.length).toBe(64); // 32 bytes hex encoded
      expect(prismaService.oAuthHandoff.create).toHaveBeenCalled();
    });

    it('should exchange valid code for tokens', async () => {
      const mockHandoff = {
        id: 'handoff-id',
        code: 'a'.repeat(64),
        userId: 'user-id',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        usedAt: null,
      };

      prismaService.oAuthHandoff.findUnique = jest
        .fn()
        .mockResolvedValue(mockHandoff);
      prismaService.oAuthHandoff.update = jest.fn().mockResolvedValue({});
      prismaService.oAuthHandoff.delete = jest.fn().mockResolvedValue({});

      const result = await authService.exchangeOAuthCode('a'.repeat(64));

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject already-used code', async () => {
      const mockHandoff = {
        id: 'handoff-id',
        code: 'a'.repeat(64),
        userId: 'user-id',
        usedAt: new Date(), // Already used
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      prismaService.oAuthHandoff.findUnique = jest
        .fn()
        .mockResolvedValue(mockHandoff);
      prismaService.oAuthHandoff.delete = jest.fn().mockResolvedValue({});

      await expect(
        authService.exchangeOAuthCode('a'.repeat(64)),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject expired code', async () => {
      const mockHandoff = {
        id: 'handoff-id',
        code: 'a'.repeat(64),
        userId: 'user-id',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      prismaService.oAuthHandoff.findUnique = jest
        .fn()
        .mockResolvedValue(mockHandoff);
      prismaService.oAuthHandoff.delete = jest.fn().mockResolvedValue({});

      await expect(
        authService.exchangeOAuthCode('a'.repeat(64)),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==========================================================================
  // CWE-601: Redirect URL Validation Tests
  // ==========================================================================
  describe('CWE-601: Redirect URL Validation', () => {
    it('should accept valid redirect URL', () => {
      const result = authService.validateRedirectUrl(
        'http://localhost:3001/callback',
      );

      expect(result.valid).toBe(true);
      expect(result.sanitizedUrl).toBeDefined();
    });

    it('should reject URL with disallowed domain', () => {
      const result = authService.validateRedirectUrl(
        'https://evil.com/callback',
      );

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('Redirect domain not allowed');
    });

    it('should reject URL with non-HTTP protocol', () => {
      const result = authService.validateRedirectUrl('javascript:alert(1)');

      expect(result.valid).toBe(false);
    });

    it('should reject invalid URL format', () => {
      const result = authService.validateRedirectUrl('not-a-valid-url');

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('Invalid URL format');
    });

    it('should return safe redirect URL', () => {
      const url = authService.getSafeRedirectUrl('/auth/callback');

      expect(url).toBe('http://localhost:3001/auth/callback');
    });
  });

  // ==========================================================================
  // CWE-640: Weak Account Linking Prevention Tests
  // ==========================================================================
  describe('CWE-640: Weak Account Linking Prevention', () => {
    it('should block linking Google to password-protected account', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password', // Has password
        googleId: null,
      };

      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValueOnce(null) // No user by Google ID
        .mockResolvedValueOnce(existingUser); // Found by email with password

      await expect(
        authService.findOrCreateGoogleUser({
          googleId: 'google-123',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow linking Google to account without password', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: null, // No password (wallet-only user)
        googleId: null,
        walletAddress: '0x1234',
      };

      const updatedUser = {
        ...existingUser,
        googleId: 'google-123',
      };

      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValueOnce(null) // No user by Google ID
        .mockResolvedValueOnce(existingUser); // Found by email without password
      prismaService.user.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await authService.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'test@example.com',
      });

      expect(result.id).toBe('user-id');
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should return existing user if Google ID matches', async () => {
      const existingUser = {
        id: 'user-id',
        googleId: 'google-123',
        email: 'test@example.com',
        walletAddress: '0x1234',
      };

      prismaService.user.findFirst = jest.fn().mockResolvedValue(existingUser);

      const result = await authService.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'test@example.com',
      });

      expect(result.id).toBe('user-id');
    });
  });
});
