import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsService } from './events.service';
import { ProviderService } from './provider.service';
import {
  ChainId,
  ContractName,
  ImpactDAOPoolEvent,
  WealthBuildingDonationEvent,
  PlatformTreasuryEvent,
  FundBraveTokenEvent,
  StakingPoolEvent,
} from '../../common/types';
import { DEFAULT_CHAIN_ID, SUPPORTED_NETWORKS } from './config/deployments';

/**
 * Configuration for blockchain indexing
 */
interface IndexerConfig {
  chainId: ChainId;
  rpcUrl: string;
  contracts: {
    name: ContractName;
    address: string;
    events: string[];
    startBlock?: number;
  }[];
}

/**
 * Service for indexing blockchain events
 * Continuously monitors smart contracts and processes events
 * Uses ProviderService for reliable blockchain connections
 */
@Injectable()
export class BlockchainIndexerService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainIndexerService.name);
  private providers: Map<ChainId, ethers.Provider> = new Map();
  private isIndexing: boolean = false;
  private configs: IndexerConfig[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    @Optional() private readonly providerService?: ProviderService,
  ) {}

  async onModuleInit() {
    // Initialize on module startup
    await this.initialize();
  }

  /**
   * Initialize blockchain providers and configurations
   */
  private async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing blockchain indexer...');

      // Initialize providers for each chain
      await this.initializeProviders();

      // Setup indexer configurations
      this.setupIndexerConfigs();

      // Start indexing
      await this.startIndexing();

      this.logger.log('Blockchain indexer initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize blockchain indexer: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Initialize blockchain providers for each supported chain
   * Leverages ProviderService for reliable connections with fallback support
   */
  private async initializeProviders(): Promise<void> {
    // First, try to use providers from ProviderService (which has FallbackProvider support)
    if (this.providerService) {
      this.logger.log('Using ProviderService for blockchain connections...');

      // Map supported network chain IDs to ChainId enum
      const chainIdMapping: Record<number, ChainId> = {
        1: ChainId.ETHEREUM,
        11155111: ChainId.SEPOLIA,
        137: ChainId.POLYGON,
        80001: ChainId.MUMBAI,
        43114: ChainId.AVALANCHE,
        43113: ChainId.FUJI,
        42161: ChainId.ARBITRUM,
        421614: ChainId.ARBITRUM_SEPOLIA,
        10: ChainId.OPTIMISM,
        11155420: ChainId.OPTIMISM_SEPOLIA,
        8453: ChainId.BASE,
        84532: ChainId.BASE_SEPOLIA,
      };

      for (const [numericChainId, networkConfig] of Object.entries(SUPPORTED_NETWORKS)) {
        const chainId = chainIdMapping[parseInt(numericChainId)];
        if (!chainId) continue;

        try {
          if (this.providerService.hasProvider(parseInt(numericChainId))) {
            const provider = this.providerService.getProvider(parseInt(numericChainId));
            this.providers.set(chainId, provider as ethers.Provider);
            this.logger.log(`Connected to ${networkConfig.name} via ProviderService`);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to get provider for ${networkConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      if (this.providers.size > 0) {
        this.logger.log(`Initialized ${this.providers.size} blockchain providers via ProviderService`);
        return;
      }
    }

    // Fallback: Initialize providers directly (legacy behavior)
    this.logger.log('Falling back to direct provider initialization...');

    const providerConfigs = [
      {
        chainId: ChainId.ETHEREUM,
        rpc: process.env.ETHEREUM_RPC,
        name: 'Ethereum Mainnet',
      },
      {
        chainId: ChainId.SEPOLIA,
        rpc: process.env.SEPOLIA_RPC,
        name: 'Sepolia Testnet',
      },
      {
        chainId: ChainId.POLYGON,
        rpc: process.env.POLYGON_RPC,
        name: 'Polygon Mainnet',
      },
      {
        chainId: ChainId.MUMBAI,
        rpc: process.env.MUMBAI_RPC,
        name: 'Mumbai Testnet',
      },
      {
        chainId: ChainId.AVALANCHE,
        rpc: process.env.AVALANCHE_RPC,
        name: 'Avalanche Mainnet',
      },
      {
        chainId: ChainId.FUJI,
        rpc: process.env.FUJI_RPC,
        name: 'Fuji Testnet',
      },
      {
        chainId: ChainId.ARBITRUM,
        rpc: process.env.ARBITRUM_RPC,
        name: 'Arbitrum Mainnet',
      },
      {
        chainId: ChainId.OPTIMISM,
        rpc: process.env.OPTIMISM_RPC,
        name: 'Optimism Mainnet',
      },
      {
        chainId: ChainId.BASE,
        rpc: process.env.BASE_RPC_URL,
        name: 'Base Mainnet',
      },
      {
        chainId: ChainId.BASE_SEPOLIA,
        rpc: process.env.BASE_SEPOLIA_RPC_URL,
        name: 'Base Sepolia',
      },
    ];

    for (const { chainId, rpc, name } of providerConfigs) {
      // Skip if RPC URL is not configured or contains placeholder
      if (
        !rpc ||
        rpc.includes('<KEY>') ||
        rpc.includes('<') ||
        rpc.includes('>')
      ) {
        this.logger.warn(
          `Skipping ${name} - RPC URL not configured or contains placeholder`,
        );
        continue;
      }

      try {
        const provider = new ethers.JsonRpcProvider(rpc);
        // Test connection by getting network
        await provider.getNetwork();
        this.providers.set(chainId, provider);
        this.logger.log(`Connected to ${name}`);
      } catch (error) {
        this.logger.warn(`Failed to connect to ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.logger.log(`Initialized ${this.providers.size} blockchain providers`);
  }

  /**
   * Setup indexer configurations for each chain and contract
   */
  private setupIndexerConfigs(): void {
    const envChainId = parseInt(process.env.CHAIN_ID || '11155111'); // Default to Sepolia

    for (const [chainId, provider] of this.providers) {
      // Get RPC URL from environment based on chain ID
      const rpcUrl = this.getRpcUrl(chainId);
      const config: IndexerConfig = {
        chainId,
        rpcUrl,
        contracts: [
          {
            name: ContractName.IMPACT_DAO_POOL,
            address: this.getContractAddress(
              ContractName.IMPACT_DAO_POOL,
              chainId,
            ),
            events: Object.values(ImpactDAOPoolEvent),
            startBlock: parseInt(process.env.IMPACT_DAO_START_BLOCK || '0'),
          },
          {
            name: ContractName.WEALTH_BUILDING_DONATION,
            address: this.getContractAddress(
              ContractName.WEALTH_BUILDING_DONATION,
              chainId,
            ),
            events: Object.values(WealthBuildingDonationEvent),
            startBlock: parseInt(
              process.env.WEALTH_BUILDING_START_BLOCK || '0',
            ),
          },
          {
            name: ContractName.PLATFORM_TREASURY,
            address: this.getContractAddress(
              ContractName.PLATFORM_TREASURY,
              chainId,
            ),
            events: Object.values(PlatformTreasuryEvent),
            startBlock: parseInt(process.env.TREASURY_START_BLOCK || '0'),
          },
          {
            name: ContractName.FUND_BRAVE_TOKEN,
            address: this.getContractAddress(
              ContractName.FUND_BRAVE_TOKEN,
              chainId,
            ),
            events: Object.values(FundBraveTokenEvent),
            startBlock: parseInt(process.env.FBT_START_BLOCK || '0'),
          },
          {
            name: ContractName.STAKING_POOL,
            address: this.getContractAddress(
              ContractName.STAKING_POOL,
              chainId,
            ),
            events: Object.values(StakingPoolEvent),
            startBlock: parseInt(process.env.STAKING_POOL_START_BLOCK || '0'),
          },
          {
            name: ContractName.FUNDRAISER_FACTORY,
            address: this.getContractAddress(
              ContractName.FUNDRAISER_FACTORY,
              chainId,
            ),
            events: ['FundraiserCreated', 'DonationReceived', 'FundsWithdrawn'],
            startBlock: parseInt(process.env.FACTORY_START_BLOCK || '0'),
          },
        ],
      };

      this.configs.push(config);
    }

    this.logger.log(`Setup ${this.configs.length} indexer configurations`);
  }

  /**
   * Start indexing all configured chains
   */
  async startIndexing(): Promise<void> {
    if (this.isIndexing) {
      this.logger.warn('Indexer is already running');
      return;
    }

    this.isIndexing = true;
    this.logger.log('Starting blockchain event indexing...');

    for (const config of this.configs) {
      const provider = this.providers.get(config.chainId);
      if (!provider) {
        this.logger.warn(`No provider for chain ${config.chainId}`);
        continue;
      }

      // Index each contract
      for (const contractConfig of config.contracts) {
        try {
          await this.indexContract(
            provider,
            config.chainId,
            contractConfig.name,
            contractConfig.address,
            contractConfig.events,
            contractConfig.startBlock,
          );
        } catch (error) {
          this.logger.error(
            `Failed to index ${contractConfig.name} on chain ${config.chainId}: ${error.message}`,
            error.stack,
          );
        }
      }
    }
  }

  /**
   * Index a specific contract
   */
  private async indexContract(
    provider: ethers.Provider,
    chainId: ChainId,
    contractName: ContractName,
    contractAddress: string,
    events: string[],
    startBlock: number = 0,
  ): Promise<void> {
    // Skip if contract address is not configured (zero address)
    if (
      !contractAddress ||
      contractAddress === '0x0000000000000000000000000000000000000000'
    ) {
      this.logger.warn(
        `Skipping ${contractName} on chain ${chainId} - contract address not configured`,
      );
      return;
    }

    this.logger.log(
      `Indexing ${contractName} at ${contractAddress} on chain ${chainId}`,
    );

    // Get last synced block from database
    const sync = await this.prisma.blockchainSync.findUnique({
      where: {
        chainId_contractAddress: {
          chainId,
          contractAddress,
        },
      },
    });

    const fromBlock = sync?.lastBlock ? sync.lastBlock + 1 : startBlock;

    // Get current block
    const currentBlock = await provider.getBlockNumber();

    this.logger.log(
      `Indexing blocks ${fromBlock} to ${currentBlock} for ${contractName}`,
    );

    // Index historical events in batches
    await this.indexHistoricalEvents(
      provider,
      chainId,
      contractName,
      contractAddress,
      events,
      fromBlock,
      currentBlock,
    );

    // Setup real-time event listeners
    this.setupEventListeners(
      provider,
      chainId,
      contractName,
      contractAddress,
      events,
    );
  }

  /**
   * Index historical events in batches
   */
  private async indexHistoricalEvents(
    provider: ethers.Provider,
    chainId: ChainId,
    contractName: ContractName,
    contractAddress: string,
    events: string[],
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    const BATCH_SIZE = 1000; // Process 1k blocks at a time (RPC limit is 2048)
    let currentBlock = fromBlock;

    while (currentBlock <= toBlock) {
      const batchEndBlock = Math.min(currentBlock + BATCH_SIZE - 1, toBlock);

      try {
        this.logger.log(
          `Processing blocks ${currentBlock} to ${batchEndBlock} for ${contractName}`,
        );

        // Query events for this batch
        const logs = await provider.getLogs({
          address: contractAddress,
          fromBlock: currentBlock,
          toBlock: batchEndBlock,
        });

        // Process each log
        for (const log of logs) {
          try {
            await this.eventsService.processEvent(
              contractName,
              log.topics[0], // Event signature
              log,
              chainId,
            );
          } catch (error) {
            this.logger.error(
              `Failed to process event at block ${log.blockNumber}: ${error.message}`,
            );
          }
        }

        currentBlock = batchEndBlock + 1;

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `Failed to fetch logs for blocks ${currentBlock}-${batchEndBlock}: ${error.message}`,
        );
        // Continue to next batch
        currentBlock = batchEndBlock + 1;
      }
    }
  }

  /**
   * Setup real-time event listeners
   */
  private setupEventListeners(
    provider: ethers.Provider,
    chainId: ChainId,
    contractName: ContractName,
    contractAddress: string,
    events: string[],
  ): void {
    this.logger.log(`Setting up real-time listeners for ${contractName}`);

    // Create contract instance with minimal ABI (just events)
    const eventAbi = events.map((eventName) => `event ${eventName}(...)`);
    const contract = new ethers.Contract(contractAddress, eventAbi, provider);

    // Listen for each event
    for (const eventName of events) {
      contract.on(eventName, async (...args) => {
        try {
          const event = args[args.length - 1]; // Last arg is event object
          await this.eventsService.processEvent(
            contractName,
            eventName,
            event.log,
            chainId,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process real-time ${eventName} event: ${error.message}`,
          );
        }
      });
    }

    this.logger.log(`Listening for ${events.length} events on ${contractName}`);
  }

  /**
   * Periodic sync job - runs every 5 minutes
   * Re-indexes recent blocks to catch any missed events
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async periodicSync(): Promise<void> {
    if (!this.isIndexing) {
      return;
    }

    this.logger.log('Running periodic sync...');

    for (const config of this.configs) {
      const provider = this.providers.get(config.chainId);
      if (!provider) continue;

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100); // Re-index last 100 blocks

      for (const contractConfig of config.contracts) {
        try {
          await this.indexHistoricalEvents(
            provider,
            config.chainId,
            contractConfig.name,
            contractConfig.address,
            contractConfig.events,
            fromBlock,
            currentBlock,
          );
        } catch (error) {
          this.logger.error(
            `Periodic sync failed for ${contractConfig.name}: ${error.message}`,
          );
        }
      }
    }

    this.logger.log('Periodic sync completed');
  }

  /**
   * Get contract address for a given chain
   * Loads from environment variables
   */
  private getContractAddress(
    contractName: ContractName,
    chainId: ChainId,
  ): string {
    const envKey = `${contractName.toUpperCase()}_ADDRESS_${chainId}`;
    return process.env[envKey] || `0x0000000000000000000000000000000000000000`;
  }

  /**
   * Get RPC URL for a given chain ID from environment variables
   */
  private getRpcUrl(chainId: ChainId): string {
    const rpcUrls: Record<ChainId, string | undefined> = {
      [ChainId.ETHEREUM]: process.env.ETHEREUM_RPC,
      [ChainId.SEPOLIA]: process.env.SEPOLIA_RPC,
      [ChainId.POLYGON]: process.env.POLYGON_RPC,
      [ChainId.MUMBAI]: process.env.MUMBAI_RPC,
      [ChainId.AVALANCHE]: process.env.AVALANCHE_RPC,
      [ChainId.FUJI]: process.env.FUJI_RPC,
      [ChainId.ARBITRUM]: process.env.ARBITRUM_RPC,
      [ChainId.ARBITRUM_SEPOLIA]: process.env.ARBITRUM_SEPOLIA_RPC,
      [ChainId.OPTIMISM]: process.env.OPTIMISM_RPC,
      [ChainId.OPTIMISM_SEPOLIA]: process.env.OPTIMISM_SEPOLIA_RPC,
      [ChainId.BASE]: process.env.BASE_RPC_URL,
      [ChainId.BASE_SEPOLIA]: process.env.BASE_SEPOLIA_RPC_URL,
    };
    return rpcUrls[chainId] || '';
  }

  /**
   * Stop indexing
   */
  stopIndexing(): void {
    this.isIndexing = false;
    this.logger.log('Blockchain indexer stopped');
  }
}
