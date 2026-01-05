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
import { WealthBuildingService } from './wealth-building.service';
import {
  WealthBuildingDonation,
  EndowmentInfo,
  PendingEndowmentYield,
  StockPortfolio,
  WealthBuildingStats,
  SupportedStockInfo,
  PaginatedWealthBuildingDonations,
  PaginatedStockPurchases,
  WealthBuildingDonationCreatedPayload,
  EndowmentYieldHarvestedPayload,
  StockPurchasedPayload,
} from './dto';
// import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

// PubSub instance for subscriptions
const pubSub = new PubSub();

// Subscription event names
export const WEALTH_BUILDING_EVENTS = {
  DONATION_CREATED: 'wealthBuildingDonationCreated',
  YIELD_HARVESTED: 'endowmentYieldHarvested',
  STOCK_PURCHASED: 'stockPurchased',
};

/**
 * GraphQL resolver for Wealth Building Donation operations
 */
@Resolver()
export class WealthBuildingResolver {
  constructor(private readonly wealthBuildingService: WealthBuildingService) {}

  // ==================== Queries ====================

  /**
   * Get platform-wide wealth building statistics
   */
  @Query(() => WealthBuildingStats, {
    name: 'wealthBuildingStats',
    description: 'Get platform-wide wealth building statistics',
  })
  async getWealthBuildingStats(): Promise<WealthBuildingStats> {
    return this.wealthBuildingService.getWealthBuildingStats();
  }

  /**
   * Get current user's wealth building donations
   */
  @Query(() => PaginatedWealthBuildingDonations, {
    name: 'myWealthBuildingDonations',
    description: 'Get current user\'s wealth building donations',
  })
  // @UseGuards(GqlAuthGuard)
  async getMyWealthBuildingDonations(
    @Context() context: any,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedWealthBuildingDonations> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return { items: [], total: 0, hasMore: false };
    }
    return this.wealthBuildingService.getUserDonations(userId, limit, offset);
  }

  /**
   * Get current user's stock portfolio
   */
  @Query(() => StockPortfolio, {
    name: 'myStockPortfolio',
    description: 'Get current user\'s stock portfolio from donations',
  })
  // @UseGuards(GqlAuthGuard)
  async getMyStockPortfolio(
    @Context() context: any,
  ): Promise<StockPortfolio> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return {
        holdings: [],
        totalValueUSD: '0',
        totalInvestedUSD: '0',
        totalGainLossPercent: '0',
        holdingsCount: 0,
      };
    }
    return this.wealthBuildingService.getUserStockPortfolio(userId);
  }

  /**
   * Get endowment info for a specific donation
   */
  @Query(() => EndowmentInfo, {
    name: 'endowmentInfo',
    description: 'Get detailed endowment information for a donation',
  })
  async getEndowmentInfo(
    @Args('donationId') donationId: string,
  ): Promise<EndowmentInfo> {
    return this.wealthBuildingService.getEndowmentInfo(donationId);
  }

  /**
   * Get all wealth building donations for a fundraiser
   */
  @Query(() => PaginatedWealthBuildingDonations, {
    name: 'fundraiserEndowments',
    description: 'Get all wealth building donations for a fundraiser',
  })
  async getFundraiserEndowments(
    @Args('fundraiserId') fundraiserId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedWealthBuildingDonations> {
    return this.wealthBuildingService.getFundraiserEndowments(
      fundraiserId,
      limit,
      offset,
    );
  }

  /**
   * Get pending yield for current user's endowments
   */
  @Query(() => [PendingEndowmentYield], {
    name: 'myPendingEndowmentYield',
    description: 'Get pending yield for all user\'s endowments',
  })
  // @UseGuards(GqlAuthGuard)
  async getMyPendingEndowmentYield(
    @Context() context: any,
  ): Promise<PendingEndowmentYield[]> {
    const userId = context.req?.user?.id;
    if (!userId) {
      return [];
    }
    return this.wealthBuildingService.getUserPendingEndowmentYields(userId);
  }

  /**
   * Get supported stock tokens
   */
  @Query(() => [SupportedStockInfo], {
    name: 'supportedStocks',
    description: 'Get list of supported stock tokens',
  })
  async getSupportedStocks(): Promise<SupportedStockInfo[]> {
    return this.wealthBuildingService.getSupportedStocks();
  }

  /**
   * Get stock purchase history for an address
   */
  @Query(() => PaginatedStockPurchases, {
    name: 'stockPurchaseHistory',
    description: 'Get stock purchase history for an address',
  })
  async getStockPurchaseHistory(
    @Args('address') address: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedStockPurchases> {
    return this.wealthBuildingService.getUserStockPurchases(
      address,
      limit,
      offset,
    );
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to new wealth building donations
   */
  @Subscription(() => WealthBuildingDonationCreatedPayload, {
    name: 'wealthBuildingDonationCreated',
    description: 'Subscribe to new wealth building donations',
    filter: (payload, variables) => {
      // Optional: Filter by fundraiser ID
      if (variables.fundraiserId !== undefined) {
        return (
          payload.wealthBuildingDonationCreated.donation.fundraiserId ===
          variables.fundraiserId
        );
      }
      return true;
    },
  })
  subscribeToWealthBuildingDonationCreated(
    @Args('fundraiserId', { type: () => Int, nullable: true })
    fundraiserId?: number,
  ) {
    return pubSub.asyncIterableIterator(WEALTH_BUILDING_EVENTS.DONATION_CREATED);
  }

  /**
   * Subscribe to yield harvest events for a user
   */
  @Subscription(() => EndowmentYieldHarvestedPayload, {
    name: 'endowmentYieldHarvested',
    description: 'Subscribe to yield harvest events for a user',
    filter: (payload, variables) => {
      if (variables.userId) {
        // Would need to look up donation to check user
        return true;
      }
      return true;
    },
  })
  subscribeToEndowmentYieldHarvested(
    @Args('userId', { nullable: true }) userId?: string,
  ) {
    return pubSub.asyncIterableIterator(WEALTH_BUILDING_EVENTS.YIELD_HARVESTED);
  }

  /**
   * Subscribe to stock purchase events for a user
   */
  @Subscription(() => StockPurchasedPayload, {
    name: 'stockPurchased',
    description: 'Subscribe to stock purchase events for a user',
    filter: (payload, variables) => {
      if (variables.address) {
        return (
          payload.stockPurchased.donorAddress.toLowerCase() ===
          variables.address.toLowerCase()
        );
      }
      return true;
    },
  })
  subscribeToStockPurchased(
    @Args('address', { nullable: true }) address?: string,
  ) {
    return pubSub.asyncIterableIterator(WEALTH_BUILDING_EVENTS.STOCK_PURCHASED);
  }
}

/**
 * Publish donation created event
 */
export function publishDonationCreated(
  payload: WealthBuildingDonationCreatedPayload,
): void {
  pubSub.publish(WEALTH_BUILDING_EVENTS.DONATION_CREATED, {
    wealthBuildingDonationCreated: payload,
  });
}

/**
 * Publish yield harvested event
 */
export function publishYieldHarvested(
  payload: EndowmentYieldHarvestedPayload,
): void {
  pubSub.publish(WEALTH_BUILDING_EVENTS.YIELD_HARVESTED, {
    endowmentYieldHarvested: payload,
  });
}

/**
 * Publish stock purchased event
 */
export function publishStockPurchased(payload: StockPurchasedPayload): void {
  pubSub.publish(WEALTH_BUILDING_EVENTS.STOCK_PURCHASED, {
    stockPurchased: payload,
  });
}
