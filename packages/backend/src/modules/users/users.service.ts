import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User as PrismaUser } from '@prisma/client';
import {
  User,
  UserMinimal,
  UserStats,
  PaginatedUsers,
  FollowRelation,
  PaginatedFollows,
  UserActivitySummary,
  UserSearchResult,
  NotificationSettings,
  CreateUserInput,
  UpdateProfileInput,
  UpdateNotificationSettingsInput,
  UserFilterInput,
  VerificationBadge,
} from './dto';
import {
  UserNotFoundException,
  UserAlreadyExistsException,
  UsernameAlreadyTakenException,
  InvalidInputException,
  UnauthorizedException,
} from '../../common/exceptions';

type UserWithRelations = PrismaUser;

/**
 * Service for managing User operations
 * Handles profiles, follows, blocks, and user settings
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get user by ID
   */
  async getUserById(id: string, viewerId?: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return this.mapToUserDto(user, viewerId);
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string, viewerId?: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      throw new UserNotFoundException(walletAddress);
    }

    return this.mapToUserDto(user, viewerId);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string, viewerId?: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      throw new UserNotFoundException(username);
    }

    return this.mapToUserDto(user, viewerId);
  }

  /**
   * Get paginated list of users
   */
  async getUsers(
    limit: number,
    offset: number,
    filter?: UserFilterInput,
    viewerId?: string,
  ): Promise<PaginatedUsers> {
    const where = this.buildWhereClause(filter);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          ...where,
          isActive: true,
          isSuspended: false,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({
        where: {
          ...where,
          isActive: true,
          isSuspended: false,
        },
      }),
    ]);

    const items = await Promise.all(
      users.map((u) => this.mapToUserDto(u, viewerId)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Search users
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResult> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { walletAddress: { startsWith: query.toLowerCase() } },
        ],
        isActive: true,
        isSuspended: false,
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerifiedCreator: true,
        verificationBadge: true,
      },
      take: limit,
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        walletAddress: u.walletAddress,
        username: u.username ?? undefined,
        displayName: u.displayName ?? undefined,
        avatarUrl: u.avatarUrl ?? undefined,
        isVerifiedCreator: u.isVerifiedCreator,
        verificationBadge: u.verificationBadge as VerificationBadge ?? undefined,
      })),
      total: users.length,
    };
  }

  /**
   * Get user followers
   */
  async getFollowers(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedFollows> {
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
              verificationBadge: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    const items: FollowRelation[] = follows.map((f) => ({
      id: f.id,
      user: {
        id: f.follower.id,
        walletAddress: f.follower.walletAddress,
        username: f.follower.username ?? undefined,
        displayName: f.follower.displayName ?? undefined,
        avatarUrl: f.follower.avatarUrl ?? undefined,
        isVerifiedCreator: f.follower.isVerifiedCreator,
        verificationBadge: f.follower.verificationBadge as VerificationBadge ?? undefined,
      },
      createdAt: f.createdAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get user following
   */
  async getFollowing(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedFollows> {
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
              verificationBadge: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    const items: FollowRelation[] = follows.map((f) => ({
      id: f.id,
      user: {
        id: f.following.id,
        walletAddress: f.following.walletAddress,
        username: f.following.username ?? undefined,
        displayName: f.following.displayName ?? undefined,
        avatarUrl: f.following.avatarUrl ?? undefined,
        isVerifiedCreator: f.following.isVerifiedCreator,
        verificationBadge: f.following.verificationBadge as VerificationBadge ?? undefined,
      },
      createdAt: f.createdAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string): Promise<UserActivitySummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [donations, stakes, posts, comments] = await Promise.all([
      this.prisma.donation.findMany({
        where: {
          donorId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { amountUSD: true },
      }),
      this.prisma.stake.count({
        where: {
          stakerId: userId,
          stakedAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.post.count({
        where: {
          authorId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.comment.count({
        where: {
          authorId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const donatedAmount = donations.reduce(
      (sum, d) => BigInt(sum) + BigInt(d.amountUSD),
      BigInt(0),
    );

    return {
      donationsLast30Days: donations.length,
      donatedAmountLast30Days: donatedAmount.toString(),
      stakesLast30Days: stakes,
      postsLast30Days: posts,
      commentsLast30Days: comments,
      earnedFBTLast30Days: '0', // TODO: Calculate from FBT rewards
    };
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    let settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSetting.create({
        data: { userId },
      });
    }

    return {
      emailEnabled: settings.emailEnabled,
      pushEnabled: settings.pushEnabled,
      notifyOnLike: settings.notifyOnLike,
      notifyOnComment: settings.notifyOnComment,
      notifyOnFollow: settings.notifyOnFollow,
      notifyOnMention: settings.notifyOnMention,
      notifyOnDonation: settings.notifyOnDonation,
      notifyOnStake: settings.notifyOnStake,
      notifyOnYieldHarvest: settings.notifyOnYieldHarvest,
      notifyOnStockPurchase: settings.notifyOnStockPurchase,
      notifyOnFBTVesting: settings.notifyOnFBTVesting,
      notifyOnDAOProposal: settings.notifyOnDAOProposal,
    };
  }

  /**
   * Check if user follows another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    return !!follow;
  }

  /**
   * Check if user is blocked
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    return !!block;
  }

  // ==================== Mutation Methods ====================

  /**
   * Create or get user by wallet address
   */
  async findOrCreateByWallet(walletAddress: string): Promise<User> {
    const normalizedAddress = walletAddress.toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
        },
      });
      this.logger.log(`Created new user for wallet ${normalizedAddress}`);
    }

    return this.mapToUserDto(user);
  }

  /**
   * Create user with additional data
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const normalizedAddress = input.walletAddress.toLowerCase();

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (existing) {
      throw new UserAlreadyExistsException(normalizedAddress);
    }

    // Check username availability if provided
    if (input.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: input.username.toLowerCase() },
      });

      if (usernameExists) {
        throw new UsernameAlreadyTakenException(input.username);
      }
    }

    const user = await this.prisma.user.create({
      data: {
        walletAddress: normalizedAddress,
        username: input.username?.toLowerCase(),
        email: input.email?.toLowerCase(),
      },
    });

    return this.mapToUserDto(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    // Check username availability if being changed
    if (input.username) {
      const usernameExists = await this.prisma.user.findFirst({
        where: {
          username: input.username.toLowerCase(),
          id: { not: userId },
        },
      });

      if (usernameExists) {
        throw new UsernameAlreadyTakenException(input.username);
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: input.username?.toLowerCase(),
        displayName: input.displayName,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        bannerUrl: input.bannerUrl,
        location: input.location,
        website: input.website,
        email: input.email?.toLowerCase(),
        isPrivate: input.isPrivate,
      },
    });

    return this.mapToUserDto(user);
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    input: UpdateNotificationSettingsInput,
  ): Promise<NotificationSettings> {
    const settings = await this.prisma.notificationSetting.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
      },
      update: input,
    });

    return {
      emailEnabled: settings.emailEnabled,
      pushEnabled: settings.pushEnabled,
      notifyOnLike: settings.notifyOnLike,
      notifyOnComment: settings.notifyOnComment,
      notifyOnFollow: settings.notifyOnFollow,
      notifyOnMention: settings.notifyOnMention,
      notifyOnDonation: settings.notifyOnDonation,
      notifyOnStake: settings.notifyOnStake,
      notifyOnYieldHarvest: settings.notifyOnYieldHarvest,
      notifyOnStockPurchase: settings.notifyOnStockPurchase,
      notifyOnFBTVesting: settings.notifyOnFBTVesting,
      notifyOnDAOProposal: settings.notifyOnDAOProposal,
    };
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new InvalidInputException('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new UserNotFoundException(followingId);
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existingFollow) {
      return true; // Already following
    }

    // Check if blocked
    const blocked = await this.isBlocked(followingId, followerId);
    if (blocked) {
      throw new UnauthorizedException('Cannot follow this user');
    }

    await this.prisma.$transaction([
      this.prisma.follow.create({
        data: { followerId, followingId },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } },
      }),
    ]);

    return true;
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!existingFollow) {
      return true; // Not following
    }

    await this.prisma.$transaction([
      this.prisma.follow.delete({
        where: { id: existingFollow.id },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } },
      }),
    ]);

    return true;
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<boolean> {
    if (blockerId === blockedId) {
      throw new InvalidInputException('Cannot block yourself');
    }

    // Remove any existing follow relationships
    await this.prisma.$transaction([
      // Remove if blocker follows blocked
      this.prisma.follow.deleteMany({
        where: { followerId: blockerId, followingId: blockedId },
      }),
      // Remove if blocked follows blocker
      this.prisma.follow.deleteMany({
        where: { followerId: blockedId, followingId: blockerId },
      }),
      // Create block
      this.prisma.block.upsert({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
        create: { blockerId, blockedId, reason },
        update: { reason },
      }),
    ]);

    return true;
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });

    return true;
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }

  /**
   * Check username availability
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    return !user;
  }

  // ==================== Helper Methods ====================

  /**
   * Build where clause from filter
   */
  private buildWhereClause(filter?: UserFilterInput): Prisma.UserWhereInput {
    if (!filter) return {};

    const where: Prisma.UserWhereInput = {};

    if (filter.isVerifiedCreator !== undefined) {
      where.isVerifiedCreator = filter.isVerifiedCreator;
    }

    if (filter.worldIdVerified !== undefined) {
      where.worldIdVerified = filter.worldIdVerified;
    }

    if (filter.searchQuery) {
      where.OR = [
        { username: { contains: filter.searchQuery, mode: 'insensitive' } },
        { displayName: { contains: filter.searchQuery, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Map Prisma user to DTO
   */
  private async mapToUserDto(user: PrismaUser, viewerId?: string): Promise<User> {
    const stats: UserStats = {
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      fundraisersCount: user.fundraisersCount,
      totalDonated: user.totalDonated.toString(),
      totalStaked: user.totalStaked.toString(),
      fbtBalance: user.fbtBalance.toString(),
      fbtStakedBalance: user.fbtStakedBalance.toString(),
      fbtVestedTotal: user.fbtVestedTotal.toString(),
      fbtVestedClaimed: user.fbtVestedClaimed.toString(),
      reputationScore: user.reputationScore,
    };

    let isFollowing: boolean | undefined;
    let isFollowedBy: boolean | undefined;
    let isBlocked: boolean | undefined;

    if (viewerId && viewerId !== user.id) {
      [isFollowing, isFollowedBy, isBlocked] = await Promise.all([
        this.isFollowing(viewerId, user.id),
        this.isFollowing(user.id, viewerId),
        this.isBlocked(viewerId, user.id),
      ]);
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username ?? undefined,
      email: user.email ?? undefined,
      emailVerified: user.emailVerified,
      displayName: user.displayName ?? undefined,
      bio: user.bio ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      bannerUrl: user.bannerUrl ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      worldIdVerified: user.worldIdVerified,
      isVerifiedCreator: user.isVerifiedCreator,
      verificationBadge: user.verificationBadge as VerificationBadge ?? undefined,
      stats,
      isPrivate: user.isPrivate,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSeenAt: user.lastSeenAt ?? undefined,
      isFollowing,
      isFollowedBy,
      isBlocked,
    };
  }
}
