import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PlatformStats {
  totalFundraisers: number;
  activeFundraisers: number;
  totalRaised: string;
  totalDonations: number;
  uniqueDonors: number;
  totalStaked: string;
  uniqueStakers: number;
  totalUsers: number;
  totalPosts: number;
  fbtTotalSupply: string;
  fbtCirculating: string;
  platformFeesCollected: string;
}

/**
 * Helper function to safely convert BigInt or null to string
 */
function bigIntToString(value: bigint | null | undefined): string {
  return value?.toString() ?? '0';
}

export interface FundraiserAnalytics {
  fundraiserId: string;
  totalRaised: string;
  donationsCount: number;
  uniqueDonors: number;
  avgDonation: string;
  largestDonation: string;
  stakersCount: number;
  totalStaked: string;
  postsCount: number;
  engagementScore: number;
  conversionRate: number; // visitors to donors
  weeklyGrowth: number;
}

export interface UserAnalytics {
  userId: string;
  totalDonated: string;
  donationsCount: number;
  fundraisersDonatedTo: number;
  totalStaked: string;
  stakesCount: number;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  engagementRate: number;
  fbtBalance: string;
  reputationScore: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: string;
}

export interface PeriodComparison {
  current: string;
  previous: string;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const [
      totalFundraisers,
      activeFundraisers,
      donations,
      uniqueDonors,
      stakes,
      uniqueStakers,
      totalUsers,
      totalPosts,
      treasuryStats,
    ] = await Promise.all([
      this.prisma.fundraiser.count(),
      this.prisma.fundraiser.count({ where: { isActive: true } }),
      this.prisma.donation.aggregate({
        _sum: { amount: true }, // BigInt field
        _count: { id: true },
      }),
      this.prisma.donation.groupBy({ by: ['donorAddress'] }),
      this.prisma.stake.aggregate({
        where: { isActive: true },
        _sum: { amount: true }, // BigInt field
      }),
      this.prisma.stake.groupBy({
        by: ['stakerAddress'],
        where: { isActive: true },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.post.count(),
      this.prisma.treasuryStats.findFirst(),
    ]);

    return {
      totalFundraisers,
      activeFundraisers,
      totalRaised: bigIntToString(donations._sum?.amount),
      totalDonations: donations._count?.id ?? 0,
      uniqueDonors: uniqueDonors.length,
      totalStaked: bigIntToString(stakes._sum?.amount),
      uniqueStakers: uniqueStakers.length,
      totalUsers,
      totalPosts,
      fbtTotalSupply: '0', // TODO: Fetch from contract
      fbtCirculating: '0', // TODO: Calculate circulating supply
      platformFeesCollected: bigIntToString(treasuryStats?.totalFeesCollected),
    };
  }

  /**
   * Get fundraiser analytics
   */
  async getFundraiserAnalytics(fundraiserId: string): Promise<FundraiserAnalytics> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser) {
      throw new Error('Fundraiser not found');
    }

    const [donations, uniqueDonors, stakes, posts] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { fundraiserId },
        _sum: { amount: true }, // BigInt field
        _count: { id: true },
        _max: { amount: true }, // BigInt field
      }),
      this.prisma.donation.groupBy({
        by: ['donorAddress'],
        where: { fundraiserId },
      }),
      this.prisma.stake.aggregate({
        where: { fundraiserId, isActive: true },
        _sum: { amount: true }, // BigInt field
        _count: { id: true },
      }),
      this.prisma.post.count({
        where: { fundraiserId },
      }),
    ]);

    const totalRaisedBigInt = donations._sum?.amount ?? BigInt(0);
    const donationsCount = donations._count?.id ?? 0;
    const avgDonation = donationsCount > 0
      ? (totalRaisedBigInt / BigInt(donationsCount)).toString()
      : '0';

    // Calculate weekly growth
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const lastWeekDonations = await this.prisma.donation.aggregate({
      where: {
        fundraiserId,
        createdAt: { gte: weekAgo },
      },
      _sum: { amount: true }, // BigInt field
    });

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const previousWeekDonations = await this.prisma.donation.aggregate({
      where: {
        fundraiserId,
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
      _sum: { amount: true }, // BigInt field
    });

    const current = lastWeekDonations._sum?.amount ?? BigInt(0);
    const previous = previousWeekDonations._sum?.amount ?? BigInt(0);
    const weeklyGrowth = previous > BigInt(0)
      ? Number(((current - previous) * BigInt(10000)) / previous) / 100
      : 0;

    return {
      fundraiserId,
      totalRaised: bigIntToString(totalRaisedBigInt),
      donationsCount,
      uniqueDonors: uniqueDonors.length,
      avgDonation,
      largestDonation: bigIntToString(donations._max?.amount),
      stakersCount: stakes._count?.id ?? 0,
      totalStaked: bigIntToString(stakes._sum?.amount),
      postsCount: posts,
      engagementScore: fundraiser.donorsCount + fundraiser.stakersCount * 2,
      conversionRate: 0, // Would need page view tracking
      weeklyGrowth,
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [donations, stakes, posts] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { donorId: userId },
        _sum: { amount: true }, // BigInt field
        _count: { id: true },
      }),
      this.prisma.stake.aggregate({
        where: { stakerId: userId, isActive: true },
        _sum: { amount: true }, // BigInt field
        _count: { id: true },
      }),
      this.prisma.post.aggregate({
        where: { authorId: userId },
        _count: { id: true },
        _sum: { likesCount: true, repostsCount: true },
      }),
    ]);

    const fundraisersDonatedTo = await this.prisma.donation.groupBy({
      by: ['fundraiserId'],
      where: { donorId: userId },
    });

    // Calculate engagement rate
    const totalEngagement = (posts._sum?.likesCount ?? 0) + (posts._sum?.repostsCount ?? 0);
    const engagementRate = user.followersCount > 0
      ? (totalEngagement / (user.followersCount * (posts._count?.id || 1))) * 100
      : 0;

    return {
      userId,
      totalDonated: bigIntToString(donations._sum?.amount),
      donationsCount: donations._count?.id ?? 0,
      fundraisersDonatedTo: fundraisersDonatedTo.length,
      totalStaked: bigIntToString(stakes._sum?.amount),
      stakesCount: stakes._count?.id ?? 0,
      postsCount: posts._count?.id ?? 0,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      engagementRate,
      fbtBalance: bigIntToString(user.fbtBalance),
      reputationScore: user.reputationScore,
    };
  }

  /**
   * Get donation time series
   */
  async getDonationTimeSeries(
    period: 'day' | 'week' | 'month',
    fundraiserId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const donations = await this.prisma.donation.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(fundraiserId ? { fundraiserId } : {}),
      },
      select: {
        amount: true, // BigInt field
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped = new Map<string, bigint>();
    for (const donation of donations) {
      const date = donation.createdAt.toISOString().split('T')[0];
      const current = grouped.get(date) || BigInt(0);
      grouped.set(date, current + donation.amount); // amount is already BigInt
    }

    return Array.from(grouped.entries()).map(([date, value]) => ({
      date,
      value: value.toString(),
    }));
  }

  /**
   * Get period comparison stats
   */
  async getPeriodComparison(
    metric: 'donations' | 'stakers' | 'users',
    days: number = 7,
  ): Promise<PeriodComparison> {
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

    let current: string;
    let previous: string;

    switch (metric) {
      case 'donations': {
        const [currentDonations, previousDonations] = await Promise.all([
          this.prisma.donation.aggregate({
            where: { createdAt: { gte: currentPeriodStart } },
            _sum: { amount: true }, // BigInt field
          }),
          this.prisma.donation.aggregate({
            where: { createdAt: { gte: previousPeriodStart, lt: currentPeriodStart } },
            _sum: { amount: true }, // BigInt field
          }),
        ]);
        current = bigIntToString(currentDonations._sum?.amount);
        previous = bigIntToString(previousDonations._sum?.amount);
        break;
      }
      case 'stakers': {
        const [currentStakers, previousStakers] = await Promise.all([
          this.prisma.stake.count({ where: { stakedAt: { gte: currentPeriodStart } } }),
          this.prisma.stake.count({ where: { stakedAt: { gte: previousPeriodStart, lt: currentPeriodStart } } }),
        ]);
        current = currentStakers.toString();
        previous = previousStakers.toString();
        break;
      }
      case 'users': {
        const [currentUsers, previousUsers] = await Promise.all([
          this.prisma.user.count({ where: { createdAt: { gte: currentPeriodStart } } }),
          this.prisma.user.count({ where: { createdAt: { gte: previousPeriodStart, lt: currentPeriodStart } } }),
        ]);
        current = currentUsers.toString();
        previous = previousUsers.toString();
        break;
      }
    }

    const currentBigInt = BigInt(current);
    const previousBigInt = BigInt(previous);
    const changePercent = previousBigInt > BigInt(0)
      ? Number(((currentBigInt - previousBigInt) * BigInt(10000)) / previousBigInt) / 100
      : 0;

    return {
      current,
      previous,
      changePercent,
      trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable',
    };
  }

  /**
   * Get top fundraisers by metric
   */
  async getTopFundraisers(
    metric: 'raised' | 'donors' | 'stakers',
    limit: number = 10,
  ) {
    const orderBy = {
      raised: { raisedAmount: 'desc' as const },
      donors: { donorsCount: 'desc' as const },
      stakers: { stakersCount: 'desc' as const },
    };

    return this.prisma.fundraiser.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        images: true,
        raisedAmount: true,
        goalAmount: true,
        donorsCount: true,
        stakersCount: true,
      },
      orderBy: orderBy[metric],
      take: limit,
    });
  }
}
