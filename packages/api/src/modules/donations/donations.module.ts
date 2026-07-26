import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { IndexingService } from './indexing.service';
import { MoralisStreamsService } from './moralis-streams.service';
import { PricingService } from './pricing.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [AuthModule],
  controllers: [DonationsController, WebhooksController],
  providers: [DonationsService, PricingService, IndexingService, MoralisStreamsService],
  exports: [DonationsService, MoralisStreamsService],
})
export class DonationsModule {}
