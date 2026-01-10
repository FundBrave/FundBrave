import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryResolver } from './treasury.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Module for Platform Treasury operations
 * Handles fee collection, FBT staking, and yield distribution
 */
@Module({
  imports: [PrismaModule],
  providers: [TreasuryService, TreasuryResolver],
  exports: [TreasuryService],
})
export class TreasuryModule {}
