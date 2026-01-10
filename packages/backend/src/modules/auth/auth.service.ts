import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { SiweMessage } from 'siwe';
import * as bcrypt from 'bcrypt';
import { ethers } from 'ethers';

interface GoogleUserData {
  googleId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Simple in-memory nonce storage (use Redis in production)
  private nonceCache = new Map<string, { nonce: string; timestamp: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Generate nonce for SIWE
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

  // Clean up expired nonces
  private cleanupExpiredNonces(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, value] of this.nonceCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        this.nonceCache.delete(key);
      }
    }
  }

  // Verify SIWE signature and create session
  async verifySiweAndLogin(message: string, signature: string) {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });
    
    if (!fields.success) {
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

    // Create JWT tokens
    const tokens = await this.generateTokens(user.id, walletAddress);

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user,
      ...tokens,
    };
  }

  // Web2 email/password registration
  async registerWithEmail(email: string, password: string, displayName: string) {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate managed wallet
    const wallet = ethers.Wallet.createRandom();
    const { encryptedPrivateKey, iv } = await this.encryptPrivateKey(wallet.privateKey);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        walletAddress: wallet.address.toLowerCase(),
        email,
        passwordHash,
        displayName,
        encryptedPrivateKey,
        encryptionIv: iv,
        username: `user_${wallet.address.slice(2, 10)}`,
      },
    });

    const tokens = await this.generateTokens(user.id, user.walletAddress);
    return { user, ...tokens };
  }

  // Helper: Generate JWT tokens
  private async generateTokens(userId: string, walletAddress: string) {
    // Convert duration strings to seconds for type safety with @nestjs/jwt v11+
    const accessTokenExpiresIn = this.parseJwtDuration(
      process.env.JWT_EXPIRES_IN || '7d',
    );
    const refreshTokenExpiresIn = this.parseJwtDuration(
      process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, walletAddress },
        { expiresIn: accessTokenExpiresIn },
      ),
      this.jwtService.signAsync(
        { sub: userId, walletAddress },
        {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Parse JWT duration string to seconds
   * Supports formats like '7d', '24h', '30m', '60s', or plain numbers (treated as seconds)
   */
  private parseJwtDuration(duration: string): number {
    const match = duration.match(/^(\d+)([dhms]?)$/);
    if (!match) {
      // If parsing fails, default to 7 days
      return 7 * 24 * 60 * 60;
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

  // Helper: Encrypt private key for managed wallets
  private async encryptPrivateKey(privateKey: string) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.WALLET_ENCRYPTION_KEY || '0'.repeat(64), 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedPrivateKey: encrypted,
      iv: iv.toString('hex'),
    };
  }

  // Find or create user from Google OAuth
  async findOrCreateGoogleUser(data: GoogleUserData) {
    const { googleId, email, displayName, avatarUrl } = data;

    // First, try to find existing user by Google ID
    let user = await this.prisma.user.findFirst({
      where: { googleId },
    });

    if (user) {
      // Update user info if needed
      if (displayName || avatarUrl) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(displayName && !user.displayName && { displayName }),
            ...(avatarUrl && !user.avatarUrl && { avatarUrl }),
          },
        });
      }
      return user;
    }

    // Try to find by email
    user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Link Google ID to existing account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          emailVerified: true, // Google emails are verified
          ...(displayName && !user.displayName && { displayName }),
          ...(avatarUrl && !user.avatarUrl && { avatarUrl }),
        },
      });
      return user;
    }

    // Create new user with managed wallet
    const wallet = ethers.Wallet.createRandom();
    const { encryptedPrivateKey, iv } = await this.encryptPrivateKey(wallet.privateKey);

    user = await this.prisma.user.create({
      data: {
        walletAddress: wallet.address.toLowerCase(),
        googleId,
        email: email.toLowerCase(),
        emailVerified: true,
        displayName,
        avatarUrl,
        encryptedPrivateKey,
        encryptionIv: iv,
        username: `user_${wallet.address.slice(2, 10)}`,
      },
    });

    this.logger.log(`Created new user from Google OAuth: ${user.id}`);
    return user;
  }

  // Login with Google (called after OAuth callback)
  async loginWithGoogle(user: { id: string; walletAddress: string }) {
    const tokens = await this.generateTokens(user.id, user.walletAddress);

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return tokens;
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Logout
  async logout(userId: string, token: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        isActive: false,
      },
    });

    return { success: true };
  }

  // Logout all sessions
  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return { success: true };
  }
}