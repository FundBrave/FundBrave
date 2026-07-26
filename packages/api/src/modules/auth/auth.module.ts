import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrivyService } from './privy.service';
import { PrivyAuthGuard, RegisteredGuard, AdminGuard } from './privy-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrivyService, PrivyAuthGuard, RegisteredGuard, AdminGuard],
  exports: [PrivyService, PrivyAuthGuard, RegisteredGuard, AdminGuard],
})
export class AuthModule {}
