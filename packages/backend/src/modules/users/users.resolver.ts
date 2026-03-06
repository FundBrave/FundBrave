import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import {
  User,
  PaginatedUsers,
  PaginatedFollows,
  UserActivitySummary,
  UserSearchResult,
  NotificationSettings,
  UpdateProfileInput,
  UpdateNotificationSettingsInput,
  UserFilterInput,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // ==================== Queries ====================

  @Query(() => User, { name: 'user' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() viewer?: { id: string },
  ): Promise<User> {
    return this.usersService.getUserById(id, viewer?.id);
  }

  @Query(() => User, { name: 'userByWallet' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getUserByWallet(
    @Args('walletAddress') walletAddress: string,
    @CurrentUser() viewer?: { id: string },
  ): Promise<User> {
    return this.usersService.getUserByWallet(walletAddress, viewer?.id);
  }

  @Query(() => User, { name: 'userByUsername' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getUserByUsername(
    @Args('username') username: string,
    @CurrentUser() viewer?: { id: string },
  ): Promise<User> {
    return this.usersService.getUserByUsername(username, viewer?.id);
  }

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { id: string }): Promise<User> {
    return this.usersService.getUserById(user.id);
  }

  @Query(() => PaginatedUsers, { name: 'users' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getUsers(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('filter', { type: () => UserFilterInput, nullable: true })
    filter?: UserFilterInput,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedUsers> {
    return this.usersService.getUsers(limit, offset, filter, viewer?.id);
  }

  @Query(() => UserSearchResult, { name: 'searchUsers' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async searchUsers(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<UserSearchResult> {
    return this.usersService.searchUsers(query, limit);
  }

  @Query(() => PaginatedFollows, { name: 'followers' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFollowers(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowers(userId, limit, offset);
  }

  @Query(() => PaginatedFollows, { name: 'following' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFollowing(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowing(userId, limit, offset);
  }

  @Query(() => PaginatedFollows, { name: 'myFollowers' })
  @UseGuards(JwtAuthGuard)
  async getMyFollowers(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowers(user.id, limit, offset);
  }

  @Query(() => PaginatedFollows, { name: 'myFollowing' })
  @UseGuards(JwtAuthGuard)
  async getMyFollowing(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowing(user.id, limit, offset);
  }

  @Query(() => UserActivitySummary, { name: 'userActivity' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getUserActivity(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<UserActivitySummary> {
    return this.usersService.getUserActivity(userId);
  }

  @Query(() => UserActivitySummary, { name: 'myActivity' })
  @UseGuards(JwtAuthGuard)
  async getMyActivity(
    @CurrentUser() user: { id: string },
  ): Promise<UserActivitySummary> {
    return this.usersService.getUserActivity(user.id);
  }

  @Query(() => NotificationSettings, { name: 'myNotificationSettings' })
  @UseGuards(JwtAuthGuard)
  async getMyNotificationSettings(
    @CurrentUser() user: { id: string },
  ): Promise<NotificationSettings> {
    return this.usersService.getNotificationSettings(user.id);
  }

  @Query(() => Boolean, { name: 'isUsernameAvailable' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async isUsernameAvailable(
    @Args('username') username: string,
  ): Promise<boolean> {
    return this.usersService.isUsernameAvailable(username);
  }

  @Query(() => Boolean, { name: 'isFollowing' })
  @UseGuards(JwtAuthGuard)
  async checkIsFollowing(
    @CurrentUser() user: { id: string },
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.usersService.isFollowing(user.id, userId);
  }

  /**
   * Get suggested users for "Who to Follow" section
   *
   * Returns personalized user suggestions based on:
   * - Follower count (popularity)
   * - Recent post activity (engagement)
   * - Verification status (trust)
   * - Random factor (variety)
   *
   * For authenticated users, excludes:
   * - Current user
   * - Users already being followed
   * - Blocked users (bidirectional)
   *
   * For anonymous users, returns popular/active users
   */
  @Query(() => [User], {
    name: 'suggestedUsers',
    description:
      'Get personalized user suggestions for "Who to Follow" section',
  })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getSuggestedUsers(
    @Args('limit', {
      type: () => Int,
      defaultValue: 5,
      description: 'Maximum number of suggestions to return (default: 5)',
    })
    limit: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<User[]> {
    // Clamp limit to reasonable bounds (1-20)
    const clampedLimit = Math.min(Math.max(limit, 1), 20);
    return this.usersService.getSuggestedUsers(viewer?.id, clampedLimit);
  }

  // ==================== Mutations ====================

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Args('input') input: UpdateProfileInput,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, input);
  }

  @Mutation(() => NotificationSettings)
  @UseGuards(JwtAuthGuard)
  async updateNotificationSettings(
    @CurrentUser() user: { id: string },
    @Args('input') input: UpdateNotificationSettingsInput,
  ): Promise<NotificationSettings> {
    return this.usersService.updateNotificationSettings(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async followUser(
    @CurrentUser() user: { id: string },
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.usersService.followUser(user.id, userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async unfollowUser(
    @CurrentUser() user: { id: string },
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.usersService.unfollowUser(user.id, userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async blockUser(
    @CurrentUser() user: { id: string },
    @Args('userId', { type: () => ID }) userId: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<boolean> {
    return this.usersService.blockUser(user.id, userId, reason);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async unblockUser(
    @CurrentUser() user: { id: string },
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.usersService.unblockUser(user.id, userId);
  }
}
