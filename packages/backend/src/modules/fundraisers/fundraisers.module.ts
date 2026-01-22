import { Module, forwardRef } from '@nestjs/common';
import { FundraisersService } from './fundraisers.service';
import { FundraisersResolver } from './fundraisers.resolver';
import { FundraisersController } from './fundraisers.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StakingModule } from '../staking/staking.module';

@Module({
  imports: [PrismaModule, forwardRef(() => StakingModule)],
  providers: [FundraisersService, FundraisersResolver],
  controllers: [FundraisersController],
  exports: [FundraisersService],
})
export class FundraisersModule {}
