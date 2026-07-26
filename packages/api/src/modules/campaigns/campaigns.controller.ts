import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrivyAuthGuard, RegisteredGuard, AuthenticatedRequest } from '../auth/privy-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrivyService } from '../auth/privy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignsService } from './campaigns.service';
import {
  CAMPAIGN_CATEGORIES,
  CreateCampaignDto,
  QueryCampaignsDto,
  UpdateCampaignDto,
} from './dto/campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly privy: PrivyService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Public ───────────────────────────────────────────────────

  @Get()
  list(@Query() query: QueryCampaignsDto) {
    return this.campaigns.list(query);
  }

  @Get('categories')
  categories() {
    return { categories: CAMPAIGN_CATEGORIES };
  }

  // ─── Authenticated (declared before :slug to win route matching) ──

  @Get('mine')
  @UseGuards(PrivyAuthGuard, RegisteredGuard)
  mine(@CurrentUser() user: User) {
    return this.campaigns.myCampaigns(user.id);
  }

  @Post()
  @UseGuards(PrivyAuthGuard, RegisteredGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateCampaignDto) {
    return this.campaigns.createDraft(user, dto);
  }

  @Patch(':id')
  @UseGuards(PrivyAuthGuard, RegisteredGuard)
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaigns.update(user, id, dto);
  }

  @Post(':id/publish')
  @UseGuards(PrivyAuthGuard, RegisteredGuard)
  publish(@CurrentUser() user: User, @Param('id') id: string) {
    return this.campaigns.publish(user, id);
  }

  // ─── Public detail (optionally-authenticated for draft owners) ──

  @Get(':slug')
  async bySlug(@Param('slug') slug: string, @Req() req: AuthenticatedRequest) {
    // Soft auth: if a valid token is present, allow owners to view drafts.
    let viewerId: string | undefined;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ') && this.privy.isConfigured) {
      try {
        const { did } = await this.privy.verifyAccessToken(header.slice(7));
        const user = await this.prisma.user.findUnique({ where: { privyDid: did } });
        viewerId = user?.id;
      } catch {
        viewerId = undefined; // invalid token → treat as anonymous
      }
    }
    return this.campaigns.getBySlug(slug, viewerId);
  }
}
