import { Module } from '@nestjs/common';
import { ImpactDAOService } from './impact-dao.service';
import { ImpactDAOResolver } from './impact-dao.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Module for Impact DAO Pool operations
 * Handles shared treasury staking with configurable yield splits
 */
@Module({
  imports: [PrismaModule],
  providers: [ImpactDAOService, ImpactDAOResolver],
  exports: [ImpactDAOService],
})
export class ImpactDAOModule {}
