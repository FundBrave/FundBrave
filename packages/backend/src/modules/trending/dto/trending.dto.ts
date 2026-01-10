import {
  Field,
  ObjectType,
  InputType,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum } from 'class-validator';

// ==================== Enums ====================

export enum TrendingType {
  HASHTAG = 'hashtag',
  FUNDRAISER = 'fundraiser',
  USER = 'user',
}

export enum TrendingPeriod {
  ONE_HOUR = '1h',
  TWENTY_FOUR_HOURS = '24h',
  SEVEN_DAYS = '7d',
}

registerEnumType(TrendingType, { name: 'TrendingType' });
registerEnumType(TrendingPeriod, { name: 'TrendingPeriod' });

// ==================== Output DTOs ====================

@ObjectType()
export class TrendingHashtag {
  @Field()
  id: string;

  @Field()
  tag: string;

  @Field(() => Float)
  score: number;

  @Field(() => Int)
  postsCount: number;

  @Field(() => TrendingPeriod)
  period: TrendingPeriod;

  @Field()
  calculatedAt: Date;
}

@ObjectType()
export class TrendingFundraiser {
  @Field()
  id: string;

  @Field()
  fundraiserId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  images: string[];

  @Field()
  goalAmount: string;

  @Field()
  raisedAmount: string;

  @Field(() => Int)
  donorsCount: number;

  @Field(() => Float)
  score: number;

  @Field(() => TrendingPeriod)
  period: TrendingPeriod;

  @Field()
  calculatedAt: Date;
}

@ObjectType()
export class TrendingUser {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => Int)
  followersCount: number;

  @Field(() => Float)
  score: number;

  @Field(() => TrendingPeriod)
  period: TrendingPeriod;

  @Field()
  calculatedAt: Date;
}

@ObjectType()
export class TrendingResult {
  @Field(() => [TrendingHashtag])
  hashtags: TrendingHashtag[];

  @Field(() => [TrendingFundraiser])
  fundraisers: TrendingFundraiser[];

  @Field(() => [TrendingUser])
  users: TrendingUser[];
}

// ==================== Input DTOs ====================

@InputType()
export class GetTrendingInput {
  @Field(() => TrendingType)
  @IsEnum(TrendingType)
  type: TrendingType;

  @Field(() => TrendingPeriod, { defaultValue: TrendingPeriod.TWENTY_FOUR_HOURS })
  @IsOptional()
  @IsEnum(TrendingPeriod)
  period?: TrendingPeriod;

  @Field(() => Int, { defaultValue: 10 })
  limit?: number;
}
