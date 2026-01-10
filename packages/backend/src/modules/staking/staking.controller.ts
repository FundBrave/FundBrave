import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StakingService } from './staking.service';
import {
  Stake,
  PaginatedStakes,
  StakingPoolStats,
  UserStakingStats,
  GlobalPoolStats,
  StakingLeaderboardEntry,
  PendingStakingRewards,
  GlobalPoolEpoch,
  UserGlobalPoolVotes,
  RecordStakeInput,
  UnstakeInput,
  GlobalPoolVoteInput,
  StakeSortBy,
} from './dto';
import { SortOrder } from '../fundraisers/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Staking')
@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  // ==================== GET Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get paginated list of stakes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'stakerId', required: false, type: String })
  @ApiQuery({ name: 'fundraiserId', required: false, type: String })
  @ApiQuery({ name: 'poolAddress', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isGlobal', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: StakeSortBy })
  @ApiQuery({ name: 'order', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'Returns paginated stakes' })
  async getStakes(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('stakerId') stakerId?: string,
    @Query('fundraiserId') fundraiserId?: string,
    @Query('poolAddress') poolAddress?: string,
    @Query('isActive') isActive?: string,
    @Query('isGlobal') isGlobal?: string,
    @Query('sortBy') sortBy: StakeSortBy = StakeSortBy.STAKED_AT,
    @Query('order') order: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedStakes> {
    const filter = {
      stakerId,
      fundraiserId,
      poolAddress,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isGlobal: isGlobal !== undefined ? isGlobal === 'true' : undefined,
    };

    return this.stakingService.getStakes(limit, offset, filter, sortBy, order);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get staking leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns staking leaderboard' })
  async getLeaderboard(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<StakingLeaderboardEntry[]> {
    return this.stakingService.getStakingLeaderboard(limit);
  }

  @Get('global-pool/stats')
  @ApiOperation({ summary: 'Get global pool statistics' })
  @ApiResponse({ status: 200, description: 'Returns global pool stats' })
  async getGlobalPoolStats(): Promise<GlobalPoolStats> {
    return this.stakingService.getGlobalPoolStats();
  }

  @Get('global-pool/stakes')
  @ApiOperation({ summary: 'Get global pool stakes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns global pool stakes' })
  async getGlobalPoolStakes(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getGlobalPoolStakes(limit, offset);
  }

  @Get('global-pool/epoch/current')
  @ApiOperation({ summary: 'Get current epoch' })
  @ApiResponse({ status: 200, description: 'Returns current epoch' })
  async getCurrentEpoch(): Promise<GlobalPoolEpoch | null> {
    return this.stakingService.getCurrentEpoch();
  }

  @Get('global-pool/epoch/:epochNumber')
  @ApiOperation({ summary: 'Get epoch by number' })
  @ApiParam({ name: 'epochNumber', type: Number })
  @ApiResponse({ status: 200, description: 'Returns epoch details' })
  async getEpoch(
    @Param('epochNumber', ParseIntPipe) epochNumber: number,
  ): Promise<GlobalPoolEpoch | null> {
    return this.stakingService.getEpochByNumber(epochNumber);
  }

  @Get('pool/:poolAddress/stats')
  @ApiOperation({ summary: 'Get staking pool statistics' })
  @ApiParam({ name: 'poolAddress', type: String })
  @ApiResponse({ status: 200, description: 'Returns pool stats' })
  async getPoolStats(
    @Param('poolAddress') poolAddress: string,
  ): Promise<StakingPoolStats> {
    return this.stakingService.getPoolStats(poolAddress);
  }

  @Get('fundraiser/:fundraiserId')
  @ApiOperation({ summary: 'Get stakes for a fundraiser' })
  @ApiParam({ name: 'fundraiserId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns fundraiser stakes' })
  async getFundraiserStakes(
    @Param('fundraiserId') fundraiserId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getFundraiserStakes(fundraiserId, limit, offset);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get stakes by user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user stakes' })
  async getUserStakes(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getUserStakes(userId, limit, offset);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get staking stats for user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Returns user staking stats' })
  async getUserStakingStats(
    @Param('userId') userId: string,
  ): Promise<UserStakingStats> {
    return this.stakingService.getUserStakingStats(userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user stakes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user stakes' })
  async getMyStakes(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getUserStakes(user.id, limit, offset);
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user staking stats' })
  @ApiResponse({ status: 200, description: 'Returns user staking stats' })
  async getMyStakingStats(
    @CurrentUser() user: { id: string },
  ): Promise<UserStakingStats> {
    return this.stakingService.getUserStakingStats(user.id);
  }

  @Get('my/rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user pending rewards' })
  @ApiResponse({ status: 200, description: 'Returns pending rewards' })
  async getMyPendingRewards(
    @CurrentUser() user: { id: string },
  ): Promise<PendingStakingRewards> {
    return this.stakingService.getUserPendingRewards(user.id);
  }

  @Get('my/votes/:epochNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user votes for epoch' })
  @ApiParam({ name: 'epochNumber', type: Number })
  @ApiResponse({ status: 200, description: 'Returns user votes' })
  async getMyEpochVotes(
    @CurrentUser() user: { id: string },
    @Param('epochNumber', ParseIntPipe) epochNumber: number,
  ): Promise<UserGlobalPoolVotes | null> {
    return this.stakingService.getUserEpochVotes(user.id, epochNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stake by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns stake details' })
  @ApiResponse({ status: 404, description: 'Stake not found' })
  async getStakeById(@Param('id') id: string): Promise<Stake> {
    return this.stakingService.getStakeById(id);
  }

  // ==================== POST Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a new stake' })
  @ApiResponse({ status: 201, description: 'Stake recorded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recordStake(
    @CurrentUser() user: { id: string; walletAddress: string },
    @Body() input: RecordStakeInput,
  ): Promise<Stake> {
    return this.stakingService.recordStake(user.id, user.walletAddress, input);
  }

  @Post('unstake')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process an unstake' })
  @ApiResponse({ status: 200, description: 'Unstake processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processUnstake(
    @Body() input: UnstakeInput,
  ): Promise<{ success: boolean }> {
    await this.stakingService.processUnstake(input);
    return { success: true };
  }

  @Post('global-pool/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit global pool votes' })
  @ApiResponse({ status: 200, description: 'Votes submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitGlobalPoolVotes(
    @CurrentUser() user: { id: string },
    @Body() input: GlobalPoolVoteInput,
  ): Promise<UserGlobalPoolVotes> {
    return this.stakingService.submitGlobalPoolVotes(user.id, input);
  }
}
