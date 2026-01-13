import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DAOProposal as PrismaDAOProposal,
  DAOVote as PrismaDAOVote,
  ProposalCategory as PrismaProposalCategory,
  ProposalStatus as PrismaProposalStatus,
  VoteChoice as PrismaVoteChoice,
} from '@prisma/client';
import {
  DAOProposal,
  DAOVote,
  ProposalResults,
  VotingPowerInfo,
  DAOVotingStats,
  ProposalCategory,
  ProposalStatus,
  VoteChoice,
  CreateDAOProposalInput,
  VoteOnProposalInput,
  FundraiserAllocation,
  PaginatedDAOProposals,
  PaginatedDAOVotes,
} from './dto';
import {
  ProposalNotFoundException,
  InsufficientVotingPowerException,
  ProposalNotActiveException,
  VotingPeriodEndedException,
  AlreadyVotedException,
  QuorumNotReachedException,
  UserNotFoundException,
} from '../../common/exceptions';

/**
 * Service for managing DAO voting operations
 * Handles off-chain voting for Impact DAO yield distribution
 */
@Injectable()
export class DAOVotingService {
  private readonly logger = new Logger(DAOVotingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get active DAO proposals
   */
  async getActiveProposals(
    limit: number,
    offset: number,
  ): Promise<PaginatedDAOProposals> {
    const now = new Date();

    const [proposals, total] = await Promise.all([
      this.prisma.dAOProposal.findMany({
        where: {
          status: 'ACTIVE',
          votingEndTime: { gt: now },
        },
        include: {
          proposer: {
            select: { walletAddress: true, username: true },
          },
        },
        orderBy: { votingEndTime: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.dAOProposal.count({
        where: {
          status: 'ACTIVE',
          votingEndTime: { gt: now },
        },
      }),
    ]);

    const items = proposals.map((p) => this.mapPrismaProposalToDto(p));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get all proposals with pagination
   */
  async getProposals(
    limit: number,
    offset: number,
    status?: ProposalStatus,
    category?: ProposalCategory,
  ): Promise<PaginatedDAOProposals> {
    const where: any = {};

    if (status) {
      where.status = this.mapProposalStatusToPrisma(status);
    }
    if (category) {
      where.category = this.mapProposalCategoryToPrisma(category);
    }

    const [proposals, total] = await Promise.all([
      this.prisma.dAOProposal.findMany({
        where,
        include: {
          proposer: {
            select: { walletAddress: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.dAOProposal.count({ where }),
    ]);

    const items = proposals.map((p) => this.mapPrismaProposalToDto(p));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a specific proposal
   */
  async getProposal(proposalId: string): Promise<DAOProposal> {
    const proposal = await this.prisma.dAOProposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: {
          select: { walletAddress: true, username: true },
        },
      },
    });

    if (!proposal) {
      throw new ProposalNotFoundException(proposalId);
    }

    return this.mapPrismaProposalToDto(proposal);
  }

  /**
   * Get votes for a proposal
   */
  async getProposalVotes(
    proposalId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedDAOVotes> {
    const [votes, total] = await Promise.all([
      this.prisma.dAOVote.findMany({
        where: { proposalId },
        include: {
          voter: {
            select: { walletAddress: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.dAOVote.count({ where: { proposalId } }),
    ]);

    // Calculate total voting power for percentage
    const proposal = await this.prisma.dAOProposal.findUnique({
      where: { id: proposalId },
      select: {
        totalVotesFor: true,
        totalVotesAgainst: true,
        totalVotesAbstain: true,
      },
    });

    // Fields are now BigInt directly
    const totalVotingPower = proposal
      ? proposal.totalVotesFor +
        proposal.totalVotesAgainst +
        proposal.totalVotesAbstain
      : BigInt(1);

    const items: DAOVote[] = votes.map((v) => ({
      id: v.id,
      proposalId: v.proposalId,
      voterAddress: v.voter.walletAddress,
      voterUsername: v.voter.username ?? undefined,
      choice: this.mapPrismaVoteChoiceToDto(v.choice),
      votingPower: v.votingPower.toString(),
      votingPowerPercent: (
        Number((v.votingPower * BigInt(10000)) / totalVotingPower) / 100
      ).toFixed(2),
      signature: v.signature ?? undefined,
      createdAt: v.createdAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get user's votes
   */
  async getUserVotes(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedDAOVotes> {
    const [votes, total] = await Promise.all([
      this.prisma.dAOVote.findMany({
        where: { voterId: userId },
        include: {
          voter: {
            select: { walletAddress: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.dAOVote.count({ where: { voterId: userId } }),
    ]);

    const items: DAOVote[] = votes.map((v) => ({
      id: v.id,
      proposalId: v.proposalId,
      voterAddress: v.voter.walletAddress,
      voterUsername: v.voter.username ?? undefined,
      choice: this.mapPrismaVoteChoiceToDto(v.choice),
      votingPower: v.votingPower.toString(),
      votingPowerPercent: '0', // Not calculated without proposal context
      signature: v.signature ?? undefined,
      createdAt: v.createdAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get proposal results
   */
  async getProposalResults(proposalId: string): Promise<ProposalResults> {
    const proposal = await this.prisma.dAOProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new ProposalNotFoundException(proposalId);
    }

    // Fields are now BigInt directly
    const totalFor = proposal.totalVotesFor;
    const totalAgainst = proposal.totalVotesAgainst;
    const totalAbstain = proposal.totalVotesAbstain;
    const total = totalFor + totalAgainst + totalAbstain;
    const quorumRequired = proposal.quorumRequired;

    const forPercent =
      total > BigInt(0)
        ? (Number((totalFor * BigInt(10000)) / total) / 100).toFixed(2)
        : '0.00';
    const againstPercent =
      total > BigInt(0)
        ? (Number((totalAgainst * BigInt(10000)) / total) / 100).toFixed(2)
        : '0.00';
    const abstainPercent =
      total > BigInt(0)
        ? (Number((totalAbstain * BigInt(10000)) / total) / 100).toFixed(2)
        : '0.00';

    const quorumReached = total >= quorumRequired;
    const isPassing = totalFor > totalAgainst;

    return {
      proposalId,
      totalVotesFor: totalFor.toString(),
      totalVotesAgainst: totalAgainst.toString(),
      totalVotesAbstain: totalAbstain.toString(),
      totalVotingPower: total.toString(),
      forPercent,
      againstPercent,
      abstainPercent,
      votersCount: proposal.votersCount,
      quorumRequired: quorumRequired.toString(),
      quorumReached,
      isPassing,
      finalStatus: this.mapPrismaProposalStatusToDto(proposal.status),
    };
  }

  /**
   * Get user's voting power
   */
  async getVotingPower(userId: string): Promise<VotingPowerInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        fbtBalance: true,
        fbtStakedBalance: true,
        fbtVestedTotal: true,
        fbtVestedClaimed: true,
      },
    });

    if (!user) {
      return {
        walletBalance: '0',
        stakedBalance: '0',
        vestedBalance: '0',
        totalVotingPower: '0',
        lockedInVotes: '0',
        availableVotingPower: '0',
      };
    }

    // Fields are now BigInt directly
    const walletBalance = user.fbtBalance;
    const stakedBalance = user.fbtStakedBalance;
    const vestedBalance = user.fbtVestedTotal - user.fbtVestedClaimed;

    // Total = wallet + staked (vested not yet claimed doesn't count)
    const totalVotingPower = walletBalance + stakedBalance;

    // Calculate locked in active votes
    const activeVotes = await this.prisma.dAOVote.findMany({
      where: {
        voterId: userId,
        proposal: {
          status: 'ACTIVE',
        },
      },
      select: { votingPower: true },
    });

    // votingPower is now BigInt directly
    const lockedInVotes = activeVotes.reduce(
      (sum, v) => sum + v.votingPower,
      BigInt(0),
    );

    const availableVotingPower = totalVotingPower - lockedInVotes;

    return {
      walletBalance: walletBalance.toString(),
      stakedBalance: stakedBalance.toString(),
      vestedBalance: vestedBalance.toString(),
      totalVotingPower: totalVotingPower.toString(),
      lockedInVotes: lockedInVotes.toString(),
      availableVotingPower: availableVotingPower.toString(),
    };
  }

  /**
   * Get DAO voting statistics
   */
  async getVotingStats(): Promise<DAOVotingStats> {
    const [
      totalProposals,
      activeProposals,
      passedProposals,
      rejectedProposals,
      executedProposals,
    ] = await Promise.all([
      this.prisma.dAOProposal.count(),
      this.prisma.dAOProposal.count({ where: { status: 'ACTIVE' } }),
      this.prisma.dAOProposal.count({ where: { status: 'PASSED' } }),
      this.prisma.dAOProposal.count({ where: { status: 'REJECTED' } }),
      this.prisma.dAOProposal.count({ where: { status: 'EXECUTED' } }),
    ]);

    // Get unique voters
    const uniqueVoters = await this.prisma.dAOVote.groupBy({
      by: ['voterId'],
    });

    // Get total voting power used - votingPower is now BigInt directly
    const votes = await this.prisma.dAOVote.findMany({
      select: { votingPower: true },
    });
    const totalVotingPowerUsed = votes.reduce(
      (sum, v) => sum + v.votingPower,
      BigInt(0),
    );

    // Calculate average participation rate
    const proposals = await this.prisma.dAOProposal.findMany({
      where: { status: { not: 'DRAFT' } },
      select: {
        quorumRequired: true,
        totalVotesFor: true,
        totalVotesAgainst: true,
        totalVotesAbstain: true,
      },
    });

    // Fields are now BigInt directly
    let totalParticipationRate = 0;
    for (const p of proposals) {
      const quorum = p.quorumRequired;
      const votes = p.totalVotesFor + p.totalVotesAgainst + p.totalVotesAbstain;
      if (quorum > BigInt(0)) {
        totalParticipationRate += Number((votes * BigInt(100)) / quorum);
      }
    }
    const avgParticipation =
      proposals.length > 0
        ? (totalParticipationRate / proposals.length).toFixed(2)
        : '0.00';

    return {
      totalProposals,
      activeProposals,
      passedProposals,
      rejectedProposals,
      executedProposals,
      uniqueVoters: uniqueVoters.length,
      totalVotingPowerUsed: totalVotingPowerUsed.toString(),
      averageParticipationRate: avgParticipation,
    };
  }

  // ==================== Mutation Methods ====================

  /**
   * Create a new DAO proposal
   */
  async createProposal(
    proposerId: string,
    input: CreateDAOProposalInput,
  ): Promise<DAOProposal> {
    const user = await this.prisma.user.findUnique({
      where: { id: proposerId },
    });

    if (!user) {
      throw new UserNotFoundException(proposerId);
    }

    const votingStartTime = new Date();
    const votingEndTime = new Date(
      votingStartTime.getTime() + input.votingDurationHours * 60 * 60 * 1000,
    );

    const proposal = await this.prisma.dAOProposal.create({
      data: {
        title: input.title,
        description: input.description,
        category: this.mapProposalCategoryToPrisma(input.category),
        proposerId,
        votingStartTime,
        votingEndTime,
        quorumRequired: BigInt(input.quorumRequired), // Convert string to BigInt
        status: 'ACTIVE',
        targetFundraisers: input.targetFundraisers
          ? JSON.stringify(input.targetFundraisers)
          : undefined,
      },
      include: {
        proposer: {
          select: { walletAddress: true, username: true },
        },
      },
    });

    this.logger.log(`Created DAO proposal: ${proposal.id} - ${proposal.title}`);

    return this.mapPrismaProposalToDto(proposal);
  }

  /**
   * Vote on a proposal
   */
  async voteOnProposal(
    voterId: string,
    input: VoteOnProposalInput,
  ): Promise<DAOVote> {
    // Get proposal
    const proposal = await this.prisma.dAOProposal.findUnique({
      where: { id: input.proposalId },
    });

    if (!proposal) {
      throw new ProposalNotFoundException(input.proposalId);
    }

    // Check proposal is active
    if (proposal.status !== 'ACTIVE') {
      throw new ProposalNotActiveException(input.proposalId, proposal.status);
    }

    // Check voting period
    const now = new Date();
    if (now > proposal.votingEndTime) {
      throw new VotingPeriodEndedException(
        input.proposalId,
        proposal.votingEndTime,
      );
    }

    // Check if already voted
    const existingVote = await this.prisma.dAOVote.findUnique({
      where: {
        proposalId_voterId: {
          proposalId: input.proposalId,
          voterId,
        },
      },
    });

    if (existingVote) {
      throw new AlreadyVotedException(input.proposalId, voterId);
    }

    // Verify voting power
    const votingPowerInfo = await this.getVotingPower(voterId);
    const requestedPower = BigInt(input.votingPower);
    const availablePower = BigInt(votingPowerInfo.availableVotingPower);

    if (requestedPower > availablePower) {
      throw new InsufficientVotingPowerException(
        input.votingPower,
        votingPowerInfo.availableVotingPower,
      );
    }

    // Create vote - convert string input to BigInt
    const votingPowerBigInt = BigInt(input.votingPower);
    const vote = await this.prisma.dAOVote.create({
      data: {
        proposalId: input.proposalId,
        voterId,
        choice: this.mapVoteChoiceToPrisma(input.vote),
        votingPower: votingPowerBigInt,
        signature: input.signature,
        message: input.message,
      },
      include: {
        voter: {
          select: { walletAddress: true, username: true },
        },
      },
    });

    // Update proposal vote counts
    const updateField = this.getVoteUpdateField(input.vote);
    await this.prisma.dAOProposal.update({
      where: { id: input.proposalId },
      data: {
        [updateField]: {
          increment: votingPowerBigInt,
        },
        votersCount: { increment: 1 },
      },
    });

    this.logger.log(
      `Vote cast on proposal ${input.proposalId}: ${input.vote} with power ${input.votingPower}`,
    );

    return {
      id: vote.id,
      proposalId: vote.proposalId,
      voterAddress: vote.voter.walletAddress,
      voterUsername: vote.voter.username ?? undefined,
      choice: this.mapPrismaVoteChoiceToDto(vote.choice),
      votingPower: vote.votingPower.toString(),
      votingPowerPercent: '0', // Would need to recalculate
      signature: vote.signature ?? undefined,
      createdAt: vote.createdAt,
    };
  }

  /**
   * Close a proposal and determine outcome
   */
  async closeProposal(proposalId: string): Promise<DAOProposal> {
    const proposal = await this.prisma.dAOProposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: {
          select: { walletAddress: true, username: true },
        },
      },
    });

    if (!proposal) {
      throw new ProposalNotFoundException(proposalId);
    }

    // Determine outcome - fields are now BigInt directly
    const totalFor = proposal.totalVotesFor;
    const totalAgainst = proposal.totalVotesAgainst;
    const totalAbstain = proposal.totalVotesAbstain;
    const total = totalFor + totalAgainst + totalAbstain;
    const quorumRequired = proposal.quorumRequired;

    const quorumReached = total >= quorumRequired;
    const isPassing = totalFor > totalAgainst;

    let newStatus: PrismaProposalStatus;
    if (!quorumReached) {
      newStatus = 'REJECTED';
    } else if (isPassing) {
      newStatus = 'PASSED';
    } else {
      newStatus = 'REJECTED';
    }

    const updatedProposal = await this.prisma.dAOProposal.update({
      where: { id: proposalId },
      data: { status: newStatus },
      include: {
        proposer: {
          select: { walletAddress: true, username: true },
        },
      },
    });

    this.logger.log(`Closed proposal ${proposalId}: ${newStatus}`);

    return this.mapPrismaProposalToDto(updatedProposal);
  }

  /**
   * Execute a passed yield distribution proposal
   */
  async executeYieldDistribution(
    proposalId: string,
    executionTxHash: string,
  ): Promise<DAOProposal> {
    const proposal = await this.prisma.dAOProposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: {
          select: { walletAddress: true, username: true },
        },
      },
    });

    if (!proposal) {
      throw new ProposalNotFoundException(proposalId);
    }

    if (proposal.status !== 'PASSED') {
      throw new ProposalNotActiveException(proposalId, proposal.status);
    }

    if (proposal.category !== 'YIELD_DISTRIBUTION') {
      throw new Error(
        'Only yield distribution proposals can be executed this way',
      );
    }

    const updatedProposal = await this.prisma.dAOProposal.update({
      where: { id: proposalId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executionTxHash,
      },
      include: {
        proposer: {
          select: { walletAddress: true, username: true },
        },
      },
    });

    this.logger.log(
      `Executed proposal ${proposalId} with tx ${executionTxHash}`,
    );

    return this.mapPrismaProposalToDto(updatedProposal);
  }

  /**
   * Update expired proposals (scheduled job)
   */
  async updateExpiredProposals(): Promise<number> {
    const now = new Date();

    const expiredProposals = await this.prisma.dAOProposal.findMany({
      where: {
        status: 'ACTIVE',
        votingEndTime: { lte: now },
      },
    });

    for (const proposal of expiredProposals) {
      await this.closeProposal(proposal.id);
    }

    return expiredProposals.length;
  }

  // ==================== Helper Methods ====================

  /**
   * Get the update field for a vote choice
   */
  private getVoteUpdateField(choice: VoteChoice): string {
    switch (choice) {
      case VoteChoice.FOR:
        return 'totalVotesFor';
      case VoteChoice.AGAINST:
        return 'totalVotesAgainst';
      case VoteChoice.ABSTAIN:
        return 'totalVotesAbstain';
    }
  }

  /**
   * Map Prisma proposal to DTO
   * Converts BigInt fields to strings for API response
   */
  private mapPrismaProposalToDto(
    proposal: PrismaDAOProposal & {
      proposer: { walletAddress: string; username: string | null };
    },
  ): DAOProposal {
    // Fields are now BigInt directly
    const totalFor = proposal.totalVotesFor;
    const totalAgainst = proposal.totalVotesAgainst;
    const totalAbstain = proposal.totalVotesAbstain;
    const total = totalFor + totalAgainst + totalAbstain;
    const quorumRequired = proposal.quorumRequired;

    const isQuorumReached = total >= quorumRequired;
    const isPassing = totalFor > totalAgainst;

    // Calculate time remaining
    const now = new Date();
    const endTime = proposal.votingEndTime;
    let timeRemaining = '';
    if (now < endTime) {
      const diff = endTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeRemaining = `${hours}h ${minutes}m`;
    } else {
      timeRemaining = 'Ended';
    }

    // Parse target fundraisers if present
    let targetFundraisers: FundraiserAllocation[] | undefined;
    if (proposal.targetFundraisers) {
      try {
        const parsed = JSON.parse(proposal.targetFundraisers as string);
        targetFundraisers = parsed.map((f: any) => ({
          fundraiserId: f.fundraiserId,
          fundraiserName: f.fundraiserName || `Fundraiser #${f.fundraiserId}`,
          allocationBps: f.allocationBps,
          allocationPercent: (f.allocationBps / 100).toFixed(2),
        }));
      } catch {
        targetFundraisers = undefined;
      }
    }

    return {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      category: this.mapPrismaProposalCategoryToDto(proposal.category),
      proposerAddress: proposal.proposer.walletAddress,
      proposerUsername: proposal.proposer.username ?? undefined,
      votingStartTime: proposal.votingStartTime,
      votingEndTime: proposal.votingEndTime,
      quorumRequired: quorumRequired.toString(),
      totalVotesFor: totalFor.toString(),
      totalVotesAgainst: totalAgainst.toString(),
      totalVotesAbstain: totalAbstain.toString(),
      totalVotingPower: total.toString(),
      votersCount: proposal.votersCount,
      status: this.mapPrismaProposalStatusToDto(proposal.status),
      executedAt: proposal.executedAt ?? undefined,
      executionTxHash: proposal.executionTxHash ?? undefined,
      targetFundraisers,
      createdAt: proposal.createdAt,
      isQuorumReached,
      isPassing,
      timeRemaining,
    };
  }

  // ==================== Enum Mapping Methods ====================

  private mapProposalCategoryToPrisma(
    category: ProposalCategory,
  ): PrismaProposalCategory {
    return category as PrismaProposalCategory;
  }

  private mapPrismaProposalCategoryToDto(
    category: PrismaProposalCategory,
  ): ProposalCategory {
    return category as ProposalCategory;
  }

  private mapProposalStatusToPrisma(
    status: ProposalStatus,
  ): PrismaProposalStatus {
    return status as PrismaProposalStatus;
  }

  private mapPrismaProposalStatusToDto(
    status: PrismaProposalStatus,
  ): ProposalStatus {
    return status as ProposalStatus;
  }

  private mapVoteChoiceToPrisma(choice: VoteChoice): PrismaVoteChoice {
    return choice as PrismaVoteChoice;
  }

  private mapPrismaVoteChoiceToDto(choice: PrismaVoteChoice): VoteChoice {
    return choice as VoteChoice;
  }
}
