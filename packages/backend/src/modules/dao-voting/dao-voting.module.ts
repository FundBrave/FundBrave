import { Module } from '@nestjs/common';
import { DAOVotingService } from './dao-voting.service';
import { DAOVotingResolver } from './dao-voting.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Module for DAO Voting operations
 * Handles off-chain voting for Impact DAO yield distribution
 */
@Module({
  imports: [PrismaModule],
  providers: [DAOVotingService, DAOVotingResolver],
  exports: [DAOVotingService],
})
export class DAOVotingModule {}
