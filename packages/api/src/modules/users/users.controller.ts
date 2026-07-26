import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrivyAuthGuard, RegisteredGuard } from '../auth/privy-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(PrivyAuthGuard, RegisteredGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const updated = await this.users.updateProfile(user.id, dto);
    return {
      user: {
        id: updated.id,
        email: updated.email,
        walletAddress: updated.walletAddress,
        username: updated.username,
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
        role: updated.role,
        createdAt: updated.createdAt,
      },
    };
  }
}
