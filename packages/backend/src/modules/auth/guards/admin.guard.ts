import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Utility function to extract the request object from either REST or GraphQL context
 * @param context - The execution context from NestJS
 * @returns The HTTP request object
 */
function getRequestFromContext(context: ExecutionContext): any {
  const contextType = context.getType<string>();

  // Handle GraphQL context
  if (contextType === 'graphql') {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  // Handle REST/HTTP context
  return context.switchToHttp().getRequest();
}

/**
 * Parse admin wallet addresses from environment variable
 * Expects comma-separated addresses in ADMIN_WALLET_ADDRESSES
 */
function getAdminWallets(): string[] {
  const envValue = process.env.ADMIN_WALLET_ADDRESSES || '';
  return envValue
    .split(',')
    .map((addr) => addr.trim().toLowerCase())
    .filter((addr) => addr.length > 0);
}

/**
 * Check if a wallet address is in the admin list
 */
function isAdminWallet(walletAddress: string | undefined | null): boolean {
  if (!walletAddress) {
    return false;
  }
  const adminWallets = getAdminWallets();
  return adminWallets.includes(walletAddress.toLowerCase());
}

/**
 * Guard to check if user has admin privileges
 * Works with both REST and GraphQL endpoints.
 *
 * Admin is determined by:
 * 1. Wallet address in ADMIN_WALLET_ADDRESSES environment variable
 * 2. verificationBadge === 'OFFICIAL' in database
 *
 * IMPORTANT: Must be used AFTER JwtAuthGuard to ensure user is authenticated
 * Example: @UseGuards(JwtAuthGuard, AdminGuard)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequestFromContext(context);
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if wallet is in admin list
    if (isAdminWallet(user.walletAddress)) {
      return true;
    }

    // Check if user has OFFICIAL badge
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { verificationBadge: true },
    });

    if (dbUser?.verificationBadge === 'OFFICIAL') {
      return true;
    }

    throw new ForbiddenException('Admin access required');
  }
}

/**
 * Guard to check if user is a moderator
 * Works with both REST and GraphQL endpoints.
 *
 * Moderator is determined by:
 * 1. Being an admin, OR
 * 2. Having VERIFIED_CREATOR badge
 *
 * IMPORTANT: Must be used AFTER JwtAuthGuard to ensure user is authenticated
 * Example: @UseGuards(JwtAuthGuard, ModeratorGuard)
 */
@Injectable()
export class ModeratorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequestFromContext(context);
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if wallet is in admin list
    if (isAdminWallet(user.walletAddress)) {
      return true;
    }

    // Check badge level
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { verificationBadge: true, isVerifiedCreator: true },
    });

    if (
      dbUser?.verificationBadge === 'OFFICIAL' ||
      dbUser?.verificationBadge === 'VERIFIED_CREATOR' ||
      dbUser?.isVerifiedCreator
    ) {
      return true;
    }

    throw new ForbiddenException('Moderator access required');
  }
}
