import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { FundraiserBlockchainService } from './fundraiser-blockchain.service';
import { DonationBlockchainService } from './donation-blockchain.service';
import { StakingBlockchainService } from './staking-blockchain.service';
import {
  CreateFundraiserOnChainDto,
  CreateFundraiserOnChainResponseDto,
  RecordDonationFromTxDto,
  RecordStakeFromTxDto,
  VerifyTransactionDto,
  TransactionVerificationResultDto,
  FundraiserBlockchainDataDto,
  StakingPoolBlockchainDataDto,
  SyncFundraiserDataDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Fundraiser } from '../fundraisers/dto';
import { Donation } from '../donations/dto';
import { Stake } from '../staking/dto';
import { DEFAULT_CHAIN_ID } from './config/deployments';

/**
 * Blockchain Controller
 * REST API endpoints for blockchain operations
 *
 * Endpoints:
 * - POST /api/fundraisers - Create campaign (calls blockchain)
 * - POST /api/donations - Record donation from transaction
 * - POST /api/stakes - Record stake from transaction
 * - GET /api/blockchain/verify/:txHash - Verify transaction
 * - GET /api/blockchain/fundraiser/:id/sync - Sync fundraiser from chain
 * - GET /api/blockchain/staking-pool/:address - Get pool data
 */
@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly fundraiserBlockchainService: FundraiserBlockchainService,
    private readonly donationBlockchainService: DonationBlockchainService,
    private readonly stakingBlockchainService: StakingBlockchainService,
  ) {}

  // ==================== Fundraiser Endpoints ====================

  /**
   * Create a new fundraiser on the blockchain
   * This endpoint:
   * 1. Validates input
   * 2. Calls FundraiserFactory.createFundraiser()
   * 3. Waits for confirmation
   * 4. Saves to database
   * 5. Returns the created fundraiser
   */
  @Post('fundraisers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new fundraiser on blockchain',
    description:
      'Creates a fundraiser on the blockchain and saves it to the database. ' +
      'Requires the backend to have a configured wallet for signing transactions.',
  })
  @ApiResponse({
    status: 201,
    description: 'Fundraiser created successfully',
    type: Fundraiser,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or blockchain error',
  })
  async createFundraiser(
    @CurrentUser() user: { id: string },
    @Body() input: CreateFundraiserOnChainDto,
  ): Promise<Fundraiser> {
    return this.fundraiserBlockchainService.createFundraiserWithBlockchain(
      user.id,
      input,
    );
  }

  /**
   * Create a fundraiser on blockchain only (returns transaction details)
   * Use this when the frontend wants to handle database creation separately
   */
  @Post('fundraisers/on-chain')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create fundraiser on blockchain only',
    description:
      'Creates a fundraiser on the blockchain and returns transaction details. ' +
      'Does not save to database - use POST /fundraisers for full creation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Blockchain transaction successful',
    type: CreateFundraiserOnChainResponseDto,
  })
  async createFundraiserOnChain(
    @Body() input: CreateFundraiserOnChainDto,
  ): Promise<CreateFundraiserOnChainResponseDto> {
    return this.fundraiserBlockchainService.createFundraiserOnChain(input);
  }

  /**
   * Get live fundraiser data from blockchain
   */
  @Get('fundraisers/:id/blockchain-data')
  @ApiOperation({
    summary: 'Get live fundraiser data from blockchain',
    description:
      'Fetches current fundraiser state directly from the smart contract',
  })
  @ApiParam({ name: 'id', description: 'Fundraiser database ID' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Blockchain data retrieved',
    type: FundraiserBlockchainDataDto,
  })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getFundraiserBlockchainData(
    @Param('id') fundraiserId: string,
    @Query('chainId') chainId?: number,
  ): Promise<FundraiserBlockchainDataDto> {
    return this.fundraiserBlockchainService.getFundraiserBlockchainData({
      fundraiserId,
      chainId,
    });
  }

  /**
   * Sync fundraiser data from blockchain to database
   */
  @Post('fundraisers/:id/sync')
  @ApiOperation({
    summary: 'Sync fundraiser data from blockchain',
    description:
      'Updates the database with current on-chain state (raised amount, donors, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Fundraiser database ID' })
  @ApiResponse({
    status: 200,
    description: 'Fundraiser synced successfully',
    type: Fundraiser,
  })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  @HttpCode(HttpStatus.OK)
  async syncFundraiserFromBlockchain(
    @Param('id') fundraiserId: string,
    @Body() body: { chainId?: number },
  ): Promise<Fundraiser> {
    return this.fundraiserBlockchainService.syncFundraiserFromBlockchain({
      fundraiserId,
      chainId: body.chainId,
    });
  }

  // ==================== Donation Endpoints ====================

  /**
   * Record a donation from a verified transaction
   * Called by frontend after user signs the donation transaction
   */
  @Post('donations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Record donation from transaction',
    description:
      'Verifies a donation transaction on the blockchain and records it to the database. ' +
      'Call this after the user has signed the donation transaction.',
  })
  @ApiResponse({
    status: 201,
    description: 'Donation recorded successfully',
    type: Donation,
  })
  @ApiResponse({ status: 400, description: 'Invalid transaction or input' })
  @ApiResponse({ status: 409, description: 'Transaction already processed' })
  async recordDonation(
    @CurrentUser() user: { id: string },
    @Body() input: RecordDonationFromTxDto,
  ): Promise<Donation> {
    return this.donationBlockchainService.recordDonationFromTransaction(
      input,
      user.id,
    );
  }

  /**
   * Record an anonymous donation (no auth required)
   */
  @Post('donations/anonymous')
  @ApiOperation({
    summary: 'Record anonymous donation from transaction',
    description:
      'Records a donation without requiring authentication. ' +
      'The donor address is extracted from the transaction.',
  })
  @ApiResponse({
    status: 201,
    description: 'Donation recorded successfully',
    type: Donation,
  })
  async recordAnonymousDonation(
    @Body() input: RecordDonationFromTxDto,
  ): Promise<Donation> {
    // Force anonymous flag for unauthenticated requests
    return this.donationBlockchainService.recordDonationFromTransaction({
      ...input,
      isAnonymous: true,
    });
  }

  // ==================== Staking Endpoints ====================

  /**
   * Record a stake from a verified transaction
   */
  @Post('stakes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Record stake from transaction',
    description:
      'Verifies a stake transaction on the blockchain and records it to the database. ' +
      'Call this after the user has signed the stake transaction.',
  })
  @ApiResponse({
    status: 201,
    description: 'Stake recorded successfully',
    type: Stake,
  })
  @ApiResponse({ status: 400, description: 'Invalid transaction or input' })
  @ApiResponse({ status: 409, description: 'Transaction already processed' })
  async recordStake(
    @CurrentUser() user: { id: string },
    @Body() input: RecordStakeFromTxDto,
  ): Promise<Stake> {
    return this.stakingBlockchainService.recordStakeFromTransaction(
      input,
      user.id,
    );
  }

  /**
   * Get staking pool data from blockchain
   */
  @Get('staking-pools/:address')
  @ApiOperation({
    summary: 'Get staking pool blockchain data',
    description: 'Fetches current staking pool state from the smart contract',
  })
  @ApiParam({ name: 'address', description: 'Pool contract address' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pool data retrieved',
    type: StakingPoolBlockchainDataDto,
  })
  async getStakingPoolData(
    @Param('address') poolAddress: string,
    @Query('chainId') chainId?: number,
  ): Promise<StakingPoolBlockchainDataDto> {
    return this.stakingBlockchainService.getStakingPoolBlockchainData(
      poolAddress,
      chainId ?? DEFAULT_CHAIN_ID,
    );
  }

  /**
   * Get user's staking info for a pool
   */
  @Get('staking-pools/:address/user/:userAddress')
  @ApiOperation({
    summary: 'Get user staking info from blockchain',
    description: 'Fetches user-specific staking data from the contract',
  })
  @ApiParam({ name: 'address', description: 'Pool contract address' })
  @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getUserStakingInfo(
    @Param('address') poolAddress: string,
    @Param('userAddress') userAddress: string,
    @Query('chainId') chainId?: number,
  ) {
    return this.stakingBlockchainService.getUserStakingInfo(
      poolAddress,
      userAddress,
      chainId ?? DEFAULT_CHAIN_ID,
    );
  }

  /**
   * Sync stake from blockchain
   */
  @Post('stakes/:id/sync')
  @ApiOperation({
    summary: 'Sync stake data from blockchain',
    description: 'Updates stake record with current on-chain state',
  })
  @ApiParam({ name: 'id', description: 'Stake database ID' })
  @ApiResponse({
    status: 200,
    description: 'Stake synced successfully',
    type: Stake,
  })
  @HttpCode(HttpStatus.OK)
  async syncStakeFromBlockchain(
    @Param('id') stakeId: string,
    @Body() body: { chainId?: number },
  ): Promise<Stake> {
    return this.stakingBlockchainService.syncStakeFromBlockchain(
      stakeId,
      body.chainId,
    );
  }

  // ==================== Transaction Verification ====================

  /**
   * Verify a transaction exists and was successful
   */
  @Get('verify/:txHash')
  @ApiOperation({
    summary: 'Verify transaction',
    description: 'Check if a transaction exists and was successful',
  })
  @ApiParam({ name: 'txHash', description: 'Transaction hash to verify' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Verification result',
    type: TransactionVerificationResultDto,
  })
  async verifyTransaction(
    @Param('txHash') txHash: string,
    @Query('chainId') chainId?: number,
  ): Promise<TransactionVerificationResultDto> {
    return this.donationBlockchainService.verifyTransaction({
      txHash,
      chainId,
    });
  }

  // ==================== Network Info ====================

  /**
   * Get supported networks
   */
  @Get('networks')
  @ApiOperation({
    summary: 'Get supported networks',
    description: 'Returns list of supported blockchain networks',
  })
  async getSupportedNetworks() {
    const defaultChainId = DEFAULT_CHAIN_ID;
    const defaultNetwork = this.contractsService.getNetworkConfig(defaultChainId);

    return {
      defaultChainId,
      defaultNetwork: defaultNetwork
        ? {
            chainId: defaultNetwork.chainId,
            name: defaultNetwork.name,
            isTestnet: defaultNetwork.isTestnet,
            explorerUrl: defaultNetwork.explorerUrl,
          }
        : null,
      supportedChainIds: [31337, 11155111, 137, 42161], // From deployments config
    };
  }

  /**
   * Get current block number
   */
  @Get('block-number')
  @ApiOperation({
    summary: 'Get current block number',
    description: 'Returns the current block number for a chain',
  })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getCurrentBlockNumber(
    @Query('chainId') chainId?: number,
  ): Promise<{ blockNumber: number; chainId: number }> {
    const chain = chainId ?? DEFAULT_CHAIN_ID;
    const blockNumber = await this.contractsService.getCurrentBlock(chain);
    return { blockNumber, chainId: chain };
  }

  /**
   * Get contract addresses
   */
  @Get('contracts')
  @ApiOperation({
    summary: 'Get contract addresses',
    description: 'Returns deployed contract addresses for a chain',
  })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getContractAddresses(@Query('chainId') chainId?: number) {
    const chain = chainId ?? DEFAULT_CHAIN_ID;
    const networkConfig = this.contractsService.getNetworkConfig(chain);

    if (!networkConfig) {
      return {
        chainId: chain,
        supported: false,
        contracts: null,
      };
    }

    return {
      chainId: chain,
      supported: true,
      networkName: networkConfig.name,
      contracts: {
        fundraiserFactory: networkConfig.contracts.fundraiserFactory,
        fundBraveToken: networkConfig.contracts.fundBraveToken,
        impactDAOPool: networkConfig.contracts.impactDAOPool,
        usdc: networkConfig.contracts.usdc,
        platformTreasury: networkConfig.contracts.platformTreasury,
      },
    };
  }
}
