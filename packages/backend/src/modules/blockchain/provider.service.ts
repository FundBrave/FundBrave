import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JsonRpcProvider,
  FallbackProvider,
  Network,
  WebSocketProvider,
  AbstractProvider,
} from 'ethers';
import {
  NetworkConfig,
  SUPPORTED_NETWORKS,
  DEFAULT_CHAIN_ID,
  getNetworkConfig,
} from './config/deployments';

/**
 * RPC endpoint configuration for fallback providers
 */
interface RpcEndpoint {
  url: string;
  priority: number;
  stallTimeout?: number;
  weight?: number;
}

/**
 * Provider connection status
 */
export interface ProviderStatus {
  chainId: number;
  networkName: string;
  isConnected: boolean;
  blockNumber: number | null;
  latency: number | null;
  endpoint: string;
  error?: string;
}

/**
 * Overall blockchain connection health
 */
export interface BlockchainHealthStatus {
  isHealthy: boolean;
  defaultChainConnected: boolean;
  providers: ProviderStatus[];
  timestamp: string;
}

/**
 * Retry configuration for provider operations
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * ProviderService manages blockchain provider connections with:
 * - FallbackProvider support for multiple RPC endpoints
 * - Static network configuration to avoid auto-detection issues
 * - Connection validation and health checks
 * - Exponential backoff retry logic
 * - Graceful reconnection on failures
 */
@Injectable()
export class ProviderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProviderService.name);

  // Primary providers per chain (FallbackProvider or single JsonRpcProvider)
  private providers: Map<number, AbstractProvider> = new Map();

  // Individual RPC providers for health checks
  private rpcProviders: Map<number, JsonRpcProvider[]> = new Map();

  // Connection status tracking
  private connectionStatus: Map<number, ProviderStatus> = new Map();

  // Health check interval
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Retry configuration
  private readonly retryConfig: RetryConfig = {
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  };

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize providers on module start
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing ProviderService...');

    // Initialize providers for all supported networks
    await this.initializeAllProviders();

    // Start periodic health checks (every 30 seconds)
    this.startHealthChecks();

    this.logger.log('ProviderService initialized successfully');
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down ProviderService...');

    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Destroy all providers
    for (const [chainId, provider] of this.providers) {
      try {
        if (provider instanceof FallbackProvider) {
          await provider.destroy();
        } else if (provider instanceof JsonRpcProvider) {
          await provider.destroy();
        }
        this.logger.debug(`Provider for chain ${chainId} destroyed`);
      } catch (error) {
        this.logger.warn(
          `Error destroying provider for chain ${chainId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    this.providers.clear();
    this.rpcProviders.clear();
    this.connectionStatus.clear();

    this.logger.log('ProviderService shutdown complete');
  }

  // ==================== Provider Initialization ====================

  /**
   * Initialize providers for all supported networks
   */
  private async initializeAllProviders(): Promise<void> {
    const chainIds = Object.keys(SUPPORTED_NETWORKS).map(Number);

    for (const chainId of chainIds) {
      try {
        await this.initializeProviderForChain(chainId);
      } catch (error) {
        this.logger.error(
          `Failed to initialize provider for chain ${chainId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  /**
   * Initialize provider for a specific chain with retry logic
   */
  private async initializeProviderForChain(chainId: number): Promise<void> {
    const networkConfig = getNetworkConfig(chainId);
    if (!networkConfig) {
      this.logger.warn(`No network configuration found for chain ${chainId}`);
      return;
    }

    const endpoints = this.getRpcEndpoints(chainId, networkConfig);
    if (endpoints.length === 0) {
      this.logger.warn(`No RPC endpoints configured for ${networkConfig.name}`);
      return;
    }

    // Create static network to avoid auto-detection
    const staticNetwork = Network.from({
      chainId,
      name: networkConfig.name.toLowerCase().replace(/\s+/g, '-'),
    });

    // Create individual providers for each endpoint
    const jsonRpcProviders: JsonRpcProvider[] = [];

    for (const endpoint of endpoints) {
      try {
        const provider = new JsonRpcProvider(endpoint.url, staticNetwork, {
          staticNetwork,
          batchMaxCount: 10,
          polling: true,
          pollingInterval: 4000,
        });

        // Test the connection (but don't fail if it's unavailable initially)
        const isConnected = await this.testProviderConnection(provider, chainId);
        if (isConnected) {
          this.logger.log(
            `✅ RPC endpoint connected: ${this.maskEndpoint(endpoint.url)} for ${networkConfig.name}`,
          );
        } else {
          this.logger.warn(
            `⚠️ RPC endpoint not responding (will retry): ${this.maskEndpoint(endpoint.url)} for ${networkConfig.name}`,
          );
        }

        // Add provider even if initial test failed - health checks will retry
        jsonRpcProviders.push(provider);
      } catch (error) {
        this.logger.error(
          `Failed to create provider for ${this.maskEndpoint(endpoint.url)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    if (jsonRpcProviders.length === 0) {
      this.logger.error(
        `❌ No RPC endpoints configured for ${networkConfig.name} (chainId: ${chainId})`,
      );
      this.updateConnectionStatus(chainId, networkConfig.name, false, null, null, endpoints[0]?.url || 'none', 'No endpoints configured');
      return;
    }

    // Store individual providers for health checks
    this.rpcProviders.set(chainId, jsonRpcProviders);

    // Create provider (FallbackProvider if multiple endpoints, otherwise single provider)
    let provider: AbstractProvider;
    if (jsonRpcProviders.length > 1) {
      // Create FallbackProvider with configured priorities
      const providerConfigs = jsonRpcProviders.map((p, index) => ({
        provider: p,
        priority: endpoints[index]?.priority ?? index + 1,
        stallTimeout: endpoints[index]?.stallTimeout ?? 2000,
        weight: endpoints[index]?.weight ?? 1,
      }));

      provider = new FallbackProvider(providerConfigs, staticNetwork, {
        quorum: 1, // Only need one provider to respond
        eventQuorum: 1,
        eventWorkers: 1,
      });

      this.logger.log(
        `FallbackProvider created for ${networkConfig.name} with ${jsonRpcProviders.length} endpoints`,
      );
    } else {
      provider = jsonRpcProviders[0];
      this.logger.log(
        `Single provider created for ${networkConfig.name}`,
      );
    }

    this.providers.set(chainId, provider);

    // Validate connection and update status
    await this.validateAndUpdateStatus(chainId, networkConfig.name, endpoints[0]?.url || '');
  }

  /**
   * Get RPC endpoints for a chain from environment and config
   */
  private getRpcEndpoints(chainId: number, networkConfig: NetworkConfig): RpcEndpoint[] {
    const endpoints: RpcEndpoint[] = [];
    const alchemyKey = this.configService.get<string>('ALCHEMY_API_KEY');
    const quicknodeKey = this.configService.get<string>('QUICKNODE_API_KEY');

    // Priority endpoints based on chain
    switch (chainId) {
      case 84532: // Base Sepolia
        // 1. Alchemy (if configured) - highest priority
        if (alchemyKey) {
          endpoints.push({
            url: `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`,
            priority: 1,
            stallTimeout: 2000,
            weight: 3,
          });
        }

        // 2. QuickNode (if configured)
        if (quicknodeKey) {
          const quicknodeUrl = this.configService.get<string>('QUICKNODE_BASE_SEPOLIA_URL');
          if (quicknodeUrl) {
            endpoints.push({
              url: quicknodeUrl,
              priority: 2,
              stallTimeout: 2000,
              weight: 2,
            });
          }
        }

        // 3. Custom RPC from env
        const customRpc = this.configService.get<string>('BASE_SEPOLIA_RPC_URL');
        if (customRpc && customRpc !== 'https://sepolia.base.org') {
          endpoints.push({
            url: customRpc,
            priority: 3,
            stallTimeout: 3000,
            weight: 1,
          });
        }

        // 4. Public endpoint (lowest priority, fallback)
        endpoints.push({
          url: 'https://sepolia.base.org',
          priority: 4,
          stallTimeout: 5000,
          weight: 1,
        });
        break;

      case 8453: // Base Mainnet
        if (alchemyKey) {
          endpoints.push({
            url: `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
            priority: 1,
            stallTimeout: 2000,
            weight: 3,
          });
        }

        const baseRpc = this.configService.get<string>('BASE_RPC_URL');
        if (baseRpc && baseRpc !== 'https://mainnet.base.org') {
          endpoints.push({
            url: baseRpc,
            priority: 2,
            stallTimeout: 3000,
            weight: 2,
          });
        }

        endpoints.push({
          url: 'https://mainnet.base.org',
          priority: 3,
          stallTimeout: 5000,
          weight: 1,
        });
        break;

      case 11155111: // Sepolia
        if (alchemyKey) {
          endpoints.push({
            url: `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`,
            priority: 1,
            stallTimeout: 2000,
            weight: 3,
          });
        }

        const sepoliaRpc = this.configService.get<string>('SEPOLIA_RPC_URL');
        if (sepoliaRpc) {
          endpoints.push({
            url: sepoliaRpc,
            priority: 2,
            stallTimeout: 3000,
            weight: 1,
          });
        }
        break;

      case 137: // Polygon
        if (alchemyKey) {
          endpoints.push({
            url: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
            priority: 1,
            stallTimeout: 2000,
            weight: 3,
          });
        }

        endpoints.push({
          url: 'https://polygon-rpc.com',
          priority: 2,
          stallTimeout: 5000,
          weight: 1,
        });
        break;

      case 42161: // Arbitrum
        if (alchemyKey) {
          endpoints.push({
            url: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
            priority: 1,
            stallTimeout: 2000,
            weight: 3,
          });
        }

        endpoints.push({
          url: 'https://arb1.arbitrum.io/rpc',
          priority: 2,
          stallTimeout: 5000,
          weight: 1,
        });
        break;

      case 31337: // Localhost (Hardhat)
        endpoints.push({
          url: 'http://127.0.0.1:8545',
          priority: 1,
          stallTimeout: 1000,
          weight: 1,
        });
        break;

      default:
        // Use the configured RPC URL from network config
        if (networkConfig.rpcUrl) {
          endpoints.push({
            url: networkConfig.rpcUrl,
            priority: 1,
            stallTimeout: 5000,
            weight: 1,
          });
        }
    }

    return endpoints;
  }

  /**
   * Test if a provider can connect successfully
   */
  private async testProviderConnection(
    provider: JsonRpcProvider,
    chainId: number,
  ): Promise<boolean> {
    try {
      // Use exponential backoff for connection test
      const blockNumber = await this.executeWithRetry(
        async () => provider.getBlockNumber(),
        `Provider connection test for chain ${chainId}`,
        { maxRetries: 3, baseDelayMs: 500, maxDelayMs: 5000 },
      );

      this.logger.debug(
        `Provider for chain ${chainId} connected successfully at block ${blockNumber}`,
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Provider connection test failed for chain ${chainId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Validate provider connection and update status
   */
  private async validateAndUpdateStatus(
    chainId: number,
    networkName: string,
    primaryEndpoint: string,
  ): Promise<void> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      this.updateConnectionStatus(chainId, networkName, false, null, null, primaryEndpoint, 'No provider');
      return;
    }

    try {
      const startTime = Date.now();
      const blockNumber = await provider.getBlockNumber();
      const latency = Date.now() - startTime;

      this.updateConnectionStatus(chainId, networkName, true, blockNumber, latency, primaryEndpoint);
      this.logger.log(
        `Provider for ${networkName} (chainId: ${chainId}) validated - Block: ${blockNumber}, Latency: ${latency}ms`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.updateConnectionStatus(chainId, networkName, false, null, null, primaryEndpoint, errorMsg);
      this.logger.error(
        `Provider validation failed for ${networkName}: ${errorMsg}`,
      );
    }
  }

  /**
   * Update connection status for a chain
   */
  private updateConnectionStatus(
    chainId: number,
    networkName: string,
    isConnected: boolean,
    blockNumber: number | null,
    latency: number | null,
    endpoint: string,
    error?: string,
  ): void {
    this.connectionStatus.set(chainId, {
      chainId,
      networkName,
      isConnected,
      blockNumber,
      latency,
      endpoint: this.maskEndpoint(endpoint),
      error,
    });
  }

  /**
   * Mask sensitive parts of endpoint URL
   */
  private maskEndpoint(url: string): string {
    try {
      const parsedUrl = new URL(url);
      // Mask API keys in path
      if (parsedUrl.pathname.includes('/v2/') || parsedUrl.pathname.includes('/v3/')) {
        const parts = parsedUrl.pathname.split('/');
        const keyIndex = parts.findIndex(p => p === 'v2' || p === 'v3') + 1;
        if (keyIndex < parts.length && parts[keyIndex]) {
          parts[keyIndex] = parts[keyIndex].slice(0, 4) + '...' + parts[keyIndex].slice(-4);
        }
        parsedUrl.pathname = parts.join('/');
      }
      return parsedUrl.toString();
    } catch {
      return url.slice(0, 20) + '...';
    }
  }

  // ==================== Health Checks ====================

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.runHealthChecks();
    }, 30000);

    // Run initial health check
    this.runHealthChecks();
  }

  /**
   * Run health checks for all providers
   */
  private async runHealthChecks(): Promise<void> {
    for (const [chainId, provider] of this.providers) {
      const networkConfig = getNetworkConfig(chainId);
      if (!networkConfig) continue;

      try {
        const startTime = Date.now();
        const blockNumber = await provider.getBlockNumber();
        const latency = Date.now() - startTime;

        const currentStatus = this.connectionStatus.get(chainId);
        this.updateConnectionStatus(
          chainId,
          networkConfig.name,
          true,
          blockNumber,
          latency,
          currentStatus?.endpoint || 'unknown',
        );
      } catch (error) {
        const currentStatus = this.connectionStatus.get(chainId);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        this.updateConnectionStatus(
          chainId,
          networkConfig.name,
          false,
          null,
          null,
          currentStatus?.endpoint || 'unknown',
          errorMsg,
        );

        // Attempt to reconnect if primary provider fails
        this.logger.warn(
          `Health check failed for ${networkConfig.name}, attempting reconnection...`,
        );
        this.attemptReconnection(chainId);
      }
    }
  }

  /**
   * Attempt to reconnect a failed provider
   */
  private async attemptReconnection(chainId: number): Promise<void> {
    try {
      // Remove old provider
      const oldProvider = this.providers.get(chainId);
      if (oldProvider) {
        try {
          if (oldProvider instanceof FallbackProvider || oldProvider instanceof JsonRpcProvider) {
            await oldProvider.destroy();
          }
        } catch {
          // Ignore destroy errors
        }
        this.providers.delete(chainId);
      }

      // Reinitialize
      await this.initializeProviderForChain(chainId);

      const networkConfig = getNetworkConfig(chainId);
      this.logger.log(`Successfully reconnected provider for ${networkConfig?.name || chainId}`);
    } catch (error) {
      this.logger.error(
        `Failed to reconnect provider for chain ${chainId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get overall blockchain health status
   */
  getHealthStatus(): BlockchainHealthStatus {
    const providers = Array.from(this.connectionStatus.values());
    const defaultChainStatus = this.connectionStatus.get(DEFAULT_CHAIN_ID);

    return {
      isHealthy: providers.some(p => p.isConnected),
      defaultChainConnected: defaultChainStatus?.isConnected ?? false,
      providers,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get connection status for a specific chain
   */
  getChainStatus(chainId: number): ProviderStatus | undefined {
    return this.connectionStatus.get(chainId);
  }

  // ==================== Provider Access ====================

  /**
   * Get provider for a specific chain
   * @throws Error if no provider is available
   */
  getProvider(chainId: number = DEFAULT_CHAIN_ID): AbstractProvider {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(
        `No provider available for chain ${chainId}. ` +
        `Please ensure RPC endpoints are configured and the network is reachable.`,
      );
    }
    return provider;
  }

  /**
   * Get JsonRpcProvider for a specific chain (needed for some operations)
   * Returns the first available JsonRpcProvider for the chain
   */
  getJsonRpcProvider(chainId: number = DEFAULT_CHAIN_ID): JsonRpcProvider {
    const providers = this.rpcProviders.get(chainId);
    if (!providers || providers.length === 0) {
      throw new Error(
        `No JsonRpcProvider available for chain ${chainId}. ` +
        `Please ensure RPC endpoints are configured and the network is reachable.`,
      );
    }
    return providers[0];
  }

  /**
   * Check if a provider is available for a chain
   */
  hasProvider(chainId: number): boolean {
    return this.providers.has(chainId);
  }

  /**
   * Check if provider is connected for a chain
   */
  isConnected(chainId: number = DEFAULT_CHAIN_ID): boolean {
    const status = this.connectionStatus.get(chainId);
    return status?.isConnected ?? false;
  }

  /**
   * Get current block number for a chain
   */
  async getBlockNumber(chainId: number = DEFAULT_CHAIN_ID): Promise<number> {
    const provider = this.getProvider(chainId);
    return this.executeWithRetry(
      () => provider.getBlockNumber(),
      `Get block number for chain ${chainId}`,
    );
  }

  // ==================== Utility Methods ====================

  /**
   * Execute an operation with exponential backoff retry
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = this.retryConfig,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        const delay = Math.min(
          config.baseDelayMs * Math.pow(2, attempt),
          config.maxDelayMs,
        );

        if (attempt < config.maxRetries - 1) {
          this.logger.debug(
            `${operationName} failed (attempt ${attempt + 1}/${config.maxRetries}): ${lastError.message}. Retrying in ${delay}ms...`,
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if an error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      'revert',
      'insufficient funds',
      'nonce too low',
      'replacement fee too low',
      'execution reverted',
      'UNPREDICTABLE_GAS_LIMIT',
      'invalid address',
      'invalid argument',
    ];

    return nonRetryablePatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
