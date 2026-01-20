import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';

// Import blockchain services
import { BlockchainIndexerService } from './indexer.service';
import { EventsService } from './events.service';
import { ContractsService } from './contracts.service';
import { FundraiserBlockchainService } from './fundraiser-blockchain.service';
import { DonationBlockchainService } from './donation-blockchain.service';
import { StakingBlockchainService } from './staking-blockchain.service';
import { BlockchainController } from './blockchain.controller';

// Import domain services needed for event processing
import { FundraisersModule } from '../fundraisers/fundraisers.module';
import { DonationsModule } from '../donations/donations.module';
import { StakingModule } from '../staking/staking.module';
import { ImpactDAOModule } from '../impact-dao/impact-dao.module';
import { WealthBuildingModule } from '../wealth-building/wealth-building.module';
import { TreasuryModule } from '../treasury/treasury.module';
import { FBTVestingModule } from '../fbt-vesting/fbt-vesting.module';

/**
 * Blockchain Module
 * Handles blockchain event indexing, contract interactions, and transaction processing
 *
 * Services:
 * - ContractsService: Manages ethers.js contract instances and provider connections
 * - FundraiserBlockchainService: Creates fundraisers on-chain and syncs data
 * - DonationBlockchainService: Verifies and records donation transactions
 * - StakingBlockchainService: Verifies and records staking transactions
 * - BlockchainIndexerService: Indexes historical blockchain events
 * - EventsService: Processes real-time blockchain events
 */
@Module({
  imports: [
    // Enable scheduled tasks for periodic sync
    ScheduleModule.forRoot(),

    // Configuration for environment variables
    ConfigModule,

    // Core dependencies
    PrismaModule,

    // Domain modules for event processing
    forwardRef(() => FundraisersModule),
    forwardRef(() => DonationsModule),
    forwardRef(() => StakingModule),
    forwardRef(() => ImpactDAOModule),
    forwardRef(() => WealthBuildingModule),
    forwardRef(() => TreasuryModule),
    forwardRef(() => FBTVestingModule),
  ],
  controllers: [BlockchainController],
  providers: [
    // Core contract service - must be initialized first
    ContractsService,

    // Domain-specific blockchain services
    FundraiserBlockchainService,
    DonationBlockchainService,
    StakingBlockchainService,

    // Event indexing and processing
    BlockchainIndexerService,
    EventsService,
  ],
  exports: [
    // Export all services for use in other modules
    ContractsService,
    FundraiserBlockchainService,
    DonationBlockchainService,
    StakingBlockchainService,
    BlockchainIndexerService,
    EventsService,
  ],
})
export class BlockchainModule {}
