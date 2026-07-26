import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User, WithdrawalStatus } from '@prisma/client';
import { PrivyAuthGuard, RegisteredGuard, AdminGuard } from '../auth/privy-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto, RejectDto, SignatureDto } from './dto/withdrawal.dto';

@Controller('withdrawals')
@UseGuards(PrivyAuthGuard, RegisteredGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalsService) {}

  @Get('mine')
  mine(@CurrentUser() user: User) {
    return this.withdrawals.mine(user);
  }

  @Get('balances/:campaignId')
  balances(@CurrentUser() user: User, @Param('campaignId') campaignId: string) {
    return this.withdrawals.campaignBalances(user, campaignId);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawals.create(
      user,
      dto.campaignId,
      dto.chainId,
      dto.tokenAddress ?? null,
      dto.amountRaw,
    );
  }

  @Post(':id/creator-signature')
  creatorSignature(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: SignatureDto,
  ) {
    return this.withdrawals.submitCreatorSignature(user, id, dto.signature);
  }
}

@Controller('admin/withdrawals')
@UseGuards(PrivyAuthGuard, RegisteredGuard, AdminGuard)
export class AdminWithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalsService) {}

  @Get()
  list(@Query('status') status?: WithdrawalStatus) {
    const valid = status && Object.values(WithdrawalStatus).includes(status) ? status : undefined;
    return this.withdrawals.adminList(valid);
  }

  @Post(':id/signature')
  sign(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: SignatureDto) {
    return this.withdrawals.adminSign(admin, id, dto.signature);
  }

  @Post(':id/reject')
  reject(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: RejectDto) {
    return this.withdrawals.adminReject(admin, id, dto.reason);
  }
}
