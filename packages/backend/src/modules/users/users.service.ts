import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { createHash } from 'crypto';
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
  CompleteOnboardingDto,
  OnboardingStatusDto,
  VALID_GOAL_IDS,
  VALID_INTEREST_IDS,
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
  async getUserByWallet(
    walletAddress: string,
    viewerId?: string,
  ): Promise<User> {
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
  async searchUsers(
    query: string,
    limit: number = 10,
  ): Promise<UserSearchResult> {
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
        verificationBadge:
          (u.verificationBadge as VerificationBadge) ?? undefined,
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
        verificationBadge:
          (f.follower.verificationBadge as VerificationBadge) ?? undefined,
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
        verificationBadge:
          (f.following.verificationBadge as VerificationBadge) ?? undefined,
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
  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<User> {
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

    // Parse birthdate if provided
    const birthdate = input.birthdate ? new Date(input.birthdate) : undefined;

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
        birthdate,
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
  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
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
  async blockUser(
    blockerId: string,
    blockedId: string,
    reason?: string,
  ): Promise<boolean> {
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

  // ==================== Onboarding Methods ====================

  /**
   * Generate a default avatar URL using DiceBear API
   * Creates a unique, deterministic avatar based on the identifier
   * @param identifier - Unique identifier (user ID, wallet address, or username)
   * @returns DiceBear avatar URL
   */
  generateDefaultAvatar(identifier: string): string {
    // Create a hash from the identifier for consistent avatar generation
    const hash = createHash('sha256').update(identifier).digest('hex');

    // Use DiceBear's "bottts" style for fun, unique robot avatars
    // Alternative styles: adventurer, avataaars, big-ears, big-smile, etc.
    const style = 'bottts';

    // Use first 16 chars of hash as seed for consistent generation
    const seed = hash.substring(0, 16);

    // DiceBear API v7 URL format with some styling options
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  /**
   * Get onboarding status for a user
   * @param userId - User ID
   * @returns Onboarding status with completion details
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        avatarUrl: true,
        goals: true,
        interests: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return {
      completed: user.onboardingCompleted,
      username: user.username ?? undefined,
      hasUsername: !!user.username,
      hasGoals: user.goals.length > 0,
      hasInterests: user.interests.length > 0,
      hasAvatar: !!user.avatarUrl,
    };
  }

  /**
   * Complete user onboarding
   * Saves all onboarding data in a single transaction
   * Generates default avatar if not provided
   * @param userId - User ID
   * @param input - Complete onboarding data
   * @returns Updated user profile
   */
  async completeOnboarding(
    userId: string,
    input: CompleteOnboardingDto,
  ): Promise<User> {
    const { profile, goals, interests } = input;

    // Validate goals
    const invalidGoals = goals.filter(
      (goal) =>
        !VALID_GOAL_IDS.includes(goal as (typeof VALID_GOAL_IDS)[number]),
    );
    if (invalidGoals.length > 0) {
      throw new InvalidInputException(
        `Invalid goal IDs: ${invalidGoals.join(', ')}`,
        { invalidGoals, validGoals: VALID_GOAL_IDS },
      );
    }

    // Validate interests if provided
    if (interests && interests.length > 0) {
      const invalidInterests = interests.filter(
        (interest) =>
          !VALID_INTEREST_IDS.includes(
            interest as (typeof VALID_INTEREST_IDS)[number],
          ),
      );
      if (invalidInterests.length > 0) {
        throw new InvalidInputException(
          `Invalid interest IDs: ${invalidInterests.join(', ')}`,
          { invalidInterests, validInterests: VALID_INTEREST_IDS },
        );
      }
    }

    // Check if username is available (if being set)
    const usernameExists = await this.prisma.user.findFirst({
      where: {
        username: profile.username.toLowerCase(),
        id: { not: userId },
      },
    });

    if (usernameExists) {
      throw new UsernameAlreadyTakenException(profile.username);
    }

    // Get current user to check if avatar is already set
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, walletAddress: true },
    });

    if (!currentUser) {
      throw new UserNotFoundException(userId);
    }

    // Determine avatar URL: use provided, keep existing, or generate default
    let avatarUrl = profile.avatarUrl;
    if (!avatarUrl && !currentUser.avatarUrl) {
      // Generate default avatar using user's wallet address or ID
      avatarUrl = this.generateDefaultAvatar(
        currentUser.walletAddress || userId,
      );
    } else if (!avatarUrl) {
      // Keep existing avatar (convert null to undefined)
      avatarUrl = currentUser.avatarUrl || undefined;
    }

    // Parse birthdate if provided
    const birthdate = profile.birthdate ? new Date(profile.birthdate) : null;

    // Perform atomic update with transaction
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      return tx.user.update({
        where: { id: userId },
        data: {
          username: profile.username.toLowerCase(),
          displayName: profile.displayName ?? null,
          bio: profile.bio ?? null,
          avatarUrl: avatarUrl ?? undefined,
          birthdate,
          goals,
          interests: interests ?? [],
          onboardingCompleted: true,
        },
      });
    });

    this.logger.log(`Onboarding completed for user ${userId}`);

    return this.mapToUserDto(updatedUser);
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
  private async mapToUserDto(
    user: PrismaUser,
    viewerId?: string,
  ): Promise<User> {
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
      isVerifiedCreator: user.isVerifiedCreator,
      verificationBadge:
        (user.verificationBadge as VerificationBadge) ?? undefined,
      stats,
      isPrivate: user.isPrivate,
      isActive: user.isActive,
      birthdate: user.birthdate ?? undefined,
      goals: user.goals ?? [],
      interests: user.interests ?? [],
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSeenAt: user.lastSeenAt ?? undefined,
      isFollowing,
      isFollowedBy,
      isBlocked,
    };
  }
}
