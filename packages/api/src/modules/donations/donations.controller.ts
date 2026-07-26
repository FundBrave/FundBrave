import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CampaignStatus } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { DonationsService } from './donations.service';
import { findToken, tokensForChain } from './tokens.config';
import type { ChainConfig } from '../../config/configuration';

@Controller()
export class DonationsController {
  private readonly chains: ChainConfig[];

  constructor(
    private readonly donations: DonationsService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.chains = config.get<ChainConfig[]>('chains.enabled') ?? [];
  }

  /** Supported chains + token allowlist, for the donate UI. */
  @Get('donations/tokens')
  tokens() {
    return {
      chains: this.chains.map((c) => ({
        chainId: c.chainId,
        name: c.name,
        explorerUrl: c.explorerUrl,
        nativeSymbol: c.nativeSymbol,
        isTestnet: c.isTestnet,
        tokens: tokensForChain(c.chainId).map((t) => ({
          address: t.address,
          symbol: t.symbol,
          decimals: t.decimals,
        })),
      })),
    };
  }

  @Get('campaigns/:id/donations')
  async list(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.donations.listForCampaign(id, p, l);
  }

  @Get('campaigns/:id/breakdown')
  breakdown(@Param('id') id: string) {
    return this.donations.raisedBreakdown(id);
  }

  /**
   * EIP-681 payment QR for a campaign's Safe address.
   * Native:  ethereum:<safe>@<chainId>[?value=<wei>]
   * ERC-20:  ethereum:<token>@<chainId>/transfer?address=<safe>[&uint256=<units>]
   */
  @Get('campaigns/:id/qr')
  async qr(
    @Param('id') id: string,
    @Query('chainId', ParseIntPipe) chainId: number,
    @Query('token') tokenAddress?: string,
    @Query('amount') amount?: string,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] },
      },
      select: { safeAddress: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (!this.chains.some((c) => c.chainId === chainId)) {
      throw new BadRequestException('Unsupported chain');
    }

    const token = findToken(chainId, tokenAddress?.toLowerCase() ?? null);
    if (!token) throw new BadRequestException('Unsupported token for this chain');
    if (amount !== undefined && !/^\d+$/.test(amount)) {
      throw new BadRequestException('amount must be an integer string in token base units');
    }

    const uri = token.address
      ? `ethereum:${token.address}@${chainId}/transfer?address=${campaign.safeAddress}${amount ? `&uint256=${amount}` : ''}`
      : `ethereum:${campaign.safeAddress}@${chainId}${amount ? `?value=${amount}` : ''}`;

    const dataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 320 });
    return { uri, dataUrl, address: campaign.safeAddress };
  }
}
