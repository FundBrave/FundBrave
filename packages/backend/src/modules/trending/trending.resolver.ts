import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TrendingService } from './trending.service';
import {
  TrendingHashtag,
  TrendingFundraiser,
  TrendingUser,
  TrendingType,
  TrendingPeriod,
  GetTrendingInput,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Resolver()
export class TrendingResolver {
  constructor(private readonly trendingService: TrendingService) {}

  // ==================== Queries ====================

  @Query(() => [TrendingHashtag], { name: 'trendingHashtags' })
  async getTrendingHashtags(
    @Args('period', { type: () => TrendingPeriod, defaultValue: TrendingPeriod.TWENTY_FOUR_HOURS })
    period: TrendingPeriod,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<TrendingHashtag[]> {
    return this.trendingService.getTrendingHashtags(period, limit);
  }

  @Query(() => [TrendingFundraiser], { name: 'trendingFundraisers' })
  async getTrendingFundraisers(
    @Args('period', { type: () => TrendingPeriod, defaultValue: TrendingPeriod.TWENTY_FOUR_HOURS })
    period: TrendingPeriod,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<TrendingFundraiser[]> {
    return this.trendingService.getTrendingFundraisers(period, limit);
  }

  @Query(() => [TrendingUser], { name: 'trendingUsers' })
  async getTrendingUsers(
    @Args('period', { type: () => TrendingPeriod, defaultValue: TrendingPeriod.TWENTY_FOUR_HOURS })
    period: TrendingPeriod,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<TrendingUser[]> {
    return this.trendingService.getTrendingUsers(period, limit);
  }

  // ==================== Admin Mutations ====================

  @Mutation(() => Boolean, { name: 'forceRecalculateTrending' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async forceRecalculateTrending(): Promise<boolean> {
    await this.trendingService.forceRecalculate();
    return true;
  }
}
