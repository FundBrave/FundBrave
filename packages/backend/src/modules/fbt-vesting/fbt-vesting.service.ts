import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FBTVestingSchedule as PrismaVestingSchedule,
  FBTVestingClaim as PrismaVestingClaim,
  FBTBurn as PrismaFBTBurn,
  VestingType as PrismaVestingType,
} from '@prisma/client';
import {
  VestingSchedule,
  VestingClaimEvent,
  FBTBurnEvent,
  VestingSummary,
  VestingStats,
  VestingBreakdown,
  VestingType,
  PaginatedVestingSchedules,
  PaginatedVestingClaims,
  PaginatedFBTBurns,
} from './dto';
import {
  VestingScheduleNotFoundException,
  NoClaimableTokensException,
  InvalidVestingDurationException,
} from '../../common/exceptions';
import {
  VESTING_DURATIONS,
  VestingScheduleCreatedEventArgs,
  TokensBurnedEventArgs,
} from '../../common/types';

/**
 * Service for managing FBT vesting operations
 * Handles vesting schedules, claims, and burns
 */
@Injectable()
export class FBTVestingService {
  private readonly logger = new Logger(FBTVestingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get all vesting schedules for a user
   */
  async getUserVestingSchedules(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedVestingSchedules> {
    const [schedules, total] = await Promise.all([
      this.prisma.fBTVestingSchedule.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.fBTVestingSchedule.count({
        where: { recipientId: userId },
      }),
    ]);

    const items = schedules.map((s) => this.mapPrismaScheduleToDto(s));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get vesting schedules by wallet address
   */
  async getSchedulesByAddress(
    address: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedVestingSchedules> {
    const [schedules, total] = await Promise.all([
      this.prisma.fBTVestingSchedule.findMany({
        where: { recipientAddress: address.toLowerCase() },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.fBTVestingSchedule.count({
        where: { recipientAddress: address.toLowerCase() },
      }),
    ]);

    const items = schedules.map((s) => this.mapPrismaScheduleToDto(s));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a specific vesting schedule
   */
  async getVestingSchedule(scheduleId: string): Promise<VestingSchedule> {
    const schedule = await this.prisma.fBTVestingSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new VestingScheduleNotFoundException(scheduleId);
    }

    return this.mapPrismaScheduleToDto(schedule);
  }

  /**
   * Get total claimable vested FBT for a user
   */
  async getClaimableAmount(userId: string): Promise<string> {
    const schedules = await this.prisma.fBTVestingSchedule.findMany({
      where: {
        recipientId: userId,
        isFullyClaimed: false,
      },
    });

    let totalClaimable = BigInt(0);

    for (const schedule of schedules) {
      const claimable = this.calculateClaimableAmount(schedule);
      totalClaimable += BigInt(claimable);
    }

    return totalClaimable.toString();
  }

  /**
   * Get total vested (not yet claimed) for a user
   */
  async getTotalVested(userId: string): Promise<string> {
    const schedules = await this.prisma.fBTVestingSchedule.findMany({
      where: { recipientId: userId },
      select: { totalAmount: true, releasedAmount: true },
    });

    // Fields are now BigInt directly
    const total = schedules.reduce((sum, s) => {
      const pending = s.totalAmount - s.releasedAmount;
      return sum + pending;
    }, BigInt(0));

    return total.toString();
  }

  /**
   * Get vesting summary for a user
   */
  async getVestingSummary(userId: string): Promise<VestingSummary> {
    const schedules = await this.prisma.fBTVestingSchedule.findMany({
      where: { recipientId: userId },
    });

    let totalVested = BigInt(0);
    let totalReleased = BigInt(0);
    let totalClaimable = BigInt(0);
    let activeCount = 0;
    let completedCount = 0;

    // Fields are now BigInt directly
    for (const schedule of schedules) {
      totalVested += schedule.totalAmount;
      totalReleased += schedule.releasedAmount;
      totalClaimable += BigInt(this.calculateClaimableAmount(schedule));

      if (schedule.isFullyClaimed) {
        completedCount++;
      } else {
        activeCount++;
      }
    }

    const totalPending = totalVested - totalReleased;

    return {
      totalVested: totalVested.toString(),
      totalReleased: totalReleased.toString(),
      totalClaimable: totalClaimable.toString(),
      totalPending: totalPending.toString(),
      scheduleCount: schedules.length,
      activeScheduleCount: activeCount,
      completedScheduleCount: completedCount,
    };
  }

  /**
   * Get platform-wide vesting statistics
   */
  async getVestingStats(): Promise<VestingStats> {
    const schedules = await this.prisma.fBTVestingSchedule.findMany();
    const burns = await this.prisma.fBTBurn.findMany();

    // Calculate totals
    let totalVested = BigInt(0);
    let totalClaimed = BigInt(0);
    let totalPending = BigInt(0);
    let activeCount = 0;

    const byType: Record<string, bigint> = {
      DONATION_REWARD: BigInt(0),
      ENGAGEMENT_REWARD: BigInt(0),
      TEAM_ALLOCATION: BigInt(0),
      INVESTOR: BigInt(0),
      ECOSYSTEM: BigInt(0),
    };

    // Fields are now BigInt directly
    for (const schedule of schedules) {
      totalVested += schedule.totalAmount;
      totalClaimed += schedule.releasedAmount;
      totalPending += schedule.totalAmount - schedule.releasedAmount;

      if (!schedule.isFullyClaimed) {
        activeCount++;
      }

      byType[schedule.vestingType] += schedule.totalAmount;
    }

    // Calculate burns - amount is now BigInt directly
    const totalBurned = burns.reduce(
      (sum, b) => sum + b.amount,
      BigInt(0),
    );

    // Get unique recipients
    const uniqueRecipients = await this.prisma.fBTVestingSchedule.groupBy({
      by: ['recipientAddress'],
    });

    return {
      totalVestedAmount: totalVested.toString(),
      totalClaimedAmount: totalClaimed.toString(),
      totalPendingAmount: totalPending.toString(),
      totalBurnedAmount: totalBurned.toString(),
      totalSchedules: schedules.length,
      activeSchedules: activeCount,
      uniqueRecipients: uniqueRecipients.length,
      byType: {
        donationRewards: byType.DONATION_REWARD.toString(),
        engagementRewards: byType.ENGAGEMENT_REWARD.toString(),
        teamAllocation: byType.TEAM_ALLOCATION.toString(),
        investor: byType.INVESTOR.toString(),
        ecosystem: byType.ECOSYSTEM.toString(),
      },
    };
  }

  /**
   * Get claim history for a schedule
   */
  async getScheduleClaims(
    scheduleId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedVestingClaims> {
    const [claims, total] = await Promise.all([
      this.prisma.fBTVestingClaim.findMany({
        where: { scheduleId },
        orderBy: { claimedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.fBTVestingClaim.count({
        where: { scheduleId },
      }),
    ]);

    // Convert BigInt to string for DTO
    const items: VestingClaimEvent[] = claims.map((c) => ({
      scheduleId: c.scheduleId,
      amount: c.amount.toString(),
      txHash: c.txHash,
      claimedAt: c.claimedAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get FBT burn history
   */
  async getBurnHistory(
    limit: number,
    offset: number,
  ): Promise<PaginatedFBTBurns> {
    const [burns, total] = await Promise.all([
      this.prisma.fBTBurn.findMany({
        orderBy: { burnedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.fBTBurn.count(),
    ]);

    // Convert BigInt to string for DTO
    const items: FBTBurnEvent[] = burns.map((b) => ({
      id: b.id,
      burnerAddress: b.burnerAddress,
      amount: b.amount.toString(),
      reason: b.reason ?? undefined,
      txHash: b.txHash,
      burnedAt: b.burnedAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get burn history for an address
   */
  async getBurnsByAddress(
    address: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedFBTBurns> {
    const [burns, total] = await Promise.all([
      this.prisma.fBTBurn.findMany({
        where: { burnerAddress: address.toLowerCase() },
        orderBy: { burnedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.fBTBurn.count({
        where: { burnerAddress: address.toLowerCase() },
      }),
    ]);

    // Convert BigInt to string for DTO
    const items: FBTBurnEvent[] = burns.map((b) => ({
      id: b.id,
      burnerAddress: b.burnerAddress,
      amount: b.amount.toString(),
      reason: b.reason ?? undefined,
      txHash: b.txHash,
      burnedAt: b.burnedAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  // ==================== Event Processing Methods ====================

  /**
   * Process a VestingScheduleCreated event
   */
  async processVestingScheduleCreatedEvent(
    args: VestingScheduleCreatedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<VestingSchedule> {
    const recipientAddress = args.recipient.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: recipientAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: recipientAddress,
        },
      });
    }

    // Determine vesting type based on duration
    const duration = Number(args.duration);
    let vestingType: PrismaVestingType;

    if (duration === VESTING_DURATIONS.DONATION_REWARD) {
      vestingType = 'DONATION_REWARD';
    } else if (duration === VESTING_DURATIONS.ENGAGEMENT_REWARD) {
      vestingType = 'ENGAGEMENT_REWARD';
    } else {
      vestingType = 'ECOSYSTEM'; // Default for custom durations
    }

    // Create schedule - totalAmount is now BigInt
    const schedule = await this.prisma.fBTVestingSchedule.create({
      data: {
        recipientId: user.id,
        recipientAddress,
        totalAmount: args.amount,
        startTime: new Date(Number(args.startTime) * 1000),
        duration,
        vestingType,
        txHash,
        blockNumber,
        chainId,
      },
    });

    // Update user stats - fbtVestedTotal is now BigInt
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fbtVestedTotal: user.fbtVestedTotal + args.amount,
      },
    });

    this.logger.log(
      `Processed VestingScheduleCreated event: ${args.amount.toString()} FBT vesting to ${recipientAddress}`,
    );

    return this.mapPrismaScheduleToDto(schedule);
  }

  /**
   * Process a VestedTokensClaimed event
   */
  async processVestedTokensClaimedEvent(
    recipient: string,
    amount: bigint,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const recipientAddress = recipient.toLowerCase();

    // Find the user's schedules with claimable amounts
    const schedules = await this.prisma.fBTVestingSchedule.findMany({
      where: {
        recipientAddress,
        isFullyClaimed: false,
      },
      orderBy: { startTime: 'asc' },
    });

    let remainingToClaim = amount;

    for (const schedule of schedules) {
      if (remainingToClaim <= BigInt(0)) break;

      const claimable = BigInt(this.calculateClaimableAmount(schedule));
      if (claimable <= BigInt(0)) continue;

      const claimFromThisSchedule =
        remainingToClaim < claimable ? remainingToClaim : claimable;

      // Create claim record - amount is now BigInt
      await this.prisma.fBTVestingClaim.create({
        data: {
          scheduleId: schedule.id,
          amount: claimFromThisSchedule,
          txHash: `${txHash}-${schedule.id}`,
          blockNumber,
          chainId,
        },
      });

      // Update schedule - releasedAmount and claimableAmount are now BigInt
      const newReleasedAmount = schedule.releasedAmount + claimFromThisSchedule;
      const isFullyClaimed = newReleasedAmount >= schedule.totalAmount;

      await this.prisma.fBTVestingSchedule.update({
        where: { id: schedule.id },
        data: {
          releasedAmount: newReleasedAmount,
          claimableAmount: BigInt(0),
          isFullyClaimed,
        },
      });

      remainingToClaim -= claimFromThisSchedule;
    }

    // Update user stats - fbtVestedClaimed is now BigInt
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: recipientAddress },
    });

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fbtVestedClaimed: user.fbtVestedClaimed + amount,
        },
      });
    }

    this.logger.log(
      `Processed VestedTokensClaimed event: ${amount.toString()} FBT claimed by ${recipientAddress}`,
    );
  }

  /**
   * Process a TokensBurned event
   */
  async processTokensBurnedEvent(
    args: TokensBurnedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
    reason?: string,
  ): Promise<void> {
    // amount is now BigInt
    await this.prisma.fBTBurn.create({
      data: {
        burnerAddress: args.account.toLowerCase(),
        amount: args.amount,
        reason,
        txHash,
        blockNumber,
        chainId,
      },
    });

    this.logger.log(
      `Processed TokensBurned event: ${args.amount.toString()} FBT burned by ${args.account}`,
    );
  }

  /**
   * Update claimable amounts for all schedules (scheduled job)
   */
  async updateAllClaimableAmounts(): Promise<void> {
    const schedules = await this.prisma.fBTVestingSchedule.findMany({
      where: { isFullyClaimed: false },
    });

    for (const schedule of schedules) {
      // calculateClaimableAmount returns string, convert to BigInt
      const claimable = BigInt(this.calculateClaimableAmount(schedule));
      const isFullyVested = this.isFullyVested(schedule);

      await this.prisma.fBTVestingSchedule.update({
        where: { id: schedule.id },
        data: {
          claimableAmount: claimable,
          isFullyVested,
        },
      });
    }

    this.logger.log(
      `Updated claimable amounts for ${schedules.length} schedules`,
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Calculate claimable amount for a schedule
   */
  private calculateClaimableAmount(schedule: PrismaVestingSchedule): string {
    const now = Date.now();
    const startTime = schedule.startTime.getTime();
    const endTime = startTime + schedule.duration * 1000;

    if (now < startTime) {
      return '0';
    }

    const elapsed = now - startTime;
    // Fields are now BigInt directly
    const total = schedule.totalAmount;
    const released = schedule.releasedAmount;

    let vested: bigint;
    if (now >= endTime) {
      vested = total;
    } else {
      vested = (total * BigInt(elapsed)) / BigInt(schedule.duration * 1000);
    }

    const claimable = vested > released ? vested - released : BigInt(0);
    return claimable.toString();
  }

  /**
   * Check if a schedule is fully vested
   */
  private isFullyVested(schedule: PrismaVestingSchedule): boolean {
    const now = Date.now();
    const endTime = schedule.startTime.getTime() + schedule.duration * 1000;
    return now >= endTime;
  }

  /**
   * Calculate vesting progress percentage
   */
  private calculateProgressPercent(schedule: PrismaVestingSchedule): string {
    const now = Date.now();
    const startTime = schedule.startTime.getTime();
    const endTime = startTime + schedule.duration * 1000;

    if (now < startTime) {
      return '0.00';
    }

    if (now >= endTime) {
      return '100.00';
    }

    const elapsed = now - startTime;
    const total = schedule.duration * 1000;
    const percent = (elapsed / total) * 100;

    return percent.toFixed(2);
  }

  /**
   * Map Prisma schedule to DTO
   * Converts BigInt fields to strings for API response
   */
  private mapPrismaScheduleToDto(
    schedule: PrismaVestingSchedule,
  ): VestingSchedule {
    return {
      id: schedule.id,
      recipientAddress: schedule.recipientAddress,
      totalAmount: schedule.totalAmount.toString(),
      releasedAmount: schedule.releasedAmount.toString(),
      claimableAmount: this.calculateClaimableAmount(schedule),
      startTime: schedule.startTime,
      duration: schedule.duration,
      vestingType: this.mapPrismaVestingTypeToDto(schedule.vestingType),
      isFullyVested: this.isFullyVested(schedule),
      isFullyClaimed: schedule.isFullyClaimed,
      txHash: schedule.txHash ?? undefined,
      createdAt: schedule.createdAt,
      progressPercent: this.calculateProgressPercent(schedule),
    };
  }

  /**
   * Map Prisma VestingType to DTO enum
   */
  private mapPrismaVestingTypeToDto(type: PrismaVestingType): VestingType {
    const mapping: Record<PrismaVestingType, VestingType> = {
      DONATION_REWARD: VestingType.DONATION_REWARD,
      ENGAGEMENT_REWARD: VestingType.ENGAGEMENT_REWARD,
      TEAM_ALLOCATION: VestingType.TEAM_ALLOCATION,
      INVESTOR: VestingType.INVESTOR,
      ECOSYSTEM: VestingType.ECOSYSTEM,
    };
    return mapping[type];
  }
}
