import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractsService } from './contracts.service';
import {
  CreateFundraiserOnChainDto,
  CreateFundraiserOnChainResponseDto,
  FundraiserBlockchainDataDto,
  SyncFundraiserDataDto,
} from './dto';
import {
  FundraiserNotFoundException,
  BlockchainTransactionException,
  InvalidInputException,
} from '../../common/exceptions';
import { DEFAULT_CHAIN_ID } from './config/deployments';
import { Fundraiser } from '../fundraisers/dto';

/**
 * Service for blockchain operations related to fundraisers.
 * Handles:
 * - Creating fundraisers on-chain
 * - Syncing blockchain data to database
 * - Fetching live data from contracts
 */
@Injectable()
export class FundraiserBlockchainService {
  private readonly logger = new Logger(FundraiserBlockchainService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contractsService: ContractsService,
  ) {}

  // ==================== Fundraiser Creation ====================

  /**
   * Create a fundraiser on the blockchain
   * This method:
   * 1. Validates input
   * 2. Calls FundraiserFactory.createFundraiser()
   * 3. Waits for transaction confirmation
   * 4. Returns transaction details
   *
   * Note: Database record should be created after this call succeeds
   */
  async createFundraiserOnChain(
    input: CreateFundraiserOnChainDto,
  ): Promise<CreateFundraiserOnChainResponseDto> {
    const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

    // Validate that we have a signer
    const signer = this.contractsService.getSigner();
    if (!signer) {
      throw new InvalidInputException(
        'Backend wallet not configured for blockchain operations',
      );
    }

    // Get the factory contract with signer
    const factory =
      this.contractsService.getFundraiserFactoryWithSigner(chainId);

    this.logger.log(
      `Creating fundraiser on chain ${chainId}: ${input.name} with goal ${input.goalAmount}`,
    );

    try {
      // Execute the contract call with retry logic
      const tx = await this.contractsService.executeWithRetry(
        async () => {
          return factory.createFundraiser(
            input.name,
            input.images,
            input.categories,
            input.description,
            input.region || '',
            input.beneficiary,
            BigInt(input.goalAmount),
            input.durationInDays,
          );
        },
        'Create Fundraiser',
      );

      this.logger.log(`Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await this.contractsService.waitForTransaction(
        tx.hash,
        chainId,
      );

      // Parse the FundraiserCreated event from logs
      const event = this.contractsService.extractFundraiserCreatedEvent(
        receipt.logs,
      );

      if (!event) {
        throw new BlockchainTransactionException(
          tx.hash,
          'FundraiserCreated event not found in transaction logs',
        );
      }

      this.logger.log(
        `Fundraiser created: ID=${event.id}, address=${event.fundraiser}`,
      );

      return {
        txHash: tx.hash,
        onChainId: Number(event.id),
        fundraiserAddress: event.fundraiser,
        blockNumber: receipt.blockNumber,
        chainId,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown blockchain error';
      this.logger.error(`Failed to create fundraiser on chain: ${message}`);
      throw new BlockchainTransactionException('pending', message);
    }
  }

  /**
   * Create fundraiser on-chain and save to database in one operation
   */
  async createFundraiserWithBlockchain(
    userId: string,
    input: CreateFundraiserOnChainDto,
  ): Promise<Fundraiser> {
    const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

    // First, create on blockchain
    const blockchainResult = await this.createFundraiserOnChain(input);

    // Calculate deadline from duration
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + input.durationInDays);

    // Then save to database
    const fundraiser = await this.prisma.$transaction(async (tx) => {
      // Find or create user
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new InvalidInputException('User not found');
      }

      // Create the fundraiser record
      const newFundraiser = await tx.fundraiser.create({
        data: {
          onChainId: blockchainResult.onChainId,
          txHash: blockchainResult.txHash,
          name: input.name,
          description: input.description,
          images: input.images,
          categories: input.categories,
          region: input.region || null,
          goalAmount: input.goalAmount,
          beneficiary: input.beneficiary.toLowerCase(),
          deadline,
          creatorId: userId,
          currency: 'USDC',
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

      // Update user fundraiser count
      await tx.user.update({
        where: { id: userId },
        data: {
          fundraisersCount: { increment: 1 },
        },
      });

      return newFundraiser;
    });

    this.logger.log(
      `Fundraiser ${fundraiser.id} created with on-chain ID ${blockchainResult.onChainId}`,
    );

    // Map to DTO (simplified - in real implementation, use the existing mapper)
    return this.mapFundraiserToDto(fundraiser);
  }

  // ==================== Data Synchronization ====================

  /**
   * Fetch live fundraiser data from blockchain
   */
  async getFundraiserBlockchainData(
    input: SyncFundraiserDataDto,
  ): Promise<FundraiserBlockchainDataDto> {
    const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

    // Get fundraiser from database to find on-chain ID
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: input.fundraiserId },
    });

    if (!fundraiser) {
      throw new FundraiserNotFoundException(input.fundraiserId);
    }

    if (!fundraiser.onChainId) {
      throw new InvalidInputException(
        'Fundraiser does not have an on-chain ID',
      );
    }

    // Get fundraiser address from factory
    const factory = this.contractsService.getFundraiserFactory(chainId);
    const fundraiserAddress = await this.contractsService.executeWithRetry(
      () => factory.getFundraiserById(fundraiser.onChainId),
      'Get Fundraiser Address',
    );

    // Get the fundraiser contract
    const fundraiserContract = this.contractsService.getFundraiserContract(
      fundraiserAddress,
      chainId,
    );

    // Fetch data from contract
    const [stats, name, stakingPoolAddress] = await Promise.all([
      this.contractsService.executeWithRetry(
        () => fundraiserContract.getFundraiserStats(),
        'Get Fundraiser Stats',
      ),
      this.contractsService.executeWithRetry(
        () => fundraiserContract.name(),
        'Get Fundraiser Name',
      ),
      this.getStakingPoolAddress(fundraiser.onChainId, chainId),
    ]);

    const [totalDonations, donorsCount, goal, deadline, goalReached] = stats;

    // Get staking data if pool exists
    let totalStaked: string | undefined;
    if (stakingPoolAddress && stakingPoolAddress !== '0x0000000000000000000000000000000000000000') {
      const stakingPool = this.contractsService.getStakingPoolContract(
        stakingPoolAddress,
        chainId,
      );
      const stakedPrincipal = await this.contractsService.executeWithRetry(
        () => stakingPool.totalStakedPrincipal(),
        'Get Total Staked',
      );
      totalStaked = stakedPrincipal.toString();
    }

    // Get refunds enabled status
    const refundsEnabled = await this.contractsService.executeWithRetry(
      () => fundraiserContract.refundsEnabled(),
      'Get Refunds Enabled',
    );

    return {
      onChainId: fundraiser.onChainId,
      contractAddress: fundraiserAddress,
      totalDonations: totalDonations.toString(),
      donorsCount: Number(donorsCount),
      goal: goal.toString(),
      deadline: Number(deadline),
      goalReached,
      refundsEnabled,
      name,
      stakingPoolAddress:
        stakingPoolAddress !== '0x0000000000000000000000000000000000000000'
          ? stakingPoolAddress
          : undefined,
      totalStaked,
    };
  }

  /**
   * Sync fundraiser data from blockchain to database
   */
  async syncFundraiserFromBlockchain(
    input: SyncFundraiserDataDto,
  ): Promise<Fundraiser> {
    const blockchainData = await this.getFundraiserBlockchainData(input);

    // Update database with blockchain data
    const updated = await this.prisma.fundraiser.update({
      where: { id: input.fundraiserId },
      data: {
        raisedAmount: BigInt(blockchainData.totalDonations),
        donorsCount: blockchainData.donorsCount,
        goalReached: blockchainData.goalReached,
        stakingPoolAddr: blockchainData.stakingPoolAddress,
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

    this.logger.log(
      `Synced fundraiser ${input.fundraiserId} from blockchain: raised=${blockchainData.totalDonations}`,
    );

    return this.mapFundraiserToDto(updated);
  }

  // ==================== Helper Methods ====================

  /**
   * Get staking pool address for a fundraiser
   */
  private async getStakingPoolAddress(
    onChainId: number,
    chainId: number,
  ): Promise<string> {
    try {
      const factory = this.contractsService.getFundraiserFactory(chainId);
      return await this.contractsService.executeWithRetry(
        () => factory.stakingPools(onChainId),
        'Get Staking Pool',
      );
    } catch {
      return '0x0000000000000000000000000000000000000000';
    }
  }

  /**
   * Map Prisma fundraiser to DTO
   * This is a simplified version - the full implementation is in FundraisersService
   */
  private mapFundraiserToDto(fundraiser: any): Fundraiser {
    const totalStaked = fundraiser.stakes.reduce(
      (sum: bigint, s: { amount: bigint }) => sum + s.amount,
      BigInt(0),
    );

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

    const avgDonation =
      fundraiser.donorsCount > 0
        ? (fundraiser.raisedAmount / BigInt(fundraiser.donorsCount)).toString()
        : '0';

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
      creator: {
        id: fundraiser.creator.id,
        walletAddress: fundraiser.creator.walletAddress,
        username: fundraiser.creator.username ?? undefined,
        displayName: fundraiser.creator.displayName ?? undefined,
        avatarUrl: fundraiser.creator.avatarUrl ?? undefined,
        isVerifiedCreator: fundraiser.creator.isVerifiedCreator,
      },
      deadline: fundraiser.deadline,
      createdAt: fundraiser.createdAt,
      updatedAt: fundraiser.updatedAt,
      isActive: fundraiser.isActive,
      isFeatured: fundraiser.isFeatured,
      goalReached: fundraiser.goalReached,
      endowmentEnabled: fundraiser.endowmentEnabled,
      stats: {
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
      },
      milestones: fundraiser.milestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description ?? undefined,
        targetAmount: m.targetAmount.toString(),
        isReached: m.isReached,
        reachedAt: m.reachedAt ?? undefined,
        createdAt: m.createdAt,
      })),
      updates: fundraiser.updates.map((u: any) => ({
        id: u.id,
        title: u.title,
        content: u.content,
        mediaUrls: u.mediaUrls,
        createdAt: u.createdAt,
      })),
    };
  }
}
