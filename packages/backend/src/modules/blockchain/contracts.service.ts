import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  Provider,
  ContractRunner,
  Interface,
  TransactionReceipt,
  TransactionResponse,
  Log,
  EventLog,
  isError,
  parseUnits,
  formatUnits,
  AbstractProvider,
} from 'ethers';
import {
  FUNDRAISER_FACTORY_ABI,
  FUNDRAISER_ABI,
  STAKING_POOL_ABI,
  FUND_BRAVE_TOKEN_ABI,
  IMPACT_DAO_POOL_ABI,
  WEALTH_BUILDING_DONATION_ABI,
  PLATFORM_TREASURY_ABI,
  ERC20_ABI,
  ContractABI,
} from './abis';
import {
  NetworkConfig,
  ContractAddresses,
  ContractName,
  SUPPORTED_NETWORKS,
  DEFAULT_CHAIN_ID,
  getNetworkConfig,
  getContractAddresses,
  isChainSupported,
} from './config/deployments';
import {
  ContractNotRegisteredException,
  BlockchainTransactionException,
  BlockchainConnectionException,
} from '../../common/exceptions';
import { ProviderService, BlockchainHealthStatus, ProviderStatus } from './provider.service';

/**
 * Configuration for retry logic on blockchain calls
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Result of a parsed transaction log
 */
interface ParsedLog {
  name: string;
  args: Record<string, unknown>;
  address: string;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Contract instance with associated metadata
 */
interface ContractInstance {
  contract: Contract;
  address: string;
  chainId: number;
  name: string;
}

/**
 * ContractsService manages ethers.js contract instances for all FundBrave smart contracts.
 * Provides:
 * - Multi-chain support with robust provider management
 * - Contract instance caching
 * - Retry logic for failed calls
 * - Transaction confirmation waiting
 * - Event log parsing
 * - Health check integration
 */
@Injectable()
export class ContractsService implements OnModuleInit {
  private readonly logger = new Logger(ContractsService.name);

  // Cached contract instances: Map<chainId, Map<contractName, ContractInstance>>
  private contracts: Map<number, Map<string, ContractInstance>> = new Map();

  // Backend wallet for signing transactions (if configured)
  private signer: Wallet | null = null;

  // Default retry configuration
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
  };

  // ABI mappings for contract types
  private readonly abiMap: Record<string, ContractABI> = {
    fundraiserFactory: FUNDRAISER_FACTORY_ABI,
    fundBraveToken: FUND_BRAVE_TOKEN_ABI,
    impactDAOPool: IMPACT_DAO_POOL_ABI,
    wealthBuildingDonation: WEALTH_BUILDING_DONATION_ABI,
    platformTreasury: PLATFORM_TREASURY_ABI,
    usdc: ERC20_ABI,
    aUsdc: ERC20_ABI,
    stakingPool: STAKING_POOL_ABI,
    fundraiser: FUNDRAISER_ABI,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService,
  ) {}

  /**
   * Initialize contracts on module start
   * Provider initialization is handled by ProviderService
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing ContractsService...');

    // Validate provider service is ready
    await this.validateProviderConnection();

    // Initialize signer if private key is provided
    await this.initializeSigner();

    // Pre-load contracts for default chain
    await this.initializeContractsForChain(DEFAULT_CHAIN_ID);

    this.logger.log('ContractsService initialized successfully');
  }

  /**
   * Validate that the provider service has working connections
   * Note: This is lenient during initialization - providers may still be connecting
   */
  private async validateProviderConnection(): Promise<void> {
    const healthStatus = this.providerService.getHealthStatus();

    if (!healthStatus.isHealthy) {
      this.logger.warn(
        '⚠️ No blockchain providers are connected yet. They may still be initializing. Health checks will continue retrying.',
      );
      this.logger.warn(
        '💡 To improve reliability, set ALCHEMY_API_KEY in your .env file',
      );
    } else {
      this.logger.log(
        `✅ Provider validation complete: ${healthStatus.providers.filter(p => p.isConnected).length}/${healthStatus.providers.length} chains connected`,
      );
    }

    if (!healthStatus.defaultChainConnected) {
      this.logger.warn(
        `⚠️ Default chain (${DEFAULT_CHAIN_ID}) is not connected yet. Will retry via health checks.`,
      );
    }
  }

  /**
   * Initialize backend wallet signer
   */
  private async initializeSigner(): Promise<void> {
    const privateKey = this.configService.get<string>('BACKEND_WALLET_PK');

    if (!privateKey) {
      this.logger.warn(
        'No BACKEND_WALLET_PK configured - write operations will not be available. ' +
        'Set BACKEND_WALLET_PK in .env for blockchain write operations.',
      );
      return;
    }

    // Validate private key format
    if (!this.isValidPrivateKey(privateKey)) {
      this.logger.error(
        'BACKEND_WALLET_PK is invalid. Must be a 64-character hex string (with or without 0x prefix).',
      );
      return;
    }

    try {
      // Get provider for default chain
      if (!this.providerService.hasProvider(DEFAULT_CHAIN_ID)) {
        this.logger.warn(
          `Cannot initialize signer: No provider for default chain ${DEFAULT_CHAIN_ID}`,
        );
        return;
      }

      const provider = this.providerService.getProvider(DEFAULT_CHAIN_ID);
      const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      this.signer = new Wallet(normalizedKey, provider);

      this.logger.log(
        `Backend wallet initialized: ${this.signer.address.slice(0, 10)}...${this.signer.address.slice(-4)}`,
      );

      // Log wallet balance for debugging
      try {
        const balance = await provider.getBalance(this.signer.address);
        this.logger.debug(
          `Backend wallet balance: ${formatUnits(balance, 18)} ETH`,
        );
      } catch (balanceError) {
        this.logger.debug('Could not fetch wallet balance');
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize backend wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validate private key format
   */
  private isValidPrivateKey(key: string): boolean {
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    return /^[a-fA-F0-9]{64}$/.test(cleanKey);
  }

  // ==================== Provider Management ====================

  /**
   * Get provider for a specific chain
   * Delegates to ProviderService for robust connection handling
   */
  getProvider(chainId: number = DEFAULT_CHAIN_ID): AbstractProvider {
    if (!this.providerService.hasProvider(chainId)) {
      throw new BlockchainConnectionException(
        chainId,
        `No provider available for chain ${chainId}. Ensure RPC endpoints are configured.`,
      );
    }
    return this.providerService.getProvider(chainId);
  }

  /**
   * Get JsonRpcProvider for operations that require it specifically
   */
  getJsonRpcProvider(chainId: number = DEFAULT_CHAIN_ID): JsonRpcProvider {
    return this.providerService.getJsonRpcProvider(chainId);
  }

  /**
   * Get the backend signer (if configured)
   */
  getSigner(): Wallet | null {
    return this.signer;
  }

  /**
   * Check if blockchain connection is healthy
   */
  isConnectionHealthy(chainId: number = DEFAULT_CHAIN_ID): boolean {
    return this.providerService.isConnected(chainId);
  }

  /**
   * Get blockchain health status
   */
  getBlockchainHealth(): BlockchainHealthStatus {
    return this.providerService.getHealthStatus();
  }

  /**
   * Get connection status for a specific chain
   */
  getChainConnectionStatus(chainId: number): ProviderStatus | undefined {
    return this.providerService.getChainStatus(chainId);
  }

  // ==================== Contract Instance Management ====================

  /**
   * Initialize all platform contracts for a specific chain
   */
  private async initializeContractsForChain(chainId: number): Promise<void> {
    const addresses = getContractAddresses(chainId);
    if (!addresses) {
      this.logger.warn(`No contract addresses configured for chain ${chainId}`);
      return;
    }

    // Use providerService instead of local providers map
    if (!this.providerService.hasProvider(chainId)) {
      this.logger.warn(`No provider available for chain ${chainId} yet. Will initialize contracts later.`);
      return;
    }

    let provider;
    try {
      provider = this.providerService.getProvider(chainId);
    } catch (error) {
      this.logger.warn(
        `Provider for chain ${chainId} not ready yet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return;
    }

    // Initialize contracts map for this chain
    if (!this.contracts.has(chainId)) {
      this.contracts.set(chainId, new Map());
    }

    const chainContracts = this.contracts.get(chainId)!;
    let initializedCount = 0;

    // Initialize each contract
    for (const [name, address] of Object.entries(addresses)) {
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        continue;
      }

      const abi = this.abiMap[name];
      if (!abi) {
        continue;
      }

      try {
        const contract = new Contract(address, abi, provider);
        chainContracts.set(name, {
          contract,
          address,
          chainId,
          name,
        });
        initializedCount++;
        this.logger.debug(
          `Contract ${name} initialized at ${address.slice(0, 10)}...${address.slice(-4)} on chain ${chainId}`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to initialize contract ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    this.logger.log(
      `Initialized ${initializedCount} contracts for chain ${chainId}`,
    );
  }

  /**
   * Get a platform contract instance
   */
  getContract(
    contractName: ContractName,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Contract {
    const chainContracts = this.contracts.get(chainId);
    const instance = chainContracts?.get(contractName);

    if (!instance) {
      throw new ContractNotRegisteredException(contractName, chainId);
    }

    return instance.contract;
  }

  /**
   * Get a platform contract with signer attached (for write operations)
   */
  getContractWithSigner(
    contractName: ContractName,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Contract {
    if (!this.signer) {
      throw new Error('No signer configured for write operations');
    }

    const contract = this.getContract(contractName, chainId);
    return contract.connect(this.signer) as Contract;
  }

  /**
   * Get FundraiserFactory contract
   */
  getFundraiserFactory(chainId: number = DEFAULT_CHAIN_ID): Contract {
    return this.getContract('fundraiserFactory', chainId);
  }

  /**
   * Get FundraiserFactory with signer
   */
  getFundraiserFactoryWithSigner(chainId: number = DEFAULT_CHAIN_ID): Contract {
    return this.getContractWithSigner('fundraiserFactory', chainId);
  }

  /**
   * Get a Fundraiser contract at a specific address
   */
  getFundraiserContract(
    address: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Contract {
    const provider = this.getProvider(chainId);
    return new Contract(address, FUNDRAISER_ABI, provider);
  }

  /**
   * Get a StakingPool contract at a specific address
   */
  getStakingPoolContract(
    address: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Contract {
    const provider = this.getProvider(chainId);
    return new Contract(address, STAKING_POOL_ABI, provider);
  }

  /**
   * Get USDC token contract
   */
  getUsdcContract(chainId: number = DEFAULT_CHAIN_ID): Contract {
    return this.getContract('usdc', chainId);
  }

  /**
   * Get ImpactDAO Pool contract
   */
  getImpactDAOPool(chainId: number = DEFAULT_CHAIN_ID): Contract {
    return this.getContract('impactDAOPool', chainId);
  }

  /**
   * Get FundBrave Token contract
   */
  getFundBraveToken(chainId: number = DEFAULT_CHAIN_ID): Contract {
    return this.getContract('fundBraveToken', chainId);
  }

  /**
   * Get contract address
   */
  getContractAddress(
    contractName: ContractName,
    chainId: number = DEFAULT_CHAIN_ID,
  ): string {
    const addresses = getContractAddresses(chainId);
    if (!addresses) {
      throw new ContractNotRegisteredException(contractName, chainId);
    }
    const address = addresses[contractName];
    if (!address) {
      throw new ContractNotRegisteredException(contractName, chainId);
    }
    return address;
  }

  // ==================== Transaction Handling ====================

  /**
   * Wait for transaction confirmation with retry logic
   */
  async waitForTransaction(
    txHash: string,
    chainId: number = DEFAULT_CHAIN_ID,
    confirmations?: number,
  ): Promise<TransactionReceipt> {
    const provider = this.getProvider(chainId);
    const networkConfig = getNetworkConfig(chainId);
    const requiredConfirmations =
      confirmations ?? networkConfig?.blockConfirmations ?? 1;

    try {
      const receipt = await provider.waitForTransaction(
        txHash,
        requiredConfirmations,
        60000, // 60 second timeout
      );

      if (!receipt) {
        throw new Error(`Transaction ${txHash} not found`);
      }

      if (receipt.status === 0) {
        throw new BlockchainTransactionException(txHash, 'Transaction reverted');
      }

      this.logger.log(
        `Transaction ${txHash.slice(0, 10)}... confirmed with ${requiredConfirmations} confirmations`,
      );

      return receipt;
    } catch (error) {
      if (isError(error, 'TIMEOUT')) {
        throw new BlockchainTransactionException(
          txHash,
          'Transaction confirmation timeout',
        );
      }
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    txHash: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<TransactionReceipt | null> {
    const provider = this.getProvider(chainId);
    return provider.getTransactionReceipt(txHash);
  }

  /**
   * Get transaction details
   */
  async getTransaction(
    txHash: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<TransactionResponse | null> {
    const provider = this.getProvider(chainId);
    return provider.getTransaction(txHash);
  }

  /**
   * Verify that a transaction exists and was successful
   */
  async verifyTransaction(
    txHash: string,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<{ isValid: boolean; receipt: TransactionReceipt | null }> {
    try {
      const receipt = await this.getTransactionReceipt(txHash, chainId);
      if (!receipt) {
        return { isValid: false, receipt: null };
      }
      return { isValid: receipt.status === 1, receipt };
    } catch {
      return { isValid: false, receipt: null };
    }
  }

  // ==================== Event Log Parsing ====================

  /**
   * Parse logs from a transaction receipt using a specific contract ABI
   */
  parseLogsWithAbi(logs: readonly Log[], abi: ContractABI): ParsedLog[] {
    const iface = new Interface(abi);
    const parsedLogs: ParsedLog[] = [];

    for (const log of logs) {
      try {
        const parsed = iface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed) {
          parsedLogs.push({
            name: parsed.name,
            args: Object.fromEntries(
              parsed.fragment.inputs.map((input, i) => [
                input.name,
                parsed.args[i],
              ]),
            ),
            address: log.address,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          });
        }
      } catch {
        // Log doesn't match this ABI, skip
      }
    }

    return parsedLogs;
  }

  /**
   * Parse FundraiserFactory logs from a transaction
   */
  parseFundraiserFactoryLogs(logs: readonly Log[]): ParsedLog[] {
    return this.parseLogsWithAbi(logs, FUNDRAISER_FACTORY_ABI);
  }

  /**
   * Parse Fundraiser logs from a transaction
   */
  parseFundraiserLogs(logs: readonly Log[]): ParsedLog[] {
    return this.parseLogsWithAbi(logs, FUNDRAISER_ABI);
  }

  /**
   * Parse StakingPool logs from a transaction
   */
  parseStakingPoolLogs(logs: readonly Log[]): ParsedLog[] {
    return this.parseLogsWithAbi(logs, STAKING_POOL_ABI);
  }

  /**
   * Extract FundraiserCreated event from logs
   */
  extractFundraiserCreatedEvent(logs: readonly Log[]): {
    fundraiser: string;
    owner: string;
    id: bigint;
    name: string;
    goal: bigint;
    deadline: bigint;
  } | null {
    const parsed = this.parseFundraiserFactoryLogs(logs);
    const event = parsed.find((log) => log.name === 'FundraiserCreated');
    if (!event) return null;

    return {
      fundraiser: event.args['fundraiser'] as string,
      owner: event.args['owner'] as string,
      id: event.args['id'] as bigint,
      name: event.args['name'] as string,
      goal: event.args['goal'] as bigint,
      deadline: event.args['deadline'] as bigint,
    };
  }

  /**
   * Extract DonationCredited event from logs
   */
  extractDonationEvent(logs: readonly Log[]): {
    donor: string;
    amount: bigint;
    sourceChain: string;
  } | null {
    const parsed = this.parseFundraiserLogs(logs);
    const event = parsed.find((log) => log.name === 'DonationCredited');
    if (!event) return null;

    return {
      donor: event.args['donor'] as string,
      amount: event.args['amount'] as bigint,
      sourceChain: event.args['sourceChain'] as string,
    };
  }

  /**
   * Extract Staked event from logs
   */
  extractStakedEvent(logs: readonly Log[]): {
    staker: string;
    usdcAmount: bigint;
  } | null {
    const parsed = this.parseStakingPoolLogs(logs);
    const event = parsed.find((log) => log.name === 'Staked');
    if (!event) return null;

    return {
      staker: event.args['staker'] as string,
      usdcAmount: event.args['usdcAmount'] as bigint,
    };
  }

  // ==================== Utility Methods ====================

  /**
   * Execute a contract call with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Contract call',
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        const delay = Math.min(
          this.retryConfig.baseDelayMs * Math.pow(2, attempt),
          this.retryConfig.maxDelayMs,
        );

        this.logger.warn(
          `${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries}): ${lastError.message}. Retrying in ${delay}ms...`,
        );

        await this.sleep(delay);
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
    ];

    return nonRetryablePatterns.some((pattern) =>
      error.message.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse USDC amount (6 decimals)
   */
  parseUsdc(amount: string): bigint {
    return parseUnits(amount, 6);
  }

  /**
   * Format USDC amount (6 decimals)
   */
  formatUsdc(amount: bigint): string {
    return formatUnits(amount, 6);
  }

  /**
   * Parse token amount with decimals
   */
  parseTokenAmount(amount: string, decimals: number = 18): bigint {
    return parseUnits(amount, decimals);
  }

  /**
   * Format token amount with decimals
   */
  formatTokenAmount(amount: bigint, decimals: number = 18): string {
    return formatUnits(amount, decimals);
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(chainId: number = DEFAULT_CHAIN_ID): Promise<number> {
    const provider = this.getProvider(chainId);
    return provider.getBlockNumber();
  }

  /**
   * Get block timestamp
   */
  async getBlockTimestamp(
    blockNumber: number,
    chainId: number = DEFAULT_CHAIN_ID,
  ): Promise<number> {
    const provider = this.getProvider(chainId);
    const block = await provider.getBlock(blockNumber);
    return block?.timestamp ?? Math.floor(Date.now() / 1000);
  }

  /**
   * Check if an address is a valid Ethereum address
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(chainId: number): NetworkConfig | undefined {
    return getNetworkConfig(chainId);
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return isChainSupported(chainId);
  }
}
