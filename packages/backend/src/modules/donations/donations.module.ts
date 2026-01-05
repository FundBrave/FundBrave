import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsResolver } from './donations.resolver';
import { DonationsController } from './donations.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DonationsService, DonationsResolver],
  controllers: [DonationsController],
  exports: [DonationsService],
})
export class DonationsModule {}
