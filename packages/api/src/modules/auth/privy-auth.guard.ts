import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrivyService } from './privy.service';

export interface AuthenticatedRequest extends Request {
  privyDid: string;
  /** Populated for registered users; null until first sync. */
  user: User | null;
}

/**
 * Verifies the Privy Bearer token and attaches the DB user (if any).
 * Routes that require a registered user should also use RegisteredGuard.
 */
@Injectable()
export class PrivyAuthGuard implements CanActivate {
  constructor(
    private readonly privy: PrivyService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const { did } = await this.privy.verifyAccessToken(header.slice(7));
    req.privyDid = did;
    req.user = await this.prisma.user.findUnique({ where: { privyDid: did } });
    if (req.user?.isSuspended) {
      throw new ForbiddenException('Account suspended');
    }
    return true;
  }
}

/** Requires a synced (registered) user row. Use after PrivyAuthGuard. */
@Injectable()
export class RegisteredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.user) {
      throw new ForbiddenException('Account not registered — call /api/auth/sync first');
    }
    return true;
  }
}

/** Requires role ADMIN. Use after PrivyAuthGuard. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
    return true;
  }
}
