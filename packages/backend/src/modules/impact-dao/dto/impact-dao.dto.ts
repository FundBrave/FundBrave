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
  Max,
  IsEthereumAddress,
} from 'class-validator';

// ==================== Input Types ====================

/**
 * Input for setting custom yield split
 */
@InputType()
export class SetYieldSplitInput {
  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(10000)
  daoShare: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(10000)
  stakerShare: number;

  @Field(() => Int)
  @IsInt()
  @Min(200) // Minimum 2% platform share
  @Max(10000)
  platformShare: number;
}

/**
 * Input for recording an Impact DAO stake event (simpler version for tx hash tracking)
 * For full stake recording, use RecordStakeInput from staking module
 */
@InputType()
export class ImpactDAORecordStakeInput {
  @Field()
  @IsString()
  txHash: string;
}

// ==================== Object Types ====================

/**
 * Yield split configuration
 */
@ObjectType()
export class YieldSplit {
  @Field(() => Int)
  daoShare: number;

  @Field(() => Int)
  stakerShare: number;

  @Field(() => Int)
  platformShare: number;
}

/**
 * Impact DAO stake information
 */
@ObjectType()
export class ImpactDAOStake {
  @Field()
  id: string;

  @Field()
  stakerAddress: string;

  @Field()
  principal: string;

  @Field(() => YieldSplit)
  yieldSplit: YieldSplit;

  @Field()
  pendingUSDCYield: string;

  @Field()
  pendingFBTReward: string;

  @Field()
  claimedUSDCYield: string;

  @Field()
  claimedFBTReward: string;

  @Field()
  isActive: boolean;

  @Field()
  stakedAt: Date;

  @Field({ nullable: true })
  unstakedAt?: Date;
}

/**
 * Impact DAO staker with user info
 */
@ObjectType()
export class ImpactDAOStaker {
  @Field()
  address: string;

  @Field()
  principal: string;

  @Field(() => YieldSplit)
  yieldSplit: YieldSplit;

  @Field()
  pendingYield: string;

  @Field()
  pendingFBTReward: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}

/**
 * Impact DAO pool statistics
 */
@ObjectType()
export class ImpactDAOStats {
  @Field()
  totalStakedPrincipal: string;

  @Field()
  totalYieldHarvested: string;

  @Field()
  totalFBTDistributed: string;

  @Field(() => Int)
  stakersCount: number;

  @Field()
  pendingYield: string;

  @Field()
  rewardRate: string;

  @Field({ nullable: true })
  periodFinish?: Date;

  @Field(() => Int)
  rewardsDuration: number;

  @Field({ nullable: true })
  lastHarvestAt?: Date;

  @Field(() => YieldSplit)
  defaultYieldSplit: YieldSplit;
}

/**
 * Pending yield breakdown
 */
@ObjectType()
export class PendingYield {
  @Field()
  totalYield: string;

  @Field()
  daoShare: string;

  @Field()
  stakerShare: string;

  @Field()
  platformShare: string;
}

/**
 * Yield harvest event
 */
@ObjectType()
export class ImpactDAOYieldHarvest {
  @Field()
  id: string;

  @Field()
  stakeId: string;

  @Field()
  totalYield: string;

  @Field()
  daoAmount: string;

  @Field()
  stakerAmount: string;

  @Field()
  platformAmount: string;

  @Field()
  txHash: string;

  @Field(() => Int, { nullable: true })
  blockNumber?: number;

  @Field()
  harvestedAt: Date;
}

/**
 * FBT reward claim event
 */
@ObjectType()
export class FBTRewardClaim {
  @Field()
  stakerAddress: string;

  @Field()
  amount: string;

  @Field()
  txHash: string;

  @Field()
  claimedAt: Date;
}

// ==================== Paginated Responses ====================

/**
 * Paginated stakers response
 */
@ObjectType()
export class PaginatedImpactDAOStakers {
  @Field(() => [ImpactDAOStaker])
  items: ImpactDAOStaker[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

/**
 * Paginated yield harvests response
 */
@ObjectType()
export class PaginatedYieldHarvests {
  @Field(() => [ImpactDAOYieldHarvest])
  items: ImpactDAOYieldHarvest[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

// ==================== Subscription Payloads ====================

/**
 * Payload for stake update subscription
 */
@ObjectType()
export class ImpactDAOStakeUpdatedPayload {
  @Field(() => ImpactDAOStake)
  stake: ImpactDAOStake;

  @Field()
  eventType: string; // 'STAKED' | 'UNSTAKED' | 'YIELD_CLAIMED'
}

/**
 * Payload for yield harvested subscription
 */
@ObjectType()
export class ImpactDAOYieldHarvestedPayload {
  @Field()
  totalYield: string;

  @Field()
  daoAmount: string;

  @Field()
  stakerAmount: string;

  @Field()
  platformAmount: string;

  @Field()
  txHash: string;

  @Field()
  timestamp: Date;
}
