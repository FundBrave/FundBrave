import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractsService } from './contracts.service';
import {
  RecordStakeFromTxDto,
  ParsedStakeDto,
  StakingPoolBlockchainDataDto,
  YieldSplitDto,
} from './dto';
import {
  FundraiserNotFoundException,
  DuplicateTransactionException,
  BlockchainTransactionException,
  InvalidInputException,
  StakeNotFoundException,
} from '../../common/exceptions';
import { DEFAULT_CHAIN_ID } from './config/deployments';
import { Stake } from '../staking/dto';
import { STAKING_POOL_ABI, IMPACT_DAO_POOL_ABI } from './abis';
import { Interface, Log } from 'ethers';

/**
 * Service for blockchain operations related to staking.
 * Handles:
 * - Verifying stake transactions
 * - Parsing stake events from transaction logs
 * - Recording verified stakes to database
 * - Fetching live staking pool data
 */
@Injectable()
export class StakingBlockchainService {
  private readonly logger = new Logger(StakingBlockchainService.name);

  // Interface for parsing logs
  private readonly stakingPoolInterface: Interface;
  private readonly impactDAOPoolInterface: Interface;

  constructor(
    private readonly prisma: PrismaService,
    private readonly contractsService: ContractsService,
  ) {
    this.stakingPoolInterface = new Interface(STAKING_POOL_ABI);
    this.impactDAOPoolInterface = new Interface(IMPACT_DAO_POOL_ABI);
  }

  // ==================== Stake Recording ====================

  /**
   * Record a stake from a verified transaction
   * This is called by the frontend after the user signs the stake transaction
   */
  async recordStakeFromTransaction(
    input: RecordStakeFromTxDto,
    userId: string,
  ): Promise<Stake> {
    const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

    // Check for duplicate transaction
    const existing = await this.prisma.stake.findUnique({
      where: { txHash: input.txHash },
    });

    if (existing) {
      throw new DuplicateTransactionException(input.txHash);
    }

    // Verify the transaction
    const verification = await this.contractsService.verifyTransaction(
      input.txHash,
      chainId,
    );

    if (!verification.isValid) {
      throw new BlockchainTransactionException(
        input.txHash,
        'Transaction failed or not found',
      );
    }

    // Parse the stake details from the transaction
    const parsedStake = await this.parseStakeTransaction(input.txHash, chainId);

    if (!parsedStake) {
      throw new InvalidInputException(
        'Could not parse stake event from transaction. Ensure this is a valid stake transaction.',
      );
    }

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new InvalidInputException('User not found');
    }

    // Validate staker address matches
    if (
      user.walletAddress.toLowerCase() !==
      parsedStake.stakerAddress.toLowerCase()
    ) {
      throw new InvalidInputException(
        'Transaction staker does not match authenticated user',
      );
    }

    // Find fundraiser if provided
    let fundraiser: {
      id: string;
      stakingPoolAddr: string | null;
    } | null = null;
    if (input.fundraiserId) {
      fundraiser = await this.prisma.fundraiser.findUnique({
        where: { id: input.fundraiserId },
        select: { id: true, stakingPoolAddr: true },
      });

      if (!fundraiser) {
        throw new FundraiserNotFoundException(input.fundraiserId);
      }

      // Verify pool address matches fundraiser's staking pool
      if (
        fundraiser.stakingPoolAddr &&
        fundraiser.stakingPoolAddr.toLowerCase() !==
          parsedStake.poolAddress.toLowerCase()
      ) {
        throw new InvalidInputException(
          'Transaction pool address does not match fundraiser staking pool',
        );
      }
    }

    const amountBigInt = BigInt(parsedStake.amount);
    const sharesBigInt = BigInt(parsedStake.shares);

    // Create the stake record
    const stake = await this.prisma.$transaction(async (tx) => {
      const newStake = await tx.stake.create({
        data: {
          txHash: input.txHash,
          poolAddress: parsedStake.poolAddress.toLowerCase(),
          amount: amountBigInt,
          shares: sharesBigInt,
          fundraiserId: fundraiser?.id,
          stakerId: user.id,
          stakerAddress: parsedStake.stakerAddress.toLowerCase(),
          causeShare: parsedStake.yieldSplit?.causeShare,
          stakerShare: parsedStake.yieldSplit?.stakerShare,
          platformShare: parsedStake.yieldSplit?.platformShare,
          chainId,
          blockNumber: parsedStake.blockNumber,
          isGlobal: input.isGlobal ?? !fundraiser,
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

      // Update fundraiser stakers count if applicable
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
      `Recorded stake ${stake.id}: ${parsedStake.amount} from ${parsedStake.stakerAddress}`,
    );

    return this.mapToStakeDto(stake);
  }

  // ==================== Transaction Parsing ====================

  /**
   * Parse stake details from a transaction
   */
  async parseStakeTransaction(
    txHash: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<ParsedStakeDto | null> {
    const receipt = await this.contractsService.getTransactionReceipt(
      txHash,
      chainId,
    );

    if (!receipt || receipt.status === 0) {
      return null;
    }

    // Try to parse Staked event from StakingPool contract
    const stakedEvent = this.parseStakedEvent(receipt.logs);
    if (stakedEvent) {
      const timestamp = await this.contractsService.getBlockTimestamp(
        receipt.blockNumber,
        chainId,
      );

      return {
        stakerAddress: stakedEvent.staker,
        amount: stakedEvent.amount.toString(),
        shares: stakedEvent.amount.toString(), // Shares typically equal amount on deposit
        poolAddress: stakedEvent.poolAddress,
        yieldSplit: stakedEvent.yieldSplit,
        blockNumber: receipt.blockNumber,
        timestamp,
      };
    }

    return null;
  }

  /**
   * Parse Staked event from logs
   */
  private parseStakedEvent(logs: readonly Log[]): {
    staker: string;
    amount: bigint;
    poolAddress: string;
    yieldSplit?: YieldSplitDto;
  } | null {
    for (const log of logs) {
      // Try StakingPool event
      try {
        const parsed = this.stakingPoolInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed && parsed.name === 'Staked') {
          return {
            staker: parsed.args[0] as string,
            amount: parsed.args[1] as bigint,
            poolAddress: log.address,
          };
        }
      } catch {
        // Not a matching log
      }

      // Try ImpactDAOPool event (includes yield split)
      try {
        const parsed = this.impactDAOPoolInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed && parsed.name === 'Staked') {
          return {
            staker: parsed.args[0] as string,
            amount: parsed.args[1] as bigint,
            poolAddress: log.address,
            yieldSplit: {
              causeShare: Number(parsed.args[2]),
              stakerShare: Number(parsed.args[3]),
              platformShare: Number(parsed.args[4]),
            },
          };
        }
      } catch {
        // Not a matching log
      }
    }
    return null;
  }

  // ==================== Blockchain Data Fetching ====================

  /**
   * Get live staking pool data from blockchain
   */
  async getStakingPoolBlockchainData(
    poolAddress: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<StakingPoolBlockchainDataDto> {
    const stakingPool = this.contractsService.getStakingPoolContract(
      poolAddress,
      chainId,
    );

    // Fetch all data in parallel
    const [
      totalStakedPrincipal,
      beneficiary,
      platformWallet,
      rewardPerToken,
      periodFinish,
      rewardRate,
      rewardsDuration,
      defaultYieldSplit,
    ] = await Promise.all([
      this.contractsService.executeWithRetry(
        () => stakingPool.totalStakedPrincipal(),
        'Get Total Staked',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.beneficiary(),
        'Get Beneficiary',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.platformWallet(),
        'Get Platform Wallet',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.rewardPerToken(),
        'Get Reward Per Token',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.periodFinish(),
        'Get Period Finish',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.rewardRate(),
        'Get Reward Rate',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.rewardsDuration(),
        'Get Rewards Duration',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.defaultYieldSplit(),
        'Get Default Yield Split',
      ),
    ]);

    return {
      poolAddress,
      totalStakedPrincipal: totalStakedPrincipal.toString(),
      beneficiary,
      platformWallet,
      rewardPerToken: rewardPerToken.toString(),
      periodFinish: Number(periodFinish),
      rewardRate: rewardRate.toString(),
      rewardsDuration: Number(rewardsDuration),
      defaultYieldSplit: {
        causeShare: Number(defaultYieldSplit.causeShare),
        stakerShare: Number(defaultYieldSplit.stakerShare),
        platformShare: Number(defaultYieldSplit.platformShare),
      },
    };
  }

  /**
   * Get user's staking info from blockchain
   */
  async getUserStakingInfo(
    poolAddress: string,
    userAddress: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<{
    stakedAmount: string;
    earnedUSDC: string;
    earnedFBT: string;
    claimableYield: string;
    yieldSplit: YieldSplitDto;
  }> {
    const stakingPool = this.contractsService.getStakingPoolContract(
      poolAddress,
      chainId,
    );

    const [
      stakedAmount,
      earnedUSDC,
      earnedFBT,
      claimableYield,
      yieldSplit,
    ] = await Promise.all([
      this.contractsService.executeWithRetry(
        () => stakingPool.stakerPrincipal(userAddress),
        'Get Staker Principal',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.earnedUSDC(userAddress),
        'Get Earned USDC',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.earnedFBT(userAddress),
        'Get Earned FBT',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.claimableYield(userAddress),
        'Get Claimable Yield',
      ),
      this.contractsService.executeWithRetry(
        () => stakingPool.getEffectiveYieldSplit(userAddress),
        'Get Yield Split',
      ),
    ]);

    return {
      stakedAmount: stakedAmount.toString(),
      earnedUSDC: earnedUSDC.toString(),
      earnedFBT: earnedFBT.toString(),
      claimableYield: claimableYield.toString(),
      yieldSplit: {
        causeShare: Number(yieldSplit.causeShare),
        stakerShare: Number(yieldSplit.stakerShare),
        platformShare: Number(yieldSplit.platformShare),
      },
    };
  }

  /**
   * Sync stake data from blockchain
   */
  async syncStakeFromBlockchain(
    stakeId: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<Stake> {
    const stake = await this.prisma.stake.findUnique({
      where: { id: stakeId },
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
      throw new StakeNotFoundException(stakeId);
    }

    // Get current stake info from blockchain
    const stakingInfo = await this.getUserStakingInfo(
      stake.poolAddress,
      stake.stakerAddress,
      chainId,
    );

    // Update if amount has changed (could happen with partial unstakes)
    if (stakingInfo.stakedAmount !== stake.amount.toString()) {
      const newAmount = BigInt(stakingInfo.stakedAmount);
      const isActive = newAmount > BigInt(0);

      await this.prisma.stake.update({
        where: { id: stakeId },
        data: {
          amount: newAmount,
          isActive,
          ...(isActive
            ? {}
            : { unstakedAt: new Date() }),
        },
      });

      stake.amount = newAmount;
      stake.isActive = isActive;
    }

    this.logger.log(
      `Synced stake ${stakeId}: amount=${stakingInfo.stakedAmount}`,
    );

    return this.mapToStakeDto(stake);
  }

  // ==================== Helper Methods ====================

  /**
   * Map Prisma stake to DTO
   */
  private mapToStakeDto(stake: any): Stake {
    return {
      id: stake.id,
      txHash: stake.txHash,
      poolAddress: stake.poolAddress,
      amount: stake.amount.toString(),
      shares: stake.shares.toString(),
      fundraiser: stake.fundraiser
        ? {
            id: stake.fundraiser.id,
            onChainId: stake.fundraiser.onChainId,
            name: stake.fundraiser.name,
            stakingPoolAddr: stake.fundraiser.stakingPoolAddr ?? undefined,
          }
        : undefined,
      staker: {
        id: stake.staker?.id,
        walletAddress: stake.stakerAddress,
        username: stake.staker?.username ?? undefined,
        displayName: stake.staker?.displayName ?? undefined,
        avatarUrl: stake.staker?.avatarUrl ?? undefined,
      },
      yieldSplit:
        stake.causeShare !== null
          ? {
              causeShare: stake.causeShare,
              stakerShare: stake.stakerShare!,
              platformShare: stake.platformShare!,
            }
          : undefined,
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
