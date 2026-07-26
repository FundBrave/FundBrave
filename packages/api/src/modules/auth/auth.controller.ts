import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrivyAuthGuard, RegisteredGuard } from './privy-auth.guard';
import { CurrentUser, PrivyDid } from './current-user.decorator';

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    walletAddress: user.walletAddress,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Idempotent post-login sync: registers/updates the user, enforces whitelist. */
  @Post('sync')
  @UseGuards(PrivyAuthGuard)
  async sync(@PrivyDid() did: string) {
    const user = await this.auth.syncUser(did);
    return { user: toPublicUser(user) };
  }

  @Get('me')
  @UseGuards(PrivyAuthGuard, RegisteredGuard)
  me(@CurrentUser() user: User) {
    return { user: toPublicUser(user) };
  }
}
