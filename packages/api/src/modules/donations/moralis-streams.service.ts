import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CampaignStatus } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import { keccak256, toBytes, toHex } from 'viem';
import { PrismaService } from '../../prisma/prisma.service';
import type { ChainConfig } from '../../config/configuration';

const MORALIS_API = 'https://api.moralis-streams.com';
const STREAM_TAG = 'fundbrave-mvp';

/**
 * Manages a single Moralis Stream watching every campaign Safe address on
 * all enabled chains (native + ERC-20 transfers). Fully optional: when the
 * API key / webhook URL are placeholders, the fallback RPC poller carries
 * detection alone.
 */
@Injectable()
export class MoralisStreamsService implements OnModuleInit {
  private readonly logger = new Logger(MoralisStreamsService.name);
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly webhookBaseUrl: string;
  private readonly chains: ChainConfig[];
  private streamId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.apiKey = config.get<string>('donations.moralisApiKey') ?? '';
    this.webhookSecret = config.get<string>('donations.moralisStreamSecret') ?? '';
    this.webhookBaseUrl = config.get<string>('webhookBaseUrl') ?? '';
    this.chains = config.get<ChainConfig[]>('chains.enabled') ?? [];
  }

  get isConfigured(): boolean {
    return Boolean(
      this.apiKey &&
        !this.apiKey.startsWith('your-') &&
        this.webhookBaseUrl.startsWith('http'),
    );
  }

  /** Verify the x-signature header Moralis sends with each webhook (constant-time). */
  verifySignature(rawBody: Buffer | string, signature: string | undefined): boolean {
    if (!signature || !this.webhookSecret || this.webhookSecret.startsWith('your-')) return false;
    const raw = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = keccak256(toBytes(raw + this.webhookSecret)).toLowerCase();
    const provided = signature.toLowerCase();
    // Length guard so timingSafeEqual doesn't throw on mismatched buffers.
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  }

  async onModuleInit() {
    if (!this.isConfigured) {
      this.logger.warn('Moralis Streams disabled (missing MORALIS_API_KEY or WEBHOOK_BASE_URL) — relying on RPC poller');
      return;
    }
    try {
      await this.ensureStream();
      await this.syncAllCampaignAddresses();
    } catch (err) {
      this.logger.error(`Stream setup failed: ${(err as Error).message} — relying on RPC poller`);
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${MORALIS_API}${path}`, {
      method,
      headers: { 'x-api-key': this.apiKey, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Moralis ${method} ${path}: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  private async ensureStream(): Promise<string> {
    if (this.streamId) return this.streamId;

    const list = await this.request<{ result?: { id: string; tag: string }[] }>(
      'GET',
      '/streams/evm?limit=100',
    );
    const existing = list.result?.find((s) => s.tag === STREAM_TAG);
    if (existing) {
      this.streamId = existing.id;
      this.logger.log(`Reusing Moralis stream ${existing.id}`);
      return existing.id;
    }

    const created = await this.request<{ id: string }>('PUT', '/streams/evm', {
      webhookUrl: `${this.webhookBaseUrl.replace(/\/$/, '')}/api/webhooks/moralis`,
      description: 'FundBrave MVP — campaign Safe deposits',
      tag: STREAM_TAG,
      chainIds: this.chains.map((c) => toHex(c.chainId)),
      includeNativeTxs: true,
      includeContractLogs: true,
      topic0: ['Transfer(address,address,uint256)'],
      abi: [
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
          ],
          name: 'Transfer',
          type: 'event',
        },
      ],
    });
    this.streamId = created.id;
    this.logger.log(`Created Moralis stream ${created.id}`);
    return created.id;
  }

  /** Attach a campaign Safe address to the stream (idempotent). */
  async watchAddress(safeAddress: string): Promise<void> {
    if (!this.isConfigured) return;
    try {
      const id = await this.ensureStream();
      await this.request('POST', `/streams/evm/${id}/address`, { address: [safeAddress] });
      this.logger.log(`Watching ${safeAddress}`);
    } catch (err) {
      // Non-fatal: poller still covers it
      this.logger.warn(`watchAddress(${safeAddress}) failed: ${(err as Error).message}`);
    }
  }

  /** Re-attach every ACTIVE campaign address (boot-time reconciliation). */
  async syncAllCampaignAddresses(): Promise<void> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] } },
      select: { safeAddress: true },
    });
    if (campaigns.length === 0) return;
    const id = await this.ensureStream();
    try {
      await this.request('POST', `/streams/evm/${id}/address`, {
        address: campaigns.map((c) => c.safeAddress),
      });
      this.logger.log(`Synced ${campaigns.length} campaign addresses to stream`);
    } catch (err) {
      this.logger.warn(`Address sync failed: ${(err as Error).message}`);
    }
  }
}
