import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CampaignStatus, User, WithdrawalRequest, WithdrawalStatus } from '@prisma/client';
import { erc20Abi, recoverAddress, type Address, type Hex } from 'viem';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeService, SafeTypedData } from '../safe/safe.service';
import { EmailService } from '../email/email.service';
import { findToken, tokensForChain } from '../donations/tokens.config';

export interface WithdrawalView {
  id: string;
  campaignId: string;
  campaign?: { title: string; slug: string; safeAddress: string };
  chainId: number;
  tokenAddress: string | null;
  tokenSymbol: string;
  amountRaw: string;
  toAddress: string;
  status: WithdrawalStatus;
  safeTxHash: string | null;
  execTxHash: string | null;
  deployTxHash: string | null;
  rejectionReason: string | null;
  hasCreatorSignature: boolean;
  hasAdminSignature: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toView(
  w: WithdrawalRequest & { campaign?: { title: string; slug: string; safeAddress: string } },
): WithdrawalView {
  const token = findToken(w.chainId, w.tokenAddress);
  return {
    id: w.id,
    campaignId: w.campaignId,
    campaign: w.campaign,
    chainId: w.chainId,
    tokenAddress: w.tokenAddress,
    tokenSymbol: token?.symbol ?? (w.tokenAddress ? 'UNKNOWN' : 'NATIVE'),
    amountRaw: w.amountRaw,
    toAddress: w.toAddress,
    status: w.status,
    safeTxHash: w.safeTxHash,
    execTxHash: w.execTxHash,
    deployTxHash: w.deployTxHash,
    rejectionReason: w.rejectionReason,
    hasCreatorSignature: Boolean(w.creatorSignature),
    hasAdminSignature: Boolean(w.adminSignature),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);
  private readonly rootAdminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly safe: SafeService,
    private readonly email: EmailService,
    config: ConfigService,
  ) {
    this.rootAdminEmail = config.get<string>('admin.rootAdminEmail') ?? '';
  }

  // ─── Balances (for the withdraw UI) ───────────────────────────

  async campaignBalances(user: User, campaignId: string) {
    const campaign = await this.ownedActiveCampaign(user, campaignId);
    const safeAddress = campaign.safeAddress as Address;

    const results = await Promise.allSettled(
      this.enabledChains().map(async (chain) => {
        const client = this.safe.publicClient(chain.chainId);
        const native = await client.getBalance({ address: safeAddress });
        const tokens = await Promise.all(
          tokensForChain(chain.chainId)
            .filter((t) => t.address !== null)
            .map(async (t) => ({
              address: t.address,
              symbol: t.symbol,
              decimals: t.decimals,
              balanceRaw: (
                await client.readContract({
                  address: t.address as Address,
                  abi: erc20Abi,
                  functionName: 'balanceOf',
                  args: [safeAddress],
                })
              ).toString(),
            })),
        );
        const nativeToken = tokensForChain(chain.chainId).find((t) => t.address === null);
        return {
          chainId: chain.chainId,
          name: chain.name,
          deployed: await this.safe.isDeployed(chain.chainId, safeAddress),
          native: {
            symbol: nativeToken?.symbol ?? 'ETH',
            decimals: 18,
            balanceRaw: native.toString(),
          },
          tokens,
        };
      }),
    );

    return {
      safeAddress,
      chains: results
        .filter(<T,>(r: PromiseSettledResult<T>): r is PromiseFulfilledResult<T> => r.status === 'fulfilled')
        .map((r) => r.value),
    };
  }

  // ─── Creator flow ─────────────────────────────────────────────

  async create(
    user: User,
    campaignId: string,
    chainId: number,
    tokenAddress: string | null,
    amountRaw: string,
  ): Promise<{ withdrawal: WithdrawalView; typedData: SafeTypedData }> {
    const campaign = await this.ownedActiveCampaign(user, campaignId);
    const chain = this.safe.chainConfig(chainId); // throws if not enabled
    const token = findToken(chainId, tokenAddress);
    if (!token) throw new BadRequestException('Token is not on the allowlist for this chain');

    const inFlight = await this.prisma.withdrawalRequest.count({
      where: {
        campaignId,
        chainId,
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED] },
      },
    });
    if (inFlight > 0) {
      throw new BadRequestException(
        'There is already a withdrawal in progress for this campaign on this chain',
      );
    }

    const safeAddress = campaign.safeAddress as Address;
    const amount = BigInt(amountRaw);

    // On-chain balance check
    const client = this.safe.publicClient(chainId);
    const balance = token.address
      ? await client.readContract({
          address: token.address as Address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [safeAddress],
        })
      : await client.getBalance({ address: safeAddress });
    if (amount > balance) {
      throw new BadRequestException(
        `Insufficient balance on ${chain.name}: requested ${amountRaw}, available ${balance.toString()}`,
      );
    }

    const nonce = await this.safe.getSafeNonce(chainId, safeAddress);
    const toAddress = user.walletAddress as Address;
    const tx = this.safe.buildWithdrawalTx(
      token.address ? (token.address as Address) : null,
      amount,
      toAddress,
      nonce,
    );
    const safeTxHash = this.safe.hashSafeTx(chainId, safeAddress, tx);

    const withdrawal = await this.prisma.withdrawalRequest.create({
      data: {
        campaignId,
        chainId,
        tokenAddress: token.address?.toLowerCase() ?? null,
        amountRaw,
        toAddress,
        nonce: Number(nonce),
        safeTxHash,
        status: WithdrawalStatus.PENDING,
      },
      include: { campaign: { select: { title: true, slug: true, safeAddress: true } } },
    });

    return {
      withdrawal: toView(withdrawal),
      typedData: this.safe.toTypedData(chainId, safeAddress, tx),
    };
  }

  async submitCreatorSignature(user: User, id: string, signature: string): Promise<WithdrawalView> {
    const w = await this.getWithCampaign(id);
    if (w.campaign.creatorId !== user.id) throw new ForbiddenException('Not your withdrawal');
    if (w.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not awaiting signatures');
    }

    await this.verifySignature(w.safeTxHash as Hex, signature as Hex, user.walletAddress as Address);

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: { creatorSignature: signature },
      include: { campaign: { select: { title: true, slug: true, safeAddress: true } } },
    });

    if (this.rootAdminEmail) {
      void this.email.send(
        this.rootAdminEmail,
        `FundBrave: withdrawal approval needed — ${w.campaign.title}`,
        `<p>A withdrawal request for campaign <b>${w.campaign.title}</b> is awaiting your co-signature in the admin dashboard.</p>`,
      );
    }
    return toView(updated);
  }

  async mine(user: User): Promise<WithdrawalView[]> {
    const rows = await this.prisma.withdrawalRequest.findMany({
      where: { campaign: { creatorId: user.id } },
      orderBy: { createdAt: 'desc' },
      include: { campaign: { select: { title: true, slug: true, safeAddress: true } } },
      take: 100,
    });
    return rows.map(toView);
  }

  // ─── Admin flow ───────────────────────────────────────────────

  async adminList(status?: WithdrawalStatus): Promise<(WithdrawalView & { typedData: SafeTypedData | null })[]> {
    const rows = await this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { campaign: { select: { title: true, slug: true, safeAddress: true, creatorId: true } } },
      take: 100,
    });
    return rows.map((w) => ({
      ...toView(w),
      typedData:
        w.status === WithdrawalStatus.PENDING && w.creatorSignature
          ? this.rebuildTypedData(w)
          : null,
    }));
  }

  async adminSign(admin: User, id: string, signature: string): Promise<WithdrawalView> {
    const w = await this.getWithCampaign(id);
    if (w.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not awaiting signatures');
    }
    if (!w.creatorSignature) {
      throw new BadRequestException('Creator has not signed yet');
    }

    const adminAddress = this.safe.getRootAdminAddress();
    await this.verifySignature(w.safeTxHash as Hex, signature as Hex, adminAddress);

    // Atomically claim the request: only one caller can transition
    // PENDING → APPROVED, so a double-submit can't dispatch two executions.
    const claim = await this.prisma.withdrawalRequest.updateMany({
      where: { id, status: WithdrawalStatus.PENDING },
      data: { adminSignature: signature, status: WithdrawalStatus.APPROVED },
    });
    if (claim.count === 0) {
      throw new BadRequestException('Withdrawal is no longer awaiting approval');
    }
    await this.prisma.adminAuditLog.create({
      data: { adminId: admin.id, action: 'WITHDRAWAL_APPROVE', targetId: id },
    });

    // Execute asynchronously; status transitions to EXECUTED / FAILED
    void this.execute(id);

    const updated = await this.getWithCampaign(id);
    return toView(updated);
  }

  async adminReject(admin: User, id: string, reason: string): Promise<WithdrawalView> {
    const w = await this.getWithCampaign(id);
    if (w.status !== WithdrawalStatus.PENDING && w.status !== WithdrawalStatus.APPROVED) {
      throw new BadRequestException('Withdrawal can no longer be rejected');
    }
    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: { status: WithdrawalStatus.REJECTED, rejectionReason: reason },
      include: { campaign: { select: { title: true, slug: true, safeAddress: true } } },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminId: admin.id, action: 'WITHDRAWAL_REJECT', targetId: id, metadata: { reason } },
    });
    await this.notifyCreator(w.campaign.creatorId, `Your withdrawal for "${w.campaign.title}" was declined`, `<p>Reason: ${reason}</p>`);
    return toView(updated);
  }

  // ─── Execution ────────────────────────────────────────────────

  private async execute(id: string): Promise<void> {
    const w = await this.getWithCampaign(id);
    if (w.status !== WithdrawalStatus.APPROVED) return;
    const safeAddress = w.campaign.safeAddress as Address;

    try {
      // Nonce must still match what was signed
      const currentNonce = await this.safe.getSafeNonce(w.chainId, safeAddress);
      if (Number(currentNonce) !== w.nonce) {
        throw new Error(
          `Safe nonce changed (signed ${w.nonce}, current ${currentNonce}) — request a new withdrawal`,
        );
      }

      let deployTxHash: Hex | undefined;
      if (!(await this.safe.isDeployed(w.chainId, safeAddress))) {
        const creator = await this.prisma.user.findUnique({
          where: { id: w.campaign.creatorId },
          select: { walletAddress: true },
        });
        deployTxHash = await this.safe.deploySafe(
          w.chainId,
          creator!.walletAddress as Address,
          w.campaignId,
          safeAddress,
        );
        await this.prisma.safeDeployment.upsert({
          where: { campaignId_chainId: { campaignId: w.campaignId, chainId: w.chainId } },
          create: { campaignId: w.campaignId, chainId: w.chainId, txHash: deployTxHash },
          update: {},
        });
      }

      const tx = this.safe.buildWithdrawalTx(
        w.tokenAddress ? (w.tokenAddress as Address) : null,
        BigInt(w.amountRaw),
        w.toAddress as Address,
        BigInt(w.nonce),
      );
      const adminAddress = this.safe.getRootAdminAddress();
      const creator = await this.prisma.user.findUnique({
        where: { id: w.campaign.creatorId },
        select: { walletAddress: true },
      });

      const execTxHash = await this.safe.execTransaction(w.chainId, safeAddress, tx, [
        { signer: creator!.walletAddress as Address, signature: w.creatorSignature as Hex },
        { signer: adminAddress, signature: w.adminSignature as Hex },
      ]);

      await this.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: WithdrawalStatus.EXECUTED, execTxHash, deployTxHash: deployTxHash ?? null },
      });
      await this.notifyCreator(
        w.campaign.creatorId,
        `Your withdrawal for "${w.campaign.title}" was executed`,
        `<p>Funds are on their way to your wallet. Tx: ${execTxHash}</p>`,
      );
      this.logger.log(`Withdrawal ${id} executed: ${execTxHash}`);
    } catch (err) {
      const message = (err as Error).message.slice(0, 500);
      this.logger.error(`Withdrawal ${id} failed: ${message}`);
      await this.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: WithdrawalStatus.FAILED, rejectionReason: message },
      });
      await this.notifyCreator(
        w.campaign.creatorId,
        `Your withdrawal for "${w.campaign.title}" failed`,
        `<p>${message}</p><p>You can request a new withdrawal from your dashboard.</p>`,
      );
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private enabledChains() {
    return [
      ...new Set<number>(
        // chains that have at least one allowlisted token configured
        [84532, 11155111, 1, 8453, 137, 42161].filter((id) => {
          try {
            this.safe.chainConfig(id);
            return true;
          } catch {
            return false;
          }
        }),
      ),
    ].map((id) => this.safe.chainConfig(id));
  }

  private rebuildTypedData(
    w: WithdrawalRequest & { campaign: { safeAddress: string } },
  ): SafeTypedData {
    const tx = this.safe.buildWithdrawalTx(
      w.tokenAddress ? (w.tokenAddress as Address) : null,
      BigInt(w.amountRaw),
      w.toAddress as Address,
      BigInt(w.nonce),
    );
    return this.safe.toTypedData(w.chainId, w.campaign.safeAddress as Address, tx);
  }

  private async verifySignature(hash: Hex, signature: Hex, expected: Address): Promise<void> {
    let recovered: Address;
    try {
      recovered = await recoverAddress({ hash, signature });
    } catch {
      throw new BadRequestException('Malformed signature');
    }
    if (recovered.toLowerCase() !== expected.toLowerCase()) {
      throw new BadRequestException(
        `Signature does not match the expected signer (${expected})`,
      );
    }
  }

  private async ownedActiveCampaign(user: User, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.creatorId !== user.id) throw new ForbiddenException('Not your campaign');
    if (campaign.status !== CampaignStatus.ACTIVE && campaign.status !== CampaignStatus.COMPLETED) {
      throw new BadRequestException('Campaign has no active donation wallet');
    }
    return campaign;
  }

  private async getWithCampaign(id: string) {
    const w = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        campaign: { select: { title: true, slug: true, safeAddress: true, creatorId: true } },
      },
    });
    if (!w) throw new NotFoundException('Withdrawal not found');
    return w;
  }

  private async notifyCreator(creatorId: string, subject: string, html: string): Promise<void> {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { email: true },
    });
    if (creator?.email) void this.email.send(creator.email, subject, html);
  }
}
