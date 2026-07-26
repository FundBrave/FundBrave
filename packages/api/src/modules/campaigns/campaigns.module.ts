import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SafeModule } from '../safe/safe.module';
import { DonationsModule } from '../donations/donations.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [AuthModule, SafeModule, DonationsModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
