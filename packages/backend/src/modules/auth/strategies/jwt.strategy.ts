import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  walletAddress: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Strategy for Passport
 * Validates JWT tokens and extracts user information
 *
 * CWE-522 Fix: Extracts JWT from HttpOnly cookies as well as Authorization header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is not set. ' +
          'Application cannot start without a secure JWT secret. ' +
          'Please set JWT_SECRET in your .env file.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // For API clients with Bearer token
        (request) => {
          // CWE-522 Fix: Extract JWT from HttpOnly cookie for browser clients
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validate the JWT payload and return the user
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        email: true,
        isActive: true,
        isSuspended: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive || user.isSuspended) {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
    };
  }
}
