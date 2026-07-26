import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { CampaignStatus } from '@prisma/client';
import { createPublicClient, http, parseAbiItem, type Address, type PublicClient } from 'viem';
import { PrismaService } from '../../prisma/prisma.service';
import { DonationsService } from './donations.service';
import { tokensForChain } from './tokens.config';
import type { ChainConfig } from '../../config/configuration';

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);
const MAX_BLOCK_RANGE = 2_000n;

/**
 * Fallback / reconciliation indexer. Every 2 minutes it scans ERC-20
 * Transfer logs to campaign Safe addresses via plain RPC and promotes
 * DETECTED donations to CONFIRMED. Native-coin transfers are detected by
 * Moralis Streams (webhook); this poller guarantees ERC-20 completeness
 * even if Moralis is down or unconfigured.
 */
@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);
  private readonly chains: ChainConfig[];
  private readonly confirmations: number;
  private readonly clients = new Map<number, PublicClient>();
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly donations: DonationsService,
    config: ConfigService,
  ) {
    this.chains = config.get<ChainConfig[]>('chains.enabled') ?? [];
    this.confirmations = config.get<number>('donations.confirmations') ?? 5;
  }

  private clientFor(chain: ChainConfig): PublicClient {
    let client = this.clients.get(chain.chainId);
    if (!client) {
      client = createPublicClient({ transport: http(chain.rpcUrl) });
      this.clients.set(chain.chainId, client);
    }
    return client;
  }

  @Cron('*/2 * * * *')
  async poll(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const safeAddresses = await this.activeSafeAddresses();
      for (const chain of this.chains) {
        try {
          await this.pollChain(chain, safeAddresses);
        } catch (err) {
          this.logger.warn(`Polling ${chain.name} failed: ${(err as Error).message}`);
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async activeSafeAddresses(): Promise<Address[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] } },
      select: { safeAddress: true },
    });
    return campaigns
      .map((c) => c.safeAddress as Address)
      .filter((a) => /^0x[0-9a-fA-F]{40}$/.test(a));
  }

  private async pollChain(chain: ChainConfig, safeAddresses: Address[]): Promise<void> {
    const client = this.clientFor(chain);
    const latest = await client.getBlockNumber();

    // Confirmation pass runs even with no addresses (clears backlog).
    // Passing the client makes confirmation re-verify each tx receipt on-chain.
    await this.donations.confirmDonations(
      chain.chainId,
      Number(latest),
      this.confirmations,
      client,
    );

    if (safeAddresses.length === 0) return;

    const sync = await this.prisma.chainSyncState.findUnique({
      where: { chainId: chain.chainId },
    });
    const fromBlock = sync ? BigInt(sync.lastBlock) + 1n : latest - 10n;
    if (fromBlock > latest) return;
    const toBlock = fromBlock + MAX_BLOCK_RANGE > latest ? latest : fromBlock + MAX_BLOCK_RANGE;

    const tokenAddresses = tokensForChain(chain.chainId)
      .map((t) => t.address)
      .filter((a): a is string => a !== null) as Address[];

    if (tokenAddresses.length > 0) {
      const logs = await client.getLogs({
        address: tokenAddresses,
        event: TRANSFER_EVENT,
        args: { to: safeAddresses },
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        if (log.args.value === undefined || !log.args.from || !log.args.to) continue;
        await this.donations.recordTransfer({
          chainId: chain.chainId,
          txHash: log.transactionHash,
          logIndex: log.logIndex,
          tokenAddress: log.address,
          amountRaw: log.args.value.toString(),
          fromAddress: log.args.from,
          toAddress: log.args.to,
          blockNumber: Number(log.blockNumber),
        });
      }
      if (logs.length > 0) {
        this.logger.log(`${chain.name}: found ${logs.length} ERC-20 transfers in [${fromBlock}, ${toBlock}]`);
      }
    }

    await this.prisma.chainSyncState.upsert({
      where: { chainId: chain.chainId },
      create: { chainId: chain.chainId, lastBlock: Number(toBlock) },
      update: { lastBlock: Number(toBlock) },
    });
  }
}
