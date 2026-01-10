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
import { FBTVestingService } from './fbt-vesting.service';
import {
  VestingSchedule,
  VestingSummary,
  VestingStats,
  PaginatedVestingSchedules,
  PaginatedVestingClaims,
  PaginatedFBTBurns,
  VestingScheduleCreatedPayload,
  VestedTokensClaimedPayload,
  FBTBurnedPayload,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// PubSub instance for subscriptions
const pubSub = new PubSub();

// Subscription event names
export const FBT_VESTING_EVENTS = {
  SCHEDULE_CREATED: 'vestingScheduleCreated',
  TOKENS_CLAIMED: 'vestedTokensClaimed',
  TOKENS_BURNED: 'fbtBurned',
};

/**
 * GraphQL resolver for FBT Vesting operations
 */
@Resolver()
export class FBTVestingResolver {
  constructor(private readonly fbtVestingService: FBTVestingService) {}

  // ==================== Queries ====================

  /**
   * Get current user's vesting schedules
   * Protected: Requires authentication
   */
  @Query(() => PaginatedVestingSchedules, {
    name: 'myVestingSchedules',
    description: 'Get current user\'s vesting schedules',
  })
  @UseGuards(JwtAuthGuard)
  async getMyVestingSchedules(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedVestingSchedules> {
    return this.fbtVestingService.getUserVestingSchedules(user.id, limit, offset);
  }

  /**
   * Get vesting schedules by wallet address (public)
   */
  @Query(() => PaginatedVestingSchedules, {
    name: 'vestingSchedulesByAddress',
    description: 'Get vesting schedules by wallet address',
  })
  async getVestingSchedulesByAddress(
    @Args('address') address: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedVestingSchedules> {
    return this.fbtVestingService.getSchedulesByAddress(address, limit, offset);
  }

  /**
   * Get a specific vesting schedule
   */
  @Query(() => VestingSchedule, {
    name: 'vestingSchedule',
    description: 'Get a specific vesting schedule',
  })
  async getVestingSchedule(
    @Args('scheduleId') scheduleId: string,
  ): Promise<VestingSchedule> {
    return this.fbtVestingService.getVestingSchedule(scheduleId);
  }

  /**
   * Get total claimable vested FBT for current user
   * Protected: Requires authentication
   */
  @Query(() => String, {
    name: 'myClaimableVestedFBT',
    description: 'Get total claimable vested FBT',
  })
  @UseGuards(JwtAuthGuard)
  async getMyClaimableVestedFBT(
    @CurrentUser() user: { id: string },
  ): Promise<string> {
    return this.fbtVestingService.getClaimableAmount(user.id);
  }

  /**
   * Get total vested (not yet claimed) for current user
   * Protected: Requires authentication
   */
  @Query(() => String, {
    name: 'myTotalVested',
    description: 'Get total vested FBT not yet claimed',
  })
  @UseGuards(JwtAuthGuard)
  async getMyTotalVested(
    @CurrentUser() user: { id: string },
  ): Promise<string> {
    return this.fbtVestingService.getTotalVested(user.id);
  }

  /**
   * Get vesting summary for current user
   * Protected: Requires authentication
   */
  @Query(() => VestingSummary, {
    name: 'myVestingSummary',
    description: 'Get vesting summary for current user',
  })
  @UseGuards(JwtAuthGuard)
  async getMyVestingSummary(
    @CurrentUser() user: { id: string },
  ): Promise<VestingSummary> {
    return this.fbtVestingService.getVestingSummary(user.id);
  }

  /**
   * Get platform-wide vesting statistics
   */
  @Query(() => VestingStats, {
    name: 'vestingStats',
    description: 'Get platform-wide vesting statistics',
  })
  async getVestingStats(): Promise<VestingStats> {
    return this.fbtVestingService.getVestingStats();
  }

  /**
   * Get claim history for a schedule
   */
  @Query(() => PaginatedVestingClaims, {
    name: 'vestingScheduleClaims',
    description: 'Get claim history for a vesting schedule',
  })
  async getVestingScheduleClaims(
    @Args('scheduleId') scheduleId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedVestingClaims> {
    return this.fbtVestingService.getScheduleClaims(scheduleId, limit, offset);
  }

  /**
   * Get FBT burn history
   */
  @Query(() => PaginatedFBTBurns, {
    name: 'fbtBurnHistory',
    description: 'Get FBT burn history',
  })
  async getFBTBurnHistory(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFBTBurns> {
    return this.fbtVestingService.getBurnHistory(limit, offset);
  }

  /**
   * Get FBT burn history for an address
   */
  @Query(() => PaginatedFBTBurns, {
    name: 'fbtBurnsByAddress',
    description: 'Get FBT burn history for a specific address',
  })
  async getFBTBurnsByAddress(
    @Args('address') address: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedFBTBurns> {
    return this.fbtVestingService.getBurnsByAddress(address, limit, offset);
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to vesting schedule created events
   */
  @Subscription(() => VestingScheduleCreatedPayload, {
    name: 'vestingScheduleCreated',
    description: 'Subscribe to new vesting schedules',
    filter: (payload, variables) => {
      if (variables.address) {
        return (
          payload.vestingScheduleCreated.schedule.recipientAddress.toLowerCase() ===
          variables.address.toLowerCase()
        );
      }
      return true;
    },
  })
  subscribeToVestingScheduleCreated(
    @Args('address', { nullable: true }) address?: string,
  ) {
    return pubSub.asyncIterableIterator(FBT_VESTING_EVENTS.SCHEDULE_CREATED);
  }

  /**
   * Subscribe to vested tokens claimed events
   */
  @Subscription(() => VestedTokensClaimedPayload, {
    name: 'vestedTokensClaimed',
    description: 'Subscribe to vested tokens claimed events',
    filter: (payload, variables) => {
      if (variables.address) {
        return (
          payload.vestedTokensClaimed.recipientAddress.toLowerCase() ===
          variables.address.toLowerCase()
        );
      }
      return true;
    },
  })
  subscribeToVestedTokensClaimed(
    @Args('address', { nullable: true }) address?: string,
  ) {
    return pubSub.asyncIterableIterator(FBT_VESTING_EVENTS.TOKENS_CLAIMED);
  }

  /**
   * Subscribe to FBT burned events
   */
  @Subscription(() => FBTBurnedPayload, {
    name: 'fbtBurned',
    description: 'Subscribe to FBT burned events',
  })
  subscribeToFBTBurned() {
    return pubSub.asyncIterableIterator(FBT_VESTING_EVENTS.TOKENS_BURNED);
  }
}

/**
 * Publish vesting schedule created event
 */
export function publishVestingScheduleCreated(
  payload: VestingScheduleCreatedPayload,
): void {
  pubSub.publish(FBT_VESTING_EVENTS.SCHEDULE_CREATED, {
    vestingScheduleCreated: payload,
  });
}

/**
 * Publish vested tokens claimed event
 */
export function publishVestedTokensClaimed(
  payload: VestedTokensClaimedPayload,
): void {
  pubSub.publish(FBT_VESTING_EVENTS.TOKENS_CLAIMED, {
    vestedTokensClaimed: payload,
  });
}

/**
 * Publish FBT burned event
 */
export function publishFBTBurned(payload: FBTBurnedPayload): void {
  pubSub.publish(FBT_VESTING_EVENTS.TOKENS_BURNED, {
    fbtBurned: payload,
  });
}
