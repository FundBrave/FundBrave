import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SafeModule } from '../safe/safe.module';
import { WithdrawalsController, AdminWithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [AuthModule, SafeModule],
  controllers: [WithdrawalsController, AdminWithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
