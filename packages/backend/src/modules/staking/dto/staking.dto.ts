import { Field, ObjectType, InputType, Int, ID, registerEnumType } from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEthereumAddress,
  Min,
  Max,
} from 'class-validator';

// ==================== Enums ====================

export enum StakeType {
  FUNDRAISER = 'FUNDRAISER',
  GLOBAL = 'GLOBAL',
}

export enum StakeSortBy {
  STAKED_AT = 'stakedAt',
  AMOUNT = 'amount',
}

registerEnumType(StakeType, { name: 'StakeType' });
registerEnumType(StakeSortBy, { name: 'StakeSortBy' });

// ==================== Output DTOs ====================

@ObjectType()
export class StakerInfo {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}

@ObjectType()
export class FundraiserStakingInfo {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  onChainId: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  stakingPoolAddr?: string;
}

@ObjectType()
export class YieldSplitConfig {
  @Field(() => Int)
  causeShare: number;

  @Field(() => Int)
  stakerShare: number;

  @Field(() => Int)
  platformShare: number;
}

@ObjectType()
export class Stake {
  @Field(() => ID)
  id: string;

  @Field()
  txHash: string;

  @Field()
  poolAddress: string;

  @Field()
  amount: string;

  @Field()
  shares: string;

  @Field(() => FundraiserStakingInfo, { nullable: true })
  fundraiser?: FundraiserStakingInfo;

  @Field(() => StakerInfo)
  staker: StakerInfo;

  @Field(() => YieldSplitConfig, { nullable: true })
  yieldSplit?: YieldSplitConfig;

  @Field(() => Int)
  chainId: number;

  @Field({ nullable: true })
  blockNumber?: number;

  @Field()
  isActive: boolean;

  @Field()
  isGlobal: boolean;

  @Field()
  stakedAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  unstakedAt?: Date;
}

@ObjectType()
export class PaginatedStakes {
  @Field(() => [Stake])
  items: Stake[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class StakingPoolStats {
  @Field()
  poolAddress: string;

  @Field()
  totalStaked: string;

  @Field(() => Int)
  stakersCount: number;

  @Field()
  totalYieldGenerated: string;

  @Field()
  apy: string;

  @Field({ nullable: true })
  fundraiserName?: string;
}

@ObjectType()
export class UserStakingStats {
  @Field()
  totalStaked: string;

  @Field(() => Int)
  activeStakesCount: number;

  @Field()
  totalYieldEarned: string;

  @Field()
  pendingYield: string;

  @Field(() => Int)
  fundraisersStakedIn: number;

  @Field({ nullable: true })
  globalPoolStake?: string;
}

@ObjectType()
export class GlobalPoolStats {
  @Field()
  totalStaked: string;

  @Field(() => Int)
  stakersCount: number;

  @Field()
  totalYieldDistributed: string;

  @Field()
  pendingYield: string;

  @Field()
  currentEpoch: number;

  @Field({ nullable: true })
  nextEpochStartDate?: Date;

  @Field()
  apy: string;
}

@ObjectType()
export class StakingLeaderboardEntry {
  @Field(() => Int)
  rank: number;

  @Field(() => StakerInfo)
  staker: StakerInfo;

  @Field()
  totalStaked: string;

  @Field(() => Int)
  stakesCount: number;
}

@ObjectType()
export class PendingStakingRewards {
  @Field()
  usdcYield: string;

  @Field()
  fbtRewards: string;

  @Field()
  totalValueUSD: string;
}

// ==================== Input DTOs ====================

@InputType()
export class YieldSplitInput {
  @Field(() => Int)
  @IsNumber()
  @Min(0)
  @Max(10000)
  causeShare: number;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  @Max(10000)
  stakerShare: number;

  @Field(() => Int)
  @IsNumber()
  @Min(200) // Minimum 2% platform fee
  @Max(10000)
  platformShare: number;
}

@InputType()
export class RecordStakeInput {
  @Field()
  @IsString()
  txHash: string;

  @Field()
  @IsEthereumAddress()
  poolAddress: string;

  @Field()
  @IsString()
  amount: string;

  @Field()
  @IsString()
  shares: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fundraiserId?: string;

  @Field(() => Int)
  @IsNumber()
  chainId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @Field(() => YieldSplitInput, { nullable: true })
  @IsOptional()
  yieldSplit?: YieldSplitInput;
}

@InputType()
export class UnstakeInput {
  @Field()
  @IsString()
  stakeId: string;

  @Field()
  @IsString()
  txHash: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  amount?: string; // For partial unstake
}

@InputType()
export class StakeFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stakerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEthereumAddress()
  stakerAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fundraiserId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEthereumAddress()
  poolAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  chainId?: number;
}

// ==================== Global Pool Specific DTOs ====================

@ObjectType()
export class GlobalPoolEpoch {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  epochNumber: number;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field()
  totalYield: string;

  @Field()
  isCalculated: boolean;

  @Field()
  isDistributed: boolean;

  @Field({ nullable: true })
  distributionTx?: string;
}

@ObjectType()
export class GlobalPoolVoteAllocation {
  @Field(() => ID)
  fundraiserId: string;

  @Field()
  fundraiserName: string;

  @Field()
  weight: string;

  @Field()
  percentage: number;
}

@ObjectType()
export class UserGlobalPoolVotes {
  @Field(() => Int)
  epochNumber: number;

  @Field(() => [GlobalPoolVoteAllocation])
  allocations: GlobalPoolVoteAllocation[];

  @Field()
  totalWeight: string;
}

@InputType()
export class GlobalPoolVoteInput {
  @Field(() => Int)
  @IsNumber()
  epochNumber: number;

  @Field(() => [VoteAllocationInput])
  allocations: VoteAllocationInput[];
}

@InputType()
export class VoteAllocationInput {
  @Field()
  @IsString()
  fundraiserId: string;

  @Field()
  @IsString()
  weight: string;
}

// ==================== Blockchain Event Types ====================

export interface StakedEventArgs {
  staker: string;
  amount: bigint;
  shares: bigint;
  poolAddress: string;
}

export interface UnstakedEventArgs {
  staker: string;
  amount: bigint;
  shares: bigint;
  poolAddress: string;
}

export interface YieldClaimedEventArgs {
  staker: string;
  amount: bigint;
  poolAddress: string;
}

export interface GlobalPoolStakedEventArgs {
  staker: string;
  amount: bigint;
  lockDuration: number;
  multiplier: number;
}
