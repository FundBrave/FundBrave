import {
  Field,
  ObjectType,
  InputType,
  Int,
  ID,
} from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEthereumAddress,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Output DTOs ====================

@ObjectType()
export class CampaignStakerInfo {
  @Field(() => ID, { nullable: true })
  @ApiProperty({ description: 'User ID' })
  id?: string;

  @Field()
  @ApiProperty({ description: 'Wallet address of the staker' })
  walletAddress: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Username' })
  username?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;
}

@ObjectType()
export class CampaignStake {
  @Field(() => ID)
  @ApiProperty({ description: 'Stake ID' })
  id: string;

  @Field()
  @ApiProperty({ description: 'Transaction hash' })
  txHash: string;

  @Field()
  @ApiProperty({ description: 'Staked amount in wei' })
  amount: string;

  @Field()
  @ApiProperty({ description: 'Share tokens received' })
  shares: string;

  @Field(() => CampaignStakerInfo)
  @ApiProperty({ description: 'Staker information' })
  staker: CampaignStakerInfo;

  @Field()
  @ApiProperty({ description: 'Whether stake is active' })
  isActive: boolean;

  @Field()
  @ApiProperty({ description: 'When the stake was made' })
  stakedAt: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'When the stake was unstaked' })
  unstakedAt?: Date;
}

@ObjectType()
export class PaginatedCampaignStakes {
  @Field(() => [CampaignStake])
  @ApiProperty({ type: [CampaignStake], description: 'List of stakes' })
  items: CampaignStake[];

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of stakes' })
  total: number;

  @Field()
  @ApiProperty({ description: 'Whether there are more items' })
  hasMore: boolean;
}

@ObjectType()
export class CampaignStakingInfo {
  @Field(() => ID)
  @ApiProperty({ description: 'Fundraiser ID' })
  fundraiserId: string;

  @Field()
  @ApiProperty({ description: 'Fundraiser name' })
  fundraiserName: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Staking pool address' })
  stakingPoolAddr?: string;

  @Field()
  @ApiProperty({ description: 'Total staked amount in wei' })
  totalStaked: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of active stakers' })
  stakersCount: number;

  @Field()
  @ApiProperty({ description: 'Estimated APY' })
  estimatedApy: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Total yield generated in wei' })
  totalYieldGenerated?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'User\'s staked amount (if authenticated)' })
  userStakedAmount?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'User\'s pending yield (if authenticated)' })
  userPendingYield?: string;

  @Field()
  @ApiProperty({ description: 'Whether staking is active for this campaign' })
  isStakingActive: boolean;
}

@ObjectType()
export class UserCampaignStake {
  @Field(() => ID)
  @ApiProperty({ description: 'Stake ID' })
  stakeId: string;

  @Field(() => ID)
  @ApiProperty({ description: 'Fundraiser ID' })
  fundraiserId: string;

  @Field()
  @ApiProperty({ description: 'Fundraiser name' })
  fundraiserName: string;

  @Field()
  @ApiProperty({ description: 'Staked amount in wei' })
  amount: string;

  @Field()
  @ApiProperty({ description: 'Share tokens' })
  shares: string;

  @Field()
  @ApiProperty({ description: 'Pending yield in wei' })
  pendingYield: string;

  @Field()
  @ApiProperty({ description: 'Total yield earned in wei' })
  totalYieldEarned: string;

  @Field()
  @ApiProperty({ description: 'When the stake was made' })
  stakedAt: Date;
}

@ObjectType()
export class CampaignStakeResult {
  @Field()
  @ApiProperty({ description: 'Whether operation was successful' })
  success: boolean;

  @Field(() => CampaignStake, { nullable: true })
  @ApiPropertyOptional({ description: 'The stake object if successful' })
  stake?: CampaignStake;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Error message if failed' })
  message?: string;
}

@ObjectType()
export class CampaignUnstakeResult {
  @Field()
  @ApiProperty({ description: 'Whether unstake was successful' })
  success: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Amount unstaked in wei' })
  amountUnstaked?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Yield claimed in wei' })
  yieldClaimed?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Error message if failed' })
  message?: string;
}

// ==================== Input DTOs ====================

@InputType()
export class StakeToCampaignInput {
  @Field()
  @IsString()
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  txHash: string;

  @Field()
  @IsString()
  @ApiProperty({ description: 'Amount staked in wei' })
  amount: string;

  @Field()
  @IsString()
  @ApiProperty({ description: 'Share tokens received' })
  shares: string;

  @Field(() => Int)
  @IsNumber()
  @ApiProperty({ description: 'Chain ID' })
  chainId: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  @ApiPropertyOptional({ description: 'Cause share in basis points (0-10000)' })
  causeShare?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  @ApiPropertyOptional({ description: 'Staker share in basis points (0-10000)' })
  stakerShare?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(200)
  @Max(10000)
  @ApiPropertyOptional({ description: 'Platform share in basis points (min 200)' })
  platformShare?: number;
}

@InputType()
export class UnstakeFromCampaignInput {
  @Field()
  @IsString()
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  txHash: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Amount to unstake in wei (optional for partial unstake)' })
  amount?: string;
}

@InputType()
export class ClaimCampaignYieldInput {
  @Field()
  @IsString()
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  txHash: string;

  @Field()
  @IsString()
  @ApiProperty({ description: 'Amount of yield claimed in wei' })
  yieldAmount: string;
}
