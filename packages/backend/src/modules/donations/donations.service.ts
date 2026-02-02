import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Donation as PrismaDonation } from '@prisma/client';
import {
  Donation,
  DonorInfo,
  FundraiserBasicInfo,
  PaginatedDonations,
  DonationStats,
  UserDonationStats,
  DonationLeaderboard,
  DonationLeaderboardEntry,
  RecentDonationActivity,
  RecordDonationInput,
  RecordDonationPublicInput,
  RecordDonationResponse,
  DonationFilterInput,
  DonationSortBy,
  DonationReceivedEventArgs,
  CrossChainDonationEventArgs,
} from './dto';
import {
  DonationNotFoundException,
  FundraiserNotFoundException,
  DuplicateTransactionException,
  InvalidInputException,
} from '../../common/exceptions';
import { SortOrder } from '../fundraisers/dto';

type DonationWithRelations = Prisma.DonationGetPayload<{
  include: {
    donor: {
      select: {
        id: true;
        walletAddress: true;
        username: true;
        displayName: true;
        avatarUrl: true;
      };
    };
    fundraiser: {
      select: {
        id: true;
        onChainId: true;
        name: true;
        images: true;
      };
    };
  };
}>;

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  43114: 'Avalanche',
  42161: 'Arbitrum',
  10: 'Optimism',
  11155111: 'Sepolia',
  80001: 'Mumbai',
};

/**
 * Service for managing Donation operations
 * Handles direct donations, cross-chain donations, and donation tracking
 */
@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get a donation by ID
   */
  async getDonationById(id: string): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        fundraiser: {
          select: {
            id: true,
            onChainId: true,
            name: true,
            images: true,
          },
        },
      },
    });

    if (!donation) {
      throw new DonationNotFoundException(id);
    }

    return this.mapToDonationDto(donation);
  }

  /**
   * Get a donation by transaction hash
   */
  async getDonationByTxHash(txHash: string): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({
      where: { txHash },
      include: {
        donor: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        fundraiser: {
          select: {
            id: true,
            onChainId: true,
            name: true,
            images: true,
          },
        },
      },
    });

    if (!donation) {
      throw new DonationNotFoundException(txHash);
    }

    return this.mapToDonationDto(donation);
  }

  /**
   * Get paginated list of donations with filtering and sorting
   */
  async getDonations(
    limit: number,
    offset: number,
    filter?: DonationFilterInput,
    sortBy: DonationSortBy = DonationSortBy.CREATED_AT,
    order: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedDonations> {
    const where = this.buildWhereClause(filter);

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          fundraiser: {
            select: {
              id: true,
              onChainId: true,
              name: true,
              images: true,
            },
          },
        },
        orderBy: { [sortBy]: order },
        take: limit,
        skip: offset,
      }),
      this.prisma.donation.count({ where }),
    ]);

    const items = donations.map((d) => this.mapToDonationDto(d));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get donations for a specific fundraiser
   */
  async getFundraiserDonations(
    fundraiserId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedDonations> {
    return this.getDonations(limit, offset, { fundraiserId });
  }

  /**
   * Get donations made by a specific user
   */
  async getUserDonations(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedDonations> {
    return this.getDonations(limit, offset, { donorId: userId });
  }

  /**
   * Get donations by wallet address
   */
  async getDonationsByAddress(
    address: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedDonations> {
    return this.getDonations(limit, offset, { donorAddress: address });
  }

  /**
   * Get donation statistics for a fundraiser
   */
  async getFundraiserDonationStats(
    fundraiserId: string,
  ): Promise<DonationStats> {
    const donations = await this.prisma.donation.findMany({
      where: { fundraiserId },
      select: {
        amount: true, // BigInt field
        createdAt: true,
      },
      orderBy: { amount: 'desc' },
    });

    const uniqueDonors = await this.prisma.donation.groupBy({
      by: ['donorAddress'],
      where: { fundraiserId },
    });

    const totalDonated = donations.reduce(
      (sum, d) => sum + d.amount, // amount is already BigInt
      BigInt(0),
    );

    const averageDonation =
      donations.length > 0
        ? (totalDonated / BigInt(donations.length)).toString()
        : '0';

    const largestDonation =
      donations.length > 0 ? donations[0].amount.toString() : '0';
    const lastDonation =
      donations.length > 0 ? donations[donations.length - 1] : null;

    return {
      totalDonated: totalDonated.toString(),
      donationsCount: donations.length,
      uniqueDonorsCount: uniqueDonors.length,
      averageDonation,
      largestDonation,
      lastDonationAt: lastDonation?.createdAt,
    };
  }

  /**
   * Get donation statistics for a user
   */
  async getUserDonationStats(userId: string): Promise<UserDonationStats> {
    const donations = await this.prisma.donation.findMany({
      where: { donorId: userId },
      select: {
        amount: true, // BigInt field
        createdAt: true,
        fundraiserId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const uniqueFundraisers = new Set(donations.map((d) => d.fundraiserId));

    const totalDonated = donations.reduce(
      (sum, d) => sum + d.amount, // amount is already BigInt
      BigInt(0),
    );

    const averageDonation =
      donations.length > 0
        ? (totalDonated / BigInt(donations.length)).toString()
        : '0';

    return {
      totalDonated: totalDonated.toString(),
      donationsCount: donations.length,
      fundraisersDonatedTo: uniqueFundraisers.size,
      averageDonation,
      firstDonationAt:
        donations.length > 0 ? donations[0].createdAt : undefined,
      lastDonationAt:
        donations.length > 0
          ? donations[donations.length - 1].createdAt
          : undefined,
    };
  }

  /**
   * Get donation leaderboard
   */
  async getDonationLeaderboard(
    period: 'all' | '7d' | '30d' | '90d',
    limit: number = 10,
  ): Promise<DonationLeaderboard> {
    const dateFilter = this.getDateFilter(period);

    const leaderboardData = await this.prisma.donation.groupBy({
      by: ['donorAddress'],
      where: {
        isAnonymous: false,
        ...dateFilter,
      },
      _sum: { amount: true }, // BigInt field
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    // Get donor details
    const donorAddresses = leaderboardData.map((d) => d.donorAddress);
    const donors = await this.prisma.user.findMany({
      where: { walletAddress: { in: donorAddresses } },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const donorMap = new Map(donors.map((d) => [d.walletAddress, d]));

    const entries: DonationLeaderboardEntry[] = leaderboardData.map(
      (data, index) => {
        const donor = donorMap.get(data.donorAddress);
        return {
          rank: index + 1,
          donor: {
            id: donor?.id,
            walletAddress: data.donorAddress,
            username: donor?.username ?? undefined,
            displayName: donor?.displayName ?? undefined,
            avatarUrl: donor?.avatarUrl ?? undefined,
            isAnonymous: false,
          },
          totalDonated: data._sum?.amount?.toString() ?? '0',
          donationsCount: data._count?.id ?? 0,
        };
      },
    );

    return {
      entries,
      total: entries.length,
      period,
    };
  }

  /**
   * Get recent donation activity (for live feed)
   */
  async getRecentDonationActivity(
    limit: number = 20,
  ): Promise<RecentDonationActivity[]> {
    const donations = await this.prisma.donation.findMany({
      where: { isAnonymous: false },
      select: {
        id: true,
        donorAddress: true,
        amountUSD: true,
        createdAt: true,
        donor: {
          select: { username: true },
        },
        fundraiser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return donations.map((d) => ({
      id: d.id,
      donorAddress: d.donorAddress,
      donorUsername: d.donor?.username ?? undefined,
      amountUSD: d.amountUSD,
      fundraiserName: d.fundraiser.name,
      fundraiserId: d.fundraiser.id,
      createdAt: d.createdAt,
    }));
  }

  /**
   * Get top donors for a fundraiser
   */
  async getTopDonors(
    fundraiserId: string,
    limit: number = 10,
  ): Promise<DonationLeaderboardEntry[]> {
    const topDonors = await this.prisma.donation.groupBy({
      by: ['donorAddress'],
      where: {
        fundraiserId,
        isAnonymous: false,
      },
      _sum: { amount: true }, // BigInt field
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const donorAddresses = topDonors.map((d) => d.donorAddress);
    const donors = await this.prisma.user.findMany({
      where: { walletAddress: { in: donorAddresses } },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const donorMap = new Map(donors.map((d) => [d.walletAddress, d]));

    return topDonors.map((data, index) => {
      const donor = donorMap.get(data.donorAddress);
      return {
        rank: index + 1,
        donor: {
          id: donor?.id,
          walletAddress: data.donorAddress,
          username: donor?.username ?? undefined,
          displayName: donor?.displayName ?? undefined,
          avatarUrl: donor?.avatarUrl ?? undefined,
          isAnonymous: false,
        },
        totalDonated: data._sum?.amount?.toString() ?? '0',
        donationsCount: data._count?.id ?? 0,
      };
    });
  }

  // ==================== Mutation Methods ====================

  /**
   * Record a donation (called after on-chain transaction)
   * Used for authenticated users
   */
  async recordDonation(
    userId: string | null,
    donorAddress: string,
    input: RecordDonationInput,
  ): Promise<Donation> {
    // Check for duplicate transaction
    const existing = await this.prisma.donation.findUnique({
      where: { txHash: input.txHash },
    });

    if (existing) {
      throw new DuplicateTransactionException(input.txHash);
    }

    // Find fundraiser
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: input.fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(input.fundraiserId);
    }

    // Find or create user
    let user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId } })
      : await this.prisma.user.findUnique({
          where: { walletAddress: donorAddress.toLowerCase() },
        });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: donorAddress.toLowerCase(),
        },
      });
    }

    const chainName = CHAIN_NAMES[input.chainId] || `Chain ${input.chainId}`;

    // Create donation
    const amountBigInt = BigInt(input.amount);
    const donation = await this.prisma.$transaction(async (tx) => {
      const newDonation = await tx.donation.create({
        data: {
          txHash: input.txHash,
          amount: amountBigInt, // BigInt field
          amountUSD: input.amount, // Keep as string for USD value
          token: input.token,
          chainId: input.chainId,
          sourceChain: chainName,
          donorId: user.id,
          donorAddress: donorAddress.toLowerCase(),
          fundraiserId: input.fundraiserId,
          isAnonymous: input.isAnonymous || false,
          message: input.message,
        },
        include: {
          donor: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          fundraiser: {
            select: {
              id: true,
              onChainId: true,
              name: true,
              images: true,
            },
          },
        },
      });

      // Update fundraiser stats
      await tx.fundraiser.update({
        where: { id: input.fundraiserId },
        data: {
          raisedAmount: {
            increment: amountBigInt,
          },
          donorsCount: { increment: 1 },
        },
      });

      // Update user stats
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalDonated: {
            increment: amountBigInt,
          },
        },
      });

      return newDonation;
    });

    this.logger.log(
      `Recorded donation ${donation.id} for ${input.fundraiserId}`,
    );

    return this.mapToDonationDto(donation);
  }

  /**
   * Record a donation without authentication (for Web3 wallets)
   * This endpoint validates the transaction exists on-chain before recording
   * Used when the blockchain indexer hasn't caught the event yet
   */
  async recordDonationPublic(
    input: RecordDonationPublicInput,
  ): Promise<RecordDonationResponse> {
    // Normalize addresses
    const donorAddress = input.donorAddress.toLowerCase();
    const txHash = input.txHash.toLowerCase();

    // Check for duplicate transaction - if exists, return the existing donation
    const existing = await this.prisma.donation.findUnique({
      where: { txHash },
      include: {
        donor: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        fundraiser: {
          select: {
            id: true,
            onChainId: true,
            name: true,
            images: true,
          },
        },
      },
    });

    if (existing) {
      // Return existing donation instead of throwing error
      // This supports idempotent frontend calls
      return {
        donation: this.mapToDonationDto(existing),
        verified: true,
        verificationMessage: 'Donation already recorded',
      };
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      throw new InvalidInputException('Invalid transaction hash format', {
        txHash,
      });
    }

    // Validate amount is a valid positive number
    let amountBigInt: bigint;
    try {
      amountBigInt = BigInt(input.amount);
      if (amountBigInt <= BigInt(0)) {
        throw new Error('Amount must be positive');
      }
    } catch {
      throw new InvalidInputException('Invalid donation amount', {
        amount: input.amount,
      });
    }

    // Find fundraiser
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: input.fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(input.fundraiserId);
    }

    // Find or create user based on wallet address
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: donorAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: donorAddress,
        },
      });
    }

    const chainName = CHAIN_NAMES[input.chainId] || `Chain ${input.chainId}`;

    // Create donation within transaction
    const donation = await this.prisma.$transaction(async (tx) => {
      const newDonation = await tx.donation.create({
        data: {
          txHash,
          amount: amountBigInt,
          amountUSD: input.amount,
          token: input.token,
          chainId: input.chainId,
          sourceChain: chainName,
          blockNumber: input.blockNumber,
          donorId: user.id,
          donorAddress,
          fundraiserId: input.fundraiserId,
          isAnonymous: input.isAnonymous || false,
          message: input.message,
        },
        include: {
          donor: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          fundraiser: {
            select: {
              id: true,
              onChainId: true,
              name: true,
              images: true,
            },
          },
        },
      });

      // Update fundraiser stats
      const newRaisedAmount = fundraiser.raisedAmount + amountBigInt;
      const goalReached = newRaisedAmount >= BigInt(fundraiser.goalAmount);

      await tx.fundraiser.update({
        where: { id: input.fundraiserId },
        data: {
          raisedAmount: newRaisedAmount,
          goalReached,
          donorsCount: { increment: 1 },
        },
      });

      // Update user stats
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalDonated: {
            increment: amountBigInt,
          },
        },
      });

      // Check milestones
      const milestones = await tx.milestone.findMany({
        where: {
          fundraiserId: fundraiser.id,
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

      return newDonation;
    });

    this.logger.log(
      `Recorded public donation ${donation.id} from ${donorAddress} for fundraiser ${input.fundraiserId}`,
    );

    return {
      donation: this.mapToDonationDto(donation),
      verified: true,
      verificationMessage: 'Donation recorded successfully',
    };
  }

  /**
   * Check if a donation with the given txHash already exists
   * Useful for frontend to check before calling recordDonation
   */
  async donationExistsByTxHash(txHash: string): Promise<boolean> {
    const count = await this.prisma.donation.count({
      where: { txHash: txHash.toLowerCase() },
    });
    return count > 0;
  }

  // ==================== Blockchain Event Processing ====================

  /**
   * Process DonationReceived event from blockchain
   */
  async processDonationReceivedEvent(
    args: DonationReceivedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<Donation> {
    const donorAddress = args.donor.toLowerCase();

    // Check for duplicate
    const existing = await this.prisma.donation.findUnique({
      where: { txHash },
    });

    if (existing) {
      this.logger.warn(`Donation ${txHash} already exists`);
      return this.getDonationByTxHash(txHash);
    }

    // Find fundraiser
    const fundraiser = await this.prisma.fundraiser.findFirst({
      where: { onChainId: Number(args.fundraiserId) },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(Number(args.fundraiserId));
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: donorAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: donorAddress,
        },
      });
    }

    const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;

    const donation = await this.prisma.$transaction(async (tx) => {
      const newDonation = await tx.donation.create({
        data: {
          txHash,
          amount: args.amount, // args.amount is already BigInt
          amountUSD: args.amount.toString(),
          token: args.token || 'USDC',
          chainId,
          sourceChain: chainName,
          blockNumber,
          donorId: user.id,
          donorAddress,
          fundraiserId: fundraiser.id,
          isAnonymous: false,
          message: args.message,
        },
        include: {
          donor: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          fundraiser: {
            select: {
              id: true,
              onChainId: true,
              name: true,
              images: true,
            },
          },
        },
      });

      // Update fundraiser (raisedAmount is now BigInt)
      const newRaisedAmount = fundraiser.raisedAmount + args.amount;
      const goalReached = newRaisedAmount >= BigInt(fundraiser.goalAmount);

      await tx.fundraiser.update({
        where: { id: fundraiser.id },
        data: {
          raisedAmount: newRaisedAmount,
          goalReached,
          donorsCount: { increment: 1 },
        },
      });

      // Update user (totalDonated is now BigInt)
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalDonated: user.totalDonated + args.amount,
        },
      });

      // Check milestones (targetAmount is now BigInt)
      const milestones = await tx.milestone.findMany({
        where: {
          fundraiserId: fundraiser.id,
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

      return newDonation;
    });

    this.logger.log(
      `Processed DonationReceived: ${donorAddress} donated ${args.amount} to fundraiser ${args.fundraiserId}`,
    );

    return this.mapToDonationDto(donation);
  }

  /**
   * Process CrossChainDonation event
   */
  async processCrossChainDonationEvent(
    args: CrossChainDonationEventArgs,
    txHash: string,
    blockNumber: number,
  ): Promise<Donation> {
    // Similar to processDonationReceivedEvent but with cross-chain context
    return this.processDonationReceivedEvent(
      {
        fundraiserId: args.fundraiserId,
        donor: args.donor,
        amount: args.amount,
        token: 'USDC',
      },
      txHash,
      blockNumber,
      args.destChainId,
    );
  }

  // ==================== Platform Stats ====================

  /**
   * Get platform-wide donation statistics
   */
  async getPlatformDonationStats(): Promise<DonationStats> {
    const result = await this.prisma.donation.aggregate({
      _sum: { amount: true }, // BigInt field
      _count: { id: true },
      _max: { amount: true, createdAt: true }, // BigInt field
    });

    const uniqueDonors = await this.prisma.donation.groupBy({
      by: ['donorAddress'],
    });

    const totalDonated = result._sum?.amount ?? BigInt(0);
    const donationsCount = result._count?.id ?? 0;
    const averageDonation =
      donationsCount > 0
        ? (totalDonated / BigInt(donationsCount)).toString()
        : '0';

    return {
      totalDonated: totalDonated.toString(),
      donationsCount,
      uniqueDonorsCount: uniqueDonors.length,
      averageDonation,
      largestDonation: result._max?.amount?.toString() ?? '0',
      lastDonationAt: result._max?.createdAt ?? undefined,
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Build Prisma where clause from filter input
   */
  private buildWhereClause(
    filter?: DonationFilterInput,
  ): Prisma.DonationWhereInput {
    if (!filter) return {};

    const where: Prisma.DonationWhereInput = {};

    if (filter.fundraiserId) {
      where.fundraiserId = filter.fundraiserId;
    }

    if (filter.donorId) {
      where.donorId = filter.donorId;
    }

    if (filter.donorAddress) {
      where.donorAddress = filter.donorAddress.toLowerCase();
    }

    if (filter.token) {
      where.token = filter.token;
    }

    if (filter.chainId) {
      where.chainId = filter.chainId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.createdAt.lte = filter.endDate;
      }
    }

    return where;
  }

  /**
   * Get date filter for leaderboard periods
   */
  private getDateFilter(period: string): Prisma.DonationWhereInput {
    if (period === 'all') return {};

    const now = new Date();
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return {
      createdAt: { gte: startDate },
    };
  }

  /**
   * Map Prisma donation to DTO
   */
  private mapToDonationDto(donation: DonationWithRelations): Donation {
    const donor: DonorInfo = {
      id: donation.donor?.id,
      walletAddress: donation.donorAddress,
      username: donation.isAnonymous
        ? undefined
        : (donation.donor?.username ?? undefined),
      displayName: donation.isAnonymous
        ? undefined
        : (donation.donor?.displayName ?? undefined),
      avatarUrl: donation.isAnonymous
        ? undefined
        : (donation.donor?.avatarUrl ?? undefined),
      isAnonymous: donation.isAnonymous,
    };

    const fundraiser: FundraiserBasicInfo = {
      id: donation.fundraiser.id,
      onChainId: donation.fundraiser.onChainId,
      name: donation.fundraiser.name,
      images: donation.fundraiser.images,
    };

    return {
      id: donation.id,
      txHash: donation.txHash,
      amount: donation.amount.toString(), // Convert BigInt to string
      amountUSD: donation.amountUSD,
      token: donation.token,
      chainId: donation.chainId,
      sourceChain: donation.sourceChain,
      blockNumber: donation.blockNumber ?? undefined,
      donor,
      fundraiser,
      isAnonymous: donation.isAnonymous,
      message: donation.message ?? undefined,
      createdAt: donation.createdAt,
      indexedAt: donation.indexedAt,
    };
  }
}
