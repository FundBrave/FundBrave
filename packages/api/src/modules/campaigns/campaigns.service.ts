import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Campaign, CampaignMedia, CampaignStatus, Prisma, User } from '@prisma/client';
import type { Address } from 'viem';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeService } from '../safe/safe.service';
import { MoralisStreamsService } from '../donations/moralis-streams.service';
import {
  CAMPAIGN_SORTS,
  CreateCampaignDto,
  QueryCampaignsDto,
  UpdateCampaignDto,
} from './dto/campaign.dto';

type CampaignWithMedia = Campaign & {
  media: CampaignMedia[];
  creator?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
};

const CREATOR_SELECT = {
  select: { id: true, username: true, displayName: true, avatarUrl: true },
} as const;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60);
}

export function toPublicCampaign(c: CampaignWithMedia) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    category: c.category,
    goalUsd: c.goalUsd.toString(),
    raisedUsd: c.raisedUsd.toString(),
    deadline: c.deadline,
    status: c.status,
    isFeatured: c.isFeatured,
    safeAddress: c.status === CampaignStatus.DRAFT ? null : c.safeAddress,
    donorsCount: c.donorsCount,
    createdAt: c.createdAt,
    media: c.media
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ id: m.id, type: m.type, url: m.url, order: m.order })),
    creator: c.creator ?? null,
  };
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly safe: SafeService,
    private readonly streams: MoralisStreamsService,
  ) {}

  // ─── Public ───────────────────────────────────────────────────

  async list(query: QueryCampaignsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const sort = query.sort ?? CAMPAIGN_SORTS[0];

    const where: Prisma.CampaignWhereInput = {
      status: CampaignStatus.ACTIVE,
      ...(query.category ? { category: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.CampaignOrderByWithRelationInput[] =
      sort === 'most_raised'
        ? [{ raisedUsd: 'desc' }, { createdAt: 'desc' }]
        : sort === 'ending_soon'
          ? [{ deadline: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }]
          : [{ isFeatured: 'desc' }, { createdAt: 'desc' }];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { media: true, creator: CREATOR_SELECT },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      items: items.map(toPublicCampaign),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getBySlug(slug: string, viewerId?: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { slug },
      include: { media: true, creator: CREATOR_SELECT },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const isOwner = viewerId !== undefined && campaign.creatorId === viewerId;
    if (campaign.status === CampaignStatus.DRAFT && !isOwner) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.status === CampaignStatus.SUSPENDED && !isOwner) {
      throw new NotFoundException('Campaign not found');
    }
    return { ...toPublicCampaign(campaign), isOwner };
  }

  // ─── Creator ──────────────────────────────────────────────────

  async myCampaigns(userId: string) {
    const items = await this.prisma.campaign.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { media: true },
    });
    return items.map(toPublicCampaign);
  }

  async createDraft(user: User, dto: CreateCampaignDto) {
    this.validateDeadline(dto.deadline);
    const base = slugify(dto.title) || 'campaign';
    const slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;

    const campaign = await this.prisma.campaign.create({
      data: {
        slug,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        goalUsd: new Prisma.Decimal(dto.goalUsd),
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        status: CampaignStatus.DRAFT,
        // placeholder until publish computes the real counterfactual address
        safeAddress: `draft:${slug}`,
        safeSalt: '',
        creatorId: user.id,
        media: dto.media?.length
          ? { create: dto.media.map((m) => ({ type: m.type, url: m.url, order: m.order })) }
          : undefined,
      },
      include: { media: true },
    });
    return toPublicCampaign(campaign);
  }

  async update(user: User, id: string, dto: UpdateCampaignDto) {
    const campaign = await this.ownedCampaign(user, id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      // After publish only description updates + media additions are allowed
      const disallowed = ['title', 'category', 'goalUsd', 'deadline'].filter(
        (k) => (dto as Record<string, unknown>)[k] !== undefined,
      );
      if (disallowed.length > 0) {
        throw new BadRequestException(
          `Cannot change ${disallowed.join(', ')} after publishing`,
        );
      }
    }
    this.validateDeadline(dto.deadline ?? undefined);

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.goalUsd !== undefined ? { goalUsd: new Prisma.Decimal(dto.goalUsd) } : {}),
        ...(dto.deadline !== undefined
          ? { deadline: dto.deadline ? new Date(dto.deadline) : null }
          : {}),
        ...(dto.media !== undefined
          ? {
              media: {
                deleteMany: {},
                create: dto.media.map((m) => ({ type: m.type, url: m.url, order: m.order })),
              },
            }
          : {}),
      },
      include: { media: true },
    });
    return toPublicCampaign(updated);
  }

  /** Compute the counterfactual Safe address and go live. */
  async publish(user: User, id: string) {
    const campaign = await this.ownedCampaign(user, id);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Campaign is already published');
    }
    if (campaign.media.length === 0) {
      throw new BadRequestException('Add at least one image before publishing');
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(user.walletAddress)) {
      throw new BadRequestException('Your wallet address is invalid');
    }

    const { safeAddress, saltNonce } = await this.safe.predictSafeAddress(
      user.walletAddress as Address,
      campaign.id,
    );

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE, safeAddress, safeSalt: saltNonce },
      include: { media: true, creator: CREATOR_SELECT },
    });
    this.logger.log(`Campaign ${id} published — Safe ${safeAddress}`);
    // Register the address with Moralis Streams (non-blocking; poller covers failures)
    void this.streams.watchAddress(safeAddress);
    return toPublicCampaign(updated);
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async ownedCampaign(user: User, id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.creatorId !== user.id) {
      throw new ForbiddenException('You do not own this campaign');
    }
    return campaign;
  }

  private validateDeadline(deadline?: string | null) {
    if (!deadline) return;
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime()) || d.getTime() < Date.now() + 24 * 3600 * 1000) {
      throw new BadRequestException('Deadline must be at least 24 hours in the future');
    }
    if (d.getTime() > Date.now() + 366 * 24 * 3600 * 1000) {
      throw new BadRequestException('Deadline must be within one year');
    }
  }
}
