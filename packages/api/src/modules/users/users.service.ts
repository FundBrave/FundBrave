import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.username !== undefined ? { username: dto.username.toLowerCase() } : {}),
          ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
          ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Username is already taken');
      }
      throw err;
    }
  }
}
