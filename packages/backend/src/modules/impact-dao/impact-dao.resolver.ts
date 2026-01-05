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
// import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
   */
  @Query(() => ImpactDAOStake, {
    name: 'myImpactDAOStake',
    nullable: true,
    description: 'Get the current user\'s Impact DAO stake',
  })
  // @UseGuards(GqlAuthGuard)
  async getMyImpactDAOStake(
    @Context() context: any,
  ): Promise<ImpactDAOStake | null> {
    // TODO: Get user from context once auth is implemented
    // const userId = context.req.user.id;
    const userId = context.req?.user?.id;
    if (!userId) {
      return null;
    }
    return this.impactDAOService.getUserStake(userId);
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
   */
  @Query(() => PendingYield, {
    name: 'myPendingDAOYield',
    description: 'Get pending yield breakdown for current user',
  })
  // @UseGuards(GqlAuthGuard)
  async getMyPendingDAOYield(
    @Context() context: any,
  ): Promise<PendingYield> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return {
        totalYield: '0',
        daoShare: '0',
        stakerShare: '0',
        platformShare: '0',
      };
    }
    return this.impactDAOService.getPendingYield(userId);
  }

  /**
   * Get pending FBT rewards for current user
   */
  @Query(() => String, {
    name: 'myDAOFBTRewards',
    description: 'Get pending FBT rewards for current user',
  })
  // @UseGuards(GqlAuthGuard)
  async getMyDAOFBTRewards(
    @Context() context: any,
  ): Promise<string> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return '0';
    }
    return this.impactDAOService.getPendingFBTRewards(userId);
  }

  /**
   * Get current user's custom yield split
   */
  @Query(() => YieldSplit, {
    name: 'myDAOYieldSplit',
    nullable: true,
    description: 'Get current user\'s custom yield split configuration',
  })
  // @UseGuards(GqlAuthGuard)
  async getMyDAOYieldSplit(
    @Context() context: any,
  ): Promise<YieldSplit | null> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return null;
    }
    return this.impactDAOService.getUserYieldSplit(userId);
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
   */
  @Mutation(() => Boolean, {
    name: 'recordImpactDAOStake',
    description: 'Record a stake transaction hash for tracking',
  })
  // @UseGuards(GqlAuthGuard)
  async recordImpactDAOStake(
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
        return payload.impactDAOStakeUpdated.stake.stakerAddress.toLowerCase() ===
          variables.address.toLowerCase();
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
export function publishStakeUpdate(payload: ImpactDAOStakeUpdatedPayload): void {
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
