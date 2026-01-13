import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FBTStake as PrismaFBTStake,
  PlatformFee as PrismaPlatformFee,
  FeeSourceType as PrismaFeeSourceType,
} from '@prisma/client';
import {
  TreasuryStats,
  FBTStake,
  PlatformFee,
  FeeSourceType,
  TreasuryEndowmentInfo,
  FBTStaker,
  TreasuryYieldInfo,
  PaginatedPlatformFees,
  PaginatedFBTStakers,
} from './dto';
import {
  StakeNotFoundException,
  InsufficientStakeException,
  NoYieldAvailableException,
  NoPendingFeesException,
  UnauthorizedFeeSenderException,
} from '../../common/exceptions';
import { FBTStakedEventArgs } from '../../common/types';

/**
 * Service for managing Platform Treasury operations
 * Handles fee collection, FBT staking, and yield distribution
 */
@Injectable()
export class TreasuryService {
  private readonly logger = new Logger(TreasuryService.name);

  // Precision for yield per token calculations
  private readonly PRECISION = BigInt(10 ** 18);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get comprehensive treasury statistics
   */
  async getTreasuryStats(): Promise<TreasuryStats> {
    // Get or create treasury stats
    let stats = await this.prisma.treasuryStats.findFirst();

    if (!stats) {
      stats = await this.prisma.treasuryStats.create({
        data: {},
      });
    }

    // Get FBT stakers count
    const totalFBTStakers = await this.prisma.fBTStake.count({
      where: { isActive: true },
    });

    // Calculate total FBT staked
    const activeStakes = await this.prisma.fBTStake.findMany({
      where: { isActive: true },
      select: { amount: true },
    });

    const totalFBTStaked = activeStakes.reduce(
      (sum, stake) => sum + stake.amount, // amount is now BigInt directly
      BigInt(0),
    );

    return {
      totalFeesCollected: stats.totalFeesCollected.toString(),
      totalFeesStaked: stats.totalFeesStaked.toString(),
      pendingFeesToStake: stats.pendingFeesToStake.toString(),
      totalFBTStaked: totalFBTStaked.toString(),
      totalYieldDistributed: stats.totalYieldDistributed.toString(),
      operationalFunds: stats.operationalFunds.toString(),
      endowmentPrincipal: stats.endowmentPrincipal.toString(),
      endowmentLifetimeYield: stats.endowmentLifetimeYield.toString(),
      minStakeThreshold: stats.minStakeThreshold.toString(),
      lastFeeStakedAt: stats.lastFeeStakedAt ?? undefined,
      lastYieldHarvestedAt: stats.lastYieldHarvestedAt ?? undefined,
      totalFBTStakers,
      yieldPerTokenStored: '0', // TODO: Calculate from contract
    };
  }

  /**
   * Get user's FBT stake in treasury
   */
  async getUserFBTStake(userId: string): Promise<FBTStake | null> {
    const stake = await this.prisma.fBTStake.findFirst({
      where: {
        stakerId: userId,
        isActive: true,
      },
    });

    if (!stake) {
      return null;
    }

    return this.mapPrismaFBTStakeToDto(stake);
  }

  /**
   * Get user's FBT stake by wallet address
   */
  async getUserFBTStakeByAddress(
    walletAddress: string,
  ): Promise<FBTStake | null> {
    const stake = await this.prisma.fBTStake.findFirst({
      where: {
        stakerAddress: walletAddress.toLowerCase(),
        isActive: true,
      },
    });

    if (!stake) {
      return null;
    }

    return this.mapPrismaFBTStakeToDto(stake);
  }

  /**
   * Get claimable USDC yield from FBT staking
   */
  async getClaimableTreasuryYield(userId: string): Promise<string> {
    const stake = await this.prisma.fBTStake.findFirst({
      where: {
        stakerId: userId,
        isActive: true,
      },
      select: { pendingYield: true },
    });

    return stake?.pendingYield?.toString() ?? '0';
  }

  /**
   * Get platform fee collection history
   */
  async getPlatformFees(
    limit: number,
    offset: number,
  ): Promise<PaginatedPlatformFees> {
    const [fees, total] = await Promise.all([
      this.prisma.platformFee.findMany({
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.platformFee.count(),
    ]);

    const items = fees.map((f) => this.mapPrismaPlatformFeeToDto(f));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get fees by source type
   */
  async getPlatformFeesBySource(
    sourceType: FeeSourceType,
    limit: number,
    offset: number,
  ): Promise<PaginatedPlatformFees> {
    const prismaSourceType = this.mapFeeSourceTypeToPrisma(sourceType);

    const [fees, total] = await Promise.all([
      this.prisma.platformFee.findMany({
        where: { sourceType: prismaSourceType },
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.platformFee.count({
        where: { sourceType: prismaSourceType },
      }),
    ]);

    const items = fees.map((f) => this.mapPrismaPlatformFeeToDto(f));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get operational funds balance
   */
  async getOperationalFunds(): Promise<string> {
    const stats = await this.prisma.treasuryStats.findFirst();
    return stats?.operationalFunds?.toString() ?? '0';
  }

  /**
   * Get all FBT stakers with pagination
   */
  async getFBTStakers(
    limit: number,
    offset: number,
  ): Promise<PaginatedFBTStakers> {
    const [stakes, total] = await Promise.all([
      this.prisma.fBTStake.findMany({
        where: { isActive: true },
        include: {
          staker: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { amount: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.fBTStake.count({
        where: { isActive: true },
      }),
    ]);

    // Calculate total staked for share calculation
    const totalStaked = stakes.reduce(
      (sum, s) => sum + s.amount, // amount is now BigInt directly
      BigInt(0),
    );

    const items: FBTStaker[] = stakes.map((stake) => {
      const share =
        totalStaked > BigInt(0)
          ? ((stake.amount * BigInt(10000)) / totalStaked).toString()
          : '0';

      return {
        address: stake.stakerAddress,
        amount: stake.amount.toString(),
        pendingYield: stake.pendingYield.toString(),
        shareOfTreasury: (Number(share) / 100).toFixed(2),
        username: stake.staker.username ?? undefined,
        avatarUrl: stake.staker.avatarUrl ?? undefined,
      };
    });

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get treasury endowment info (via WealthBuildingDonation)
   */
  async getTreasuryEndowmentInfo(): Promise<TreasuryEndowmentInfo> {
    const stats = await this.prisma.treasuryStats.findFirst();

    return {
      principal: stats?.endowmentPrincipal?.toString() ?? '0',
      lifetimeYield: stats?.endowmentLifetimeYield?.toString() ?? '0',
      causeYieldPaid: '0', // Treasury's cause yield goes to operational funds
      pendingYield: '0', // TODO: Calculate from contract
    };
  }

  // ==================== Event Processing Methods ====================

  /**
   * Process a FeeReceived event
   */
  async processFeeReceivedEvent(
    from: string,
    amount: bigint,
    sourceType: FeeSourceType,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<PlatformFee> {
    const fee = await this.prisma.platformFee.create({
      data: {
        sourceContract: from.toLowerCase(),
        sourceType: this.mapFeeSourceTypeToPrisma(sourceType),
        amount: amount, // Now BigInt directly
        txHash,
        blockNumber,
        chainId,
      },
    });

    // Update treasury stats (amount fields are now BigInt)
    const stats = await this.getOrCreateTreasuryStats();
    await this.prisma.treasuryStats.update({
      where: { id: stats.id },
      data: {
        totalFeesCollected: stats.totalFeesCollected + amount,
        pendingFeesToStake: stats.pendingFeesToStake + amount,
      },
    });

    this.logger.log(
      `Processed FeeReceived event: ${amount.toString()} from ${from}`,
    );

    return this.mapPrismaPlatformFeeToDto(fee);
  }

  /**
   * Process a FeesStaked event
   */
  async processFeesStakedEvent(
    amount: bigint,
    endowmentAmount: bigint,
    txHash: string,
  ): Promise<void> {
    const stats = await this.getOrCreateTreasuryStats();

    // Calculate operational funds (78% of staked amount)
    const operationalFunds = (amount * BigInt(78)) / BigInt(100);

    await this.prisma.treasuryStats.update({
      where: { id: stats.id },
      data: {
        totalFeesStaked: stats.totalFeesStaked + amount,
        pendingFeesToStake: BigInt(0),
        operationalFunds: stats.operationalFunds + operationalFunds,
        endowmentPrincipal: stats.endowmentPrincipal + endowmentAmount,
        lastFeeStakedAt: new Date(),
      },
    });

    // Update platform fees that were staked
    await this.prisma.platformFee.updateMany({
      where: { isStaked: false },
      data: {
        isStaked: true,
        stakedAt: new Date(),
        stakedTxHash: txHash,
      },
    });

    this.logger.log(`Processed FeesStaked event: ${amount.toString()}`);
  }

  /**
   * Process an FBTStaked event
   */
  async processFBTStakedEvent(
    args: FBTStakedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<FBTStake> {
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
    }

    // Check for existing active stake
    const existingStake = await this.prisma.fBTStake.findFirst({
      where: {
        stakerId: user.id,
        isActive: true,
      },
    });

    if (existingStake) {
      // Update existing stake - amount is now BigInt directly
      const updatedStake = await this.prisma.fBTStake.update({
        where: { id: existingStake.id },
        data: {
          amount: existingStake.amount + args.amount,
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaFBTStakeToDto(updatedStake);
    }

    // Create new stake - amount is BigInt
    const stake = await this.prisma.fBTStake.create({
      data: {
        stakerId: user.id,
        stakerAddress,
        amount: args.amount,
        txHash,
        blockNumber,
        chainId,
      },
    });

    // Update user FBT staked balance - fbtStakedBalance is now BigInt
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fbtStakedBalance: user.fbtStakedBalance + args.amount,
      },
    });

    this.logger.log(
      `Processed FBTStaked event: ${stakerAddress} staked ${args.amount.toString()}`,
    );

    return this.mapPrismaFBTStakeToDto(stake);
  }

  /**
   * Process an FBTUnstaked event
   */
  async processFBTUnstakedEvent(
    staker: string,
    amount: bigint,
    txHash: string,
  ): Promise<void> {
    const stakerAddress = staker.toLowerCase();

    const stake = await this.prisma.fBTStake.findFirst({
      where: {
        stakerAddress,
        isActive: true,
      },
      include: { staker: true },
    });

    if (!stake) {
      this.logger.warn(`No active FBT stake found for ${stakerAddress}`);
      return;
    }

    // amount is now BigInt directly
    const newAmount = stake.amount - amount;

    if (newAmount <= BigInt(0)) {
      // Full unstake
      await this.prisma.fBTStake.update({
        where: { id: stake.id },
        data: {
          amount: BigInt(0),
          isActive: false,
          unstakedAt: new Date(),
        },
      });
    } else {
      // Partial unstake
      await this.prisma.fBTStake.update({
        where: { id: stake.id },
        data: {
          amount: newAmount,
          updatedAt: new Date(),
        },
      });
    }

    // Update user FBT staked balance - fbtStakedBalance is now BigInt
    await this.prisma.user.update({
      where: { id: stake.stakerId },
      data: {
        fbtStakedBalance: stake.staker.fbtStakedBalance - amount,
      },
    });

    this.logger.log(
      `Processed FBTUnstaked event: ${stakerAddress} unstaked ${amount.toString()}`,
    );
  }

  /**
   * Process a YieldClaimed event
   */
  async processYieldClaimedEvent(
    staker: string,
    amount: bigint,
    txHash: string,
  ): Promise<void> {
    const stakerAddress = staker.toLowerCase();

    const stake = await this.prisma.fBTStake.findFirst({
      where: {
        stakerAddress,
        isActive: true,
      },
    });

    if (!stake) {
      this.logger.warn(`No active FBT stake found for ${stakerAddress}`);
      return;
    }

    // pendingYield and claimedYield are now BigInt
    await this.prisma.fBTStake.update({
      where: { id: stake.id },
      data: {
        pendingYield: BigInt(0),
        claimedYield: stake.claimedYield + amount,
      },
    });

    // Update treasury stats - totalYieldDistributed is now BigInt
    const stats = await this.getOrCreateTreasuryStats();
    await this.prisma.treasuryStats.update({
      where: { id: stats.id },
      data: {
        totalYieldDistributed: stats.totalYieldDistributed + amount,
      },
    });

    this.logger.log(
      `Processed YieldClaimed event: ${stakerAddress} claimed ${amount.toString()}`,
    );
  }

  /**
   * Process a YieldHarvested event (treasury endowment)
   */
  async processTreasuryYieldHarvestedEvent(yieldAmount: bigint): Promise<void> {
    const stats = await this.getOrCreateTreasuryStats();

    // Distribute yield to FBT stakers
    const activeStakes = await this.prisma.fBTStake.findMany({
      where: { isActive: true },
    });

    if (activeStakes.length === 0) {
      // No stakers, add to operational funds - fields are now BigInt
      await this.prisma.treasuryStats.update({
        where: { id: stats.id },
        data: {
          operationalFunds: stats.operationalFunds + yieldAmount,
          endowmentLifetimeYield: stats.endowmentLifetimeYield + yieldAmount,
          lastYieldHarvestedAt: new Date(),
        },
      });
      return;
    }

    // Calculate total FBT staked - amount is now BigInt directly
    const totalStaked = activeStakes.reduce(
      (sum, s) => sum + s.amount,
      BigInt(0),
    );

    // Distribute yield proportionally
    for (const stake of activeStakes) {
      const stakeShare = (yieldAmount * stake.amount) / totalStaked;

      // pendingYield is now BigInt
      await this.prisma.fBTStake.update({
        where: { id: stake.id },
        data: {
          pendingYield: stake.pendingYield + stakeShare,
        },
      });
    }

    // endowmentLifetimeYield is now BigInt
    await this.prisma.treasuryStats.update({
      where: { id: stats.id },
      data: {
        endowmentLifetimeYield: stats.endowmentLifetimeYield + yieldAmount,
        lastYieldHarvestedAt: new Date(),
      },
    });

    this.logger.log(
      `Processed TreasuryYieldHarvested event: ${yieldAmount.toString()} distributed to ${activeStakes.length} stakers`,
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Get or create treasury stats record
   */
  private async getOrCreateTreasuryStats() {
    let stats = await this.prisma.treasuryStats.findFirst();

    if (!stats) {
      stats = await this.prisma.treasuryStats.create({
        data: {},
      });
    }

    return stats;
  }

  /**
   * Map Prisma FBT stake to DTO
   * Converts BigInt fields to strings for API response
   */
  private mapPrismaFBTStakeToDto(stake: PrismaFBTStake): FBTStake {
    return {
      id: stake.id,
      stakerAddress: stake.stakerAddress,
      amount: stake.amount.toString(),
      pendingYield: stake.pendingYield.toString(),
      claimedYield: stake.claimedYield.toString(),
      txHash: stake.txHash,
      isActive: stake.isActive,
      stakedAt: stake.stakedAt,
      unstakedAt: stake.unstakedAt ?? undefined,
      shareOfTreasury: '0', // Calculated separately when needed
    };
  }

  /**
   * Map Prisma platform fee to DTO
   * Converts BigInt fields to strings for API response
   */
  private mapPrismaPlatformFeeToDto(fee: PrismaPlatformFee): PlatformFee {
    return {
      id: fee.id,
      sourceContract: fee.sourceContract,
      sourceType: this.mapPrismaFeeSourceTypeToDto(fee.sourceType),
      amount: fee.amount.toString(),
      txHash: fee.txHash,
      blockNumber: fee.blockNumber ?? undefined,
      isStaked: fee.isStaked,
      stakedAt: fee.stakedAt ?? undefined,
      stakedTxHash: fee.stakedTxHash ?? undefined,
      receivedAt: fee.receivedAt,
    };
  }

  /**
   * Map FeeSourceType enum to Prisma enum
   */
  private mapFeeSourceTypeToPrisma(type: FeeSourceType): PrismaFeeSourceType {
    const mapping: Record<FeeSourceType, PrismaFeeSourceType> = {
      [FeeSourceType.STAKING_POOL]: 'STAKING_POOL',
      [FeeSourceType.IMPACT_DAO_POOL]: 'IMPACT_DAO_POOL',
      [FeeSourceType.WEALTH_BUILDING]: 'WEALTH_BUILDING',
      [FeeSourceType.FUNDRAISER]: 'FUNDRAISER',
      [FeeSourceType.OTHER]: 'OTHER',
    };
    return mapping[type];
  }

  /**
   * Map Prisma FeeSourceType to DTO enum
   */
  private mapPrismaFeeSourceTypeToDto(
    type: PrismaFeeSourceType,
  ): FeeSourceType {
    const mapping: Record<PrismaFeeSourceType, FeeSourceType> = {
      STAKING_POOL: FeeSourceType.STAKING_POOL,
      IMPACT_DAO_POOL: FeeSourceType.IMPACT_DAO_POOL,
      WEALTH_BUILDING: FeeSourceType.WEALTH_BUILDING,
      FUNDRAISER: FeeSourceType.FUNDRAISER,
      OTHER: FeeSourceType.OTHER,
    };
    return mapping[type];
  }
}
