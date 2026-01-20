import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEthereumAddress,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Fundraiser Creation DTOs ====================

/**
 * Input for creating a new fundraiser on the blockchain
 */
export class CreateFundraiserOnChainDto {
  @ApiProperty({
    description: 'Campaign name',
    example: 'Help Build a School in Kenya',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Campaign images URLs',
    example: ['https://example.com/image1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Campaign categories',
    example: ['education', 'africa'],
  })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty({
    description: 'Campaign description',
    example: 'We are raising funds to build a primary school...',
  })
  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    description: 'Geographic region',
    example: 'Kenya',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({
    description: 'Beneficiary wallet address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsEthereumAddress()
  beneficiary: string;

  @ApiProperty({
    description: 'Funding goal in USDC (6 decimals)',
    example: '10000000000', // 10,000 USDC
  })
  @IsString()
  @Matches(/^\d+$/, { message: 'Goal must be a numeric string' })
  goalAmount: string;

  @ApiProperty({
    description: 'Campaign duration in days',
    example: 30,
  })
  @IsNumber()
  @Min(1)
  @Max(365)
  durationInDays: number;

  @ApiPropertyOptional({
    description: 'Chain ID for the deployment',
    example: 31337,
  })
  @IsOptional()
  @IsNumber()
  chainId?: number;
}

/**
 * Response after creating a fundraiser on-chain
 */
export class CreateFundraiserOnChainResponseDto {
  @ApiProperty({ description: 'Transaction hash' })
  txHash: string;

  @ApiProperty({ description: 'On-chain fundraiser ID' })
  onChainId: number;

  @ApiProperty({ description: 'Fundraiser contract address' })
  fundraiserAddress: string;

  @ApiProperty({ description: 'Block number of the transaction' })
  blockNumber: number;

  @ApiProperty({ description: 'Chain ID' })
  chainId: number;
}

// ==================== Transaction Verification DTOs ====================

/**
 * Input for verifying a transaction
 */
export class VerifyTransactionDto {
  @ApiProperty({
    description: 'Transaction hash to verify',
    example: '0x1234...',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'Invalid transaction hash format',
  })
  txHash: string;

  @ApiPropertyOptional({
    description: 'Chain ID of the transaction',
    example: 31337,
  })
  @IsOptional()
  @IsNumber()
  chainId?: number;
}

/**
 * Transaction verification result
 */
export class TransactionVerificationResultDto {
  @ApiProperty({ description: 'Whether the transaction is valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Transaction status (success/failed/pending)' })
  status: 'success' | 'failed' | 'pending' | 'not_found';

  @ApiPropertyOptional({ description: 'Block number if confirmed' })
  blockNumber?: number;

  @ApiPropertyOptional({ description: 'Gas used' })
  gasUsed?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}

// ==================== Donation Recording DTOs ====================

/**
 * Input for recording a donation from the frontend
 * Frontend sends txHash after user signs the transaction
 */
export class RecordDonationFromTxDto {
  @ApiProperty({
    description: 'Transaction hash of the donation',
    example: '0x1234...',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/)
  txHash: string;

  @ApiProperty({ description: 'Fundraiser database ID' })
  @IsString()
  fundraiserId: string;

  @ApiPropertyOptional({
    description: 'Chain ID of the transaction',
    example: 31337,
  })
  @IsOptional()
  @IsNumber()
  chainId?: number;

  @ApiPropertyOptional({
    description: 'Whether the donation is anonymous',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    description: 'Optional message from the donor',
    example: 'Good luck with your campaign!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

/**
 * Result of parsing a donation transaction
 */
export class ParsedDonationDto {
  @ApiProperty({ description: 'Donor wallet address' })
  donorAddress: string;

  @ApiProperty({ description: 'Donation amount in token units' })
  amount: string;

  @ApiProperty({ description: 'Token used for donation' })
  token: string;

  @ApiProperty({ description: 'Fundraiser on-chain ID' })
  fundraiserOnChainId: number;

  @ApiProperty({ description: 'Whether it was a wealth building donation' })
  isWealthBuilding: boolean;

  @ApiPropertyOptional({ description: 'Direct amount (for wealth building)' })
  directAmount?: string;

  @ApiPropertyOptional({
    description: 'Endowment amount (for wealth building)',
  })
  endowmentAmount?: string;

  @ApiProperty({ description: 'Block number' })
  blockNumber: number;

  @ApiProperty({ description: 'Block timestamp' })
  timestamp: number;
}

// ==================== Stake Recording DTOs ====================

/**
 * Input for recording a stake from the frontend
 */
export class RecordStakeFromTxDto {
  @ApiProperty({
    description: 'Transaction hash of the stake',
    example: '0x1234...',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/)
  txHash: string;

  @ApiPropertyOptional({
    description: 'Fundraiser database ID (null for global pool)',
  })
  @IsOptional()
  @IsString()
  fundraiserId?: string;

  @ApiPropertyOptional({
    description: 'Chain ID of the transaction',
    example: 31337,
  })
  @IsOptional()
  @IsNumber()
  chainId?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a global pool stake',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}

/**
 * Yield split configuration
 */
export class YieldSplitDto {
  @ApiProperty({
    description: 'Cause share in basis points (e.g., 7900 = 79%)',
  })
  @IsNumber()
  @Min(0)
  @Max(10000)
  causeShare: number;

  @ApiProperty({
    description: 'Staker share in basis points (e.g., 1900 = 19%)',
  })
  @IsNumber()
  @Min(0)
  @Max(10000)
  stakerShare: number;

  @ApiProperty({
    description: 'Platform share in basis points (min 200 = 2%)',
  })
  @IsNumber()
  @Min(200)
  @Max(10000)
  platformShare: number;
}

/**
 * Result of parsing a stake transaction
 */
export class ParsedStakeDto {
  @ApiProperty({ description: 'Staker wallet address' })
  stakerAddress: string;

  @ApiProperty({ description: 'Staked amount in token units' })
  amount: string;

  @ApiProperty({ description: 'Receipt shares received' })
  shares: string;

  @ApiProperty({ description: 'Staking pool address' })
  poolAddress: string;

  @ApiPropertyOptional({ description: 'Yield split configuration' })
  yieldSplit?: YieldSplitDto;

  @ApiProperty({ description: 'Block number' })
  blockNumber: number;

  @ApiProperty({ description: 'Block timestamp' })
  timestamp: number;
}

// ==================== Blockchain Data Sync DTOs ====================

/**
 * Request to sync fundraiser data from blockchain
 */
export class SyncFundraiserDataDto {
  @ApiProperty({ description: 'Fundraiser database ID' })
  @IsString()
  fundraiserId: string;

  @ApiPropertyOptional({
    description: 'Chain ID',
    example: 31337,
  })
  @IsOptional()
  @IsNumber()
  chainId?: number;
}

/**
 * Live fundraiser data from blockchain
 */
export class FundraiserBlockchainDataDto {
  @ApiProperty({ description: 'On-chain fundraiser ID' })
  onChainId: number;

  @ApiProperty({ description: 'Fundraiser contract address' })
  contractAddress: string;

  @ApiProperty({ description: 'Current total donations' })
  totalDonations: string;

  @ApiProperty({ description: 'Total donors count' })
  donorsCount: number;

  @ApiProperty({ description: 'Funding goal' })
  goal: string;

  @ApiProperty({ description: 'Campaign deadline timestamp' })
  deadline: number;

  @ApiProperty({ description: 'Whether goal has been reached' })
  goalReached: boolean;

  @ApiProperty({ description: 'Whether refunds are enabled' })
  refundsEnabled: boolean;

  @ApiProperty({ description: 'Campaign name from contract' })
  name: string;

  @ApiPropertyOptional({ description: 'Associated staking pool address' })
  stakingPoolAddress?: string;

  @ApiPropertyOptional({ description: 'Total staked in pool' })
  totalStaked?: string;
}

/**
 * Staking pool blockchain data
 */
export class StakingPoolBlockchainDataDto {
  @ApiProperty({ description: 'Pool contract address' })
  poolAddress: string;

  @ApiProperty({ description: 'Total principal staked' })
  totalStakedPrincipal: string;

  @ApiProperty({ description: 'Beneficiary address' })
  beneficiary: string;

  @ApiProperty({ description: 'Platform wallet address' })
  platformWallet: string;

  @ApiProperty({ description: 'Current reward per token' })
  rewardPerToken: string;

  @ApiProperty({ description: 'Period finish timestamp' })
  periodFinish: number;

  @ApiProperty({ description: 'Current reward rate' })
  rewardRate: string;

  @ApiProperty({ description: 'Rewards duration' })
  rewardsDuration: number;

  @ApiProperty({ description: 'Default yield split' })
  defaultYieldSplit: YieldSplitDto;
}

// ==================== Error Response DTOs ====================

/**
 * Blockchain error response
 */
export class BlockchainErrorDto {
  @ApiProperty({ description: 'Error code' })
  code: string;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ description: 'Transaction hash if applicable' })
  txHash?: string;

  @ApiPropertyOptional({ description: 'Additional error details' })
  details?: Record<string, unknown>;
}

// ==================== Query Filter DTOs ====================

/**
 * Filter for querying blockchain events
 */
export class BlockchainEventFilterDto {
  @ApiPropertyOptional({ description: 'Start block number' })
  @IsOptional()
  @IsNumber()
  fromBlock?: number;

  @ApiPropertyOptional({ description: 'End block number' })
  @IsOptional()
  @IsNumber()
  toBlock?: number;

  @ApiPropertyOptional({ description: 'Filter by address' })
  @IsOptional()
  @IsEthereumAddress()
  address?: string;

  @ApiPropertyOptional({ description: 'Event names to filter' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventNames?: string[];

  @ApiPropertyOptional({ description: 'Chain ID' })
  @IsOptional()
  @IsNumber()
  chainId?: number;
}
