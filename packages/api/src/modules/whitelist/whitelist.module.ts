import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WhitelistController } from './whitelist.controller';
import { WhitelistService } from './whitelist.service';

@Module({
  imports: [AuthModule],
  controllers: [WhitelistController],
  providers: [WhitelistService],
})
export class WhitelistModule {}
