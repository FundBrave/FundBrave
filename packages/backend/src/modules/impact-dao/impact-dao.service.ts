import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ImpactDAOStake as PrismaImpactDAOStake } from '@prisma/client';
import {
  ImpactDAOStats,
  ImpactDAOStake,
  ImpactDAOStaker,
  PendingYield,
  YieldSplit,
  ImpactDAOYieldHarvest,
  PaginatedImpactDAOStakers,
  PaginatedYieldHarvests,
} from './dto';
import {
  StakeNotFoundException,
  InsufficientStakeException,
  InvalidYieldSplitException,
} from '../../common/exceptions';
import {
  DEFAULT_YIELD_SPLIT,
  MIN_PLATFORM_SHARE,
  TOTAL_BASIS,
  StakedEventArgs,
  YieldHarvestedEventArgs,
} from '../../common/types';

/**
 * Service for managing Impact DAO Pool operations
 * Handles stake tracking, yield calculations, and FBT rewards
 */
@Injectable()
export class ImpactDAOService {
  private readonly logger = new Logger(ImpactDAOService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get comprehensive Impact DAO pool statistics
   */
  async getDAOStats(): Promise<ImpactDAOStats> {
    // Get or create pool stats
    let stats = await this.prisma.impactDAOPoolStats.findFirst();

    if (!stats) {
      stats = await this.prisma.impactDAOPoolStats.create({
        data: {},
      });
    }

    // Get active stakers count
    const stakersCount = await this.prisma.impactDAOStake.count({
      where: { isActive: true },
    });

    // Calculate total staked principal from active stakes
    const activeStakes = await this.prisma.impactDAOStake.findMany({
      where: { isActive: true },
      select: { principal: true },
    });

    const totalStakedPrincipal = activeStakes.reduce(
      (sum, stake) => sum + stake.principal, // principal is now BigInt directly
      BigInt(0),
    );

    // Calculate pending yield (this would normally come from contract call)
    // For now, we return stored value
    const pendingYield = '0'; // TODO: Fetch from contract

    return {
      totalStakedPrincipal: totalStakedPrincipal.toString(),
      totalYieldHarvested: stats.totalYieldHarvested.toString(),
      totalFBTDistributed: stats.totalFBTDistributed.toString(),
      stakersCount,
      pendingYield,
      rewardRate: stats.rewardRate.toString(),
      periodFinish: stats.periodFinish ?? undefined,
      rewardsDuration: stats.rewardsDuration,
      lastHarvestAt: stats.lastHarvestAt ?? undefined,
      defaultYieldSplit: DEFAULT_YIELD_SPLIT,
    };
  }

  /**
   * Get a user's Impact DAO stake by user ID
   */
  async getUserStake(userId: string): Promise<ImpactDAOStake | null> {
    const stake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerId: userId,
        isActive: true,
      },
    });

    if (!stake) {
      return null;
    }

    return this.mapPrismaStakeToDto(stake);
  }

  /**
   * Get a user's Impact DAO stake by wallet address
   */
  async getUserStakeByAddress(
    walletAddress: string,
  ): Promise<ImpactDAOStake | null> {
    const stake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerAddress: walletAddress.toLowerCase(),
        isActive: true,
      },
    });

    if (!stake) {
      return null;
    }

    return this.mapPrismaStakeToDto(stake);
  }

  /**
   * Get all Impact DAO stakers with pagination
   */
  async getStakers(
    limit: number,
    offset: number,
  ): Promise<PaginatedImpactDAOStakers> {
    const [stakes, total] = await Promise.all([
      this.prisma.impactDAOStake.findMany({
        where: { isActive: true },
        include: {
          staker: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { principal: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.impactDAOStake.count({
        where: { isActive: true },
      }),
    ]);

    const items: ImpactDAOStaker[] = stakes.map((stake) => ({
      address: stake.stakerAddress,
      principal: stake.principal.toString(),
      yieldSplit: {
        daoShare: stake.daoShare,
        stakerShare: stake.stakerShare,
        platformShare: stake.platformShare,
      },
      pendingYield: stake.pendingUSDCYield.toString(),
      pendingFBTReward: stake.pendingFBTReward.toString(),
      username: stake.staker.username ?? undefined,
      avatarUrl: stake.staker.avatarUrl ?? undefined,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get pending yield for a user
   */
  async getPendingYield(userId: string): Promise<PendingYield> {
    const stake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerId: userId,
        isActive: true,
      },
    });

    if (!stake) {
      return {
        totalYield: '0',
        daoShare: '0',
        stakerShare: '0',
        platformShare: '0',
      };
    }

    // TODO: Calculate pending yield from contract
    // For now, return stored pending value
    const totalYield = stake.pendingUSDCYield;

    if (totalYield === BigInt(0)) {
      return {
        totalYield: '0',
        daoShare: '0',
        stakerShare: '0',
        platformShare: '0',
      };
    }

    const daoShare =
      (totalYield * BigInt(stake.daoShare)) / BigInt(TOTAL_BASIS);
    const stakerShare =
      (totalYield * BigInt(stake.stakerShare)) / BigInt(TOTAL_BASIS);
    const platformShare =
      (totalYield * BigInt(stake.platformShare)) / BigInt(TOTAL_BASIS);

    return {
      totalYield: totalYield.toString(),
      daoShare: daoShare.toString(),
      stakerShare: stakerShare.toString(),
      platformShare: platformShare.toString(),
    };
  }

  /**
   * Get pending FBT rewards for a user
   */
  async getPendingFBTRewards(userId: string): Promise<string> {
    const stake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerId: userId,
        isActive: true,
      },
      select: { pendingFBTReward: true },
    });

    return stake?.pendingFBTReward?.toString() ?? '0';
  }

  /**
   * Get user's custom yield split
   */
  async getUserYieldSplit(userId: string): Promise<YieldSplit | null> {
    const stake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerId: userId,
        isActive: true,
      },
      select: {
        daoShare: true,
        stakerShare: true,
        platformShare: true,
      },
    });

    if (!stake) {
      return null;
    }

    return {
      daoShare: stake.daoShare,
      stakerShare: stake.stakerShare,
      platformShare: stake.platformShare,
    };
  }

  /**
   * Get yield harvest history for a stake
   */
  async getYieldHarvests(
    stakeId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedYieldHarvests> {
    const [harvests, total] = await Promise.all([
      this.prisma.impactDAOYieldHarvest.findMany({
        where: { stakeId },
        orderBy: { harvestedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.impactDAOYieldHarvest.count({
        where: { stakeId },
      }),
    ]);

    const items: ImpactDAOYieldHarvest[] = harvests.map((harvest) => ({
      id: harvest.id,
      stakeId: harvest.stakeId,
      totalYield: harvest.totalYield.toString(),
      daoAmount: harvest.daoAmount.toString(),
      stakerAmount: harvest.stakerAmount.toString(),
      platformAmount: harvest.platformAmount.toString(),
      txHash: harvest.txHash,
      blockNumber: harvest.blockNumber ?? undefined,
      harvestedAt: harvest.harvestedAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  // ==================== Event Processing Methods ====================

  /**
   * Process a Staked event from the blockchain
   */
  async processStakedEvent(
    args: StakedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<ImpactDAOStake> {
    const stakerAddress = args.staker.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: stakerAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: stakerAddress,
        },
      });
      this.logger.log(`Created new user for address ${stakerAddress}`);
    }

    // Check for existing active stake
    const existingStake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerId: user.id,
        isActive: true,
      },
    });

    if (existingStake) {
      // Update existing stake (add to principal)
      const updatedStake = await this.prisma.impactDAOStake.update({
        where: { id: existingStake.id },
        data: {
          principal: existingStake.principal + args.amount,
          daoShare: args.split.daoShare,
          stakerShare: args.split.stakerShare,
          platformShare: args.split.platformShare,
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaStakeToDto(updatedStake);
    }

    // Create new stake
    const stake = await this.prisma.impactDAOStake.create({
      data: {
        txHash,
        stakerId: user.id,
        stakerAddress,
        principal: args.amount,
        daoShare: args.split.daoShare,
        stakerShare: args.split.stakerShare,
        platformShare: args.split.platformShare,
        chainId,
        blockNumber,
      },
    });

    // Update user stats (totalStaked is now BigInt)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        totalStaked: user.totalStaked + args.amount,
      },
    });

    // Update pool stats
    await this.updatePoolStats();

    this.logger.log(
      `Processed Staked event: ${stakerAddress} staked ${args.amount.toString()}`,
    );

    return this.mapPrismaStakeToDto(stake);
  }

  /**
   * Process an Unstaked event from the blockchain
   */
  async processUnstakedEvent(
    staker: string,
    amount: bigint,
    txHash: string,
  ): Promise<void> {
    const stakerAddress = staker.toLowerCase();

    const stake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerAddress,
        isActive: true,
      },
      include: { staker: true },
    });

    if (!stake) {
      this.logger.warn(`No active stake found for ${stakerAddress}`);
      return;
    }

    const newPrincipal = stake.principal - amount;

    if (newPrincipal <= BigInt(0)) {
      // Full unstake
      await this.prisma.impactDAOStake.update({
        where: { id: stake.id },
        data: {
          principal: BigInt(0),
          isActive: false,
          unstakedAt: new Date(),
        },
      });
    } else {
      // Partial unstake
      await this.prisma.impactDAOStake.update({
        where: { id: stake.id },
        data: {
          principal: newPrincipal,
          updatedAt: new Date(),
        },
      });
    }

    // Update user stats (totalStaked is now BigInt)
    await this.prisma.user.update({
      where: { id: stake.stakerId },
      data: {
        totalStaked: stake.staker.totalStaked - amount,
      },
    });

    // Update pool stats
    await this.updatePoolStats();

    this.logger.log(
      `Processed Unstaked event: ${stakerAddress} unstaked ${amount.toString()}`,
    );
  }

  /**
   * Process a YieldHarvested event from the blockchain
   */
  async processYieldHarvestedEvent(
    args: YieldHarvestedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    // Get all active stakes to distribute yield
    const activeStakes = await this.prisma.impactDAOStake.findMany({
      where: { isActive: true },
    });

    if (activeStakes.length === 0) {
      this.logger.warn('No active stakes to distribute yield');
      return;
    }

    // Calculate total principal
    const totalPrincipal = activeStakes.reduce(
      (sum, stake) => sum + BigInt(stake.principal),
      BigInt(0),
    );

    // Distribute staker share proportionally
    for (const stake of activeStakes) {
      const stakeShare =
        (args.totalStakerShare * BigInt(stake.principal)) / totalPrincipal;

      // Create harvest record (amount fields are now BigInt)
      await this.prisma.impactDAOYieldHarvest.create({
        data: {
          stakeId: stake.id,
          totalYield: args.totalYield,
          daoAmount: args.daoShare,
          stakerAmount: stakeShare,
          platformAmount:
            (args.platformShare * stake.principal) / totalPrincipal,
          txHash: `${txHash}-${stake.id}`,
          blockNumber,
          chainId,
        },
      });

      // Update pending yield
      await this.prisma.impactDAOStake.update({
        where: { id: stake.id },
        data: {
          pendingUSDCYield: stake.pendingUSDCYield + stakeShare,
        },
      });
    }

    // Update pool stats (amount fields are now BigInt)
    const stats = await this.prisma.impactDAOPoolStats.findFirst();
    if (stats) {
      await this.prisma.impactDAOPoolStats.update({
        where: { id: stats.id },
        data: {
          totalYieldHarvested: stats.totalYieldHarvested + args.totalYield,
          lastHarvestAt: new Date(),
        },
      });
    }

    this.logger.log(
      `Processed YieldHarvested event: Total ${args.totalYield.toString()}`,
    );
  }

  /**
   * Process a YieldSplitSet event
   */
  async processYieldSplitSetEvent(
    staker: string,
    daoShare: number,
    stakerShare: number,
    platformShare: number,
  ): Promise<void> {
    const stakerAddress = staker.toLowerCase();

    await this.prisma.impactDAOStake.updateMany({
      where: {
        stakerAddress,
        isActive: true,
      },
      data: {
        daoShare,
        stakerShare,
        platformShare,
      },
    });

    this.logger.log(
      `Updated yield split for ${stakerAddress}: ${daoShare}/${stakerShare}/${platformShare}`,
    );
  }

  /**
   * Process an FBT reward claim event
   */
  async processFBTRewardClaimedEvent(
    staker: string,
    amount: bigint,
    txHash: string,
  ): Promise<void> {
    const stakerAddress = staker.toLowerCase();

    const stake = await this.prisma.impactDAOStake.findFirst({
      where: {
        stakerAddress,
        isActive: true,
      },
    });

    if (!stake) {
      this.logger.warn(`No active stake found for ${stakerAddress}`);
      return;
    }

    await this.prisma.impactDAOStake.update({
      where: { id: stake.id },
      data: {
        pendingFBTReward: BigInt(0),
        claimedFBTReward: stake.claimedFBTReward + amount,
      },
    });

    // Update pool stats (amount fields are now BigInt)
    const stats = await this.prisma.impactDAOPoolStats.findFirst();
    if (stats) {
      await this.prisma.impactDAOPoolStats.update({
        where: { id: stats.id },
        data: {
          totalFBTDistributed: stats.totalFBTDistributed + amount,
        },
      });
    }

    this.logger.log(
      `Processed FBT reward claim: ${stakerAddress} claimed ${amount.toString()}`,
    );
  }

  // ==================== Validation Methods ====================

  /**
   * Validate yield split configuration
   */
  validateYieldSplit(split: YieldSplit): void {
    const total = split.daoShare + split.stakerShare + split.platformShare;

    if (total !== TOTAL_BASIS) {
      throw new InvalidYieldSplitException(
        `Yield split must sum to ${TOTAL_BASIS} basis points, got ${total}`,
      );
    }

    if (split.platformShare < MIN_PLATFORM_SHARE) {
      throw new InvalidYieldSplitException(
        `Platform share must be at least ${MIN_PLATFORM_SHARE} basis points`,
      );
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Update pool statistics
   */
  private async updatePoolStats(): Promise<void> {
    const stakersCount = await this.prisma.impactDAOStake.count({
      where: { isActive: true },
    });

    const activeStakes = await this.prisma.impactDAOStake.findMany({
      where: { isActive: true },
      select: { principal: true },
    });

    const totalPrincipal = activeStakes.reduce(
      (sum, stake) => sum + stake.principal, // principal is now BigInt directly
      BigInt(0),
    );

    const stats = await this.prisma.impactDAOPoolStats.findFirst();

    if (stats) {
      await this.prisma.impactDAOPoolStats.update({
        where: { id: stats.id },
        data: {
          totalStakedPrincipal: totalPrincipal,
          stakersCount,
        },
      });
    } else {
      await this.prisma.impactDAOPoolStats.create({
        data: {
          totalStakedPrincipal: totalPrincipal,
          stakersCount,
        },
      });
    }
  }

  /**
   * Map Prisma stake to DTO
   */
  private mapPrismaStakeToDto(stake: PrismaImpactDAOStake): ImpactDAOStake {
    return {
      id: stake.id,
      stakerAddress: stake.stakerAddress,
      principal: stake.principal.toString(),
      yieldSplit: {
        daoShare: stake.daoShare,
        stakerShare: stake.stakerShare,
        platformShare: stake.platformShare,
      },
      pendingUSDCYield: stake.pendingUSDCYield.toString(),
      pendingFBTReward: stake.pendingFBTReward.toString(),
      claimedUSDCYield: stake.claimedUSDCYield.toString(),
      claimedFBTReward: stake.claimedFBTReward.toString(),
      isActive: stake.isActive,
      stakedAt: stake.stakedAt,
      unstakedAt: stake.unstakedAt ?? undefined,
    };
  }
}
