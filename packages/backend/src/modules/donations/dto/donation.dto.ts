import {
  Field,
  ObjectType,
  InputType,
  Int,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEthereumAddress,
  Min,
  MaxLength,
} from 'class-validator';

// ==================== Enums ====================

export enum DonationType {
  DIRECT = 'DIRECT',
  WEALTH_BUILDING = 'WEALTH_BUILDING',
  CROSS_CHAIN = 'CROSS_CHAIN',
}

export enum DonationSortBy {
  CREATED_AT = 'createdAt',
  AMOUNT = 'amountUSD',
}

registerEnumType(DonationType, { name: 'DonationType' });
registerEnumType(DonationSortBy, { name: 'DonationSortBy' });

// ==================== Output DTOs ====================

@ObjectType()
export class DonorInfo {
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

  @Field()
  isAnonymous: boolean;
}

@ObjectType()
export class FundraiserBasicInfo {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  onChainId: number;

  @Field()
  name: string;

  @Field(() => [String])
  images: string[];
}

@ObjectType()
export class Donation {
  @Field(() => ID)
  id: string;

  @Field()
  txHash: string;

  @Field()
  amount: string;

  @Field()
  amountUSD: string;

  @Field()
  token: string;

  @Field(() => Int)
  chainId: number;

  @Field()
  sourceChain: string;

  @Field({ nullable: true })
  blockNumber?: number;

  @Field(() => DonorInfo)
  donor: DonorInfo;

  @Field(() => FundraiserBasicInfo)
  fundraiser: FundraiserBasicInfo;

  @Field()
  isAnonymous: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field()
  createdAt: Date;

  @Field()
  indexedAt: Date;
}

@ObjectType()
export class PaginatedDonations {
  @Field(() => [Donation])
  items: Donation[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class DonationStats {
  @Field()
  totalDonated: string;

  @Field(() => Int)
  donationsCount: number;

  @Field(() => Int)
  uniqueDonorsCount: number;

  @Field()
  averageDonation: string;

  @Field()
  largestDonation: string;

  @Field({ nullable: true })
  lastDonationAt?: Date;
}

@ObjectType()
export class UserDonationStats {
  @Field()
  totalDonated: string;

  @Field(() => Int)
  donationsCount: number;

  @Field(() => Int)
  fundraisersDonatedTo: number;

  @Field()
  averageDonation: string;

  @Field({ nullable: true })
  firstDonationAt?: Date;

  @Field({ nullable: true })
  lastDonationAt?: Date;
}

@ObjectType()
export class DonationLeaderboardEntry {
  @Field(() => Int)
  rank: number;

  @Field(() => DonorInfo)
  donor: DonorInfo;

  @Field()
  totalDonated: string;

  @Field(() => Int)
  donationsCount: number;
}

@ObjectType()
export class DonationLeaderboard {
  @Field(() => [DonationLeaderboardEntry])
  entries: DonationLeaderboardEntry[];

  @Field(() => Int)
  total: number;

  @Field()
  period: string;
}

@ObjectType()
export class RecentDonationActivity {
  @Field(() => ID)
  id: string;

  @Field()
  donorAddress: string;

  @Field({ nullable: true })
  donorUsername?: string;

  @Field()
  amountUSD: string;

  @Field()
  fundraiserName: string;

  @Field()
  fundraiserId: string;

  @Field()
  createdAt: Date;
}

// ==================== Input DTOs ====================

@InputType()
export class RecordDonationInput {
  @Field()
  @IsString()
  txHash: string;

  @Field()
  @IsString()
  amount: string;

  @Field()
  @IsString()
  token: string;

  @Field(() => Int)
  @IsNumber()
  chainId: number;

  @Field()
  @IsString()
  fundraiserId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

@InputType()
export class DonationFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fundraiserId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  donorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEthereumAddress()
  donorAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  token?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  chainId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  minAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  maxAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  endDate?: Date;
}

// ==================== Blockchain Event Types ====================

export interface DonationReceivedEventArgs {
  fundraiserId: bigint;
  donor: string;
  amount: bigint;
  token: string;
  message?: string;
}

export interface CrossChainDonationEventArgs {
  fundraiserId: bigint;
  donor: string;
  amount: bigint;
  sourceChainId: number;
  destChainId: number;
}
