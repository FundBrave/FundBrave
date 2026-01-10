import { Field, InputType, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

// ==================== Enums ====================

export enum VestingType {
  DONATION_REWARD = 'DONATION_REWARD',
  ENGAGEMENT_REWARD = 'ENGAGEMENT_REWARD',
  TEAM_ALLOCATION = 'TEAM_ALLOCATION',
  INVESTOR = 'INVESTOR',
  ECOSYSTEM = 'ECOSYSTEM',
}

registerEnumType(VestingType, {
  name: 'VestingType',
  description: 'Type of vesting schedule',
});

// ==================== Object Types ====================

/**
 * FBT vesting schedule information
 */
@ObjectType()
export class VestingSchedule {
  @Field()
  id: string;

  @Field()
  recipientAddress: string;

  @Field()
  totalAmount: string;

  @Field()
  releasedAmount: string;

  @Field()
  claimableAmount: string;

  @Field()
  startTime: Date;

  @Field(() => Int)
  duration: number;

  @Field(() => VestingType)
  vestingType: VestingType;

  @Field()
  isFullyVested: boolean;

  @Field()
  isFullyClaimed: boolean;

  @Field({ nullable: true })
  txHash?: string;

  @Field()
  createdAt: Date;

  @Field()
  progressPercent: string;
}

/**
 * Vesting claim event
 */
@ObjectType()
export class VestingClaimEvent {
  @Field()
  scheduleId: string;

  @Field()
  amount: string;

  @Field()
  txHash: string;

  @Field()
  claimedAt: Date;
}

/**
 * FBT burn event
 */
@ObjectType()
export class FBTBurnEvent {
  @Field()
  id: string;

  @Field()
  burnerAddress: string;

  @Field()
  amount: string;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  txHash: string;

  @Field()
  burnedAt: Date;
}

/**
 * Vesting summary for a user
 */
@ObjectType()
export class VestingSummary {
  @Field()
  totalVested: string;

  @Field()
  totalReleased: string;

  @Field()
  totalClaimable: string;

  @Field()
  totalPending: string;

  @Field(() => Int)
  scheduleCount: number;

  @Field(() => Int)
  activeScheduleCount: number;

  @Field(() => Int)
  completedScheduleCount: number;
}

/**
 * Vesting breakdown by type
 */
@ObjectType()
export class VestingBreakdown {
  @Field()
  donationRewards: string;

  @Field()
  engagementRewards: string;

  @Field()
  teamAllocation: string;

  @Field()
  investor: string;

  @Field()
  ecosystem: string;
}

/**
 * Platform-wide vesting statistics
 */
@ObjectType()
export class VestingStats {
  @Field()
  totalVestedAmount: string;

  @Field()
  totalClaimedAmount: string;

  @Field()
  totalPendingAmount: string;

  @Field()
  totalBurnedAmount: string;

  @Field(() => Int)
  totalSchedules: number;

  @Field(() => Int)
  activeSchedules: number;

  @Field(() => Int)
  uniqueRecipients: number;

  @Field(() => VestingBreakdown)
  byType: VestingBreakdown;
}

// ==================== Paginated Responses ====================

/**
 * Paginated vesting schedules response
 */
@ObjectType()
export class PaginatedVestingSchedules {
  @Field(() => [VestingSchedule])
  items: VestingSchedule[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

/**
 * Paginated vesting claims response
 */
@ObjectType()
export class PaginatedVestingClaims {
  @Field(() => [VestingClaimEvent])
  items: VestingClaimEvent[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

/**
 * Paginated FBT burns response
 */
@ObjectType()
export class PaginatedFBTBurns {
  @Field(() => [FBTBurnEvent])
  items: FBTBurnEvent[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

// ==================== Subscription Payloads ====================

/**
 * Payload for vesting schedule created subscription
 */
@ObjectType()
export class VestingScheduleCreatedPayload {
  @Field(() => VestingSchedule)
  schedule: VestingSchedule;
}

/**
 * Payload for vested tokens claimed subscription
 */
@ObjectType()
export class VestedTokensClaimedPayload {
  @Field()
  recipientAddress: string;

  @Field()
  scheduleId: string;

  @Field()
  amount: string;

  @Field()
  txHash: string;

  @Field()
  timestamp: Date;
}

/**
 * Payload for FBT burned subscription
 */
@ObjectType()
export class FBTBurnedPayload {
  @Field()
  burnerAddress: string;

  @Field()
  amount: string;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  txHash: string;

  @Field()
  timestamp: Date;
}
