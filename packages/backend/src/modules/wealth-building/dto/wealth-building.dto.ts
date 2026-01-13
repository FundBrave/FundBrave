import {
  Field,
  InputType,
  ObjectType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  IsEthereumAddress,
} from 'class-validator';

// ==================== Input Types ====================

/**
 * Input for fetching endowment info
 */
@InputType()
export class GetEndowmentInput {
  @Field()
  @IsString()
  donationId: string;
}

// ==================== Object Types ====================

/**
 * Wealth building donation information
 */
@ObjectType()
export class WealthBuildingDonation {
  @Field()
  id: string;

  @Field()
  donorAddress: string;

  @Field(() => Int)
  fundraiserId: number;

  @Field()
  fundraiserName: string;

  @Field()
  beneficiaryAddr: string;

  @Field()
  totalAmount: string;

  @Field()
  directAmount: string;

  @Field()
  endowmentAmount: string;

  @Field()
  platformFee: string;

  @Field()
  endowmentPrincipal: string;

  @Field()
  lifetimeYield: string;

  @Field()
  causeYieldPaid: string;

  @Field()
  donorStockValue: string;

  @Field()
  txHash: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  lastHarvestAt?: Date;
}

/**
 * Endowment information with detailed yield breakdown
 */
@ObjectType()
export class EndowmentInfo {
  @Field()
  donationId: string;

  @Field()
  donorAddress: string;

  @Field(() => Int)
  fundraiserId: number;

  @Field()
  principal: string;

  @Field()
  lifetimeYield: string;

  @Field()
  causeYieldPaid: string;

  @Field()
  donorStockValue: string;

  @Field({ nullable: true })
  lastHarvestTime?: Date;

  @Field()
  pendingCauseYield: string;

  @Field()
  pendingDonorYield: string;
}

/**
 * Pending yield for an endowment
 */
@ObjectType()
export class PendingEndowmentYield {
  @Field()
  donationId: string;

  @Field(() => Int)
  fundraiserId: number;

  @Field()
  causeYield: string;

  @Field()
  donorYield: string;

  @Field()
  totalYield: string;
}

/**
 * Stock portfolio entry
 */
@ObjectType()
export class StockHolding {
  @Field()
  stockToken: string;

  @Field()
  stockSymbol: string;

  @Field()
  balance: string;

  @Field()
  totalUSDCInvested: string;

  @Field()
  currentValueUSD: string;

  @Field()
  gainLossPercent: string;
}

/**
 * Complete stock portfolio
 */
@ObjectType()
export class StockPortfolio {
  @Field(() => [StockHolding])
  holdings: StockHolding[];

  @Field()
  totalValueUSD: string;

  @Field()
  totalInvestedUSD: string;

  @Field()
  totalGainLossPercent: string;

  @Field(() => Int)
  holdingsCount: number;
}

/**
 * Stock purchase event
 */
@ObjectType()
export class StockPurchaseEvent {
  @Field()
  donorAddress: string;

  @Field()
  stockToken: string;

  @Field()
  stockSymbol: string;

  @Field()
  usdcAmount: string;

  @Field()
  stockAmount: string;

  @Field()
  txHash: string;

  @Field()
  purchasedAt: Date;
}

/**
 * Yield harvest event
 */
@ObjectType()
export class WealthBuildingYieldHarvestEvent {
  @Field()
  donationId: string;

  @Field()
  yieldAmount: string;

  @Field()
  causeShare: string;

  @Field()
  donorShare: string;

  @Field()
  txHash: string;

  @Field()
  harvestedAt: Date;
}

/**
 * Platform-wide wealth building statistics
 */
@ObjectType()
export class WealthBuildingStats {
  @Field()
  totalDonations: string;

  @Field()
  totalDirectToBeneficiaries: string;

  @Field()
  totalEndowmentPrincipal: string;

  @Field()
  totalYieldGenerated: string;

  @Field()
  totalCauseYieldPaid: string;

  @Field()
  totalDonorStockValue: string;

  @Field(() => Int)
  donationsCount: number;

  @Field(() => Int)
  uniqueDonorsCount: number;

  @Field(() => Int)
  activeFundraisersCount: number;
}

/**
 * Supported stock token information
 */
@ObjectType()
export class SupportedStockInfo {
  @Field()
  tokenAddress: string;

  @Field()
  symbol: string;

  @Field()
  name: string;

  @Field(() => Int)
  decimals: number;

  @Field({ nullable: true })
  underlyingAsset?: string;

  @Field({ nullable: true })
  lastPrice?: string;

  @Field({ nullable: true })
  lastPriceAt?: Date;

  @Field()
  isDefault: boolean;
}

// ==================== Paginated Responses ====================

/**
 * Paginated donations response
 */
@ObjectType()
export class PaginatedWealthBuildingDonations {
  @Field(() => [WealthBuildingDonation])
  items: WealthBuildingDonation[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

/**
 * Paginated stock purchases response
 */
@ObjectType()
export class PaginatedStockPurchases {
  @Field(() => [StockPurchaseEvent])
  items: StockPurchaseEvent[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

// ==================== Subscription Payloads ====================

/**
 * Payload for new donation subscription
 */
@ObjectType()
export class WealthBuildingDonationCreatedPayload {
  @Field(() => WealthBuildingDonation)
  donation: WealthBuildingDonation;
}

/**
 * Payload for yield harvest subscription
 */
@ObjectType()
export class EndowmentYieldHarvestedPayload {
  @Field()
  donationId: string;

  @Field()
  yieldAmount: string;

  @Field()
  causeShare: string;

  @Field()
  donorShare: string;

  @Field()
  txHash: string;

  @Field()
  timestamp: Date;
}

/**
 * Payload for stock purchase subscription
 */
@ObjectType()
export class StockPurchasedPayload {
  @Field()
  donorAddress: string;

  @Field()
  stockToken: string;

  @Field()
  stockSymbol: string;

  @Field()
  usdcAmount: string;

  @Field()
  stockAmount: string;

  @Field()
  txHash: string;

  @Field()
  timestamp: Date;
}
