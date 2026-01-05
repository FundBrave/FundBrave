import { Module } from '@nestjs/common';
import { FundraisersService } from './fundraisers.service';
import { FundraisersResolver } from './fundraisers.resolver';
import { FundraisersController } from './fundraisers.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FundraisersService, FundraisersResolver],
  controllers: [FundraisersController],
  exports: [FundraisersService],
})
export class FundraisersModule {}
