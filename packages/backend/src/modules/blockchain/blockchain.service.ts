import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ChainId,
  ContractName,
  ImpactDAOPoolEvent,
  WealthBuildingDonationEvent,
  PlatformTreasuryEvent,
  FundBraveTokenEvent,
  StakingPoolEvent,
} from '../../common/types';

/**
 * Service for blockchain interactions and event indexing
 */
@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeProviders();
  }

  /**
   * Initialize RPC providers for supported chains
   */
  private async initializeProviders() {
    const supportedChains = await this.prisma.supportedChain.findMany({
      where: { isActive: true },
    });

    for (const chain of supportedChains) {
      try {
        const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
        await provider.getBlockNumber(); // Test connection
        this.providers.set(chain.id, provider);
        this.logger.log(`Connected to ${chain.name} (chainId: ${chain.id})`);
      } catch (error) {
        this.logger.error(
          `Failed to connect to ${chain.name}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chainId: number): ethers.JsonRpcProvider | undefined {
    return this.providers.get(chainId);
  }

  /**
   * Get contract address from registry
   */
  async getContractAddress(
    chainId: number,
    contractName: ContractName,
  ): Promise<string | null> {
    const contract = await this.prisma.contractRegistry.findUnique({
      where: {
        chainId_contractName: {
          chainId,
          contractName,
        },
      },
    });

    return contract?.contractAddress ?? null;
  }

  /**
   * Get or create blockchain sync record
   */
  async getOrCreateSyncRecord(
    chainId: number,
    contractAddress: string,
    contractName: ContractName,
  ) {
    const chain = await this.prisma.supportedChain.findUnique({
      where: { id: chainId },
    });

    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }

    let sync = await this.prisma.blockchainSync.findUnique({
      where: {
        chainId_contractAddress: {
          chainId,
          contractAddress: contractAddress.toLowerCase(),
        },
      },
    });

    if (!sync) {
      const provider = this.getProvider(chainId);
      const currentBlock = provider ? await provider.getBlockNumber() : 0;

      sync = await this.prisma.blockchainSync.create({
        data: {
          chainId,
          chainName: chain.name,
          contractAddress: contractAddress.toLowerCase(),
          contractName,
          lastBlock: currentBlock - 1000, // Start from 1000 blocks ago
        },
      });
    }

    return sync;
  }

  /**
   * Update last processed block
   */
  async updateLastBlock(syncId: string, blockNumber: number) {
    await this.prisma.blockchainSync.update({
      where: { id: syncId },
      data: {
        lastBlock: blockNumber,
        lastSyncAt: new Date(),
        status: 'SYNCED',
      },
    });
  }

  /**
   * Mark sync as error
   */
  async markSyncError(syncId: string, error: string) {
    await this.prisma.blockchainSync.update({
      where: { id: syncId },
      data: {
        status: 'ERROR',
        error,
      },
    });
  }

  /**
   * Store blockchain event
   */
  async storeEvent(
    eventName: string,
    contractAddress: string,
    contractName: string | null,
    txHash: string,
    blockNumber: number,
    logIndex: number,
    chainId: number,
    args: Record<string, unknown>,
    blockTimestamp: Date,
  ) {
    try {
      await this.prisma.blockchainEvent.create({
        data: {
          eventName,
          contractAddress: contractAddress.toLowerCase(),
          contractName,
          txHash: txHash.toLowerCase(),
          blockNumber,
          logIndex,
          chainId,
          args: args as Prisma.InputJsonValue,
          blockTimestamp,
        },
      });
    } catch (error) {
      // Handle duplicate events (unique constraint on txHash, logIndex, chainId)
      if ((error as { code?: string }).code === 'P2002') {
        this.logger.debug(
          `Event already exists: ${eventName} at tx ${txHash} log ${logIndex}`,
        );
        return;
      }
      throw error;
    }
  }

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string, error?: string) {
    await this.prisma.blockchainEvent.update({
      where: { id: eventId },
      data: {
        processed: !error,
        processedAt: new Date(),
        error,
      },
    });
  }

  /**
   * Get unprocessed events
   */
  async getUnprocessedEvents(contractName: string, limit: number = 100) {
    return this.prisma.blockchainEvent.findMany({
      where: {
        contractName,
        processed: false,
      },
      orderBy: { blockNumber: 'asc' },
      take: limit,
    });
  }

  /**
   * Get block timestamp from chain
   */
  async getBlockTimestamp(chainId: number, blockNumber: number): Promise<Date> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return new Date();
    }

    try {
      const block = await provider.getBlock(blockNumber);
      return block ? new Date(block.timestamp * 1000) : new Date();
    } catch {
      return new Date();
    }
  }
}
