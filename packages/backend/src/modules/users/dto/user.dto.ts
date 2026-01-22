import {
  Field,
  ObjectType,
  InputType,
  Int,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUrl,
  IsEthereumAddress,
  IsDateString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

// ==================== Enums ====================

export enum VerificationBadge {
  NONE = 'NONE',
  VERIFIED_CREATOR = 'VERIFIED_CREATOR',
  OFFICIAL = 'OFFICIAL',
  GOLD = 'GOLD',
}

registerEnumType(VerificationBadge, { name: 'VerificationBadge' });

// ==================== Output DTOs ====================

@ObjectType()
export class UserStats {
  @Field(() => Int)
  followersCount: number;

  @Field(() => Int)
  followingCount: number;

  @Field(() => Int)
  postsCount: number;

  @Field(() => Int)
  fundraisersCount: number;

  @Field()
  totalDonated: string;

  @Field()
  totalStaked: string;

  @Field()
  fbtBalance: string;

  @Field()
  fbtStakedBalance: string;

  @Field()
  fbtVestedTotal: string;

  @Field()
  fbtVestedClaimed: string;

  @Field(() => Int)
  reputationScore: number;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  emailVerified: boolean;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  bannerUrl?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  website?: string;

  @Field()
  isVerifiedCreator: boolean;

  @Field(() => VerificationBadge, { nullable: true })
  verificationBadge?: VerificationBadge;

  @Field(() => UserStats)
  stats: UserStats;

  @Field()
  isPrivate: boolean;

  @Field()
  isActive: boolean;

  // Onboarding fields
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'User birthdate' })
  birthdate?: Date;

  @Field(() => [String])
  @ApiProperty({ description: 'User goals', isArray: true })
  goals: string[];

  @Field(() => [String])
  @ApiProperty({ description: 'User interests', isArray: true })
  interests: string[];

  @Field()
  @ApiProperty({ description: 'Whether onboarding is completed' })
  onboardingCompleted: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  lastSeenAt?: Date;

  // Contextual fields (set based on viewer)
  @Field({ nullable: true })
  isFollowing?: boolean;

  @Field({ nullable: true })
  isFollowedBy?: boolean;

  @Field({ nullable: true })
  isBlocked?: boolean;
}

@ObjectType()
export class UserMinimal {
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

  @Field(() => VerificationBadge, { nullable: true })
  verificationBadge?: VerificationBadge;
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  items: User[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class FollowRelation {
  @Field(() => ID)
  id: string;

  @Field(() => UserMinimal)
  user: UserMinimal;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaginatedFollows {
  @Field(() => [FollowRelation])
  items: FollowRelation[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class UserActivitySummary {
  @Field(() => Int)
  donationsLast30Days: number;

  @Field()
  donatedAmountLast30Days: string;

  @Field(() => Int)
  stakesLast30Days: number;

  @Field(() => Int)
  postsLast30Days: number;

  @Field(() => Int)
  commentsLast30Days: number;

  @Field()
  earnedFBTLast30Days: string;
}

@ObjectType()
export class UserSearchResult {
  @Field(() => [UserMinimal])
  users: UserMinimal[];

  @Field(() => Int)
  total: number;
}

/**
 * Dashboard stats for the current user
 * Used by GET /users/me/stats endpoint
 */
@ObjectType()
export class UserDashboardStats {
  @Field(() => Int)
  @ApiProperty({ description: 'Number of campaigns created by user' })
  campaignsCreated: number;

  @Field()
  @ApiProperty({ description: 'Total amount raised across all campaigns (in USD)' })
  totalRaised: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of donations made by user' })
  donationsMade: number;

  @Field()
  @ApiProperty({ description: 'Total amount donated by user (in USD)' })
  totalDonated: string;

  @Field()
  @ApiProperty({ description: 'Total amount currently staked by user' })
  stakingAmount: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of active stakes' })
  activeStakes: number;

  @Field()
  @ApiProperty({ description: 'FBT token balance' })
  fbtBalance: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of followers' })
  followersCount: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of users following' })
  followingCount: number;
}

// ==================== Input DTOs ====================

@InputType()
export class CreateUserInput {
  @Field()
  @IsEthereumAddress()
  walletAddress: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'User birthdate in ISO 8601 format',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Birthdate must be a valid ISO 8601 date string' },
  )
  birthdate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

@InputType()
export class UpdateNotificationSettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnLike?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnComment?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnFollow?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnMention?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnDonation?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnStake?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnYieldHarvest?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnStockPurchase?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnFBTVesting?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifyOnDAOProposal?: boolean;
}

@ObjectType()
export class NotificationSettings {
  @Field()
  emailEnabled: boolean;

  @Field()
  pushEnabled: boolean;

  @Field()
  notifyOnLike: boolean;

  @Field()
  notifyOnComment: boolean;

  @Field()
  notifyOnFollow: boolean;

  @Field()
  notifyOnMention: boolean;

  @Field()
  notifyOnDonation: boolean;

  @Field()
  notifyOnStake: boolean;

  @Field()
  notifyOnYieldHarvest: boolean;

  @Field()
  notifyOnStockPurchase: boolean;

  @Field()
  notifyOnFBTVesting: boolean;

  @Field()
  notifyOnDAOProposal: boolean;
}

@InputType()
export class UserFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isVerifiedCreator?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  searchQuery?: string;
}
