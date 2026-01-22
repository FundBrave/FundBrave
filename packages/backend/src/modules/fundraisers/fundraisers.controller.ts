import {
  Controller,
  Get,
  Post,
  Put,
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
} from '@nestjs/swagger';
import { FundraisersService } from './fundraisers.service';
import { StakingService } from '../staking/staking.service';
import {
  Fundraiser,
  PaginatedFundraisers,
  CreateFundraiserInput,
  UpdateFundraiserInput,
  CreateFundraiserUpdateInput,
  CreateMilestoneInput,
  FundraiserFilterInput,
  FundraiserSortBy,
  SortOrder,
  CampaignStakingInfo,
  PaginatedCampaignStakes,
  CampaignStakeResult,
  CampaignUnstakeResult,
  StakeToCampaignInput,
  UnstakeFromCampaignInput,
  UserCampaignStake,
} from './dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Mapping of frontend-friendly sort options to backend enum values.
 * This allows the frontend to use user-friendly names like 'oldest', 'newest'
 * while the backend maintains proper enum types internally.
 */
type FrontendSortOption =
  | 'oldest'
  | 'newest'
  | 'most-funded'
  | 'least-funded';

interface SortMapping {
  sortBy: FundraiserSortBy;
  order: SortOrder;
}

const FRONTEND_SORT_MAPPINGS: Record<FrontendSortOption, SortMapping> = {
  oldest: { sortBy: FundraiserSortBy.CREATED_AT, order: SortOrder.ASC },
  newest: { sortBy: FundraiserSortBy.CREATED_AT, order: SortOrder.DESC },
  'most-funded': { sortBy: FundraiserSortBy.RAISED_AMOUNT, order: SortOrder.DESC },
  'least-funded': { sortBy: FundraiserSortBy.RAISED_AMOUNT, order: SortOrder.ASC },
};

@ApiTags('Fundraisers')
@Controller('fundraisers')
export class FundraisersController {
  constructor(
    private readonly fundraisersService: FundraisersService,
    private readonly stakingService: StakingService,
  ) {}

  /**
   * Maps frontend-friendly sort values to backend enum values.
   * If the value is a recognized frontend option (e.g., 'oldest'), it maps to the appropriate enum + order.
   * If the value is already a valid backend enum value, it returns it as-is with the provided order.
   * @param sortByParam - The sortBy value from the query parameter (could be frontend or backend format)
   * @param orderParam - The order value from the query parameter (optional, used when sortBy is a backend enum value)
   * @returns The mapped sortBy enum and order values
   */
  private mapSortParams(
    sortByParam?: string,
    orderParam?: SortOrder,
  ): { sortBy?: FundraiserSortBy; order?: SortOrder } {
    if (!sortByParam) {
      return { sortBy: undefined, order: orderParam };
    }

    // Check if it's a frontend-friendly sort option
    const frontendMapping = FRONTEND_SORT_MAPPINGS[sortByParam as FrontendSortOption];
    if (frontendMapping) {
      return frontendMapping;
    }

    // Check if it's already a valid backend enum value
    const isValidEnumValue = Object.values(FundraiserSortBy).includes(
      sortByParam as FundraiserSortBy,
    );
    if (isValidEnumValue) {
      return {
        sortBy: sortByParam as FundraiserSortBy,
        order: orderParam ?? SortOrder.DESC,
      };
    }

    // If not recognized, default to createdAt DESC
    return { sortBy: FundraiserSortBy.CREATED_AT, order: SortOrder.DESC };
  }

  // ==================== GET Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get paginated list of fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({ name: 'regions', required: false, type: [String] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'goalReached', required: false, type: Boolean })
  @ApiQuery({ name: 'searchQuery', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Sort option. Frontend values: oldest, newest, most-funded, least-funded. ' +
      'Backend enum values: createdAt, raisedAmount, donorsCount, deadline, goalAmount',
  })
  @ApiQuery({ name: 'order', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'Returns paginated fundraisers' })
  async getFundraisers(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('categories') categories?: string | string[],
    @Query('regions') regions?: string | string[],
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('goalReached') goalReached?: string,
    @Query('searchQuery') searchQuery?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: SortOrder,
  ): Promise<PaginatedFundraisers> {
    const filter: FundraiserFilterInput = {
      categories: this.parseArrayParam(categories),
      regions: this.parseArrayParam(regions),
      isActive: this.parseBooleanParam(isActive),
      isFeatured: this.parseBooleanParam(isFeatured),
      goalReached: this.parseBooleanParam(goalReached),
      searchQuery,
    };

    // Map frontend-friendly sort values to backend enum values
    const sort = this.mapSortParams(sortBy, order);

    return this.fundraisersService.getFundraisers(limit, offset, filter, sort);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns featured fundraisers' })
  async getFeaturedFundraisers(
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
  ): Promise<Fundraiser[]> {
    return this.fundraisersService.getFeaturedFundraisers(limit);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns trending fundraisers' })
  async getTrendingFundraisers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Fundraiser[]> {
    return this.fundraisersService.getTrendingFundraisers(limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get fundraiser categories with counts' })
  @ApiResponse({ status: 200, description: 'Returns categories with counts' })
  async getCategoriesWithCounts(): Promise<
    { category: string; count: number }[]
  > {
    return this.fundraisersService.getCategoriesWithCounts();
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get fundraiser regions with counts' })
  @ApiResponse({ status: 200, description: 'Returns regions with counts' })
  async getRegionsWithCounts(): Promise<{ region: string; count: number }[]> {
    return this.fundraisersService.getRegionsWithCounts();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search fundraisers' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns search results' })
  async searchFundraisers(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.searchFundraisers(query, limit, offset);
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: 'Get fundraisers by creator' })
  @ApiParam({ name: 'creatorId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns creator fundraisers' })
  async getFundraisersByCreator(
    @Param('creatorId') creatorId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisersByCreator(
      creatorId,
      limit,
      offset,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user fundraisers' })
  async getMyFundraisers(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisersByCreator(
      user.id,
      limit,
      offset,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fundraiser by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns fundraiser details' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getFundraiserById(@Param('id') id: string): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserById(id);
  }

  @Get('on-chain/:onChainId')
  @ApiOperation({ summary: 'Get fundraiser by on-chain ID' })
  @ApiParam({ name: 'onChainId', type: Number })
  @ApiResponse({ status: 200, description: 'Returns fundraiser details' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getFundraiserByOnChainId(
    @Param('onChainId', ParseIntPipe) onChainId: number,
  ): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserByOnChainId(onChainId);
  }

  // ==================== POST Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new fundraiser' })
  @ApiResponse({ status: 201, description: 'Fundraiser created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createFundraiser(
    @CurrentUser() user: { id: string },
    @Body()
    body: { input: CreateFundraiserInput; txHash: string; onChainId: number },
  ): Promise<Fundraiser> {
    return this.fundraisersService.createFundraiser(
      user.id,
      body.input,
      body.txHash,
      body.onChainId,
    );
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an update to a fundraiser' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Update added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async addFundraiserUpdate(
    @CurrentUser() user: { id: string },
    @Param('id') fundraiserId: string,
    @Body() input: CreateFundraiserUpdateInput,
  ) {
    return this.fundraisersService.addFundraiserUpdate(
      fundraiserId,
      user.id,
      input,
    );
  }

  @Post(':id/milestones')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a milestone to a fundraiser' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Milestone added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async addMilestone(
    @CurrentUser() user: { id: string },
    @Param('id') fundraiserId: string,
    @Body() input: CreateMilestoneInput,
  ) {
    return this.fundraisersService.addMilestone(fundraiserId, user.id, input);
  }

  // ==================== PUT Endpoints ====================

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a fundraiser' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Fundraiser updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async updateFundraiser(
    @CurrentUser() user: { id: string },
    @Param('id') fundraiserId: string,
    @Body() input: UpdateFundraiserInput,
  ): Promise<Fundraiser> {
    return this.fundraisersService.updateFundraiser(
      fundraiserId,
      user.id,
      input,
    );
  }

  // ==================== Campaign Staking Endpoints ====================

  @Get(':id/staking')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get staking information for a campaign' })
  @ApiParam({ name: 'id', type: String, description: 'Fundraiser ID' })
  @ApiResponse({ status: 200, description: 'Returns campaign staking info' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getCampaignStakingInfo(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string },
  ): Promise<CampaignStakingInfo> {
    // Get fundraiser details
    const fundraiser = await this.fundraisersService.getFundraiserById(id);

    // Get staking stats for this fundraiser
    const stakes = await this.stakingService.getFundraiserStakes(id, 1000, 0);

    // Calculate total staked
    const totalStaked = stakes.items.reduce(
      (sum, stake) => sum + BigInt(stake.amount),
      BigInt(0),
    );

    // Get unique active stakers count
    const activeStakers = new Set(
      stakes.items.filter((s) => s.isActive).map((s) => s.staker.walletAddress),
    );

    // Get user's stake if authenticated
    let userStakedAmount: string | undefined;
    let userPendingYield: string | undefined;

    if (user) {
      const userStakes = await this.stakingService.getUserStakes(user.id, 100, 0);
      const userCampaignStake = userStakes.items.find(
        (s) => s.fundraiser?.id === id && s.isActive,
      );
      if (userCampaignStake) {
        userStakedAmount = userCampaignStake.amount;
        // TODO: Calculate actual pending yield from contract
        userPendingYield = '0';
      }
    }

    return {
      fundraiserId: fundraiser.id,
      fundraiserName: fundraiser.name,
      stakingPoolAddr: fundraiser.stakingPoolAddr,
      totalStaked: totalStaked.toString(),
      stakersCount: activeStakers.size,
      estimatedApy: '5.0', // TODO: Calculate actual APY
      totalYieldGenerated: '0', // TODO: Calculate from yield harvests
      userStakedAmount,
      userPendingYield,
      isStakingActive: fundraiser.isActive && !!fundraiser.stakingPoolAddr,
    };
  }

  @Get(':id/stakers')
  @ApiOperation({ summary: 'Get list of stakers for a campaign' })
  @ApiParam({ name: 'id', type: String, description: 'Fundraiser ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns paginated stakers list' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getCampaignStakers(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedCampaignStakes> {
    // Verify fundraiser exists
    await this.fundraisersService.getFundraiserById(id);

    // Get stakes for this fundraiser
    const stakes = await this.stakingService.getFundraiserStakes(id, limit, offset);

    return {
      items: stakes.items.map((stake) => ({
        id: stake.id,
        txHash: stake.txHash,
        amount: stake.amount,
        shares: stake.shares,
        staker: {
          id: stake.staker.id,
          walletAddress: stake.staker.walletAddress,
          username: stake.staker.username,
          displayName: stake.staker.displayName,
          avatarUrl: stake.staker.avatarUrl,
        },
        isActive: stake.isActive,
        stakedAt: stake.stakedAt,
        unstakedAt: stake.unstakedAt,
      })),
      total: stakes.total,
      hasMore: stakes.hasMore,
    };
  }

  @Get(':id/staking/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user stake for a campaign' })
  @ApiParam({ name: 'id', type: String, description: 'Fundraiser ID' })
  @ApiResponse({ status: 200, description: 'Returns user stake info' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found or no stake' })
  async getMyStakeForCampaign(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<UserCampaignStake | null> {
    // Verify fundraiser exists
    const fundraiser = await this.fundraisersService.getFundraiserById(id);

    // Get user's stakes
    const userStakes = await this.stakingService.getUserStakes(user.id, 100, 0);
    const userCampaignStake = userStakes.items.find(
      (s) => s.fundraiser?.id === id && s.isActive,
    );

    if (!userCampaignStake) {
      return null;
    }

    return {
      stakeId: userCampaignStake.id,
      fundraiserId: id,
      fundraiserName: fundraiser.name,
      amount: userCampaignStake.amount,
      shares: userCampaignStake.shares,
      pendingYield: '0', // TODO: Calculate from contract
      totalYieldEarned: '0', // TODO: Calculate from yield harvests
      stakedAt: userCampaignStake.stakedAt,
    };
  }

  @Post(':id/stake')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stake to a specific campaign' })
  @ApiParam({ name: 'id', type: String, description: 'Fundraiser ID' })
  @ApiResponse({ status: 201, description: 'Stake recorded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async stakeToCampaign(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; walletAddress: string },
    @Body() input: StakeToCampaignInput,
  ): Promise<CampaignStakeResult> {
    try {
      // Verify fundraiser exists and has staking pool
      const fundraiser = await this.fundraisersService.getFundraiserById(id);

      if (!fundraiser.stakingPoolAddr) {
        return {
          success: false,
          message: 'This campaign does not have a staking pool',
        };
      }

      if (!fundraiser.isActive) {
        return {
          success: false,
          message: 'This campaign is no longer active',
        };
      }

      // Record the stake
      const stake = await this.stakingService.recordStake(
        user.id,
        user.walletAddress,
        {
          txHash: input.txHash,
          poolAddress: fundraiser.stakingPoolAddr,
          amount: input.amount,
          shares: input.shares,
          fundraiserId: id,
          chainId: input.chainId,
          isGlobal: false,
          yieldSplit:
            input.causeShare !== undefined
              ? {
                  causeShare: input.causeShare,
                  stakerShare: input.stakerShare!,
                  platformShare: input.platformShare!,
                }
              : undefined,
        },
      );

      return {
        success: true,
        stake: {
          id: stake.id,
          txHash: stake.txHash,
          amount: stake.amount,
          shares: stake.shares,
          staker: {
            id: stake.staker.id,
            walletAddress: stake.staker.walletAddress,
            username: stake.staker.username,
            displayName: stake.staker.displayName,
            avatarUrl: stake.staker.avatarUrl,
          },
          isActive: stake.isActive,
          stakedAt: stake.stakedAt,
          unstakedAt: stake.unstakedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to record stake',
      };
    }
  }

  @Post(':id/unstake')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unstake from a specific campaign' })
  @ApiParam({ name: 'id', type: String, description: 'Fundraiser ID' })
  @ApiResponse({ status: 200, description: 'Unstake processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser or stake not found' })
  async unstakeFromCampaign(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() input: UnstakeFromCampaignInput,
  ): Promise<CampaignUnstakeResult> {
    try {
      // Verify fundraiser exists
      await this.fundraisersService.getFundraiserById(id);

      // Find user's active stake for this campaign
      const userStakes = await this.stakingService.getUserStakes(user.id, 100, 0);
      const userCampaignStake = userStakes.items.find(
        (s) => s.fundraiser?.id === id && s.isActive,
      );

      if (!userCampaignStake) {
        return {
          success: false,
          message: 'No active stake found for this campaign',
        };
      }

      // Process unstake
      await this.stakingService.processUnstake({
        stakeId: userCampaignStake.id,
        txHash: input.txHash,
        amount: input.amount,
      });

      return {
        success: true,
        amountUnstaked: input.amount || userCampaignStake.amount,
        yieldClaimed: '0', // TODO: Calculate from transaction
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to process unstake',
      };
    }
  }

  // ==================== Helper Methods ====================

  private parseArrayParam(param?: string | string[]): string[] | undefined {
    if (!param) return undefined;
    if (Array.isArray(param)) return param;
    return param.split(',').map((s) => s.trim());
  }

  private parseBooleanParam(param?: string): boolean | undefined {
    if (param === undefined || param === '') return undefined;
    return param === 'true';
  }
}
