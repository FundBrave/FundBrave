import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';

// Import blockchain services
import { BlockchainIndexerService } from './indexer.service';
import { EventsService } from './events.service';

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
 * Handles blockchain event indexing and processing
 */
@Module({
  imports: [
    // Enable scheduled tasks for periodic sync
    ScheduleModule.forRoot(),

    // Core dependencies
    PrismaModule,

    // Domain modules for event processing
    FundraisersModule,
    DonationsModule,
    StakingModule,
    ImpactDAOModule,
    WealthBuildingModule,
    TreasuryModule,
    FBTVestingModule,
  ],
  providers: [
    BlockchainIndexerService,
    EventsService,
  ],
  exports: [
    BlockchainIndexerService,
    EventsService,
  ],
})
export class BlockchainModule {}
