import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WealthBuildingDonation as PrismaWealthBuildingDonation,
  DonorStockPortfolio as PrismaDonorStockPortfolio,
} from '@prisma/client';
import {
  WealthBuildingDonation,
  EndowmentInfo,
  PendingEndowmentYield,
  StockPortfolio,
  StockHolding,
  WealthBuildingStats,
  SupportedStockInfo,
  PaginatedWealthBuildingDonations,
  PaginatedStockPurchases,
  StockPurchaseEvent,
} from './dto';
import {
  EndowmentNotFoundException,
  InvalidDonationAmountException,
  UnsupportedStockException,
  FundraiserNotFoundException,
} from '../../common/exceptions';
import {
  WEALTH_BUILDING_SPLITS,
  DonationMadeEventArgs,
  StockPurchasedEventArgs,
} from '../../common/types';

/**
 * Service for managing Wealth Building Donation operations
 * Handles 80/20 donations with perpetual yield generation
 */
@Injectable()
export class WealthBuildingService {
  private readonly logger = new Logger(WealthBuildingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Query Methods ====================

  /**
   * Get platform-wide wealth building statistics
   */
  async getWealthBuildingStats(): Promise<WealthBuildingStats> {
    const donations = await this.prisma.wealthBuildingDonation.findMany();

    const stats = donations.reduce(
      (acc, donation) => ({
        totalDonations: acc.totalDonations + donation.totalAmount,
        totalDirectToBeneficiaries:
          acc.totalDirectToBeneficiaries + donation.directAmount,
        totalEndowmentPrincipal:
          acc.totalEndowmentPrincipal + donation.endowmentPrincipal,
        totalYieldGenerated: acc.totalYieldGenerated + donation.lifetimeYield,
        totalCauseYieldPaid: acc.totalCauseYieldPaid + donation.causeYieldPaid,
        totalDonorStockValue:
          acc.totalDonorStockValue + donation.donorStockValue,
      }),
      {
        totalDonations: BigInt(0),
        totalDirectToBeneficiaries: BigInt(0),
        totalEndowmentPrincipal: BigInt(0),
        totalYieldGenerated: BigInt(0),
        totalCauseYieldPaid: BigInt(0),
        totalDonorStockValue: BigInt(0),
      },
    );

    // Get unique donors count
    const uniqueDonors = await this.prisma.wealthBuildingDonation.groupBy({
      by: ['donorAddress'],
    });

    // Get active fundraisers with wealth building enabled
    const activeFundraisers = await this.prisma.fundraiser.count({
      where: {
        endowmentEnabled: true,
        isActive: true,
      },
    });

    return {
      totalDonations: stats.totalDonations.toString(),
      totalDirectToBeneficiaries: stats.totalDirectToBeneficiaries.toString(),
      totalEndowmentPrincipal: stats.totalEndowmentPrincipal.toString(),
      totalYieldGenerated: stats.totalYieldGenerated.toString(),
      totalCauseYieldPaid: stats.totalCauseYieldPaid.toString(),
      totalDonorStockValue: stats.totalDonorStockValue.toString(),
      donationsCount: donations.length,
      uniqueDonorsCount: uniqueDonors.length,
      activeFundraisersCount: activeFundraisers,
    };
  }

  /**
   * Get user's wealth building donations
   */
  async getUserDonations(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedWealthBuildingDonations> {
    const [donations, total] = await Promise.all([
      this.prisma.wealthBuildingDonation.findMany({
        where: { donorId: userId },
        include: {
          fundraiser: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.wealthBuildingDonation.count({
        where: { donorId: userId },
      }),
    ]);

    const items = donations.map((d) =>
      this.mapPrismaDonationToDto(d, d.fundraiser.name),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get user's stock portfolio
   */
  async getUserStockPortfolio(userId: string): Promise<StockPortfolio> {
    const holdings = await this.prisma.donorStockPortfolio.findMany({
      where: { donorId: userId },
    });

    if (holdings.length === 0) {
      return {
        holdings: [],
        totalValueUSD: '0',
        totalInvestedUSD: '0',
        totalGainLossPercent: '0',
        holdingsCount: 0,
      };
    }

    const stockHoldings: StockHolding[] = holdings.map((h) => {
      const invested = h.totalUSDCInvested;
      const current = h.currentValueUSD;
      const gainLoss =
        invested > BigInt(0)
          ? ((current - invested) * BigInt(10000)) / invested
          : BigInt(0);

      return {
        stockToken: h.stockToken,
        stockSymbol: h.stockSymbol,
        balance: h.stockBalance.toString(),
        totalUSDCInvested: h.totalUSDCInvested.toString(),
        currentValueUSD: h.currentValueUSD.toString(),
        gainLossPercent: (Number(gainLoss) / 100).toFixed(2),
      };
    });

    const totalInvested = holdings.reduce(
      (sum, h) => sum + h.totalUSDCInvested,
      BigInt(0),
    );
    const totalValue = holdings.reduce(
      (sum, h) => sum + h.currentValueUSD,
      BigInt(0),
    );
    const totalGainLoss =
      totalInvested > BigInt(0)
        ? ((totalValue - totalInvested) * BigInt(10000)) / totalInvested
        : BigInt(0);

    return {
      holdings: stockHoldings,
      totalValueUSD: totalValue.toString(),
      totalInvestedUSD: totalInvested.toString(),
      totalGainLossPercent: (Number(totalGainLoss) / 100).toFixed(2),
      holdingsCount: holdings.length,
    };
  }

  /**
   * Get endowment information for a specific donation
   */
  async getEndowmentInfo(donationId: string): Promise<EndowmentInfo> {
    const donation = await this.prisma.wealthBuildingDonation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      throw new EndowmentNotFoundException();
    }

    // TODO: Calculate pending yield from contract
    const pendingCauseYield = '0';
    const pendingDonorYield = '0';

    return {
      donationId: donation.id,
      donorAddress: donation.donorAddress,
      fundraiserId: parseInt(donation.fundraiserId),
      principal: donation.endowmentPrincipal.toString(),
      lifetimeYield: donation.lifetimeYield.toString(),
      causeYieldPaid: donation.causeYieldPaid.toString(),
      donorStockValue: donation.donorStockValue.toString(),
      lastHarvestTime: donation.lastHarvestAt ?? undefined,
      pendingCauseYield,
      pendingDonorYield,
    };
  }

  /**
   * Get all wealth building donations for a fundraiser
   */
  async getFundraiserEndowments(
    fundraiserId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedWealthBuildingDonations> {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(fundraiserId);
    }

    const [donations, total] = await Promise.all([
      this.prisma.wealthBuildingDonation.findMany({
        where: { fundraiserId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.wealthBuildingDonation.count({
        where: { fundraiserId },
      }),
    ]);

    const items = donations.map((d) =>
      this.mapPrismaDonationToDto(d, fundraiser.name),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get pending yield for all user's endowments
   */
  async getUserPendingEndowmentYields(
    userId: string,
  ): Promise<PendingEndowmentYield[]> {
    const donations = await this.prisma.wealthBuildingDonation.findMany({
      where: { donorId: userId },
      include: {
        fundraiser: {
          select: { onChainId: true },
        },
      },
    });

    // TODO: Fetch actual pending yields from contract
    return donations.map((d) => ({
      donationId: d.id,
      fundraiserId: d.fundraiser.onChainId,
      causeYield: '0',
      donorYield: '0',
      totalYield: '0',
    }));
  }

  /**
   * Get supported stock tokens
   */
  async getSupportedStocks(): Promise<SupportedStockInfo[]> {
    const stocks = await this.prisma.supportedStock.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { symbol: 'asc' }],
    });

    return stocks.map((s) => ({
      tokenAddress: s.tokenAddress,
      symbol: s.symbol,
      name: s.name,
      decimals: s.decimals,
      underlyingAsset: s.underlyingAsset ?? undefined,
      lastPrice: s.lastPrice ?? undefined,
      lastPriceAt: s.lastPriceAt ?? undefined,
      isDefault: s.isDefault,
    }));
  }

  /**
   * Get stock purchase history for a user
   */
  async getUserStockPurchases(
    donorAddress: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedStockPurchases> {
    const [purchases, total] = await Promise.all([
      this.prisma.stockPurchase.findMany({
        where: { donorAddress: donorAddress.toLowerCase() },
        orderBy: { purchasedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.stockPurchase.count({
        where: { donorAddress: donorAddress.toLowerCase() },
      }),
    ]);

    const items: StockPurchaseEvent[] = purchases.map((p) => ({
      donorAddress: p.donorAddress,
      stockToken: p.stockToken,
      stockSymbol: p.stockSymbol,
      usdcAmount: p.usdcAmount.toString(),
      stockAmount: p.stockAmount.toString(),
      txHash: p.txHash,
      purchasedAt: p.purchasedAt,
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  // ==================== Event Processing Methods ====================

  /**
   * Process a DonationMade event from the blockchain
   */
  async processDonationMadeEvent(
    args: DonationMadeEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<WealthBuildingDonation> {
    const donorAddress = args.donor.toLowerCase();
    const fundraiserId = Number(args.fundraiserId);

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

    // Find fundraiser
    const fundraiser = await this.prisma.fundraiser.findFirst({
      where: { onChainId: fundraiserId },
    });

    if (!fundraiser) {
      this.logger.warn(`Fundraiser ${fundraiserId} not found for donation`);
      throw new FundraiserNotFoundException(fundraiserId);
    }

    // Create donation record (all amount fields are now BigInt)
    const donation = await this.prisma.wealthBuildingDonation.create({
      data: {
        txHash,
        donorId: user.id,
        donorAddress,
        fundraiserId: fundraiser.id,
        beneficiaryAddr: fundraiser.beneficiary,
        totalAmount: args.totalAmount,
        directAmount: args.directAmount,
        endowmentAmount: args.endowmentAmount,
        platformFee: args.platformFee,
        endowmentPrincipal: args.endowmentAmount,
        chainId,
        blockNumber,
      },
    });

    // Update user stats (totalDonated is now BigInt)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        totalDonated: user.totalDonated + args.totalAmount,
      },
    });

    // Update fundraiser stats (amount fields are now BigInt)
    await this.prisma.fundraiser.update({
      where: { id: fundraiser.id },
      data: {
        raisedAmount: fundraiser.raisedAmount + args.directAmount,
        endowmentEnabled: true,
        endowmentPrincipal:
          fundraiser.endowmentPrincipal + args.endowmentAmount,
        donorsCount: { increment: 1 },
      },
    });

    this.logger.log(
      `Processed DonationMade event: ${donorAddress} donated ${args.totalAmount.toString()} to fundraiser ${fundraiserId}`,
    );

    return this.mapPrismaDonationToDto(donation, fundraiser.name);
  }

  /**
   * Process a YieldHarvested event for a donation
   */
  async processYieldHarvestedEvent(
    donor: string,
    fundraiserId: bigint,
    yieldAmount: bigint,
    causeShare: bigint,
    donorShare: bigint,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const donorAddress = donor.toLowerCase();

    const donation = await this.prisma.wealthBuildingDonation.findFirst({
      where: {
        donorAddress,
        fundraiser: {
          onChainId: Number(fundraiserId),
        },
      },
    });

    if (!donation) {
      this.logger.warn(
        `No donation found for ${donorAddress} and fundraiser ${fundraiserId}`,
      );
      return;
    }

    // Create harvest record (all amount fields are now BigInt)
    await this.prisma.wealthBuildingYieldHarvest.create({
      data: {
        donationId: donation.id,
        yieldAmount: yieldAmount,
        causeShare: causeShare,
        donorShare: donorShare,
        txHash,
        blockNumber,
        chainId,
      },
    });

    // Update donation stats (amount fields are now BigInt)
    await this.prisma.wealthBuildingDonation.update({
      where: { id: donation.id },
      data: {
        lifetimeYield: donation.lifetimeYield + yieldAmount,
        causeYieldPaid: donation.causeYieldPaid + causeShare,
        lastHarvestAt: new Date(),
      },
    });

    // Update fundraiser yield stats
    await this.prisma.fundraiser.update({
      where: { id: donation.fundraiserId },
      data: {
        endowmentYield: {
          increment: yieldAmount,
        },
      },
    });

    this.logger.log(
      `Processed YieldHarvested event: ${yieldAmount.toString()} yield for donation ${donation.id}`,
    );
  }

  /**
   * Process a StockPurchased event
   */
  async processStockPurchasedEvent(
    args: StockPurchasedEventArgs,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const donorAddress = args.donor.toLowerCase();

    // Get stock info
    const stockInfo = await this.prisma.supportedStock.findUnique({
      where: { tokenAddress: args.stockToken.toLowerCase() },
    });

    if (!stockInfo) {
      this.logger.warn(`Unknown stock token: ${args.stockToken}`);
    }

    // Create purchase record (amount fields are now BigInt)
    await this.prisma.stockPurchase.create({
      data: {
        donorAddress,
        stockToken: args.stockToken.toLowerCase(),
        stockSymbol: stockInfo?.symbol ?? 'UNKNOWN',
        usdcAmount: args.usdcAmount,
        stockAmount: args.stockAmount,
        txHash,
        blockNumber,
        chainId,
      },
    });

    // Update or create portfolio entry
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: donorAddress },
    });

    if (user) {
      const existingPortfolio =
        await this.prisma.donorStockPortfolio.findUnique({
          where: {
            donorId_stockToken: {
              donorId: user.id,
              stockToken: args.stockToken.toLowerCase(),
            },
          },
        });

      if (existingPortfolio) {
        await this.prisma.donorStockPortfolio.update({
          where: { id: existingPortfolio.id },
          data: {
            stockBalance: existingPortfolio.stockBalance + args.stockAmount,
            totalUSDCInvested:
              existingPortfolio.totalUSDCInvested + args.usdcAmount,
          },
        });
      } else {
        await this.prisma.donorStockPortfolio.create({
          data: {
            donorId: user.id,
            donorAddress,
            stockToken: args.stockToken.toLowerCase(),
            stockSymbol: stockInfo?.symbol ?? 'UNKNOWN',
            stockBalance: args.stockAmount,
            totalUSDCInvested: args.usdcAmount,
          },
        });
      }

      // Update donation donor stock value if applicable
      const donation = await this.prisma.wealthBuildingDonation.findFirst({
        where: { donorAddress },
        orderBy: { createdAt: 'desc' },
      });

      if (donation) {
        await this.prisma.wealthBuildingDonation.update({
          where: { id: donation.id },
          data: {
            donorStockValue: donation.donorStockValue + args.usdcAmount,
          },
        });
      }
    }

    this.logger.log(
      `Processed StockPurchased event: ${donorAddress} purchased ${args.stockAmount.toString()} of ${args.stockToken}`,
    );
  }

  /**
   * Process FundraiserRegistered event
   */
  async processFundraiserRegisteredEvent(
    fundraiserId: bigint,
    beneficiary: string,
  ): Promise<void> {
    const fundraiser = await this.prisma.fundraiser.findFirst({
      where: { onChainId: Number(fundraiserId) },
    });

    if (fundraiser) {
      await this.prisma.fundraiser.update({
        where: { id: fundraiser.id },
        data: {
          endowmentEnabled: true,
        },
      });

      this.logger.log(`Enabled wealth building for fundraiser ${fundraiserId}`);
    }
  }

  // ==================== Admin Methods ====================

  /**
   * Update stock price (called by scheduled job)
   */
  async updateStockPrice(tokenAddress: string, price: string): Promise<void> {
    await this.prisma.supportedStock.update({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      data: {
        lastPrice: price,
        lastPriceAt: new Date(),
      },
    });

    // Update all portfolio current values for this stock
    const holdings = await this.prisma.donorStockPortfolio.findMany({
      where: { stockToken: tokenAddress.toLowerCase() },
    });

    for (const holding of holdings) {
      // Simple calculation: balance * price (assuming both have same decimals)
      const currentValue =
        (holding.stockBalance * BigInt(price)) / BigInt(10 ** 18);

      await this.prisma.donorStockPortfolio.update({
        where: { id: holding.id },
        data: {
          currentValueUSD: currentValue,
        },
      });
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Map Prisma donation to DTO
   */
  private mapPrismaDonationToDto(
    donation: PrismaWealthBuildingDonation,
    fundraiserName: string,
  ): WealthBuildingDonation {
    return {
      id: donation.id,
      donorAddress: donation.donorAddress,
      fundraiserId: parseInt(donation.fundraiserId),
      fundraiserName,
      beneficiaryAddr: donation.beneficiaryAddr,
      totalAmount: donation.totalAmount.toString(),
      directAmount: donation.directAmount.toString(),
      endowmentAmount: donation.endowmentAmount.toString(),
      platformFee: donation.platformFee.toString(),
      endowmentPrincipal: donation.endowmentPrincipal.toString(),
      lifetimeYield: donation.lifetimeYield.toString(),
      causeYieldPaid: donation.causeYieldPaid.toString(),
      donorStockValue: donation.donorStockValue.toString(),
      txHash: donation.txHash,
      createdAt: donation.createdAt,
      lastHarvestAt: donation.lastHarvestAt ?? undefined,
    };
  }
}
