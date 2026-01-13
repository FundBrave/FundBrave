import {
  Field,
  InputType,
  ObjectType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Enums ====================

export enum ProposalCategory {
  YIELD_DISTRIBUTION = 'YIELD_DISTRIBUTION',
  PARAMETER_CHANGE = 'PARAMETER_CHANGE',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

registerEnumType(ProposalCategory, {
  name: 'ProposalCategory',
  description: 'Category of DAO proposal',
});

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PASSED = 'PASSED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(ProposalStatus, {
  name: 'ProposalStatus',
  description: 'Status of DAO proposal',
});

export enum VoteChoice {
  FOR = 'FOR',
  AGAINST = 'AGAINST',
  ABSTAIN = 'ABSTAIN',
}

registerEnumType(VoteChoice, {
  name: 'VoteChoice',
  description: 'Vote choice on a proposal',
});

// ==================== Input Types ====================

/**
 * Input for creating a DAO proposal
 */
@InputType()
export class CreateDAOProposalInput {
  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title: string;

  @Field()
  @IsString()
  @MinLength(50)
  @MaxLength(10000)
  description: string;

  @Field(() => ProposalCategory)
  @IsEnum(ProposalCategory)
  category: ProposalCategory;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  votingDurationHours: number;

  @Field()
  @IsString()
  quorumRequired: string;

  @Field(() => [FundraiserAllocationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FundraiserAllocationInput)
  targetFundraisers?: FundraiserAllocationInput[];
}

/**
 * Input for fundraiser allocation in yield distribution proposals
 */
@InputType()
export class FundraiserAllocationInput {
  @Field(() => Int)
  @IsInt()
  fundraiserId: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(10000)
  allocationBps: number;
}

/**
 * Input for voting on a proposal
 */
@InputType()
export class VoteOnProposalInput {
  @Field()
  @IsString()
  proposalId: string;

  @Field(() => VoteChoice)
  @IsEnum(VoteChoice)
  vote: VoteChoice;

  @Field()
  @IsString()
  votingPower: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  signature?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  message?: string;
}

// ==================== Object Types ====================

/**
 * DAO proposal information
 */
@ObjectType()
export class DAOProposal {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => ProposalCategory)
  category: ProposalCategory;

  @Field()
  proposerAddress: string;

  @Field({ nullable: true })
  proposerUsername?: string;

  @Field()
  votingStartTime: Date;

  @Field()
  votingEndTime: Date;

  @Field()
  quorumRequired: string;

  @Field()
  totalVotesFor: string;

  @Field()
  totalVotesAgainst: string;

  @Field()
  totalVotesAbstain: string;

  @Field()
  totalVotingPower: string;

  @Field(() => Int)
  votersCount: number;

  @Field(() => ProposalStatus)
  status: ProposalStatus;

  @Field({ nullable: true })
  executedAt?: Date;

  @Field({ nullable: true })
  executionTxHash?: string;

  @Field(() => [FundraiserAllocation], { nullable: true })
  targetFundraisers?: FundraiserAllocation[];

  @Field()
  createdAt: Date;

  @Field()
  isQuorumReached: boolean;

  @Field()
  isPassing: boolean;

  @Field()
  timeRemaining: string;
}

/**
 * Fundraiser allocation for yield distribution
 */
@ObjectType()
export class FundraiserAllocation {
  @Field(() => Int)
  fundraiserId: number;

  @Field()
  fundraiserName: string;

  @Field(() => Int)
  allocationBps: number;

  @Field()
  allocationPercent: string;
}

/**
 * DAO vote information
 */
@ObjectType()
export class DAOVote {
  @Field()
  id: string;

  @Field()
  proposalId: string;

  @Field()
  voterAddress: string;

  @Field({ nullable: true })
  voterUsername?: string;

  @Field(() => VoteChoice)
  choice: VoteChoice;

  @Field()
  votingPower: string;

  @Field()
  votingPowerPercent: string;

  @Field({ nullable: true })
  signature?: string;

  @Field()
  createdAt: Date;
}

/**
 * Proposal results breakdown
 */
@ObjectType()
export class ProposalResults {
  @Field()
  proposalId: string;

  @Field()
  totalVotesFor: string;

  @Field()
  totalVotesAgainst: string;

  @Field()
  totalVotesAbstain: string;

  @Field()
  totalVotingPower: string;

  @Field()
  forPercent: string;

  @Field()
  againstPercent: string;

  @Field()
  abstainPercent: string;

  @Field(() => Int)
  votersCount: number;

  @Field()
  quorumRequired: string;

  @Field()
  quorumReached: boolean;

  @Field()
  isPassing: boolean;

  @Field(() => ProposalStatus)
  finalStatus: ProposalStatus;
}

/**
 * User voting power information
 */
@ObjectType()
export class VotingPowerInfo {
  @Field()
  walletBalance: string;

  @Field()
  stakedBalance: string;

  @Field()
  vestedBalance: string;

  @Field()
  totalVotingPower: string;

  @Field()
  lockedInVotes: string;

  @Field()
  availableVotingPower: string;
}

/**
 * DAO voting statistics
 */
@ObjectType()
export class DAOVotingStats {
  @Field(() => Int)
  totalProposals: number;

  @Field(() => Int)
  activeProposals: number;

  @Field(() => Int)
  passedProposals: number;

  @Field(() => Int)
  rejectedProposals: number;

  @Field(() => Int)
  executedProposals: number;

  @Field(() => Int)
  uniqueVoters: number;

  @Field()
  totalVotingPowerUsed: string;

  @Field()
  averageParticipationRate: string;
}

// ==================== Paginated Responses ====================

/**
 * Paginated proposals response
 */
@ObjectType()
export class PaginatedDAOProposals {
  @Field(() => [DAOProposal])
  items: DAOProposal[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

/**
 * Paginated votes response
 */
@ObjectType()
export class PaginatedDAOVotes {
  @Field(() => [DAOVote])
  items: DAOVote[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

// ==================== Subscription Payloads ====================

/**
 * Payload for proposal created subscription
 */
@ObjectType()
export class DAOProposalCreatedPayload {
  @Field(() => DAOProposal)
  proposal: DAOProposal;
}

/**
 * Payload for vote cast subscription
 */
@ObjectType()
export class DAOVoteCastPayload {
  @Field()
  proposalId: string;

  @Field()
  voterAddress: string;

  @Field(() => VoteChoice)
  choice: VoteChoice;

  @Field()
  votingPower: string;

  @Field()
  timestamp: Date;
}

/**
 * Payload for proposal status changed subscription
 */
@ObjectType()
export class DAOProposalStatusChangedPayload {
  @Field()
  proposalId: string;

  @Field(() => ProposalStatus)
  previousStatus: ProposalStatus;

  @Field(() => ProposalStatus)
  newStatus: ProposalStatus;

  @Field()
  timestamp: Date;
}
