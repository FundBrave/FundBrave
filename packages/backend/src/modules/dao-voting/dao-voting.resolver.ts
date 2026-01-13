import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  Int,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { DAOVotingService } from './dao-voting.service';
import {
  DAOProposal,
  DAOVote,
  ProposalResults,
  VotingPowerInfo,
  DAOVotingStats,
  ProposalCategory,
  ProposalStatus,
  CreateDAOProposalInput,
  VoteOnProposalInput,
  PaginatedDAOProposals,
  PaginatedDAOVotes,
  DAOProposalCreatedPayload,
  DAOVoteCastPayload,
  DAOProposalStatusChangedPayload,
} from './dto';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// PubSub instance for subscriptions
const pubSub = new PubSub();

// Subscription event names
export const DAO_VOTING_EVENTS = {
  PROPOSAL_CREATED: 'daoProposalCreated',
  VOTE_CAST: 'daoVoteCast',
  PROPOSAL_STATUS_CHANGED: 'daoProposalStatusChanged',
};

/**
 * GraphQL resolver for DAO Voting operations
 */
@Resolver()
export class DAOVotingResolver {
  constructor(private readonly daoVotingService: DAOVotingService) {}

  // ==================== Queries ====================

  /**
   * Get active DAO proposals
   */
  @Query(() => PaginatedDAOProposals, {
    name: 'activeDAOProposals',
    description: 'Get active DAO proposals',
  })
  async getActiveDAOProposals(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedDAOProposals> {
    return this.daoVotingService.getActiveProposals(limit, offset);
  }

  /**
   * Get all DAO proposals with optional filters
   */
  @Query(() => PaginatedDAOProposals, {
    name: 'daoProposals',
    description: 'Get all DAO proposals with optional filters',
  })
  async getDAOProposals(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('status', { type: () => ProposalStatus, nullable: true })
    status?: ProposalStatus,
    @Args('category', { type: () => ProposalCategory, nullable: true })
    category?: ProposalCategory,
  ): Promise<PaginatedDAOProposals> {
    return this.daoVotingService.getProposals(limit, offset, status, category);
  }

  /**
   * Get a specific proposal
   */
  @Query(() => DAOProposal, {
    name: 'daoProposal',
    description: 'Get a specific DAO proposal',
  })
  async getDAOProposal(
    @Args('proposalId') proposalId: string,
  ): Promise<DAOProposal> {
    return this.daoVotingService.getProposal(proposalId);
  }

  /**
   * Get votes for a proposal
   */
  @Query(() => PaginatedDAOVotes, {
    name: 'daoProposalVotes',
    description: 'Get votes for a DAO proposal',
  })
  async getDAOProposalVotes(
    @Args('proposalId') proposalId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedDAOVotes> {
    return this.daoVotingService.getProposalVotes(proposalId, limit, offset);
  }

  /**
   * Get current user's votes
   * Protected: Requires authentication
   */
  @Query(() => PaginatedDAOVotes, {
    name: 'myDAOVotes',
    description: "Get current user's DAO votes",
  })
  @UseGuards(JwtAuthGuard)
  async getMyDAOVotes(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedDAOVotes> {
    return this.daoVotingService.getUserVotes(user.id, limit, offset);
  }

  /**
   * Get proposal results
   */
  @Query(() => ProposalResults, {
    name: 'proposalResults',
    description: 'Get proposal results breakdown',
  })
  async getProposalResults(
    @Args('proposalId') proposalId: string,
  ): Promise<ProposalResults> {
    return this.daoVotingService.getProposalResults(proposalId);
  }

  /**
   * Get current user's voting power
   * Protected: Requires authentication
   */
  @Query(() => VotingPowerInfo, {
    name: 'myVotingPower',
    description: "Get current user's voting power",
  })
  @UseGuards(JwtAuthGuard)
  async getMyVotingPower(
    @CurrentUser() user: { id: string },
  ): Promise<VotingPowerInfo> {
    return this.daoVotingService.getVotingPower(user.id);
  }

  /**
   * Get DAO voting statistics
   */
  @Query(() => DAOVotingStats, {
    name: 'daoVotingStats',
    description: 'Get DAO voting statistics',
  })
  async getDAOVotingStats(): Promise<DAOVotingStats> {
    return this.daoVotingService.getVotingStats();
  }

  // ==================== Mutations ====================

  /**
   * Create a new DAO proposal
   * Protected: Requires authentication
   */
  @Mutation(() => DAOProposal, {
    name: 'createDAOProposal',
    description: 'Create a new DAO proposal',
  })
  @UseGuards(JwtAuthGuard)
  async createDAOProposal(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateDAOProposalInput,
  ): Promise<DAOProposal> {
    const proposal = await this.daoVotingService.createProposal(user.id, input);

    // Publish subscription event
    publishDAOProposalCreated({ proposal });

    return proposal;
  }

  /**
   * Vote on a proposal
   * Protected: Requires authentication
   */
  @Mutation(() => DAOVote, {
    name: 'voteOnProposal',
    description: 'Vote on a DAO proposal',
  })
  @UseGuards(JwtAuthGuard)
  async voteOnProposal(
    @CurrentUser() user: { id: string },
    @Args('input') input: VoteOnProposalInput,
  ): Promise<DAOVote> {
    const vote = await this.daoVotingService.voteOnProposal(user.id, input);

    // Publish subscription event
    publishDAOVoteCast({
      proposalId: input.proposalId,
      voterAddress: vote.voterAddress,
      choice: input.vote,
      votingPower: input.votingPower,
      timestamp: new Date(),
    });

    return vote;
  }

  /**
   * Close a proposal and determine outcome
   * Protected: Requires admin privileges
   */
  @Mutation(() => DAOProposal, {
    name: 'closeDAOProposal',
    description: 'Close a DAO proposal and determine outcome (admin only)',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async closeDAOProposal(
    @Args('proposalId') proposalId: string,
  ): Promise<DAOProposal> {
    const proposal = await this.daoVotingService.closeProposal(proposalId);

    // Publish subscription event
    publishDAOProposalStatusChanged({
      proposalId,
      previousStatus: ProposalStatus.ACTIVE,
      newStatus: proposal.status,
      timestamp: new Date(),
    });

    return proposal;
  }

  /**
   * Execute a passed yield distribution proposal
   * Protected: Requires admin privileges
   */
  @Mutation(() => DAOProposal, {
    name: 'executeYieldDistribution',
    description: 'Execute a passed yield distribution proposal (admin only)',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async executeYieldDistribution(
    @Args('proposalId') proposalId: string,
    @Args('executionTxHash') executionTxHash: string,
  ): Promise<DAOProposal> {
    const proposal = await this.daoVotingService.executeYieldDistribution(
      proposalId,
      executionTxHash,
    );

    // Publish subscription event
    publishDAOProposalStatusChanged({
      proposalId,
      previousStatus: ProposalStatus.PASSED,
      newStatus: ProposalStatus.EXECUTED,
      timestamp: new Date(),
    });

    return proposal;
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to new proposal creation
   */
  @Subscription(() => DAOProposalCreatedPayload, {
    name: 'daoProposalCreated',
    description: 'Subscribe to new DAO proposals',
  })
  subscribeToDAOProposalCreated() {
    return pubSub.asyncIterableIterator(DAO_VOTING_EVENTS.PROPOSAL_CREATED);
  }

  /**
   * Subscribe to votes cast on a proposal
   */
  @Subscription(() => DAOVoteCastPayload, {
    name: 'daoVoteCast',
    description: 'Subscribe to votes cast on proposals',
    filter: (payload, variables) => {
      if (variables.proposalId) {
        return payload.daoVoteCast.proposalId === variables.proposalId;
      }
      return true;
    },
  })
  subscribeToDAOVoteCast(
    @Args('proposalId', { nullable: true }) proposalId?: string,
  ) {
    return pubSub.asyncIterableIterator(DAO_VOTING_EVENTS.VOTE_CAST);
  }

  /**
   * Subscribe to proposal status changes
   */
  @Subscription(() => DAOProposalStatusChangedPayload, {
    name: 'daoProposalStatusChanged',
    description: 'Subscribe to proposal status changes',
    filter: (payload, variables) => {
      if (variables.proposalId) {
        return (
          payload.daoProposalStatusChanged.proposalId === variables.proposalId
        );
      }
      return true;
    },
  })
  subscribeToDAOProposalStatusChanged(
    @Args('proposalId', { nullable: true }) proposalId?: string,
  ) {
    return pubSub.asyncIterableIterator(
      DAO_VOTING_EVENTS.PROPOSAL_STATUS_CHANGED,
    );
  }
}

/**
 * Publish proposal created event
 */
export function publishDAOProposalCreated(
  payload: DAOProposalCreatedPayload,
): void {
  pubSub.publish(DAO_VOTING_EVENTS.PROPOSAL_CREATED, {
    daoProposalCreated: payload,
  });
}

/**
 * Publish vote cast event
 */
export function publishDAOVoteCast(payload: DAOVoteCastPayload): void {
  pubSub.publish(DAO_VOTING_EVENTS.VOTE_CAST, {
    daoVoteCast: payload,
  });
}

/**
 * Publish proposal status changed event
 */
export function publishDAOProposalStatusChanged(
  payload: DAOProposalStatusChangedPayload,
): void {
  pubSub.publish(DAO_VOTING_EVENTS.PROPOSAL_STATUS_CHANGED, {
    daoProposalStatusChanged: payload,
  });
}
