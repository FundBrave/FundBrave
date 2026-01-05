import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DonationsService } from './donations.service';
import {
  Donation,
  PaginatedDonations,
  DonationStats,
  UserDonationStats,
  DonationLeaderboard,
  DonationLeaderboardEntry,
  RecentDonationActivity,
  RecordDonationInput,
  DonationFilterInput,
  DonationSortBy,
} from './dto';
import { SortOrder } from '../fundraisers/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

enum LeaderboardPeriod {
  ALL = 'all',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
}

registerEnumType(LeaderboardPeriod, { name: 'LeaderboardPeriod' });

@Resolver(() => Donation)
export class DonationsResolver {
  constructor(private readonly donationsService: DonationsService) {}

  // ==================== Queries ====================

  @Query(() => Donation, { name: 'donation' })
  async getDonation(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Donation> {
    return this.donationsService.getDonationById(id);
  }

  @Query(() => Donation, { name: 'donationByTxHash' })
  async getDonationByTxHash(
    @Args('txHash') txHash: string,
  ): Promise<Donation> {
    return this.donationsService.getDonationByTxHash(txHash);
  }

  @Query(() => PaginatedDonations, { name: 'donations' })
  async getDonations(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('filter', { type: () => DonationFilterInput, nullable: true })
    filter?: DonationFilterInput,
    @Args('sortBy', { type: () => DonationSortBy, defaultValue: DonationSortBy.CREATED_AT })
    sortBy?: DonationSortBy,
    @Args('order', { type: () => SortOrder, defaultValue: SortOrder.DESC })
    order?: SortOrder,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getDonations(limit, offset, filter, sortBy, order);
  }

  @Query(() => PaginatedDonations, { name: 'fundraiserDonations' })
  async getFundraiserDonations(
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getFundraiserDonations(fundraiserId, limit, offset);
  }

  @Query(() => PaginatedDonations, { name: 'userDonations' })
  async getUserDonations(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getUserDonations(userId, limit, offset);
  }

  @Query(() => PaginatedDonations, { name: 'myDonations' })
  @UseGuards(JwtAuthGuard)
  async getMyDonations(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getUserDonations(user.id, limit, offset);
  }

  @Query(() => PaginatedDonations, { name: 'donationsByAddress' })
  async getDonationsByAddress(
    @Args('address') address: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getDonationsByAddress(address, limit, offset);
  }

  @Query(() => DonationStats, { name: 'fundraiserDonationStats' })
  async getFundraiserDonationStats(
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
  ): Promise<DonationStats> {
    return this.donationsService.getFundraiserDonationStats(fundraiserId);
  }

  @Query(() => UserDonationStats, { name: 'userDonationStats' })
  async getUserDonationStats(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<UserDonationStats> {
    return this.donationsService.getUserDonationStats(userId);
  }

  @Query(() => UserDonationStats, { name: 'myDonationStats' })
  @UseGuards(JwtAuthGuard)
  async getMyDonationStats(
    @CurrentUser() user: { id: string },
  ): Promise<UserDonationStats> {
    return this.donationsService.getUserDonationStats(user.id);
  }

  @Query(() => DonationLeaderboard, { name: 'donationLeaderboard' })
  async getDonationLeaderboard(
    @Args('period', { type: () => LeaderboardPeriod, defaultValue: LeaderboardPeriod.ALL })
    period: LeaderboardPeriod,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<DonationLeaderboard> {
    return this.donationsService.getDonationLeaderboard(period as 'all' | '7d' | '30d' | '90d', limit);
  }

  @Query(() => [DonationLeaderboardEntry], { name: 'topDonors' })
  async getTopDonors(
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<DonationLeaderboardEntry[]> {
    return this.donationsService.getTopDonors(fundraiserId, limit);
  }

  @Query(() => [RecentDonationActivity], { name: 'recentDonations' })
  async getRecentDonationActivity(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<RecentDonationActivity[]> {
    return this.donationsService.getRecentDonationActivity(limit);
  }

  @Query(() => DonationStats, { name: 'platformDonationStats' })
  async getPlatformDonationStats(): Promise<DonationStats> {
    return this.donationsService.getPlatformDonationStats();
  }

  // ==================== Mutations ====================

  @Mutation(() => Donation)
  @UseGuards(JwtAuthGuard)
  async recordDonation(
    @CurrentUser() user: { id: string; walletAddress: string },
    @Args('input') input: RecordDonationInput,
  ): Promise<Donation> {
    return this.donationsService.recordDonation(user.id, user.walletAddress, input);
  }
}
