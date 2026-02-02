import { Module, forwardRef } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TerminusModule,
    // Import blockchain module for health checks (optional, uses forwardRef to avoid circular deps)
    forwardRef(() => BlockchainModule),
  ],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
