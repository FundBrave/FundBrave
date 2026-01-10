import { Module } from '@nestjs/common';
import { StakingService } from './staking.service';
import { StakingResolver } from './staking.resolver';
import { StakingController } from './staking.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StakingService, StakingResolver],
  controllers: [StakingController],
  exports: [StakingService],
})
export class StakingModule {}
