import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractsService } from './contracts.service';
import {
  RecordDonationFromTxDto,
  ParsedDonationDto,
  TransactionVerificationResultDto,
  VerifyTransactionDto,
} from './dto';
import {
  FundraiserNotFoundException,
  DuplicateTransactionException,
  BlockchainTransactionException,
  InvalidInputException,
} from '../../common/exceptions';
import { DEFAULT_CHAIN_ID } from './config/deployments';
import { Donation } from '../donations/dto';
import { FUNDRAISER_ABI, FUNDRAISER_FACTORY_ABI } from './abis';
import { Interface, Log } from 'ethers';

// Chain name mapping
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  43114: 'Avalanche',
  42161: 'Arbitrum',
  10: 'Optimism',
  11155111: 'Sepolia',
  80001: 'Mumbai',
  31337: 'Localhost',
};

/**
 * Service for blockchain operations related to donations.
 * Handles:
 * - Verifying donation transactions
 * - Parsing donation events from transaction logs
 * - Recording verified donations to database
 */
@Injectable()
export class DonationBlockchainService {
  private readonly logger = new Logger(DonationBlockchainService.name);

  // Interface for parsing logs
  private readonly fundraiserInterface: Interface;
  private readonly factoryInterface: Interface;

  constructor(
    private readonly prisma: PrismaService,
    private readonly contractsService: ContractsService,
  ) {
    this.fundraiserInterface = new Interface(FUNDRAISER_ABI);
    this.factoryInterface = new Interface(FUNDRAISER_FACTORY_ABI);
  }

  // ==================== Transaction Verification ====================

  /**
   * Verify a transaction exists and was successful
   */
  async verifyTransaction(
    input: VerifyTransactionDto,
  ): Promise<TransactionVerificationResultDto> {
    const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

    try {
      const receipt = await this.contractsService.getTransactionReceipt(
        input.txHash,
        chainId,
      );

      if (!receipt) {
        // Check if transaction exists but is pending
        const tx = await this.contractsService.getTransaction(
          input.txHash,
          chainId,
        );

        if (tx) {
          return {
            isValid: false,
            status: 'pending',
          };
        }

        return {
          isValid: false,
          status: 'not_found',
        };
      }

      if (receipt.status === 0) {
        return {
          isValid: false,
          status: 'failed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          error: 'Transaction reverted',
        };
      }

      return {
        isValid: true,
        status: 'success',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        isValid: false,
        status: 'not_found',
        error: message,
      };
    }
  }

  /**
   * Parse donation details from a transaction
   */
  async parseDonationTransaction(
    txHash: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<ParsedDonationDto | null> {
    const receipt = await this.contractsService.getTransactionReceipt(
      txHash,
      chainId,
    );

    if (!receipt || receipt.status === 0) {
      return null;
    }

    // Try to parse DonationCredited event from Fundraiser contract
    const donationEvent = this.parseDonationCreditedEvent(receipt.logs);
    if (donationEvent) {
      const timestamp = await this.contractsService.getBlockTimestamp(
        receipt.blockNumber,
        chainId,
      );

      return {
        donorAddress: donationEvent.donor,
        amount: donationEvent.amount.toString(),
        token: 'USDC', // Default token
        fundraiserOnChainId: donationEvent.fundraiserId,
        isWealthBuilding: false,
        blockNumber: receipt.blockNumber,
        timestamp,
      };
    }

    // Try to parse WealthBuildingDonationMade event from Factory
    const wealthBuildingEvent = this.parseWealthBuildingEvent(receipt.logs);
    if (wealthBuildingEvent) {
      const timestamp = await this.contractsService.getBlockTimestamp(
        receipt.blockNumber,
        chainId,
      );

      return {
        donorAddress: wealthBuildingEvent.donor,
        amount: wealthBuildingEvent.totalAmount.toString(),
        token: 'USDC',
        fundraiserOnChainId: wealthBuildingEvent.fundraiserId,
        isWealthBuilding: true,
        directAmount: wealthBuildingEvent.directAmount.toString(),
        endowmentAmount: wealthBuildingEvent.endowmentAmount.toString(),
        blockNumber: receipt.blockNumber,
        timestamp,
      };
    }

    return null;
  }

  // ==================== Donation Recording ====================

  /**
   * Record a donation from a verified transaction
   * This is called by the frontend after the user signs the donation transaction
   */
  async recordDonationFromTransaction(
    input: RecordDonationFromTxDto,
    userId?: string,
  ): Promise<Donation> {
    const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

    // Check for duplicate transaction
    const existing = await this.prisma.donation.findUnique({
      where: { txHash: input.txHash },
    });

    if (existing) {
      throw new DuplicateTransactionException(input.txHash);
    }

    // Verify the transaction
    const verification = await this.verifyTransaction({
      txHash: input.txHash,
      chainId,
    });

    if (!verification.isValid) {
      throw new BlockchainTransactionException(
        input.txHash,
        verification.error ?? `Transaction ${verification.status}`,
      );
    }

    // Parse the donation details from the transaction
    const parsedDonation = await this.parseDonationTransaction(
      input.txHash,
      chainId,
    );

    if (!parsedDonation) {
      throw new InvalidInputException(
        'Could not parse donation event from transaction. Ensure this is a valid donation transaction.',
      );
    }

    // Find the fundraiser
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: input.fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(input.fundraiserId);
    }

    // Verify the parsed donation matches the fundraiser
    if (fundraiser.onChainId !== parsedDonation.fundraiserOnChainId) {
      throw new InvalidInputException(
        `Transaction donation is for fundraiser ${parsedDonation.fundraiserOnChainId}, but requested fundraiser has on-chain ID ${fundraiser.onChainId}`,
      );
    }

    // Find or create user
    let user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId } })
      : await this.prisma.user.findUnique({
          where: { walletAddress: parsedDonation.donorAddress.toLowerCase() },
        });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: parsedDonation.donorAddress.toLowerCase(),
        },
      });
    }

    const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
    const amountBigInt = BigInt(parsedDonation.amount);

    // Create the donation record
    const donation = await this.prisma.$transaction(async (tx) => {
      const newDonation = await tx.donation.create({
        data: {
          txHash: input.txHash,
          amount: amountBigInt,
          amountUSD: parsedDonation.amount,
          token: parsedDonation.token,
          chainId,
          sourceChain: chainName,
          blockNumber: verification.blockNumber,
          donorId: user.id,
          donorAddress: parsedDonation.donorAddress.toLowerCase(),
          fundraiserId: input.fundraiserId,
          isAnonymous: input.isAnonymous ?? false,
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
          donorsCount: { increment: 1 },
          goalReached,
          // Update endowment if wealth building
          ...(parsedDonation.isWealthBuilding && parsedDonation.endowmentAmount
            ? {
                endowmentEnabled: true,
                endowmentPrincipal: {
                  increment: BigInt(parsedDonation.endowmentAmount),
                },
              }
            : {}),
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

      // Check and update milestones
      const milestones = await tx.milestone.findMany({
        where: {
          fundraiserId: input.fundraiserId,
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
      `Recorded donation ${donation.id}: ${parsedDonation.amount} from ${parsedDonation.donorAddress} to fundraiser ${input.fundraiserId}`,
    );

    return this.mapToDonationDto(donation);
  }

  // ==================== Event Parsing ====================

  /**
   * Parse DonationCredited event from logs
   */
  private parseDonationCreditedEvent(
    logs: readonly Log[],
  ): { donor: string; amount: bigint; fundraiserId: number } | null {
    for (const log of logs) {
      try {
        const parsed = this.fundraiserInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed && parsed.name === 'DonationCredited') {
          // Get fundraiser ID from the contract address
          // Note: In a real implementation, you'd look up the fundraiser ID
          // from the contract address in your registry
          return {
            donor: parsed.args[0] as string,
            amount: parsed.args[1] as bigint,
            fundraiserId: 0, // Will be determined from fundraiser lookup
          };
        }
      } catch {
        // Not a matching log
      }
    }
    return null;
  }

  /**
   * Parse WealthBuildingDonationMade event from logs
   */
  private parseWealthBuildingEvent(logs: readonly Log[]): {
    donor: string;
    fundraiserId: number;
    totalAmount: bigint;
    directAmount: bigint;
    endowmentAmount: bigint;
  } | null {
    for (const log of logs) {
      try {
        const parsed = this.factoryInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed && parsed.name === 'WealthBuildingDonationMade') {
          return {
            donor: parsed.args[0] as string,
            fundraiserId: Number(parsed.args[1]),
            totalAmount: parsed.args[2] as bigint,
            directAmount: parsed.args[3] as bigint,
            endowmentAmount: parsed.args[4] as bigint,
          };
        }
      } catch {
        // Not a matching log
      }
    }
    return null;
  }

  // ==================== Helper Methods ====================

  /**
   * Map Prisma donation to DTO
   */
  private mapToDonationDto(donation: any): Donation {
    return {
      id: donation.id,
      txHash: donation.txHash,
      amount: donation.amount.toString(),
      amountUSD: donation.amountUSD,
      token: donation.token,
      chainId: donation.chainId,
      sourceChain: donation.sourceChain,
      blockNumber: donation.blockNumber ?? undefined,
      donor: {
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
      },
      fundraiser: {
        id: donation.fundraiser.id,
        onChainId: donation.fundraiser.onChainId,
        name: donation.fundraiser.name,
        images: donation.fundraiser.images,
      },
      isAnonymous: donation.isAnonymous,
      message: donation.message ?? undefined,
      createdAt: donation.createdAt,
      indexedAt: donation.indexedAt,
    };
  }
}
