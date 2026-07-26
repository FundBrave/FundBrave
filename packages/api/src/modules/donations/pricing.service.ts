import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MEMORY_TTL_MS = 60_000;
const DB_FALLBACK_MAX_AGE_MS = 24 * 3600_000;

interface CachedPrice {
  usd: number;
  fetchedAt: number;
}

/**
 * USD prices via CoinGecko with a two-layer cache (memory 60s, DB fallback).
 * Stablecoins fall back to $1.00 if the API is unreachable so donation
 * ingestion never blocks on a pricing outage.
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private readonly apiKey: string;
  private readonly memory = new Map<string, CachedPrice>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.apiKey = config.get<string>('donations.coingeckoApiKey') ?? '';
  }

  async getUsdPrice(coingeckoId: string, isStablecoin: boolean): Promise<number> {
    const cached = this.memory.get(coingeckoId);
    if (cached && Date.now() - cached.fetchedAt < MEMORY_TTL_MS) return cached.usd;

    try {
      const url = new URL('https://api.coingecko.com/api/v3/simple/price');
      url.searchParams.set('ids', coingeckoId);
      url.searchParams.set('vs_currencies', 'usd');
      const headers: Record<string, string> = {};
      if (this.apiKey && !this.apiKey.startsWith('optional')) {
        headers['x-cg-demo-api-key'] = this.apiKey;
      }
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const body = (await res.json()) as Record<string, { usd?: number }>;
      const usd = body[coingeckoId]?.usd;
      if (typeof usd !== 'number' || usd <= 0) throw new Error('missing price');

      this.memory.set(coingeckoId, { usd, fetchedAt: Date.now() });
      await this.prisma.tokenPrice.create({
        data: { symbol: coingeckoId, usd: new Prisma.Decimal(usd) },
      });
      return usd;
    } catch (err) {
      this.logger.warn(`Price fetch failed for ${coingeckoId}: ${(err as Error).message}`);
      // DB fallback (most recent stored price, max 24h old)
      const last = await this.prisma.tokenPrice.findFirst({
        where: {
          symbol: coingeckoId,
          fetchedAt: { gte: new Date(Date.now() - DB_FALLBACK_MAX_AGE_MS) },
        },
        orderBy: { fetchedAt: 'desc' },
      });
      if (last) return Number(last.usd);
      if (isStablecoin) return 1.0;
      throw err;
    }
  }
}
