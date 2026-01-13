import {
  Field,
  InputType,
  ObjectType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { IsString, IsInt, Min, IsOptional } from 'class-validator';

// ==================== Enums ====================

export enum FeeSourceType {
  STAKING_POOL = 'STAKING_POOL',
  IMPACT_DAO_POOL = 'IMPACT_DAO_POOL',
  WEALTH_BUILDING = 'WEALTH_BUILDING',
  FUNDRAISER = 'FUNDRAISER',
  OTHER = 'OTHER',
}

registerEnumType(FeeSourceType, {
  name: 'FeeSourceType',
  description: 'Source of platform fees',
});

// ==================== Object Types ====================

/**
 * Platform treasury statistics
 */
@ObjectType()
export class TreasuryStats {
  @Field()
  totalFeesCollected: string;

  @Field()
  totalFeesStaked: string;

  @Field()
  pendingFeesToStake: string;

  @Field()
  totalFBTStaked: string;

  @Field()
  totalYieldDistributed: string;

  @Field()
  operationalFunds: string;

  @Field()
  endowmentPrincipal: string;

  @Field()
  endowmentLifetimeYield: string;

  @Field()
  minStakeThreshold: string;

  @Field({ nullable: true })
  lastFeeStakedAt?: Date;

  @Field({ nullable: true })
  lastYieldHarvestedAt?: Date;

  @Field(() => Int)
  totalFBTStakers: number;

  @Field()
  yieldPerTokenStored: string;
}

/**
 * FBT stake information
 */
@ObjectType()
export class FBTStake {
  @Field()
  id: string;

  @Field()
  stakerAddress: string;

  @Field()
  amount: string;

  @Field()
  pendingYield: string;

  @Field()
  claimedYield: string;

  @Field()
  txHash: string;

  @Field()
  isActive: boolean;

  @Field()
  stakedAt: Date;

  @Field({ nullable: true })
  unstakedAt?: Date;

  @Field()
  shareOfTreasury: string;
}

/**
 * Platform fee record
 */
@ObjectType()
export class PlatformFee {
  @Field()
  id: string;

  @Field()
  sourceContract: string;

  @Field(() => FeeSourceType)
  sourceType: FeeSourceType;

  @Field()
  amount: string;

  @Field()
  txHash: string;

  @Field(() => Int, { nullable: true })
  blockNumber?: number;

  @Field()
  isStaked: boolean;

  @Field({ nullable: true })
  stakedAt?: Date;

  @Field({ nullable: true })
  stakedTxHash?: string;

  @Field()
  receivedAt: Date;
}

/**
 * Treasury endowment info
 */
@ObjectType()
export class TreasuryEndowmentInfo {
  @Field()
  principal: string;

  @Field()
  lifetimeYield: string;

  @Field()
  causeYieldPaid: string;

  @Field()
  pendingYield: string;
}

/**
 * FBT staker information
 */
@ObjectType()
export class FBTStaker {
  @Field()
  address: string;

  @Field()
  amount: string;

  @Field()
  pendingYield: string;

  @Field()
  shareOfTreasury: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}

/**
 * Treasury yield info for FBT stakers
 */
@ObjectType()
export class TreasuryYieldInfo {
  @Field()
  totalYieldGenerated: string;

  @Field()
  totalDistributed: string;

  @Field()
  pendingDistribution: string;

  @Field()
  yieldPerToken: string;
}

// ==================== Paginated Responses ====================

/**
 * Paginated platform fees response
 */
@ObjectType()
export class PaginatedPlatformFees {
  @Field(() => [PlatformFee])
  items: PlatformFee[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

/**
 * Paginated FBT stakers response
 */
@ObjectType()
export class PaginatedFBTStakers {
  @Field(() => [FBTStaker])
  items: FBTStaker[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

// ==================== Subscription Payloads ====================

/**
 * Payload for treasury stats update subscription
 */
@ObjectType()
export class TreasuryStatsUpdatedPayload {
  @Field(() => TreasuryStats)
  stats: TreasuryStats;
}

/**
 * Payload for FBT stake update subscription
 */
@ObjectType()
export class FBTStakeUpdatedPayload {
  @Field(() => FBTStake)
  stake: FBTStake;

  @Field()
  eventType: string; // 'STAKED' | 'UNSTAKED' | 'YIELD_CLAIMED'
}

/**
 * Payload for fee received subscription
 */
@ObjectType()
export class FeeReceivedPayload {
  @Field()
  sourceContract: string;

  @Field(() => FeeSourceType)
  sourceType: FeeSourceType;

  @Field()
  amount: string;

  @Field()
  txHash: string;

  @Field()
  timestamp: Date;
}
