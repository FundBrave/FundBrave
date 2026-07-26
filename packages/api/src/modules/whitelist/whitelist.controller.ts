import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrivyAuthGuard, RegisteredGuard, AdminGuard } from '../auth/privy-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WhitelistService } from './whitelist.service';
import { AddWhitelistDto } from './dto/add-whitelist.dto';

@Controller('admin/whitelist')
@UseGuards(PrivyAuthGuard, RegisteredGuard, AdminGuard)
export class WhitelistController {
  constructor(private readonly whitelist: WhitelistService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.whitelist.list(search);
  }

  @Post()
  add(@CurrentUser() admin: User, @Body() dto: AddWhitelistDto) {
    return this.whitelist.add(admin.id, dto.email);
  }

  @Delete(':id')
  remove(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.whitelist.remove(admin.id, id);
  }
}
