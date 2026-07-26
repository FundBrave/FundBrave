import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CampaignStatus, User } from '@prisma/client';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrivyAuthGuard, RegisteredGuard, AdminGuard } from '../auth/privy-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';

class ModerateDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@Controller('admin')
@UseGuards(PrivyAuthGuard, RegisteredGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('campaigns')
  campaigns(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const valid =
      status && Object.values(CampaignStatus).includes(status as CampaignStatus)
        ? (status as CampaignStatus)
        : undefined;
    return this.admin.listCampaigns(valid, search);
  }

  @Post('campaigns/:id/suspend')
  suspend(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ModerateDto) {
    return this.admin.setCampaignStatus(admin.id, id, true, dto.reason);
  }

  @Post('campaigns/:id/reactivate')
  reactivate(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.admin.setCampaignStatus(admin.id, id, false);
  }

  @Post('campaigns/:id/feature')
  feature(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.admin.setFeatured(admin.id, id, true);
  }

  @Post('campaigns/:id/unfeature')
  unfeature(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.admin.setFeatured(admin.id, id, false);
  }

  @Get('audit-logs')
  auditLogs() {
    return this.admin.auditLogs();
  }
}
