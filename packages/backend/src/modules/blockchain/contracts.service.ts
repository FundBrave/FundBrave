import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
} from '../../common/exceptions';

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
 * - Multi-chain support
 * - Contract instance caching
 * - Retry logic for failed calls
 * - Transaction confirmation waiting
 * - Event log parsing
 */
@Injectable()
export class ContractsService implements OnModuleInit {
  private readonly logger = new Logger(ContractsService.name);

  // Providers per chain
  private providers: Map<number, JsonRpcProvider> = new Map();

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

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize providers and contracts on module start
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing ContractsService...');

    // Initialize providers for all supported networks
    await this.initializeProviders();

    // Initialize signer if private key is provided
    const privateKey = this.configService.get<string>('BACKEND_WALLET_PK');
    if (privateKey) {
      const defaultProvider = this.providers.get(DEFAULT_CHAIN_ID);
      if (defaultProvider) {
        this.signer = new Wallet(privateKey, defaultProvider);
        this.logger.log(
          `Backend wallet initialized: ${this.signer.address.slice(0, 10)}...`,
        );
      }
    } else {
      this.logger.warn(
        'No backend wallet configured - write operations will not be available',
      );
    }

    // Pre-load contracts for default chain
    await this.initializeContractsForChain(DEFAULT_CHAIN_ID);

    this.logger.log('ContractsService initialized successfully');
  }

  // ==================== Provider Management ====================

  /**
   * Initialize JSON-RPC providers for all supported networks
   */
  private async initializeProviders(): Promise<void> {
    for (const [chainIdStr, networkConfig] of Object.entries(
      SUPPORTED_NETWORKS,
    )) {
      const chainId = parseInt(chainIdStr);
      try {
        const provider = new JsonRpcProvider(networkConfig.rpcUrl, {
          chainId,
          name: networkConfig.name,
        });

        // Test the connection
        await provider.getBlockNumber();

        this.providers.set(chainId, provider);
        this.logger.log(
          `Provider initialized for ${networkConfig.name} (chainId: ${chainId})`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to initialize provider for ${networkConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chainId: number = DEFAULT_CHAIN_ID): JsonRpcProvider {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }
    return provider;
  }

  /**
   * Get the backend signer (if configured)
   */
  getSigner(): Wallet | null {
    return this.signer;
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

    const provider = this.providers.get(chainId);
    if (!provider) {
      this.logger.warn(`No provider available for chain ${chainId}`);
      return;
    }

    // Initialize contracts map for this chain
    if (!this.contracts.has(chainId)) {
      this.contracts.set(chainId, new Map());
    }

    const chainContracts = this.contracts.get(chainId)!;

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
        this.logger.debug(
          `Contract ${name} initialized at ${address.slice(0, 10)}... on chain ${chainId}`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to initialize contract ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
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
