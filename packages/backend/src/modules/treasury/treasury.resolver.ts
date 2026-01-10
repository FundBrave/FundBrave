import {
  Resolver,
  Query,
  Subscription,
  Args,
  Int,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { TreasuryService } from './treasury.service';
import {
  TreasuryStats,
  FBTStake,
  PaginatedPlatformFees,
  PaginatedFBTStakers,
  FeeSourceType,
  TreasuryEndowmentInfo,
  TreasuryStatsUpdatedPayload,
  FBTStakeUpdatedPayload,
  FeeReceivedPayload,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// PubSub instance for subscriptions
const pubSub = new PubSub();

// Subscription event names
export const TREASURY_EVENTS = {
  STATS_UPDATED: 'treasuryStatsUpdated',
  FBT_STAKE_UPDATED: 'fbtStakeUpdated',
  FEE_RECEIVED: 'feeReceived',
};

/**
 * GraphQL resolver for Platform Treasury operations
 */
@Resolver()
export class TreasuryResolver {
  constructor(private readonly treasuryService: TreasuryService) {}

  // ==================== Queries ====================

  /**
   * Get comprehensive treasury statistics
   */
  @Query(() => TreasuryStats, {
    name: 'treasuryStats',
    description: 'Get platform treasury statistics',
  })
  async getTreasuryStats(): Promise<TreasuryStats> {
    return this.treasuryService.getTreasuryStats();
  }

  /**
   * Get current user's FBT stake in treasury
   * Protected: Requires authentication
   */
  @Query(() => FBTStake, {
    name: 'myFBTStake',
    nullable: true,
    description: 'Get current user\'s FBT stake in treasury',
  })
  @UseGuards(JwtAuthGuard)
  async getMyFBTStake(
    @CurrentUser() user: { id: string },
  ): Promise<FBTStake | null> {
    return this.treasuryService.getUserFBTStake(user.id);
  }

  /**
   * Get FBT stake by wallet address (public)
   */
  @Query(() => FBTStake, {
    name: 'fbtStakeByAddress',
    nullable: true,
    description: 'Get FBT stake by wallet address',
  })
  async getFBTStakeByAddress(
    @Args('address') address: string,
  ): Promise<FBTStake | null> {
    return this.treasuryService.getUserFBTStakeByAddress(address);
  }

  /**
   * Get claimable USDC yield from FBT staking
   * Protected: Requires authentication
   */
  @Query(() => String, {
    name: 'myClaimableTreasuryYield',
    description: 'Get claimable USDC yield from FBT staking',
  })
  @UseGuards(JwtAuthGuard)
  async getMyClaimableTreasuryYield(
    @CurrentUser() user: { id: string },
  ): Promise<string> {
    return this.treasuryService.getClaimableTreasuryYield(user.id);
  }

  /**
   * Get platform fee collection history
   */
  @Query(() => PaginatedPlatformFees, {
    name: 'platformFees',
    description: 'Get platform fee collection history',
  })
  async getPlatformFees(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedPlatformFees> {
    return this.treasuryService.getPlatformFees(limit, offset);
  }

  /**
   * Get platform fees by source type
   */
  @Query(() => PaginatedPlatformFees, {
    name: 'platformFeesBySource',
    description: 'Get platform fees filtered by source type',
  })
  async getPlatformFeesBySource(
    @Args('sourceType', { type: () => FeeSourceType }) sourceType: FeeSourceType,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedPlatformFees> {
    return this.treasuryService.getPlatformFeesBySource(
      sourceType,
      limit,
      offset,
    );
  }

  /**
   * Get operational funds balance
   */
  @Query(() => String, {
    name: 'operationalFunds',
    description: 'Get operational funds balance',
  })
  async getOperationalFunds(): Promise<string> {
    return this.treasuryService.getOperationalFunds();
  }

  /**
   * Get all FBT stakers with pagination
   */
  @Query(() => PaginatedFBTStakers, {
    name: 'fbtStakers',
    description: 'Get all FBT stakers in treasury',
  })
  async getFBTStakers(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFBTStakers> {
    return this.treasuryService.getFBTStakers(limit, offset);
  }

  /**
   * Get treasury endowment info
   */
  @Query(() => TreasuryEndowmentInfo, {
    name: 'treasuryEndowmentInfo',
    description: 'Get treasury\'s endowment information',
  })
  async getTreasuryEndowmentInfo(): Promise<TreasuryEndowmentInfo> {
    return this.treasuryService.getTreasuryEndowmentInfo();
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to treasury stats updates
   */
  @Subscription(() => TreasuryStatsUpdatedPayload, {
    name: 'treasuryStatsUpdated',
    description: 'Subscribe to treasury stats updates',
  })
  subscribeToTreasuryStatsUpdated() {
    return pubSub.asyncIterableIterator(TREASURY_EVENTS.STATS_UPDATED);
  }

  /**
   * Subscribe to FBT stake updates for a user
   */
  @Subscription(() => FBTStakeUpdatedPayload, {
    name: 'fbtStakeUpdated',
    description: 'Subscribe to FBT stake updates',
    filter: (payload, variables) => {
      if (variables.address) {
        return (
          payload.fbtStakeUpdated.stake.stakerAddress.toLowerCase() ===
          variables.address.toLowerCase()
        );
      }
      return true;
    },
  })
  subscribeToFBTStakeUpdated(
    @Args('address', { nullable: true }) address?: string,
  ) {
    return pubSub.asyncIterableIterator(TREASURY_EVENTS.FBT_STAKE_UPDATED);
  }

  /**
   * Subscribe to fee received events
   */
  @Subscription(() => FeeReceivedPayload, {
    name: 'feeReceived',
    description: 'Subscribe to platform fee received events',
  })
  subscribeToFeeReceived() {
    return pubSub.asyncIterableIterator(TREASURY_EVENTS.FEE_RECEIVED);
  }
}

/**
 * Publish treasury stats updated event
 */
export function publishTreasuryStatsUpdated(
  payload: TreasuryStatsUpdatedPayload,
): void {
  pubSub.publish(TREASURY_EVENTS.STATS_UPDATED, {
    treasuryStatsUpdated: payload,
  });
}

/**
 * Publish FBT stake updated event
 */
export function publishFBTStakeUpdated(
  payload: FBTStakeUpdatedPayload,
): void {
  pubSub.publish(TREASURY_EVENTS.FBT_STAKE_UPDATED, {
    fbtStakeUpdated: payload,
  });
}

/**
 * Publish fee received event
 */
export function publishFeeReceived(payload: FeeReceivedPayload): void {
  pubSub.publish(TREASURY_EVENTS.FEE_RECEIVED, {
    feeReceived: payload,
  });
}
