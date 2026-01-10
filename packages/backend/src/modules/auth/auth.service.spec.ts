import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    hexlify: jest.fn().mockReturnValue('0xmocknonce123'),
    randomBytes: jest.fn().mockReturnValue(Buffer.from('random')),
    Wallet: {
      createRandom: jest.fn().mockReturnValue({
        address: '0xNewWalletAddress1234567890123456789012',
        privateKey: '0xmockprivatekey',
      }),
    },
  },
}));

// Mock siwe
jest.mock('siwe', () => ({
  SiweMessage: jest.fn().mockImplementation(() => ({
    verify: jest.fn().mockResolvedValue({
      success: true,
      data: {
        address: '0x1234567890123456789012345678901234567890',
      },
    }),
  })),
}));

// Mock data
const mockUser = {
  id: 'user-1',
  walletAddress: '0x1234567890123456789012345678901234567890',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  googleId: null,
  avatarUrl: null,
  passwordHash: null,
  encryptedPrivateKey: null,
  encryptionIv: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGoogleUser = {
  ...mockUser,
  id: 'google-user-1',
  googleId: 'google-123',
  email: 'google@example.com',
  walletAddress: '0xnewwalletaddress1234567890123456789012',
};

const mockSession = {
  id: 'session-1',
  userId: mockUser.id,
  token: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  isActive: true,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
};

// Create mock Prisma service
const createMockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
});

// Create mock JWT service
const createMockJwtService = () => ({
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verifyAsync: jest.fn().mockResolvedValue({
    sub: mockUser.id,
    walletAddress: mockUser.walletAddress,
  }),
});

// Create mock ConfigService
const createMockConfigService = () => ({
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, string> = {
      FRONTEND_URL: 'http://localhost:3001',
      SUPPORT_EMAIL: 'support@fundbrave.com',
    };
    return config[key] || defaultValue;
  }),
});

// Create mock EmailService
const createMockEmailService = () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  isEmailConfigured: jest.fn().mockReturnValue(true),
});

// Mock user with password for password reset tests
const mockUserWithPassword = {
  ...mockUser,
  id: 'user-with-password-1',
  email: 'password@example.com',
  passwordHash: 'hashed-password-123',
  passwordResetToken: null,
  passwordResetExpires: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let configService: ReturnType<typeof createMockConfigService>;
  let emailService: ReturnType<typeof createMockEmailService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    jwtService = createMockJwtService();
    configService = createMockConfigService();
    emailService = createMockEmailService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Set environment variables for tests
    process.env.JWT_EXPIRES_IN = '1d';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.WALLET_ENCRYPTION_KEY = '0'.repeat(64);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNonce', () => {
    it('should generate a nonce for a wallet address', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';

      const result = await service.generateNonce(walletAddress);

      expect(result).toBe('0xmocknonce123');
    });

    it('should store nonce in cache', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';

      await service.generateNonce(walletAddress);

      // Generate again to test cache behavior
      const secondNonce = await service.generateNonce(walletAddress);

      expect(secondNonce).toBe('0xmocknonce123');
    });
  });

  describe('verifySiweAndLogin', () => {
    it('should verify SIWE signature and return user with tokens for existing user', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.session.create.mockResolvedValue(mockSession);

      const result = await service.verifySiweAndLogin(
        'mock-siwe-message',
        '0xsignature',
      );

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(prismaService.session.create).toHaveBeenCalled();
    });

    it('should create new user if not exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.session.create.mockResolvedValue(mockSession);

      const result = await service.verifySiweAndLogin(
        'mock-siwe-message',
        '0xsignature',
      );

      expect(result.user).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          walletAddress: '0x1234567890123456789012345678901234567890',
          username: expect.stringContaining('user_'),
        }),
      });
    });
  });

  describe('registerWithEmail', () => {
    it('should register a new user with email and password', async () => {
      const newUser = {
        ...mockUser,
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        encryptedPrivateKey: 'encrypted-key',
        encryptionIv: 'iv-hex',
      };
      prismaService.user.create.mockResolvedValue(newUser);

      const result = await service.registerWithEmail(
        'new@example.com',
        'password123',
        'New User',
      );

      expect(result.user.email).toBe('new@example.com');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@example.com',
          displayName: 'New User',
          passwordHash: 'hashed-password',
          encryptedPrivateKey: expect.any(String),
          encryptionIv: expect.any(String),
        }),
      });
    });
  });

  describe('findOrCreateGoogleUser', () => {
    it('should return existing user by Google ID', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockGoogleUser);

      const result = await service.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'google@example.com',
        displayName: 'Google User',
        avatarUrl: 'https://google.com/avatar.png',
      });

      expect(result).toEqual(mockGoogleUser);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should link Google ID to existing email user', async () => {
      const existingUser = { ...mockUser, googleId: null };
      const updatedUser = { ...mockUser, googleId: 'google-123' };

      prismaService.user.findFirst
        .mockResolvedValueOnce(null) // No user with Google ID
        .mockResolvedValueOnce(existingUser); // User with email exists
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'test@example.com',
        displayName: 'Google User',
      });

      expect(result.googleId).toBe('google-123');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          googleId: 'google-123',
          emailVerified: true,
        }),
      });
    });

    it('should create new user with managed wallet for new Google user', async () => {
      prismaService.user.findFirst
        .mockResolvedValueOnce(null) // No user with Google ID
        .mockResolvedValueOnce(null); // No user with email
      prismaService.user.create.mockResolvedValue(mockGoogleUser);

      const result = await service.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'new-google@example.com',
        displayName: 'New Google User',
        avatarUrl: 'https://google.com/avatar.png',
      });

      expect(result).toEqual(mockGoogleUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          googleId: 'google-123',
          email: 'new-google@example.com',
          emailVerified: true,
          displayName: 'New Google User',
          avatarUrl: 'https://google.com/avatar.png',
          walletAddress: expect.any(String),
          encryptedPrivateKey: expect.any(String),
          encryptionIv: expect.any(String),
        }),
      });
    });

    it('should update missing displayName and avatarUrl for existing user', async () => {
      const existingUserWithoutProfile = {
        ...mockGoogleUser,
        displayName: null,
        avatarUrl: null,
      };
      const updatedUser = {
        ...mockGoogleUser,
        displayName: 'Updated Name',
        avatarUrl: 'https://google.com/avatar.png',
      };

      prismaService.user.findFirst.mockResolvedValue(existingUserWithoutProfile);
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'google@example.com',
        displayName: 'Updated Name',
        avatarUrl: 'https://google.com/avatar.png',
      });

      expect(result.displayName).toBe('Updated Name');
      expect(prismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('loginWithGoogle', () => {
    it('should generate tokens and create session', async () => {
      prismaService.session.create.mockResolvedValue(mockSession);

      const result = await service.loginWithGoogle({
        id: mockUser.id,
        walletAddress: mockUser.walletAddress,
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(prismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          token: expect.any(String),
          refreshToken: expect.any(String),
        }),
      });
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      prismaService.session.findFirst.mockResolvedValue(mockSession);
      prismaService.session.update.mockResolvedValue({
        ...mockSession,
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(prismaService.session.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.refreshTokens('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when session not found', async () => {
      prismaService.session.findFirst.mockResolvedValue(null);

      await expect(
        service.refreshTokens('valid-but-no-session'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      prismaService.session.findFirst.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      await expect(
        service.refreshTokens('expired-session-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should deactivate session', async () => {
      prismaService.session.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout(mockUser.id, 'mock-access-token');

      expect(result.success).toBe(true);
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          token: 'mock-access-token',
        },
        data: {
          isActive: false,
        },
      });
    });
  });

  describe('logoutAll', () => {
    it('should deactivate all sessions for user', async () => {
      prismaService.session.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.logoutAll(mockUser.id);

      expect(result.success).toBe(true);
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        data: { isActive: false },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should return success and send email for existing user with password', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUserWithPassword);
      prismaService.user.update.mockResolvedValue({
        ...mockUserWithPassword,
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() + 3600000),
      });

      const result = await service.forgotPassword('password@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account with that email exists');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserWithPassword.id },
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'password@example.com',
        expect.any(String),
        mockUserWithPassword.displayName,
      );
    });

    it('should return success even for non-existent email (prevents enumeration)', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account with that email exists');
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return success for web3-only user without password (prevents enumeration)', async () => {
      const web3OnlyUser = { ...mockUser, passwordHash: null };
      prismaService.user.findFirst.mockResolvedValue(web3OnlyUser);

      const result = await service.forgotPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return success even if email fails to send (prevents enumeration)', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUserWithPassword);
      prismaService.user.update.mockResolvedValue(mockUserWithPassword);
      emailService.sendPasswordResetEmail.mockResolvedValue(false);

      const result = await service.forgotPassword('password@example.com');

      expect(result.success).toBe(true);
    });

    it('should normalize email to lowercase', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUserWithPassword);
      prismaService.user.update.mockResolvedValue(mockUserWithPassword);

      await service.forgotPassword('PASSWORD@EXAMPLE.COM');

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email: 'password@example.com',
        }),
      });
    });

    it('should not send email to suspended users', async () => {
      prismaService.user.findFirst.mockResolvedValue(null); // Query filters out suspended users

      const result = await service.forgotPassword('suspended@example.com');

      expect(result.success).toBe(true);
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('verifyResetToken', () => {
    it('should return valid for unexpired token', async () => {
      const futureExpiry = new Date(Date.now() + 1800000); // 30 mins from now
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        passwordResetExpires: futureExpiry,
      });

      const result = await service.verifyResetToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.message).toBe('Password reset link is valid.');
      expect(result.expiresAt).toEqual(futureExpiry);
    });

    it('should return invalid for expired or non-existent token', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.verifyResetToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('invalid or has expired');
    });

    it('should handle database errors gracefully', async () => {
      prismaService.user.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await service.verifyResetToken('some-token');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('error occurred');
    });
  });

  describe('resetPassword', () => {
    const mockTransactionClient = {
      user: {
        update: jest.fn().mockResolvedValue(mockUserWithPassword),
      },
      session: {
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
    };

    beforeEach(() => {
      (prismaService as any).$transaction = jest.fn().mockImplementation(
        async (callback: any) => callback(mockTransactionClient),
      );
    });

    it('should reset password for valid token', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        ...mockUserWithPassword,
        passwordResetToken: 'hashed-valid-token',
        passwordResetExpires: new Date(Date.now() + 1800000),
      });

      const result = await service.resetPassword('valid-token', 'NewSecureP@ss1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('reset successfully');
      expect(mockTransactionClient.user.update).toHaveBeenCalledWith({
        where: { id: mockUserWithPassword.id },
        data: expect.objectContaining({
          passwordHash: 'hashed-password',
          passwordResetToken: null,
          passwordResetExpires: null,
        }),
      });
      // Should invalidate all sessions
      expect(mockTransactionClient.session.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserWithPassword.id },
        data: { isActive: false },
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NewSecureP@ss1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      prismaService.user.findFirst.mockResolvedValue(null); // Query filters expired

      await expect(
        service.resetPassword('expired-token', 'NewSecureP@ss1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash the new password', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        ...mockUserWithPassword,
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() + 1800000),
      });

      await service.resetPassword('valid-token', 'NewSecureP@ss1');

      // bcrypt.hash is mocked to return 'hashed-password'
      expect(mockTransactionClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'hashed-password',
          }),
        }),
      );
    });

    it('should clear reset token after successful reset', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        ...mockUserWithPassword,
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() + 1800000),
      });

      await service.resetPassword('valid-token', 'NewSecureP@ss1');

      expect(mockTransactionClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordResetToken: null,
            passwordResetExpires: null,
          }),
        }),
      );
    });
  });
});
