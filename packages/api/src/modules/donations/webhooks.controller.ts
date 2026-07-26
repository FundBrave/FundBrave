import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Logger } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { MoralisStreamsService } from './moralis-streams.service';

interface MoralisNativeTx {
  hash: string;
  fromAddress: string;
  toAddress: string | null;
  value: string;
}

interface MoralisErc20Transfer {
  transactionHash: string;
  logIndex: string | number;
  contract: string;
  from: string;
  to: string;
  value: string;
}

interface MoralisWebhookBody {
  confirmed?: boolean;
  chainId?: string; // hex
  block?: { number?: string };
  txs?: MoralisNativeTx[];
  erc20Transfers?: MoralisErc20Transfer[];
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly donations: DonationsService,
    private readonly streams: MoralisStreamsService,
  ) {}

  /**
   * Moralis Streams webhook. Signature-verified against the raw body.
   * Moralis delivers twice (unconfirmed + confirmed) — recording is
   * idempotent and our own confirmation cron gates counting.
   */
  @Post('moralis')
  @SkipThrottle()
  async moralis(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature?: string,
  ) {
    const raw = req.rawBody;
    if (!raw) throw new BadRequestException('Missing raw body');
    if (!this.streams.verifySignature(raw, signature)) {
      throw new UnauthorizedException('Bad webhook signature');
    }

    const body = req.body as MoralisWebhookBody;
    const chainId = body.chainId ? parseInt(body.chainId, 16) : NaN;
    const blockNumber = body.block?.number ? parseInt(body.block.number, 10) : 0;
    // Moralis sends an empty test payload on stream creation
    if (!Number.isFinite(chainId) || chainId <= 0) return { ok: true };

    let processed = 0;

    for (const tx of body.txs ?? []) {
      if (!tx.toAddress || !tx.value || tx.value === '0') continue;
      await this.donations.recordTransfer({
        chainId,
        txHash: tx.hash,
        logIndex: -1,
        tokenAddress: null,
        amountRaw: tx.value,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        blockNumber,
      });
      processed++;
    }

    for (const t of body.erc20Transfers ?? []) {
      if (!t.value || t.value === '0') continue;
      await this.donations.recordTransfer({
        chainId,
        txHash: t.transactionHash,
        logIndex: typeof t.logIndex === 'string' ? parseInt(t.logIndex, 10) : t.logIndex,
        tokenAddress: t.contract,
        amountRaw: t.value,
        fromAddress: t.from,
        toAddress: t.to,
        blockNumber,
      });
      processed++;
    }

    if (processed > 0) {
      this.logger.log(`Webhook processed ${processed} transfers (chain ${chainId}, confirmed=${body.confirmed})`);
    }
    return { ok: true };
  }
}
