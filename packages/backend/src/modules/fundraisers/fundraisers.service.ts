import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Fundraiser as PrismaFundraiser } from '@prisma/client';
import {
  Fundraiser,
  FundraiserStats,
  FundraiserCreator,
  FundraiserMilestone,
  FundraiserUpdate,
  FundraiserMinimal,
  PaginatedFundraisers,
  CreateFundraiserInput,
  UpdateFundraiserInput,
  CreateFundraiserUpdateInput,
  CreateMilestoneInput,
  FundraiserFilterInput,
  FundraiserSortInput,
  FundraiserSortBy,
  SortOrder,
  FundraiserCreatedEventArgs,
  GoalReachedEventArgs,
} from './dto';
import {
  FundraiserNotFoundException,
  UnauthorizedException,
  InvalidInputException,
} from '../../common/exceptions';

type FundraiserWithRelations = Prisma.FundraiserGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        walletAddress: true;
        username: true;
        displayName: true;
        avatarUrl: true;
        isVerifiedCreator: true;
      };
    };
    milestones: true;
    updates: true;
    stakes: {
      where: { isActive: true };
      select: { amount: true };
    };
  };
}>;

/**
 * Service for managing Fundraiser operations
 * Handles CRUD, search, filtering, and blockchain event processing
 */
@Injectable()
export class FundraisersService {
  private readonly logger = new Logger(FundraisersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get a fundraiser by ID with full details
   */
  async getFundraiserById(id: string): Promise<Fundraiser> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
          },
        },
        milestones: {
          orderBy: { targetAmount: 'asc' },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        stakes: {
          where: { isActive: true },
          select: { amount: true },
        },
      },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(id);
    }

    return this.mapToFundraiserDto(fundraiser);
  }

  /**
   * Get a fundraiser by on-chain ID
   */
  async getFundraiserByOnChainId(onChainId: number): Promise<Fundraiser> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { onChainId },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
          },
        },
        milestones: {
          orderBy: { targetAmount: 'asc' },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        stakes: {
          where: { isActive: true },
          select: { amount: true },
        },
      },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(onChainId);
    }

    return this.mapToFundraiserDto(fundraiser);
  }

  /**
   * Get paginated list of fundraisers with filtering and sorting
   */
  async getFundraisers(
    limit: number,
    offset: number,
    filter?: FundraiserFilterInput,
    sort?: FundraiserSortInput,
  ): Promise<PaginatedFundraisers> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderByClause(sort);

    const [fundraisers, total] = await Promise.all([
      this.prisma.fundraiser.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
            },
          },
          milestones: {
            orderBy: { targetAmount: 'asc' },
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          stakes: {
            where: { isActive: true },
            select: { amount: true },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.fundraiser.count({ where }),
    ]);

    const items = fundraisers.map((f) => this.mapToFundraiserDto(f));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get featured fundraisers
   */
  async getFeaturedFundraisers(limit: number = 6): Promise<Fundraiser[]> {
    const fundraisers = await this.prisma.fundraiser.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
          },
        },
        milestones: true,
        updates: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        stakes: {
          where: { isActive: true },
          select: { amount: true },
        },
      },
      orderBy: { raisedAmount: 'desc' },
      take: limit,
    });

    return fundraisers.map((f) => this.mapToFundraiserDto(f));
  }

  /**
   * Get trending fundraisers (based on recent activity)
   */
  async getTrendingFundraisers(limit: number = 10): Promise<Fundraiser[]> {
    // Get fundraisers with most donations in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingIds = await this.prisma.donation.groupBy({
      by: ['fundraiserId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    if (trendingIds.length === 0) {
      // Fallback to most recent active fundraisers
      const result = await this.getFundraisers(limit, 0, { isActive: true });
      return result.items;
    }

    const fundraisers = await this.prisma.fundraiser.findMany({
      where: {
        id: { in: trendingIds.map((t) => t.fundraiserId) },
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
          },
        },
        milestones: true,
        updates: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        stakes: {
          where: { isActive: true },
          select: { amount: true },
        },
      },
    });

    return fundraisers.map((f) => this.mapToFundraiserDto(f));
  }

  /**
   * Get fundraisers by creator
   */
  async getFundraisersByCreator(
    creatorId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.getFundraisers(limit, offset, { creatorId });
  }

  /**
   * Get minimal fundraiser data (for lists)
   */
  async getFundraisersMinimal(
    limit: number,
    offset: number,
    filter?: FundraiserFilterInput,
  ): Promise<{ items: FundraiserMinimal[]; total: number; hasMore: boolean }> {
    const where = this.buildWhereClause(filter);

    const [fundraisers, total] = await Promise.all([
      this.prisma.fundraiser.findMany({
        where,
        select: {
          id: true,
          onChainId: true,
          name: true,
          images: true,
          goalAmount: true,
          raisedAmount: true,
          deadline: true,
          isActive: true,
          donorsCount: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.fundraiser.count({ where }),
    ]);

    // Convert BigInt to string for DTO
    return {
      items: fundraisers.map((f) => ({
        ...f,
        raisedAmount: f.raisedAmount.toString(),
      })),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Search fundraisers by query
   */
  async searchFundraisers(
    query: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.getFundraisers(limit, offset, { searchQuery: query });
  }

  /**
   * Get fundraiser categories with counts
   */
  async getCategoriesWithCounts(): Promise<{ category: string; count: number }[]> {
    const fundraisers = await this.prisma.fundraiser.findMany({
      where: { isActive: true },
      select: { categories: true },
    });

    const categoryCounts = new Map<string, number>();

    for (const fundraiser of fundraisers) {
      for (const category of fundraiser.categories) {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      }
    }

    return Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get regions with counts
   */
  async getRegionsWithCounts(): Promise<{ region: string; count: number }[]> {
    const regions = await this.prisma.fundraiser.groupBy({
      by: ['region'],
      where: {
        isActive: true,
        region: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return regions
      .filter((r) => r.region !== null)
      .map((r) => ({
        region: r.region!,
        count: r._count.id,
      }));
  }

  // ==================== Mutation Methods ====================

  /**
   * Create a new fundraiser (off-chain data)
   * Note: The actual fundraiser is created on-chain first, then synced
   */
  async createFundraiser(
    userId: string,
    input: CreateFundraiserInput,
    txHash: string,
    onChainId: number,
  ): Promise<Fundraiser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate deadline is in the future
    const deadline = new Date(input.deadline);
    if (deadline <= new Date()) {
      throw new InvalidInputException('Deadline must be in the future');
    }

    const fundraiser = await this.prisma.$transaction(async (tx) => {
      // Create fundraiser
      const newFundraiser = await tx.fundraiser.create({
        data: {
          onChainId,
          txHash,
          name: input.name,
          description: input.description,
          images: input.images,
          categories: input.categories,
          region: input.region,
          goalAmount: input.goalAmount,
          currency: input.currency || 'USDC',
          beneficiary: input.beneficiary,
          deadline,
          creatorId: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
            },
          },
          milestones: true,
          updates: true,
          stakes: {
            where: { isActive: true },
            select: { amount: true },
          },
        },
      });

      // Create milestones if provided - targetAmount needs to be BigInt
      if (input.milestones && input.milestones.length > 0) {
        await tx.milestone.createMany({
          data: input.milestones.map((m) => ({
            fundraiserId: newFundraiser.id,
            title: m.title,
            description: m.description,
            targetAmount: BigInt(m.targetAmount),
          })),
        });
      }

      // Update user stats
      await tx.user.update({
        where: { id: userId },
        data: {
          fundraisersCount: { increment: 1 },
        },
      });

      return newFundraiser;
    });

    this.logger.log(`Created fundraiser ${fundraiser.id} for user ${userId}`);

    return this.mapToFundraiserDto(fundraiser);
  }

  /**
   * Update fundraiser details (only by creator)
   */
  async updateFundraiser(
    fundraiserId: string,
    userId: string,
    input: UpdateFundraiserInput,
  ): Promise<Fundraiser> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(fundraiserId);
    }

    if (fundraiser.creatorId !== userId) {
      throw new UnauthorizedException('Only the creator can update this fundraiser');
    }

    const updated = await this.prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: {
        name: input.name,
        description: input.description,
        images: input.images,
        categories: input.categories,
        region: input.region,
      },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
          },
        },
        milestones: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        stakes: {
          where: { isActive: true },
          select: { amount: true },
        },
      },
    });

    return this.mapToFundraiserDto(updated);
  }

  /**
   * Add an update to a fundraiser
   */
  async addFundraiserUpdate(
    fundraiserId: string,
    userId: string,
    input: CreateFundraiserUpdateInput,
  ): Promise<FundraiserUpdate> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(fundraiserId);
    }

    if (fundraiser.creatorId !== userId) {
      throw new UnauthorizedException('Only the creator can add updates');
    }

    const update = await this.prisma.$transaction(async (tx) => {
      const newUpdate = await tx.fundraiserUpdate.create({
        data: {
          fundraiserId,
          title: input.title,
          content: input.content,
          mediaUrls: input.mediaUrls || [],
        },
      });

      await tx.fundraiser.update({
        where: { id: fundraiserId },
        data: {
          updatesCount: { increment: 1 },
        },
      });

      return newUpdate;
    });

    return {
      id: update.id,
      title: update.title,
      content: update.content,
      mediaUrls: update.mediaUrls,
      createdAt: update.createdAt,
    };
  }

  /**
   * Add a milestone to a fundraiser
   */
  async addMilestone(
    fundraiserId: string,
    userId: string,
    input: CreateMilestoneInput,
  ): Promise<FundraiserMilestone> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(fundraiserId);
    }

    if (fundraiser.creatorId !== userId) {
      throw new UnauthorizedException('Only the creator can add milestones');
    }

    // targetAmount needs to be BigInt
    const milestone = await this.prisma.milestone.create({
      data: {
        fundraiserId,
        title: input.title,
        description: input.description,
        targetAmount: BigInt(input.targetAmount),
      },
    });

    // Convert BigInt to string for DTO
    return {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ?? undefined,
      targetAmount: milestone.targetAmount.toString(),
      isReached: milestone.isReached,
      reachedAt: milestone.reachedAt ?? undefined,
      createdAt: milestone.createdAt,
    };
  }

  // ==================== Blockchain Event Processing ====================

  /**
   * Process FundraiserCreated event from blockchain
   */
  async processFundraiserCreatedEvent(
    args: FundraiserCreatedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<Fundraiser> {
    const ownerAddress = args.owner.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: ownerAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: ownerAddress,
        },
      });
    }

    // Check if fundraiser already exists
    const existing = await this.prisma.fundraiser.findUnique({
      where: { onChainId: Number(args.fundraiserId) },
    });

    if (existing) {
      this.logger.warn(`Fundraiser ${args.fundraiserId} already exists`);
      return this.getFundraiserById(existing.id);
    }

    const deadline = new Date(Number(args.deadline) * 1000);

    const fundraiser = await this.prisma.$transaction(async (tx) => {
      const newFundraiser = await tx.fundraiser.create({
        data: {
          onChainId: Number(args.fundraiserId),
          txHash,
          name: args.name,
          description: '', // Will be updated with off-chain metadata
          images: [],
          categories: [],
          goalAmount: args.goalAmount.toString(),
          beneficiary: args.beneficiary.toLowerCase(),
          deadline,
          creatorId: user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
            },
          },
          milestones: true,
          updates: true,
          stakes: {
            where: { isActive: true },
            select: { amount: true },
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          fundraisersCount: { increment: 1 },
        },
      });

      return newFundraiser;
    });

    this.logger.log(
      `Processed FundraiserCreated event: ${args.fundraiserId} by ${ownerAddress}`,
    );

    return this.mapToFundraiserDto(fundraiser);
  }

  /**
   * Process GoalReached event from blockchain
   */
  async processGoalReachedEvent(args: GoalReachedEventArgs): Promise<void> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { onChainId: Number(args.fundraiserId) },
    });

    if (!fundraiser) {
      this.logger.warn(`Fundraiser ${args.fundraiserId} not found for GoalReached event`);
      return;
    }

    // raisedAmount is now BigInt
    await this.prisma.fundraiser.update({
      where: { id: fundraiser.id },
      data: {
        goalReached: true,
        raisedAmount: args.totalRaised,
      },
    });

    this.logger.log(`Fundraiser ${args.fundraiserId} reached its goal`);
  }

  /**
   * Update fundraiser raised amount (from donation events)
   */
  async updateRaisedAmount(
    fundraiserId: string,
    amount: bigint,
    incrementDonors: boolean = true,
  ): Promise<void> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(fundraiserId);
    }

    // Fields are now BigInt directly
    const newRaisedAmount = fundraiser.raisedAmount + amount;
    const goalReached = newRaisedAmount >= BigInt(fundraiser.goalAmount);

    await this.prisma.$transaction(async (tx) => {
      // raisedAmount is now BigInt
      await tx.fundraiser.update({
        where: { id: fundraiserId },
        data: {
          raisedAmount: newRaisedAmount,
          goalReached,
          donorsCount: incrementDonors ? { increment: 1 } : undefined,
        },
      });

      // Check milestones - targetAmount is now BigInt
      const milestones = await tx.milestone.findMany({
        where: {
          fundraiserId,
          isReached: false,
        },
      });

      for (const milestone of milestones) {
        if (newRaisedAmount >= milestone.targetAmount) {
          await tx.milestone.update({
            where: { id: milestone.id },
            data: {
              isReached: true,
              reachedAt: new Date(),
            },
          });
        }
      }
    });
  }

  // ==================== Admin Methods ====================

  /**
   * Feature/unfeature a fundraiser (admin only)
   */
  async setFeatured(fundraiserId: string, isFeatured: boolean): Promise<void> {
    await this.prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { isFeatured },
    });
  }

  /**
   * Deactivate a fundraiser (admin only)
   */
  async deactivateFundraiser(fundraiserId: string): Promise<void> {
    await this.prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { isActive: false },
    });
  }

  // ==================== Helper Methods ====================

  /**
   * Build Prisma where clause from filter input
   */
  private buildWhereClause(filter?: FundraiserFilterInput): Prisma.FundraiserWhereInput {
    if (!filter) {
      return {};
    }

    const where: Prisma.FundraiserWhereInput = {};

    if (filter.categories && filter.categories.length > 0) {
      where.categories = { hasSome: filter.categories };
    }

    if (filter.regions && filter.regions.length > 0) {
      where.region = { in: filter.regions };
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.isFeatured !== undefined) {
      where.isFeatured = filter.isFeatured;
    }

    if (filter.goalReached !== undefined) {
      where.goalReached = filter.goalReached;
    }

    if (filter.endowmentEnabled !== undefined) {
      where.endowmentEnabled = filter.endowmentEnabled;
    }

    if (filter.creatorId) {
      where.creatorId = filter.creatorId;
    }

    if (filter.searchQuery) {
      where.OR = [
        { name: { contains: filter.searchQuery, mode: 'insensitive' } },
        { description: { contains: filter.searchQuery, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause from sort input
   */
  private buildOrderByClause(
    sort?: FundraiserSortInput,
  ): Prisma.FundraiserOrderByWithRelationInput {
    const sortBy = sort?.sortBy || FundraiserSortBy.CREATED_AT;
    const order = sort?.order || SortOrder.DESC;

    return { [sortBy]: order };
  }

  /**
   * Map Prisma fundraiser to DTO
   * Converts BigInt fields to strings for API response
   */
  private mapToFundraiserDto(fundraiser: FundraiserWithRelations): Fundraiser {
    // stakes amount is now BigInt directly
    const totalStaked = fundraiser.stakes.reduce(
      (sum, s) => sum + s.amount,
      BigInt(0),
    );

    // raisedAmount is now BigInt directly
    const percentageRaised =
      BigInt(fundraiser.goalAmount) > BigInt(0)
        ? Number(
            (fundraiser.raisedAmount * BigInt(10000)) /
              BigInt(fundraiser.goalAmount),
          ) / 100
        : 0;

    const daysLeft = Math.max(
      0,
      Math.ceil(
        (fundraiser.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    );

    // raisedAmount is now BigInt directly
    const avgDonation =
      fundraiser.donorsCount > 0
        ? (fundraiser.raisedAmount / BigInt(fundraiser.donorsCount)).toString()
        : '0';

    const creator: FundraiserCreator = {
      id: fundraiser.creator.id,
      walletAddress: fundraiser.creator.walletAddress,
      username: fundraiser.creator.username ?? undefined,
      displayName: fundraiser.creator.displayName ?? undefined,
      avatarUrl: fundraiser.creator.avatarUrl ?? undefined,
      isVerifiedCreator: fundraiser.creator.isVerifiedCreator,
    };

    // Convert BigInt fields to strings for DTO
    const stats: FundraiserStats = {
      totalDonations: fundraiser.raisedAmount.toString(),
      donorsCount: fundraiser.donorsCount,
      stakersCount: fundraiser.stakersCount,
      totalStaked: totalStaked.toString(),
      updatesCount: fundraiser.updatesCount,
      percentageRaised,
      daysLeft,
      avgDonation,
      endowmentPrincipal: fundraiser.endowmentEnabled
        ? fundraiser.endowmentPrincipal.toString()
        : undefined,
      endowmentYield: fundraiser.endowmentEnabled
        ? fundraiser.endowmentYield.toString()
        : undefined,
    };

    // Convert BigInt targetAmount to string for DTO
    const milestones: FundraiserMilestone[] = fundraiser.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? undefined,
      targetAmount: m.targetAmount.toString(),
      isReached: m.isReached,
      reachedAt: m.reachedAt ?? undefined,
      createdAt: m.createdAt,
    }));

    const updates: FundraiserUpdate[] = fundraiser.updates.map((u) => ({
      id: u.id,
      title: u.title,
      content: u.content,
      mediaUrls: u.mediaUrls,
      createdAt: u.createdAt,
    }));

    // Convert BigInt raisedAmount to string for DTO
    return {
      id: fundraiser.id,
      onChainId: fundraiser.onChainId,
      txHash: fundraiser.txHash,
      name: fundraiser.name,
      description: fundraiser.description,
      images: fundraiser.images,
      categories: fundraiser.categories,
      region: fundraiser.region ?? undefined,
      goalAmount: fundraiser.goalAmount,
      raisedAmount: fundraiser.raisedAmount.toString(),
      currency: fundraiser.currency,
      beneficiary: fundraiser.beneficiary,
      stakingPoolAddr: fundraiser.stakingPoolAddr ?? undefined,
      creator,
      deadline: fundraiser.deadline,
      createdAt: fundraiser.createdAt,
      updatedAt: fundraiser.updatedAt,
      isActive: fundraiser.isActive,
      isFeatured: fundraiser.isFeatured,
      goalReached: fundraiser.goalReached,
      endowmentEnabled: fundraiser.endowmentEnabled,
      stats,
      milestones,
      updates,
    };
  }
}
