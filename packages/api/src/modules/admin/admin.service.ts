import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus, DonationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [users, activeCampaigns, draftCampaigns, suspendedCampaigns, donationAgg, whitelistCount, pendingWithdrawals] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
        this.prisma.campaign.count({ where: { status: CampaignStatus.DRAFT } }),
        this.prisma.campaign.count({ where: { status: CampaignStatus.SUSPENDED } }),
        this.prisma.donation.aggregate({
          where: { status: DonationStatus.CONFIRMED },
          _sum: { amountUsd: true },
          _count: { _all: true },
        }),
        this.prisma.whitelistEntry.count(),
        this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      users,
      campaigns: {
        active: activeCampaigns,
        draft: draftCampaigns,
        suspended: suspendedCampaigns,
      },
      donations: {
        count: donationAgg._count._all,
        totalUsd: (donationAgg._sum.amountUsd ?? new Prisma.Decimal(0)).toString(),
      },
      whitelistCount,
      pendingWithdrawals,
    };
  }

  async listCampaigns(status?: CampaignStatus, search?: string) {
    const where: Prisma.CampaignWhereInput = {
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    const rows = await this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { creator: { select: { username: true, email: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      category: c.category,
      status: c.status,
      isFeatured: c.isFeatured,
      raisedUsd: c.raisedUsd.toString(),
      goalUsd: c.goalUsd.toString(),
      donorsCount: c.donorsCount,
      creator: c.creator,
      createdAt: c.createdAt,
    }));
  }

  async setCampaignStatus(adminId: string, id: string, suspend: boolean, reason?: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (suspend && campaign.status === CampaignStatus.DRAFT) {
      throw new BadRequestException('Draft campaigns are not public');
    }

    const nextStatus = suspend ? CampaignStatus.SUSPENDED : CampaignStatus.ACTIVE;
    await this.prisma.$transaction([
      this.prisma.campaign.update({ where: { id }, data: { status: nextStatus } }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: suspend ? 'CAMPAIGN_SUSPEND' : 'CAMPAIGN_REACTIVATE',
          targetId: id,
          metadata: reason ? { reason } : undefined,
        },
      }),
    ]);
    return { id, status: nextStatus };
  }

  async setFeatured(adminId: string, id: string, featured: boolean) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.prisma.$transaction([
      this.prisma.campaign.update({ where: { id }, data: { isFeatured: featured } }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: featured ? 'CAMPAIGN_FEATURE' : 'CAMPAIGN_UNFEATURE',
          targetId: id,
        },
      }),
    ]);
    return { id, isFeatured: featured };
  }

  async auditLogs(limit = 100) {
    const rows = await this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, limit),
    });
    return rows.map((r) => ({
      id: r.id,
      adminId: r.adminId,
      action: r.action,
      targetId: r.targetId,
      metadata: r.metadata,
      createdAt: r.createdAt,
    }));
  }
}
