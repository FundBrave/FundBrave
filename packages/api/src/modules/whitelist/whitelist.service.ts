import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WhitelistService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string) {
    return this.prisma.whitelistEntry.findMany({
      where: search ? { email: { contains: search.toLowerCase() } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async add(adminId: string, email: string) {
    const normalized = email.toLowerCase();
    const existing = await this.prisma.whitelistEntry.findUnique({ where: { email: normalized } });
    if (existing) throw new ConflictException('Email is already whitelisted');

    const [entry] = await this.prisma.$transaction([
      this.prisma.whitelistEntry.create({
        data: { email: normalized, invitedBy: adminId },
      }),
      this.prisma.adminAuditLog.create({
        data: { adminId, action: 'WHITELIST_ADD', targetId: normalized },
      }),
    ]);
    return entry;
  }

  async remove(adminId: string, id: string) {
    const entry = await this.prisma.whitelistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Whitelist entry not found');

    await this.prisma.$transaction([
      this.prisma.whitelistEntry.delete({ where: { id } }),
      this.prisma.adminAuditLog.create({
        data: { adminId, action: 'WHITELIST_REMOVE', targetId: entry.email },
      }),
    ]);
    return { deleted: true };
  }
}
