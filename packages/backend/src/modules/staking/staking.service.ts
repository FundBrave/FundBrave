import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  Stake as PrismaStake,
  Fundraiser as PrismaFundraiser,
  User as PrismaUser,
} from '@prisma/client';
import {
  Stake,
  StakerInfo,
  FundraiserStakingInfo,
  YieldSplitConfig,
  PaginatedStakes,
  StakingPoolStats,
  UserStakingStats,
  GlobalPoolStats,
  StakingLeaderboardEntry,
  PendingStakingRewards,
  GlobalPoolEpoch,
  GlobalPoolVoteAllocation,
  UserGlobalPoolVotes,
  RecordStakeInput,
  RecordStakePublicInput,
  RecordStakeResponse,
  StakingStats,
  RecentStakingActivity,
  UnstakeInput,
  StakeFilterInput,
  GlobalPoolVoteInput,
  StakeSortBy,
  StakedEventArgs,
  UnstakedEventArgs,
  YieldClaimedEventArgs,
  GlobalPoolStakedEventArgs,
} from './dto';
import {
  StakeNotFoundException,
  FundraiserNotFoundException,
  InvalidInputException,
  InvalidStakeAmountException,
  StakeAlreadyInactiveException,
  DuplicateTransactionException,
} from '../../common/exceptions';
import { SortOrder } from '../fundraisers/dto';

type StakeWithRelations = Prisma.StakeGetPayload<{
  include: {
    staker: {
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
        stakingPoolAddr: true;
      };
    };
  };
}>;

/**
 * Service for managing Staking operations
 * Handles fundraiser staking, global pool staking, and yield tracking
 */
@Injectable()
export class StakingService {
  private readonly logger = new Logger(StakingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get a stake by ID
   */
  async getStakeById(id: string): Promise<Stake> {
    const stake = await this.prisma.stake.findUnique({
      where: { id },
      include: {
        staker: {
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
            stakingPoolAddr: true,
          },
        },
      },
    });

    if (!stake) {
      throw new StakeNotFoundException(id);
    }

    return this.mapToStakeDto(stake);
  }

  /**
   * Get paginated list of stakes with filtering
   */
  async getStakes(
    limit: number,
    offset: number,
    filter?: StakeFilterInput,
    sortBy: StakeSortBy = StakeSortBy.STAKED_AT,
    order: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedStakes> {
    const where = this.buildWhereClause(filter);

    const [stakes, total] = await Promise.all([
      this.prisma.stake.findMany({
        where,
        include: {
          staker: {
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
              stakingPoolAddr: true,
            },
          },
        },
        orderBy: { [sortBy]: order },
        take: limit,
        skip: offset,
      }),
      this.prisma.stake.count({ where }),
    ]);

    const items = stakes.map((s) => this.mapToStakeDto(s));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get user's active stakes
   */
  async getUserStakes(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedStakes> {
    return this.getStakes(limit, offset, { stakerId: userId, isActive: true });
  }

  /**
   * Get stakes for a fundraiser's staking pool
   */
  async getFundraiserStakes(
    fundraiserId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedStakes> {
    return this.getStakes(limit, offset, { fundraiserId, isActive: true });
  }

  /**
   * Get global pool stakes
   */
  async getGlobalPoolStakes(
    limit: number,
    offset: number,
  ): Promise<PaginatedStakes> {
    return this.getStakes(limit, offset, { isGlobal: true, isActive: true });
  }

  /**
   * Get staking pool statistics
   */
  async getPoolStats(poolAddress: string): Promise<StakingPoolStats> {
    const stakes = await this.prisma.stake.findMany({
      where: {
        poolAddress: poolAddress.toLowerCase(),
        isActive: true,
      },
      include: {
        fundraiser: {
          select: { name: true },
        },
      },
    });

    const totalStaked = stakes.reduce(
      (sum, s) => sum + s.amount, // amount is now BigInt directly
      BigInt(0),
    );

    const uniqueStakers = new Set(stakes.map((s) => s.stakerAddress));

    return {
      poolAddress,
      totalStaked: totalStaked.toString(),
      stakersCount: uniqueStakers.size,
      totalYieldGenerated: '0', // TODO: Calculate from yield harvests
      apy: '5.0', // TODO: Calculate actual APY
      fundraiserName: stakes[0]?.fundraiser?.name,
    };
  }

  /**
   * Get user's staking statistics
   */
  async getUserStakingStats(userId: string): Promise<UserStakingStats> {
    const stakes = await this.prisma.stake.findMany({
      where: {
        stakerId: userId,
        isActive: true,
      },
    });

    const totalStaked = stakes.reduce(
      (sum, s) => sum + s.amount, // amount is now BigInt directly
      BigInt(0),
    );

    const fundraiserIds = new Set(
      stakes
        .filter((s) => !s.isGlobal && s.fundraiserId)
        .map((s) => s.fundraiserId),
    );

    const globalStake = stakes.find((s) => s.isGlobal);

    return {
      totalStaked: totalStaked.toString(),
      activeStakesCount: stakes.length,
      totalYieldEarned: '0', // TODO: Calculate from claim history
      pendingYield: '0', // TODO: Calculate from contract
      fundraisersStakedIn: fundraiserIds.size,
      globalPoolStake: globalStake?.amount?.toString(),
    };
  }

  /**
   * Get global pool statistics
   */
  async getGlobalPoolStats(): Promise<GlobalPoolStats> {
    const stakes = await this.prisma.stake.findMany({
      where: {
        isGlobal: true,
        isActive: true,
      },
    });

    const totalStaked = stakes.reduce(
      (sum, s) => sum + s.amount, // amount is now BigInt directly
      BigInt(0),
    );

    const uniqueStakers = new Set(stakes.map((s) => s.stakerAddress));

    // Get current epoch
    const currentEpoch = await this.prisma.globalPoolEpoch.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    // Get next epoch
    const nextEpoch = await this.prisma.globalPoolEpoch.findFirst({
      where: {
        startDate: { gt: new Date() },
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      totalStaked: totalStaked.toString(),
      stakersCount: uniqueStakers.size,
      totalYieldDistributed: '0', // TODO: Calculate from distributed epochs
      pendingYield: '0', // TODO: Calculate from contract
      currentEpoch: currentEpoch?.epochNumber || 0,
      nextEpochStartDate: nextEpoch?.startDate,
      apy: '8.0', // TODO: Calculate actual APY
    };
  }

  /**
   * Get staking leaderboard
   */
  async getStakingLeaderboard(
    limit: number = 10,
  ): Promise<StakingLeaderboardEntry[]> {
    const leaderboardData = await this.prisma.stake.groupBy({
      by: ['stakerAddress'],
      where: { isActive: true },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const stakerAddresses = leaderboardData.map((d) => d.stakerAddress);
    const stakers = await this.prisma.user.findMany({
      where: { walletAddress: { in: stakerAddresses } },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const stakerMap = new Map(stakers.map((s) => [s.walletAddress, s]));

    return leaderboardData.map((data, index) => {
      const staker = stakerMap.get(data.stakerAddress);
      return {
        rank: index + 1,
        staker: {
          id: staker?.id,
          walletAddress: data.stakerAddress,
          username: staker?.username ?? undefined,
          displayName: staker?.displayName ?? undefined,
          avatarUrl: staker?.avatarUrl ?? undefined,
        },
        totalStaked: data._sum?.amount?.toString() ?? '0',
        stakesCount: data._count?.id ?? 0,
      };
    });
  }

  /**
   * Get user's pending rewards
   */
  async getUserPendingRewards(userId: string): Promise<PendingStakingRewards> {
    // TODO: Fetch actual pending rewards from contract
    return {
      usdcYield: '0',
      fbtRewards: '0',
      totalValueUSD: '0',
    };
  }

  // ==================== Global Pool Epoch Methods ====================

  /**
   * Get current epoch
   */
  async getCurrentEpoch(): Promise<GlobalPoolEpoch | null> {
    const epoch = await this.prisma.globalPoolEpoch.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (!epoch) return null;

    return {
      id: epoch.id,
      epochNumber: epoch.epochNumber,
      startDate: epoch.startDate,
      endDate: epoch.endDate,
      totalYield: epoch.totalYield.toString(), // Convert BigInt to string
      isCalculated: epoch.isCalculated,
      isDistributed: epoch.isDistributed,
      distributionTx: epoch.distributionTx ?? undefined,
    };
  }

  /**
   * Get epoch by number
   */
  async getEpochByNumber(epochNumber: number): Promise<GlobalPoolEpoch | null> {
    const epoch = await this.prisma.globalPoolEpoch.findUnique({
      where: { epochNumber },
    });

    if (!epoch) return null;

    return {
      id: epoch.id,
      epochNumber: epoch.epochNumber,
      startDate: epoch.startDate,
      endDate: epoch.endDate,
      totalYield: epoch.totalYield.toString(), // Convert BigInt to string
      isCalculated: epoch.isCalculated,
      isDistributed: epoch.isDistributed,
      distributionTx: epoch.distributionTx ?? undefined,
    };
  }

  /**
   * Get user's votes for an epoch
   */
  async getUserEpochVotes(
    userId: string,
    epochNumber: number,
  ): Promise<UserGlobalPoolVotes | null> {
    const epoch = await this.prisma.globalPoolEpoch.findUnique({
      where: { epochNumber },
    });

    if (!epoch) return null;

    const votes = await this.prisma.globalPoolVote.findMany({
      where: {
        epochId: epoch.id,
        voterId: userId,
      },
      include: {
        fundraiser: {
          select: { id: true, name: true },
        },
      },
    });

    if (votes.length === 0) return null;

    const totalWeight = votes.reduce(
      (sum, v) => sum + v.weight, // weight is now BigInt directly
      BigInt(0),
    );

    const allocations: GlobalPoolVoteAllocation[] = votes.map((v) => ({
      fundraiserId: v.fundraiserId,
      fundraiserName: v.fundraiser.name,
      weight: v.weight.toString(), // Convert BigInt to string
      percentage:
        totalWeight > BigInt(0)
          ? Number((v.weight * BigInt(10000)) / totalWeight) / 100
          : 0,
    }));

    return {
      epochNumber,
      allocations,
      totalWeight: totalWeight.toString(),
    };
  }

  // ==================== Mutation Methods ====================

  /**
   * Record a stake (called after on-chain transaction)
   */
  async recordStake(
    userId: string,
    stakerAddress: string,
    input: RecordStakeInput,
  ): Promise<Stake> {
    // Check for duplicate
    const existing = await this.prisma.stake.findUnique({
      where: { txHash: input.txHash },
    });

    if (existing) {
      throw new DuplicateTransactionException(input.txHash);
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { walletAddress: stakerAddress.toLowerCase() },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            walletAddress: stakerAddress.toLowerCase(),
          },
        });
      }
    }

    // Validate fundraiser if provided
    let fundraiser: PrismaFundraiser | null = null;
    if (input.fundraiserId) {
      fundraiser = await this.prisma.fundraiser.findUnique({
        where: { id: input.fundraiserId },
      });

      if (!fundraiser) {
        throw new FundraiserNotFoundException(input.fundraiserId);
      }
    }

    // Create stake
    const amountBigInt = BigInt(input.amount);
    const sharesBigInt = BigInt(input.shares);
    const stake = await this.prisma.$transaction(async (tx) => {
      const newStake = await tx.stake.create({
        data: {
          txHash: input.txHash,
          poolAddress: input.poolAddress.toLowerCase(),
          amount: amountBigInt,
          shares: sharesBigInt,
          fundraiserId: fundraiser?.id,
          stakerId: user.id,
          stakerAddress: stakerAddress.toLowerCase(),
          causeShare: input.yieldSplit?.causeShare,
          stakerShare: input.yieldSplit?.stakerShare,
          platformShare: input.yieldSplit?.platformShare,
          chainId: input.chainId,
          isGlobal: input.isGlobal || false,
        },
        include: {
          staker: {
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
              stakingPoolAddr: true,
            },
          },
        },
      });

      // Update user stats (totalStaked is now BigInt)
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalStaked: user.totalStaked + amountBigInt,
        },
      });

      // Update fundraiser stats if applicable
      if (fundraiser) {
        await tx.fundraiser.update({
          where: { id: fundraiser.id },
          data: {
            stakersCount: { increment: 1 },
          },
        });
      }

      return newStake;
    });

    this.logger.log(`Recorded stake ${stake.id} for ${stakerAddress}`);

    return this.mapToStakeDto(stake);
  }

  /**
   * Process unstake
   */
  async processUnstake(input: UnstakeInput): Promise<void> {
    const stake = await this.prisma.stake.findUnique({
      where: { id: input.stakeId },
      include: { staker: true, fundraiser: true },
    });

    if (!stake) {
      throw new StakeNotFoundException(input.stakeId);
    }

    const unstakeAmount = input.amount ? BigInt(input.amount) : stake.amount;
    const newAmount = stake.amount - unstakeAmount;

    await this.prisma.$transaction(async (tx) => {
      if (newAmount <= BigInt(0)) {
        // Full unstake
        await tx.stake.update({
          where: { id: input.stakeId },
          data: {
            amount: BigInt(0),
            shares: BigInt(0),
            isActive: false,
            unstakedAt: new Date(),
          },
        });

        // Update fundraiser stakers count
        if (stake.fundraiserId) {
          await tx.fundraiser.update({
            where: { id: stake.fundraiserId },
            data: {
              stakersCount: { decrement: 1 },
            },
          });
        }
      } else {
        // Partial unstake
        const shareRatio = (unstakeAmount * BigInt(10000)) / stake.amount;
        const sharesToRemove = (stake.shares * shareRatio) / BigInt(10000);

        await tx.stake.update({
          where: { id: input.stakeId },
          data: {
            amount: newAmount,
            shares: stake.shares - sharesToRemove,
          },
        });
      }

      // Update user stats (totalStaked is now BigInt)
      await tx.user.update({
        where: { id: stake.stakerId },
        data: {
          totalStaked: stake.staker.totalStaked - unstakeAmount,
        },
      });
    });

    this.logger.log(`Processed unstake for stake ${input.stakeId}`);
  }

  /**
   * Submit global pool votes
   */
  async submitGlobalPoolVotes(
    userId: string,
    input: GlobalPoolVoteInput,
  ): Promise<UserGlobalPoolVotes> {
    const epoch = await this.prisma.globalPoolEpoch.findUnique({
      where: { epochNumber: input.epochNumber },
    });

    if (!epoch) {
      throw new InvalidInputException(`Epoch ${input.epochNumber} not found`);
    }

    // Check if epoch is active
    const now = new Date();
    if (now < epoch.startDate || now > epoch.endDate) {
      throw new InvalidInputException('Epoch is not active for voting');
    }

    // Delete existing votes for this epoch
    await this.prisma.globalPoolVote.deleteMany({
      where: {
        epochId: epoch.id,
        voterId: userId,
      },
    });

    // Create new votes
    const votes = await this.prisma.$transaction(
      input.allocations.map((allocation) =>
        this.prisma.globalPoolVote.create({
          data: {
            epochId: epoch.id,
            voterId: userId,
            fundraiserId: allocation.fundraiserId,
            weight: BigInt(allocation.weight), // Convert to BigInt
          },
        }),
      ),
    );

    return this.getUserEpochVotes(
      userId,
      input.epochNumber,
    ) as Promise<UserGlobalPoolVotes>;
  }

  // ==================== Blockchain Event Processing ====================

  /**
   * Process Staked event from blockchain
   */
  async processStakedEvent(
    args: StakedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
    fundraiserId?: string,
  ): Promise<Stake> {
    const stakerAddress = args.staker.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: stakerAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: stakerAddress },
      });
    }

    // Find fundraiser by pool address if not provided
    let fundraiser: PrismaFundraiser | null = null;
    if (fundraiserId) {
      fundraiser = await this.prisma.fundraiser.findUnique({
        where: { id: fundraiserId },
      });
    } else {
      fundraiser = await this.prisma.fundraiser.findFirst({
        where: { stakingPoolAddr: args.poolAddress.toLowerCase() },
      });
    }

    const stake = await this.prisma.$transaction(async (tx) => {
      const newStake = await tx.stake.create({
        data: {
          txHash,
          poolAddress: args.poolAddress.toLowerCase(),
          amount: args.amount, // args.amount is already BigInt
          shares: args.shares, // args.shares is already BigInt
          fundraiserId: fundraiser?.id,
          stakerId: user.id,
          stakerAddress,
          chainId,
          blockNumber,
          isGlobal: !fundraiser,
        },
        include: {
          staker: {
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
              stakingPoolAddr: true,
            },
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          totalStaked: user.totalStaked + args.amount, // BigInt arithmetic
        },
      });

      if (fundraiser) {
        await tx.fundraiser.update({
          where: { id: fundraiser.id },
          data: { stakersCount: { increment: 1 } },
        });
      }

      return newStake;
    });

    this.logger.log(
      `Processed Staked event: ${stakerAddress} staked ${args.amount}`,
    );

    return this.mapToStakeDto(stake);
  }

  /**
   * Process Unstaked event from blockchain
   */
  async processUnstakedEvent(
    args: UnstakedEventArgs,
    txHash: string,
  ): Promise<void> {
    const stakerAddress = args.staker.toLowerCase();

    const stake = await this.prisma.stake.findFirst({
      where: {
        stakerAddress,
        poolAddress: args.poolAddress.toLowerCase(),
        isActive: true,
      },
      include: { staker: true, fundraiser: true },
    });

    if (!stake) {
      this.logger.warn(
        `No active stake found for ${stakerAddress} at ${args.poolAddress}`,
      );
      return;
    }

    const newAmount = stake.amount - args.amount;

    await this.prisma.$transaction(async (tx) => {
      if (newAmount <= BigInt(0)) {
        await tx.stake.update({
          where: { id: stake.id },
          data: {
            amount: BigInt(0),
            shares: BigInt(0),
            isActive: false,
            unstakedAt: new Date(),
          },
        });

        if (stake.fundraiserId) {
          await tx.fundraiser.update({
            where: { id: stake.fundraiserId },
            data: { stakersCount: { decrement: 1 } },
          });
        }
      } else {
        const shareRatio = (args.amount * BigInt(10000)) / stake.amount;
        const sharesToRemove = (stake.shares * shareRatio) / BigInt(10000);

        await tx.stake.update({
          where: { id: stake.id },
          data: {
            amount: newAmount,
            shares: stake.shares - sharesToRemove,
          },
        });
      }

      await tx.user.update({
        where: { id: stake.stakerId },
        data: {
          totalStaked: stake.staker.totalStaked - args.amount, // BigInt arithmetic
        },
      });
    });

    this.logger.log(
      `Processed Unstaked event: ${stakerAddress} unstaked ${args.amount}`,
    );
  }

  // ==================== Public Staking Methods ====================

  /**
   * Record a stake without authentication (for Web3 wallets)
   * Supports idempotent calls - returns existing stake if already recorded
   * Mirrors recordDonationPublic for consistency
   */
  async recordStakePublic(
    input: RecordStakePublicInput,
  ): Promise<RecordStakeResponse> {
    // Normalize addresses
    const stakerAddress = input.stakerAddress.toLowerCase();
    const poolAddress = input.poolAddress.toLowerCase();
    const txHash = input.txHash.toLowerCase();

    // Check for duplicate transaction - return existing if found (idempotent)
    const existing = await this.prisma.stake.findUnique({
      where: { txHash },
      include: {
        staker: {
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
            stakingPoolAddr: true,
          },
        },
      },
    });

    if (existing) {
      return {
        stake: this.mapToStakeDto(existing),
        verified: true,
        verificationMessage: 'Stake already recorded',
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
      throw new InvalidStakeAmountException(input.amount);
    }

    let sharesBigInt: bigint;
    try {
      sharesBigInt = BigInt(input.shares);
      if (sharesBigInt <= BigInt(0)) {
        throw new Error('Shares must be positive');
      }
    } catch {
      throw new InvalidInputException('Invalid shares amount', {
        shares: input.shares,
      });
    }

    // Validate fundraiser if provided
    let fundraiser: PrismaFundraiser | null = null;
    if (input.fundraiserId) {
      fundraiser = await this.prisma.fundraiser.findUnique({
        where: { id: input.fundraiserId },
      });

      if (!fundraiser) {
        throw new FundraiserNotFoundException(input.fundraiserId);
      }
    }

    // Find or create user based on wallet address
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: stakerAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: stakerAddress,
        },
      });
    }

    // Create stake within transaction
    const stake = await this.prisma.$transaction(async (tx) => {
      const newStake = await tx.stake.create({
        data: {
          txHash,
          poolAddress,
          amount: amountBigInt,
          shares: sharesBigInt,
          fundraiserId: fundraiser?.id,
          stakerId: user.id,
          stakerAddress,
          causeShare: input.yieldSplit?.causeShare,
          stakerShare: input.yieldSplit?.stakerShare,
          platformShare: input.yieldSplit?.platformShare,
          chainId: input.chainId,
          blockNumber: input.blockNumber,
          isGlobal: input.isGlobal || false,
        },
        include: {
          staker: {
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
              stakingPoolAddr: true,
            },
          },
        },
      });

      // Update user stats
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalStaked: {
            increment: amountBigInt,
          },
        },
      });

      // Update fundraiser stats if applicable
      if (fundraiser) {
        await tx.fundraiser.update({
          where: { id: fundraiser.id },
          data: {
            stakersCount: { increment: 1 },
          },
        });
      }

      return newStake;
    });

    this.logger.log(
      `Recorded public stake ${stake.id} from ${stakerAddress} for pool ${poolAddress}`,
    );

    return {
      stake: this.mapToStakeDto(stake),
      verified: true,
      verificationMessage: 'Stake recorded successfully',
    };
  }

  /**
   * Check if a stake with the given txHash already exists
   * Useful for frontend to check before calling recordStake
   */
  async stakeExistsByTxHash(txHash: string): Promise<boolean> {
    const count = await this.prisma.stake.count({
      where: { txHash: txHash.toLowerCase() },
    });
    return count > 0;
  }

  // ==================== Staking Statistics ====================

  /**
   * Get staking statistics for a fundraiser
   */
  async getFundraiserStakingStats(fundraiserId: string): Promise<StakingStats> {
    const stakes = await this.prisma.stake.findMany({
      where: { fundraiserId, isActive: true },
      select: {
        amount: true,
        stakedAt: true,
      },
      orderBy: { amount: 'desc' },
    });

    const uniqueStakers = await this.prisma.stake.groupBy({
      by: ['stakerAddress'],
      where: { fundraiserId, isActive: true },
    });

    const totalStaked = stakes.reduce(
      (sum, s) => sum + s.amount,
      BigInt(0),
    );

    const averageStake =
      stakes.length > 0
        ? (totalStaked / BigInt(stakes.length)).toString()
        : '0';

    const largestStake =
      stakes.length > 0 ? stakes[0].amount.toString() : '0';

    const lastStake =
      stakes.length > 0
        ? stakes.reduce((latest, s) =>
            s.stakedAt > latest.stakedAt ? s : latest,
          )
        : null;

    return {
      totalStaked: totalStaked.toString(),
      stakesCount: stakes.length,
      uniqueStakersCount: uniqueStakers.length,
      averageStake,
      largestStake,
      lastStakeAt: lastStake?.stakedAt,
      apy: '5.0', // TODO: Calculate actual APY from contract or yield data
    };
  }

  /**
   * Get platform-wide staking statistics
   */
  async getPlatformStakingStats(): Promise<StakingStats> {
    const result = await this.prisma.stake.aggregate({
      where: { isActive: true },
      _sum: { amount: true },
      _count: { id: true },
      _max: { amount: true, stakedAt: true },
    });

    const uniqueStakers = await this.prisma.stake.groupBy({
      by: ['stakerAddress'],
      where: { isActive: true },
    });

    const totalStaked = result._sum?.amount ?? BigInt(0);
    const stakesCount = result._count?.id ?? 0;
    const averageStake =
      stakesCount > 0
        ? (totalStaked / BigInt(stakesCount)).toString()
        : '0';

    return {
      totalStaked: totalStaked.toString(),
      stakesCount,
      uniqueStakersCount: uniqueStakers.length,
      averageStake,
      largestStake: result._max?.amount?.toString() ?? '0',
      lastStakeAt: result._max?.stakedAt ?? undefined,
      apy: '5.0', // TODO: Calculate actual APY
    };
  }

  /**
   * Get recent staking activity (for social proof / live feed)
   */
  async getRecentStakingActivity(
    limit: number = 20,
    fundraiserId?: string,
  ): Promise<RecentStakingActivity[]> {
    const where: Prisma.StakeWhereInput = {};
    if (fundraiserId) {
      where.fundraiserId = fundraiserId;
    }

    const stakes = await this.prisma.stake.findMany({
      where,
      select: {
        id: true,
        stakerAddress: true,
        amount: true,
        stakedAt: true,
        staker: {
          select: { username: true },
        },
        fundraiser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { stakedAt: 'desc' },
      take: limit,
    });

    return stakes.map((s) => ({
      id: s.id,
      stakerAddress: s.stakerAddress,
      stakerUsername: s.staker?.username ?? undefined,
      amount: s.amount.toString(),
      fundraiserName: s.fundraiser?.name ?? undefined,
      fundraiserId: s.fundraiser?.id ?? undefined,
      stakedAt: s.stakedAt,
    }));
  }

  // ==================== Helper Methods ====================

  /**
   * Build Prisma where clause from filter
   */
  private buildWhereClause(filter?: StakeFilterInput): Prisma.StakeWhereInput {
    if (!filter) return {};

    const where: Prisma.StakeWhereInput = {};

    if (filter.stakerId) {
      where.stakerId = filter.stakerId;
    }

    if (filter.stakerAddress) {
      where.stakerAddress = filter.stakerAddress.toLowerCase();
    }

    if (filter.fundraiserId) {
      where.fundraiserId = filter.fundraiserId;
    }

    if (filter.poolAddress) {
      where.poolAddress = filter.poolAddress.toLowerCase();
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.isGlobal !== undefined) {
      where.isGlobal = filter.isGlobal;
    }

    if (filter.chainId) {
      where.chainId = filter.chainId;
    }

    return where;
  }

  /**
   * Map Prisma stake to DTO
   */
  private mapToStakeDto(stake: StakeWithRelations): Stake {
    const staker: StakerInfo = {
      id: stake.staker?.id,
      walletAddress: stake.stakerAddress,
      username: stake.staker?.username ?? undefined,
      displayName: stake.staker?.displayName ?? undefined,
      avatarUrl: stake.staker?.avatarUrl ?? undefined,
    };

    const fundraiser: FundraiserStakingInfo | undefined = stake.fundraiser
      ? {
          id: stake.fundraiser.id,
          onChainId: stake.fundraiser.onChainId,
          name: stake.fundraiser.name,
          stakingPoolAddr: stake.fundraiser.stakingPoolAddr ?? undefined,
        }
      : undefined;

    const yieldSplit: YieldSplitConfig | undefined =
      stake.causeShare !== null
        ? {
            causeShare: stake.causeShare,
            stakerShare: stake.stakerShare!,
            platformShare: stake.platformShare!,
          }
        : undefined;

    return {
      id: stake.id,
      txHash: stake.txHash,
      poolAddress: stake.poolAddress,
      amount: stake.amount.toString(), // Convert BigInt to string
      shares: stake.shares.toString(), // Convert BigInt to string
      fundraiser,
      staker,
      yieldSplit,
      chainId: stake.chainId,
      blockNumber: stake.blockNumber ?? undefined,
      isActive: stake.isActive,
      isGlobal: stake.isGlobal,
      stakedAt: stake.stakedAt,
      updatedAt: stake.updatedAt,
      unstakedAt: stake.unstakedAt ?? undefined,
    };
  }
}
