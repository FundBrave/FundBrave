import { Module } from '@nestjs/common';
import { WealthBuildingService } from './wealth-building.service';
import { WealthBuildingResolver } from './wealth-building.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Module for Wealth Building Donation operations
 * Handles 80/20 donations with perpetual yield and stock accumulation
 */
@Module({
  imports: [PrismaModule],
  providers: [WealthBuildingService, WealthBuildingResolver],
  exports: [WealthBuildingService],
})
export class WealthBuildingModule {}
