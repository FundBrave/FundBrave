import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FundraisersService } from './fundraisers.service';
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
  constructor(private readonly fundraisersService: FundraisersService) {}

  // ==================== Queries ====================

  @Query(() => Fundraiser, { name: 'fundraiser' })
  async getFundraiser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserById(id);
  }

  @Query(() => Fundraiser, { name: 'fundraiserByOnChainId' })
  async getFundraiserByOnChainId(
    @Args('onChainId', { type: () => Int }) onChainId: number,
  ): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserByOnChainId(onChainId);
  }

  @Query(() => PaginatedFundraisers, { name: 'fundraisers' })
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
  async getFeaturedFundraisers(
    @Args('limit', { type: () => Int, defaultValue: 6 }) limit: number,
  ): Promise<Fundraiser[]> {
    return this.fundraisersService.getFeaturedFundraisers(limit);
  }

  @Query(() => [Fundraiser], { name: 'trendingFundraisers' })
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
    return this.fundraisersService.getFundraisersByCreator(user.id, limit, offset);
  }

  @Query(() => PaginatedFundraisers, { name: 'fundraisersByCreator' })
  async getFundraisersByCreator(
    @Args('creatorId', { type: () => ID }) creatorId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisersByCreator(creatorId, limit, offset);
  }

  @Query(() => FundraisersMinimalResponse, { name: 'fundraisersMinimal' })
  async getFundraisersMinimal(
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('filter', { type: () => FundraiserFilterInput, nullable: true })
    filter?: FundraiserFilterInput,
  ): Promise<FundraisersMinimalResponse> {
    return this.fundraisersService.getFundraisersMinimal(limit, offset, filter);
  }

  @Query(() => PaginatedFundraisers, { name: 'searchFundraisers' })
  async searchFundraisers(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.searchFundraisers(query, limit, offset);
  }

  @Query(() => [CategoryCount], { name: 'fundraiserCategories' })
  async getCategoriesWithCounts(): Promise<CategoryCount[]> {
    return this.fundraisersService.getCategoriesWithCounts();
  }

  @Query(() => [RegionCount], { name: 'fundraiserRegions' })
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
  ): Promise<Fundraiser> {
    return this.fundraisersService.createFundraiser(user.id, input, txHash, onChainId);
  }

  @Mutation(() => Fundraiser)
  @UseGuards(JwtAuthGuard)
  async updateFundraiser(
    @CurrentUser() user: { id: string },
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('input') input: UpdateFundraiserInput,
  ): Promise<Fundraiser> {
    return this.fundraisersService.updateFundraiser(fundraiserId, user.id, input);
  }

  @Mutation(() => FundraiserUpdate)
  @UseGuards(JwtAuthGuard)
  async addFundraiserUpdate(
    @CurrentUser() user: { id: string },
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('input') input: CreateFundraiserUpdateInput,
  ): Promise<FundraiserUpdate> {
    return this.fundraisersService.addFundraiserUpdate(fundraiserId, user.id, input);
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
}
