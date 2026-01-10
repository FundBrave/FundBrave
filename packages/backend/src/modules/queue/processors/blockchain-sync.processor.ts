import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES, BlockchainSyncJobData } from '../queue.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Blockchain sync queue processor
 * Handles indexing blockchain events
 */
@Processor(QUEUE_NAMES.BLOCKCHAIN_SYNC)
export class BlockchainSyncProcessor {
  private readonly logger = new Logger(BlockchainSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    // Inject BlockchainService when ready
    // private readonly blockchainService: BlockchainService,
  ) {}

  @Process()
  async handleBlockchainSyncJob(job: Job<BlockchainSyncJobData>): Promise<void> {
    this.logger.debug(`Processing blockchain sync job ${job.id}`);

    const { chainId, contractAddress, contractName, fromBlock, toBlock } = job.data;

    try {
      // Get last synced block
      const syncRecord = await this.prisma.blockchainSync.findUnique({
        where: {
          chainId_contractAddress: { chainId, contractAddress },
        },
      });

      const startBlock = fromBlock ?? (syncRecord?.lastBlock ?? 0) + 1;

      this.logger.log(
        `Syncing ${contractName} on chain ${chainId} from block ${startBlock}`,
      );

      // TODO: Implement actual blockchain sync using BlockchainService
      // const events = await this.blockchainService.getEvents(
      //   chainId,
      //   contractAddress,
      //   startBlock,
      //   toBlock,
      // );

      // Update sync record
      await this.prisma.blockchainSync.upsert({
        where: {
          chainId_contractAddress: { chainId, contractAddress },
        },
        create: {
          chainId,
          chainName: this.getChainName(chainId),
          contractAddress,
          contractName,
          lastBlock: toBlock ?? startBlock,
          status: 'SYNCED',
        },
        update: {
          lastBlock: toBlock ?? startBlock,
          lastSyncAt: new Date(),
          status: 'SYNCED',
          error: null,
        },
      });

      this.logger.log(
        `Blockchain sync completed for ${contractName} on chain ${chainId}`,
      );
    } catch (error) {
      // Update sync record with error
      await this.prisma.blockchainSync.upsert({
        where: {
          chainId_contractAddress: { chainId, contractAddress },
        },
        create: {
          chainId,
          chainName: this.getChainName(chainId),
          contractAddress,
          contractName,
          lastBlock: 0,
          status: 'ERROR',
          error: String(error),
        },
        update: {
          status: 'ERROR',
          error: String(error),
        },
      });

      this.logger.error(`Failed to sync blockchain: ${error}`);
      throw error;
    }
  }

  /**
   * Get chain name from chain ID
   */
  private getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia',
      137: 'Polygon Mainnet',
      80001: 'Mumbai',
      43114: 'Avalanche Mainnet',
      43113: 'Fuji',
      42161: 'Arbitrum One',
      421614: 'Arbitrum Sepolia',
      10: 'Optimism Mainnet',
      11155420: 'Optimism Sepolia',
    };

    return chainNames[chainId] || `Chain ${chainId}`;
  }

  @OnQueueCompleted()
  onCompleted(job: Job<BlockchainSyncJobData>): void {
    this.logger.debug(`Blockchain sync job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job<BlockchainSyncJobData>, error: Error): void {
    this.logger.error(`Blockchain sync job ${job.id} failed: ${error.message}`);
  }
}
