import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TrendingService } from './trending.service';
import { TrendingResolver } from './trending.resolver';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TrendingService, TrendingResolver],
  exports: [TrendingService],
})
export class TrendingModule {}
