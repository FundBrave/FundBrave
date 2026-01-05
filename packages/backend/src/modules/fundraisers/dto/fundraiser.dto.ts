import { Field, ObjectType, InputType, Int, ID, registerEnumType } from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  IsDateString,
  IsEthereumAddress,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Enums ====================

export enum FundraiserStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum FundraiserSortBy {
  CREATED_AT = 'createdAt',
  RAISED_AMOUNT = 'raisedAmount',
  DONORS_COUNT = 'donorsCount',
  DEADLINE = 'deadline',
  GOAL_AMOUNT = 'goalAmount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

registerEnumType(FundraiserStatus, { name: 'FundraiserStatus' });
registerEnumType(FundraiserSortBy, { name: 'FundraiserSortBy' });
registerEnumType(SortOrder, { name: 'SortOrder' });

// ==================== Output DTOs ====================

@ObjectType()
export class FundraiserCreator {
  @Field(() => ID)
  id: string;

  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  isVerifiedCreator: boolean;
}

@ObjectType()
export class FundraiserMilestone {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  targetAmount: string;

  @Field()
  isReached: boolean;

  @Field({ nullable: true })
  reachedAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class FundraiserUpdate {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => [String])
  mediaUrls: string[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class FundraiserStats {
  @Field()
  totalDonations: string;

  @Field(() => Int)
  donorsCount: number;

  @Field(() => Int)
  stakersCount: number;

  @Field()
  totalStaked: string;

  @Field(() => Int)
  updatesCount: number;

  @Field()
  percentageRaised: number;

  @Field(() => Int)
  daysLeft: number;

  @Field()
  avgDonation: string;

  @Field({ nullable: true })
  endowmentPrincipal?: string;

  @Field({ nullable: true })
  endowmentYield?: string;
}

@ObjectType()
export class Fundraiser {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  onChainId: number;

  @Field()
  txHash: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => [String])
  images: string[];

  @Field(() => [String])
  categories: string[];

  @Field({ nullable: true })
  region?: string;

  @Field()
  goalAmount: string;

  @Field()
  raisedAmount: string;

  @Field()
  currency: string;

  @Field()
  beneficiary: string;

  @Field({ nullable: true })
  stakingPoolAddr?: string;

  @Field(() => FundraiserCreator)
  creator: FundraiserCreator;

  @Field()
  deadline: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  isActive: boolean;

  @Field()
  isFeatured: boolean;

  @Field()
  goalReached: boolean;

  @Field()
  endowmentEnabled: boolean;

  @Field(() => FundraiserStats)
  stats: FundraiserStats;

  @Field(() => [FundraiserMilestone], { nullable: true })
  milestones?: FundraiserMilestone[];

  @Field(() => [FundraiserUpdate], { nullable: true })
  updates?: FundraiserUpdate[];
}

@ObjectType()
export class PaginatedFundraisers {
  @Field(() => [Fundraiser])
  items: Fundraiser[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class FundraiserMinimal {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  onChainId: number;

  @Field()
  name: string;

  @Field(() => [String])
  images: string[];

  @Field()
  goalAmount: string;

  @Field()
  raisedAmount: string;

  @Field()
  deadline: Date;

  @Field()
  isActive: boolean;

  @Field(() => Int)
  donorsCount: number;
}

// ==================== Input DTOs ====================

@InputType()
export class CreateFundraiserInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @Field()
  @IsString()
  @MinLength(50)
  @MaxLength(10000)
  description: string;

  @Field(() => [String])
  @IsArray()
  @IsUrl({}, { each: true })
  images: string[];

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  region?: string;

  @Field()
  @IsString()
  goalAmount: string;

  @Field({ defaultValue: 'USDC' })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field()
  @IsEthereumAddress()
  beneficiary: string;

  @Field()
  @IsDateString()
  deadline: string;

  @Field(() => [CreateMilestoneInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @Type(() => CreateMilestoneInput)
  milestones?: CreateMilestoneInput[];
}

@InputType()
export class CreateMilestoneInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field()
  @IsString()
  targetAmount: string;
}

@InputType()
export class UpdateFundraiserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(50)
  @MaxLength(10000)
  description?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  region?: string;
}

@InputType()
export class CreateFundraiserUpdateInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];
}

@InputType()
export class FundraiserFilterInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  goalReached?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  endowmentEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  minGoalAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  maxGoalAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  searchQuery?: string;
}

@InputType()
export class FundraiserSortInput {
  @Field(() => FundraiserSortBy, { defaultValue: FundraiserSortBy.CREATED_AT })
  @IsOptional()
  sortBy?: FundraiserSortBy;

  @Field(() => SortOrder, { defaultValue: SortOrder.DESC })
  @IsOptional()
  order?: SortOrder;
}

// ==================== Blockchain Event Types ====================

export interface FundraiserCreatedEventArgs {
  fundraiserAddress: string;
  owner: string;
  fundraiserId: bigint;
  name: string;
  beneficiary: string;
  goalAmount: bigint;
  deadline: bigint;
}

export interface GoalReachedEventArgs {
  fundraiserId: bigint;
  totalRaised: bigint;
}

export interface FundraiserCancelledEventArgs {
  fundraiserId: bigint;
}
