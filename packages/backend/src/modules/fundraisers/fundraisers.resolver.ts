import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FundraisersService } from './fundraisers.service';
import { FundraiserBlockchainService } from '../blockchain/fundraiser-blockchain.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Fundraiser,
  FundraiserMinimal,
  FundraiserMilestone,
  FundraiserUpdate,
  PaginatedFundraisers,
  CreateFundraiserInput,
  UpdateFundraiserInput,
  CreateFundraiserUpdateInput,
  CreateMilestoneInput,
  FundraiserFilterInput,
  FundraiserSortInput,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class CategoryCount {
  @Field()
  category: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
class RegionCount {
  @Field()
  region: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
class FundraisersMinimalResponse {
  @Field(() => [FundraiserMinimal])
  items: FundraiserMinimal[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@Resolver(() => Fundraiser)
export class FundraisersResolver {
  private readonly logger = new Logger(FundraisersResolver.name);

  constructor(
    private readonly fundraisersService: FundraisersService,
    private readonly fundraiserBlockchainService: FundraiserBlockchainService,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== Queries ====================

  @Query(() => Fundraiser, { name: 'fundraiser' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getFundraiser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserById(id);
  }

  @Query(() => Fundraiser, { name: 'fundraiserByOnChainId' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getFundraiserByOnChainId(
    @Args('onChainId', { type: () => Int }) onChainId: number,
  ): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserByOnChainId(onChainId);
  }

  @Query(() => PaginatedFundraisers, { name: 'fundraisers' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFundraisers(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('filter', { type: () => FundraiserFilterInput, nullable: true })
    filter?: FundraiserFilterInput,
    @Args('sort', { type: () => FundraiserSortInput, nullable: true })
    sort?: FundraiserSortInput,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisers(limit, offset, filter, sort);
  }

  @Query(() => [Fundraiser], { name: 'featuredFundraisers' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFeaturedFundraisers(
    @Args('limit', { type: () => Int, defaultValue: 6 }) limit: number,
  ): Promise<Fundraiser[]> {
    return this.fundraisersService.getFeaturedFundraisers(limit);
  }

  @Query(() => [Fundraiser], { name: 'trendingFundraisers' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getTrendingFundraisers(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Fundraiser[]> {
    return this.fundraisersService.getTrendingFundraisers(limit);
  }

  @Query(() => PaginatedFundraisers, { name: 'myFundraisers' })
  @UseGuards(JwtAuthGuard)
  async getMyFundraisers(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisersByCreator(
      user.id,
      limit,
      offset,
    );
  }

  @Query(() => PaginatedFundraisers, { name: 'fundraisersByCreator' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFundraisersByCreator(
    @Args('creatorId', { type: () => ID }) creatorId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisersByCreator(
      creatorId,
      limit,
      offset,
    );
  }

  @Query(() => FundraisersMinimalResponse, { name: 'fundraisersMinimal' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFundraisersMinimal(
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('filter', { type: () => FundraiserFilterInput, nullable: true })
    filter?: FundraiserFilterInput,
  ): Promise<FundraisersMinimalResponse> {
    return this.fundraisersService.getFundraisersMinimal(limit, offset, filter);
  }

  @Query(() => PaginatedFundraisers, { name: 'searchFundraisers' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async searchFundraisers(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.searchFundraisers(query, limit, offset);
  }

  @Query(() => [CategoryCount], { name: 'fundraiserCategories' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getCategoriesWithCounts(): Promise<CategoryCount[]> {
    return this.fundraisersService.getCategoriesWithCounts();
  }

  @Query(() => [RegionCount], { name: 'fundraiserRegions' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getRegionsWithCounts(): Promise<RegionCount[]> {
    return this.fundraisersService.getRegionsWithCounts();
  }

  // ==================== Mutations ====================

  @Mutation(() => Fundraiser)
  @UseGuards(JwtAuthGuard)
  async createFundraiser(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateFundraiserInput,
    @Args('txHash') txHash: string,
    @Args('onChainId', { type: () => Int }) onChainId: number,
    @Args('stakingPoolAddr', { type: () => String, nullable: true }) stakingPoolAddr?: string,
  ): Promise<Fundraiser> {
    return this.fundraisersService.createFundraiser(
      user.id,
      input,
      txHash,
      onChainId,
      stakingPoolAddr,
    );
  }

  @Mutation(() => Fundraiser)
  @UseGuards(JwtAuthGuard)
  async updateFundraiser(
    @CurrentUser() user: { id: string },
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('input') input: UpdateFundraiserInput,
  ): Promise<Fundraiser> {
    return this.fundraisersService.updateFundraiser(
      fundraiserId,
      user.id,
      input,
    );
  }

  @Mutation(() => FundraiserUpdate)
  @UseGuards(JwtAuthGuard)
  async addFundraiserUpdate(
    @CurrentUser() user: { id: string },
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('input') input: CreateFundraiserUpdateInput,
  ): Promise<FundraiserUpdate> {
    return this.fundraisersService.addFundraiserUpdate(
      fundraiserId,
      user.id,
      input,
    );
  }

  @Mutation(() => FundraiserMilestone)
  @UseGuards(JwtAuthGuard)
  async addMilestone(
    @CurrentUser() user: { id: string },
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('input') input: CreateMilestoneInput,
  ): Promise<FundraiserMilestone> {
    return this.fundraisersService.addMilestone(fundraiserId, user.id, input);
  }

  /**
   * Gasless campaign creation for web2 users.
   * The backend wallet pays gas and submits the on-chain transaction,
   * using createFundraiserFor() so the campaign is owned by the user's address.
   */
  @Mutation(() => Fundraiser)
  @UseGuards(JwtAuthGuard)
  async createFundraiserGasless(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateFundraiserInput,
  ): Promise<Fundraiser> {
    // Look up the user to get their wallet address
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, walletAddress: true },
    });

    if (!dbUser) {
      throw new Error('User not found');
    }

    if (!dbUser.walletAddress) {
      throw new Error('User has no wallet address for campaign creation');
    }

    // Calculate deadline and duration from input
    const deadline = new Date(input.deadline);
    if (deadline <= new Date()) {
      throw new Error('Deadline must be in the future');
    }
    const durationInDays = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    this.logger.log(
      `Gasless campaign creation for user ${user.id} (${dbUser.walletAddress})`,
    );

    // Step 1: Create on-chain via backend wallet using createFundraiserFor
    const blockchainResult =
      await this.fundraiserBlockchainService.createFundraiserForOnChain(
        dbUser.walletAddress,
        {
          name: input.name,
          description: input.description,
          images: input.images,
          categories: input.categories,
          region: input.region || '',
          beneficiary: input.beneficiary || dbUser.walletAddress,
          goalAmount: input.goalAmount,
          durationInDays,
        },
      );

    this.logger.log(
      `Gasless on-chain creation succeeded: txHash=${blockchainResult.txHash}, onChainId=${blockchainResult.onChainId}`,
    );

    // Step 2: Save to database (same as regular createFundraiser)
    return this.fundraisersService.createFundraiser(
      user.id,
      input,
      blockchainResult.txHash,
      blockchainResult.onChainId,
      undefined, // stakingPoolAddr will be read from chain later
    );
  }
}
