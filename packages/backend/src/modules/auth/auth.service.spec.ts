import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

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

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let jwtService: ReturnType<typeof createMockJwtService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    jwtService = createMockJwtService();

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
});
