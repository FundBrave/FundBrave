import { ForbiddenException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrivyService } from './privy.service';

export const NOT_WHITELISTED = 'NOT_WHITELISTED';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly rootAdminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly privy: PrivyService,
    config: ConfigService,
  ) {
    this.rootAdminEmail = (config.get<string>('admin.rootAdminEmail') ?? '').toLowerCase();
  }

  /**
   * Called after Privy login. Verifies identity server-side against the
   * Privy API (never trusts client-supplied email/wallet), enforces the
   * whitelist, and creates/updates the local user row.
   */
  async syncUser(did: string): Promise<User> {
    const profile = await this.privy.getUser(did);

    if (!profile.email) {
      throw new ForbiddenException('An email login is required (email or Google)');
    }
    if (!profile.embeddedWalletAddress) {
      throw new ServiceUnavailableException(
        'Embedded wallet not provisioned yet — retry in a moment',
      );
    }

    const email = profile.email;
    const isRootAdmin = this.rootAdminEmail !== '' && email === this.rootAdminEmail;

    // Whitelist gate (root admin email bypasses and is auto-whitelisted)
    const entry = await this.prisma.whitelistEntry.findUnique({ where: { email } });
    if (!entry && !isRootAdmin) {
      throw new ForbiddenException({
        statusCode: 403,
        code: NOT_WHITELISTED,
        message: 'This email is not on the FundBrave access list yet.',
      });
    }

    const user = await this.prisma.user.upsert({
      where: { privyDid: did },
      create: {
        privyDid: did,
        email,
        walletAddress: profile.embeddedWalletAddress,
        role: isRootAdmin ? Role.ADMIN : Role.USER,
      },
      update: {
        email,
        walletAddress: profile.embeddedWalletAddress,
        ...(isRootAdmin ? { role: Role.ADMIN } : {}),
      },
    });

    // Mark invite consumed / self-heal root admin whitelist entry
    if (entry && !entry.usedAt) {
      await this.prisma.whitelistEntry.update({
        where: { email },
        data: { usedAt: new Date() },
      });
    } else if (!entry && isRootAdmin) {
      await this.prisma.whitelistEntry.create({
        data: { email, invitedBy: user.id, usedAt: new Date() },
      });
    }

    this.logger.log(`Synced user ${user.id} (${email})${isRootAdmin ? ' [root admin]' : ''}`);
    return user;
  }
}
