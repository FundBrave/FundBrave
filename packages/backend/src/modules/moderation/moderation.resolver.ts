import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import {
  Report,
  PaginatedReports,
  ReportOperationResult,
  ModerationStats,
  CreateReportInput,
  GetReportsInput,
  ReviewReportInput,
  ReportStatus,
  ReportReason,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard, ModeratorGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Report)
export class ModerationResolver {
  constructor(private readonly moderationService: ModerationService) {}

  // ==================== User Queries ====================

  @Query(() => PaginatedReports, { name: 'myReports' })
  @UseGuards(JwtAuthGuard)
  async getMyReports(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedReports> {
    return this.moderationService.getMyReports(user.id, limit, offset);
  }

  @Query(() => Boolean, { name: 'hasReported' })
  @UseGuards(JwtAuthGuard)
  async hasUserReported(
    @CurrentUser() user: { id: string },
    @Args('reportedId', { type: () => ID }) reportedId: string,
    @Args('entityId', { nullable: true }) entityId?: string,
  ): Promise<boolean> {
    return this.moderationService.hasUserReported(
      user.id,
      reportedId,
      entityId,
    );
  }

  // ==================== Admin/Moderator Queries ====================

  @Query(() => PaginatedReports, { name: 'reports' })
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getReports(
    @Args('input', { nullable: true }) input?: GetReportsInput,
  ): Promise<PaginatedReports> {
    const defaultInput: GetReportsInput = {
      limit: 20,
      offset: 0,
      ...input,
    };
    return this.moderationService.getReports(defaultInput);
  }

  @Query(() => Report, { name: 'report', nullable: true })
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getReport(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Report | null> {
    return this.moderationService.getReportById(id);
  }

  @Query(() => PaginatedReports, { name: 'pendingReports' })
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getPendingReports(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedReports> {
    return this.moderationService.getReports({
      limit,
      offset,
      status: ReportStatus.PENDING,
    });
  }

  @Query(() => PaginatedReports, { name: 'reportsByReason' })
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getReportsByReason(
    @Args('reason', { type: () => ReportReason }) reason: ReportReason,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedReports> {
    return this.moderationService.getReports({
      limit,
      offset,
      reason,
    });
  }

  @Query(() => PaginatedReports, { name: 'reportedContent' })
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getReportedContent(
    @Args('entityType') entityType: string,
    @Args('entityId') entityId: string,
  ): Promise<PaginatedReports> {
    return this.moderationService.getReportedContent(entityType, entityId);
  }

  @Query(() => ModerationStats, { name: 'moderationStats' })
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getModerationStats(): Promise<ModerationStats> {
    return this.moderationService.getModerationStats();
  }

  // ==================== User Mutations ====================

  @Mutation(() => ReportOperationResult)
  @UseGuards(JwtAuthGuard)
  async createReport(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateReportInput,
  ): Promise<ReportOperationResult> {
    return this.moderationService.createReport(user.id, input);
  }

  // ==================== Admin/Moderator Mutations ====================

  @Mutation(() => ReportOperationResult)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reviewReport(
    @CurrentUser() user: { id: string },
    @Args('input') input: ReviewReportInput,
  ): Promise<ReportOperationResult> {
    return this.moderationService.reviewReport(user.id, input);
  }

  @Mutation(() => ReportOperationResult)
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async dismissReport(
    @CurrentUser() user: { id: string },
    @Args('reportId', { type: () => ID }) reportId: string,
  ): Promise<ReportOperationResult> {
    return this.moderationService.dismissReport(user.id, reportId);
  }
}
