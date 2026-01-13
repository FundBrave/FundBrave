import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  Int,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { ImpactDAOService } from './impact-dao.service';
import {
  ImpactDAOStats,
  ImpactDAOStake,
  PaginatedImpactDAOStakers,
  PendingYield,
  YieldSplit,
  ImpactDAORecordStakeInput,
  ImpactDAOStakeUpdatedPayload,
  ImpactDAOYieldHarvestedPayload,
  PaginatedYieldHarvests,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// PubSub instance for subscriptions
const pubSub = new PubSub();

// Subscription event names
export const IMPACT_DAO_EVENTS = {
  STAKE_UPDATED: 'impactDAOStakeUpdated',
  YIELD_HARVESTED: 'impactDAOYieldHarvested',
};

/**
 * GraphQL resolver for Impact DAO Pool operations
 */
@Resolver()
export class ImpactDAOResolver {
  constructor(private readonly impactDAOService: ImpactDAOService) {}

  // ==================== Queries ====================

  /**
   * Get comprehensive Impact DAO pool statistics
   */
  @Query(() => ImpactDAOStats, {
    name: 'impactDAOStats',
    description: 'Get Impact DAO pool statistics',
  })
  async getImpactDAOStats(): Promise<ImpactDAOStats> {
    return this.impactDAOService.getDAOStats();
  }

  /**
   * Get the current user's Impact DAO stake
   * Protected: Requires authentication
   */
  @Query(() => ImpactDAOStake, {
    name: 'myImpactDAOStake',
    nullable: true,
    description: "Get the current user's Impact DAO stake",
  })
  @UseGuards(JwtAuthGuard)
  async getMyImpactDAOStake(
    @CurrentUser() user: { id: string },
  ): Promise<ImpactDAOStake | null> {
    return this.impactDAOService.getUserStake(user.id);
  }

  /**
   * Get Impact DAO stake by wallet address (public)
   */
  @Query(() => ImpactDAOStake, {
    name: 'impactDAOStakeByAddress',
    nullable: true,
    description: 'Get Impact DAO stake by wallet address',
  })
  async getImpactDAOStakeByAddress(
    @Args('address') address: string,
  ): Promise<ImpactDAOStake | null> {
    return this.impactDAOService.getUserStakeByAddress(address);
  }

  /**
   * Get all Impact DAO stakers with pagination
   */
  @Query(() => PaginatedImpactDAOStakers, {
    name: 'impactDAOStakers',
    description: 'Get all Impact DAO stakers with pagination',
  })
  async getImpactDAOStakers(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedImpactDAOStakers> {
    return this.impactDAOService.getStakers(limit, offset);
  }

  /**
   * Get pending yield for current user
   * Protected: Requires authentication
   */
  @Query(() => PendingYield, {
    name: 'myPendingDAOYield',
    description: 'Get pending yield breakdown for current user',
  })
  @UseGuards(JwtAuthGuard)
  async getMyPendingDAOYield(
    @CurrentUser() user: { id: string },
  ): Promise<PendingYield> {
    return this.impactDAOService.getPendingYield(user.id);
  }

  /**
   * Get pending FBT rewards for current user
   * Protected: Requires authentication
   */
  @Query(() => String, {
    name: 'myDAOFBTRewards',
    description: 'Get pending FBT rewards for current user',
  })
  @UseGuards(JwtAuthGuard)
  async getMyDAOFBTRewards(
    @CurrentUser() user: { id: string },
  ): Promise<string> {
    return this.impactDAOService.getPendingFBTRewards(user.id);
  }

  /**
   * Get current user's custom yield split
   * Protected: Requires authentication
   */
  @Query(() => YieldSplit, {
    name: 'myDAOYieldSplit',
    nullable: true,
    description: "Get current user's custom yield split configuration",
  })
  @UseGuards(JwtAuthGuard)
  async getMyDAOYieldSplit(
    @CurrentUser() user: { id: string },
  ): Promise<YieldSplit | null> {
    return this.impactDAOService.getUserYieldSplit(user.id);
  }

  /**
   * Get yield harvest history for a stake
   */
  @Query(() => PaginatedYieldHarvests, {
    name: 'impactDAOYieldHarvests',
    description: 'Get yield harvest history for a stake',
  })
  async getImpactDAOYieldHarvests(
    @Args('stakeId') stakeId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedYieldHarvests> {
    return this.impactDAOService.getYieldHarvests(stakeId, limit, offset);
  }

  // ==================== Mutations ====================

  /**
   * Record a stake event (for tracking purposes)
   * The actual staking happens on-chain via the frontend
   * Protected: Requires authentication
   */
  @Mutation(() => Boolean, {
    name: 'recordImpactDAOStake',
    description: 'Record a stake transaction hash for tracking',
  })
  @UseGuards(JwtAuthGuard)
  async recordImpactDAOStake(
    @CurrentUser() user: { id: string },
    @Args('input') input: ImpactDAORecordStakeInput,
  ): Promise<boolean> {
    // This mutation is primarily for frontend to notify backend
    // The actual processing happens via the blockchain indexer
    return true;
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to stake updates
   */
  @Subscription(() => ImpactDAOStakeUpdatedPayload, {
    name: 'impactDAOStakeUpdated',
    description: 'Subscribe to Impact DAO stake updates',
    filter: (payload, variables) => {
      // Optional: Filter by address if provided
      if (variables.address) {
        return (
          payload.impactDAOStakeUpdated.stake.stakerAddress.toLowerCase() ===
          variables.address.toLowerCase()
        );
      }
      return true;
    },
  })
  subscribeToStakeUpdates(
    @Args('address', { nullable: true }) address?: string,
  ) {
    return pubSub.asyncIterableIterator(IMPACT_DAO_EVENTS.STAKE_UPDATED);
  }

  /**
   * Subscribe to yield harvest events
   */
  @Subscription(() => ImpactDAOYieldHarvestedPayload, {
    name: 'impactDAOYieldHarvested',
    description: 'Subscribe to Impact DAO yield harvest events',
  })
  subscribeToYieldHarvested() {
    return pubSub.asyncIterableIterator(IMPACT_DAO_EVENTS.YIELD_HARVESTED);
  }
}

/**
 * Publish stake update event
 */
export function publishStakeUpdate(
  payload: ImpactDAOStakeUpdatedPayload,
): void {
  pubSub.publish(IMPACT_DAO_EVENTS.STAKE_UPDATED, {
    impactDAOStakeUpdated: payload,
  });
}

/**
 * Publish yield harvested event
 */
export function publishYieldHarvested(
  payload: ImpactDAOYieldHarvestedPayload,
): void {
  pubSub.publish(IMPACT_DAO_EVENTS.YIELD_HARVESTED, {
    impactDAOYieldHarvested: payload,
  });
}
