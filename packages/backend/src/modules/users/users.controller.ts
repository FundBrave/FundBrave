import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  User,
  PaginatedUsers,
  PaginatedFollows,
  UserActivitySummary,
  UserSearchResult,
  UserDashboardStats,
  NotificationSettings,
  UpdateProfileInput,
  UpdateNotificationSettingsInput,
  CompleteOnboardingDto,
  OnboardingStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== GET Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'isVerifiedCreator', required: false, type: Boolean })
  @ApiQuery({ name: 'searchQuery', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns paginated users' })
  async getUsers(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('isVerifiedCreator') isVerifiedCreator?: string,
    @Query('searchQuery') searchQuery?: string,
  ): Promise<PaginatedUsers> {
    const filter = {
      isVerifiedCreator:
        isVerifiedCreator !== undefined
          ? isVerifiedCreator === 'true'
          : undefined,
      searchQuery,
    };

    return this.usersService.getUsers(limit, offset, filter);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns search results' })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<UserSearchResult> {
    return this.usersService.searchUsers(query, limit);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  async getMe(@CurrentUser() user: { id: string }): Promise<User> {
    return this.usersService.getUserById(user.id);
  }

  @Get('me/activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user activity summary' })
  @ApiResponse({ status: 200, description: 'Returns activity summary' })
  async getMyActivity(
    @CurrentUser() user: { id: string },
  ): Promise<UserActivitySummary> {
    return this.usersService.getUserActivity(user.id);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user dashboard stats' })
  @ApiResponse({
    status: 200,
    description: 'Returns dashboard statistics including campaigns, donations, staking',
    type: UserDashboardStats,
  })
  async getMyStats(
    @CurrentUser() user: { id: string },
  ): Promise<UserDashboardStats> {
    return this.usersService.getUserDashboardStats(user.id);
  }

  @Get('me/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user followers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns followers' })
  async getMyFollowers(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowers(user.id, limit, offset);
  }

  @Get('me/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users current user is following' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns following' })
  async getMyFollowing(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowing(user.id, limit, offset);
  }

  @Get('me/notifications/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Returns notification settings' })
  async getNotificationSettings(
    @CurrentUser() user: { id: string },
  ): Promise<NotificationSettings> {
    return this.usersService.getNotificationSettings(user.id);
  }

  // ==================== Onboarding Endpoints ====================

  @Get('onboarding/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get onboarding status for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns onboarding completion status',
    type: OnboardingStatusDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOnboardingStatus(
    @CurrentUser() user: { id: string },
  ): Promise<OnboardingStatusDto> {
    return this.usersService.getOnboardingStatus(user.id);
  }

  @Post('onboarding/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete user onboarding' })
  @ApiBody({ type: CompleteOnboardingDto })
  @ApiResponse({
    status: 200,
    description:
      'Onboarding completed successfully, returns updated user profile',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  async completeOnboarding(
    @CurrentUser() user: { id: string },
    @Body() input: CompleteOnboardingDto,
  ): Promise<User> {
    return this.usersService.completeOnboarding(user.id, input);
  }

  @Get('username/:username/available')
  @ApiOperation({ summary: 'Check username availability' })
  @ApiParam({ name: 'username', type: String })
  @ApiResponse({ status: 200, description: 'Returns availability status' })
  async checkUsernameAvailability(
    @Param('username') username: string,
  ): Promise<{ available: boolean }> {
    const available = await this.usersService.isUsernameAvailable(username);
    return { available };
  }

  @Get('wallet/:walletAddress')
  @ApiOperation({ summary: 'Get user by wallet address' })
  @ApiParam({ name: 'walletAddress', type: String })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByWallet(
    @Param('walletAddress') walletAddress: string,
  ): Promise<User> {
    return this.usersService.getUserByWallet(walletAddress);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiParam({ name: 'username', type: String })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByUsername(@Param('username') username: string): Promise<User> {
    return this.usersService.getUserByUsername(username);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<User> {
    return this.usersService.getUserById(id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns followers' })
  async getFollowers(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowers(id, limit, offset);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users a user is following' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns following' })
  async getFollowing(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFollows> {
    return this.usersService.getFollowing(id, limit, offset);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity summary' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns activity summary' })
  async getUserActivity(@Param('id') id: string): Promise<UserActivitySummary> {
    return this.usersService.getUserActivity(id);
  }

  // ==================== PUT Endpoints ====================

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() input: UpdateProfileInput,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, input);
  }

  @Put('me/notifications/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateNotificationSettings(
    @CurrentUser() user: { id: string },
    @Body() input: UpdateNotificationSettingsInput,
  ): Promise<NotificationSettings> {
    return this.usersService.updateNotificationSettings(user.id, input);
  }

  // ==================== POST Endpoints ====================

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Followed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async followUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.usersService.followUser(user.id, userId);
    return { success };
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Blocked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async blockUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
    @Body('reason') reason?: string,
  ): Promise<{ success: boolean }> {
    const success = await this.usersService.blockUser(user.id, userId, reason);
    return { success };
  }

  // ==================== DELETE Endpoints ====================

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Unfollowed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.usersService.unfollowUser(user.id, userId);
    return { success };
  }

  @Delete(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Unblocked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unblockUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.usersService.unblockUser(user.id, userId);
    return { success };
  }
}
