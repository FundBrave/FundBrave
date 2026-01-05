import { Module } from '@nestjs/common';
import { FBTVestingService } from './fbt-vesting.service';
import { FBTVestingResolver } from './fbt-vesting.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Module for FBT Vesting operations
 * Handles vesting schedules, claims, and burns
 */
@Module({
  imports: [PrismaModule],
  providers: [FBTVestingService, FBTVestingResolver],
  exports: [FBTVestingService],
})
export class FBTVestingModule {}
