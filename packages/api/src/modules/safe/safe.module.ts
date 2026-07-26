import { Module } from '@nestjs/common';
import { SafeService } from './safe.service';

@Module({
  providers: [SafeService],
  exports: [SafeService],
})
export class SafeModule {}
