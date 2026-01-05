import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
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
  StakeFilterInput,
  GlobalPoolVoteInput,
  StakeSortBy,
} from './dto';
import { SortOrder } from '../fundraisers/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Stake)
export class StakingResolver {
  constructor(private readonly stakingService: StakingService) {}

  // ==================== Queries ====================

  @Query(() => Stake, { name: 'stake' })
  async getStake(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Stake> {
    return this.stakingService.getStakeById(id);
  }

  @Query(() => PaginatedStakes, { name: 'stakes' })
  async getStakes(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('filter', { type: () => StakeFilterInput, nullable: true })
    filter?: StakeFilterInput,
    @Args('sortBy', { type: () => StakeSortBy, defaultValue: StakeSortBy.STAKED_AT })
    sortBy?: StakeSortBy,
    @Args('order', { type: () => SortOrder, defaultValue: SortOrder.DESC })
    order?: SortOrder,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getStakes(limit, offset, filter, sortBy, order);
  }

  @Query(() => PaginatedStakes, { name: 'userStakes' })
  async getUserStakes(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getUserStakes(userId, limit, offset);
  }

  @Query(() => PaginatedStakes, { name: 'myStakes' })
  @UseGuards(JwtAuthGuard)
  async getMyStakes(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getUserStakes(user.id, limit, offset);
  }

  @Query(() => PaginatedStakes, { name: 'fundraiserStakes' })
  async getFundraiserStakes(
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getFundraiserStakes(fundraiserId, limit, offset);
  }

  @Query(() => PaginatedStakes, { name: 'globalPoolStakes' })
  async getGlobalPoolStakes(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedStakes> {
    return this.stakingService.getGlobalPoolStakes(limit, offset);
  }

  @Query(() => StakingPoolStats, { name: 'poolStats' })
  async getPoolStats(
    @Args('poolAddress') poolAddress: string,
  ): Promise<StakingPoolStats> {
    return this.stakingService.getPoolStats(poolAddress);
  }

  @Query(() => UserStakingStats, { name: 'userStakingStats' })
  async getUserStakingStats(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<UserStakingStats> {
    return this.stakingService.getUserStakingStats(userId);
  }

  @Query(() => UserStakingStats, { name: 'myStakingStats' })
  @UseGuards(JwtAuthGuard)
  async getMyStakingStats(
    @CurrentUser() user: { id: string },
  ): Promise<UserStakingStats> {
    return this.stakingService.getUserStakingStats(user.id);
  }

  @Query(() => GlobalPoolStats, { name: 'globalPoolStats' })
  async getGlobalPoolStats(): Promise<GlobalPoolStats> {
    return this.stakingService.getGlobalPoolStats();
  }

  @Query(() => [StakingLeaderboardEntry], { name: 'stakingLeaderboard' })
  async getStakingLeaderboard(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<StakingLeaderboardEntry[]> {
    return this.stakingService.getStakingLeaderboard(limit);
  }

  @Query(() => PendingStakingRewards, { name: 'myPendingRewards' })
  @UseGuards(JwtAuthGuard)
  async getMyPendingRewards(
    @CurrentUser() user: { id: string },
  ): Promise<PendingStakingRewards> {
    return this.stakingService.getUserPendingRewards(user.id);
  }

  // ==================== Global Pool Queries ====================

  @Query(() => GlobalPoolEpoch, { name: 'currentEpoch', nullable: true })
  async getCurrentEpoch(): Promise<GlobalPoolEpoch | null> {
    return this.stakingService.getCurrentEpoch();
  }

  @Query(() => GlobalPoolEpoch, { name: 'epoch', nullable: true })
  async getEpoch(
    @Args('epochNumber', { type: () => Int }) epochNumber: number,
  ): Promise<GlobalPoolEpoch | null> {
    return this.stakingService.getEpochByNumber(epochNumber);
  }

  @Query(() => UserGlobalPoolVotes, { name: 'myEpochVotes', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getMyEpochVotes(
    @CurrentUser() user: { id: string },
    @Args('epochNumber', { type: () => Int }) epochNumber: number,
  ): Promise<UserGlobalPoolVotes | null> {
    return this.stakingService.getUserEpochVotes(user.id, epochNumber);
  }

  // ==================== Mutations ====================

  @Mutation(() => Stake)
  @UseGuards(JwtAuthGuard)
  async recordStake(
    @CurrentUser() user: { id: string; walletAddress: string },
    @Args('input') input: RecordStakeInput,
  ): Promise<Stake> {
    return this.stakingService.recordStake(user.id, user.walletAddress, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async processUnstake(
    @Args('input') input: UnstakeInput,
  ): Promise<boolean> {
    await this.stakingService.processUnstake(input);
    return true;
  }

  @Mutation(() => UserGlobalPoolVotes)
  @UseGuards(JwtAuthGuard)
  async submitGlobalPoolVotes(
    @CurrentUser() user: { id: string },
    @Args('input') input: GlobalPoolVoteInput,
  ): Promise<UserGlobalPoolVotes> {
    return this.stakingService.submitGlobalPoolVotes(user.id, input);
  }
}
