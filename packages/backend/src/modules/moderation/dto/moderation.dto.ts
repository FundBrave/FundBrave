import {
  Field,
  ObjectType,
  InputType,
  Int,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';

// ==================== Enums ====================

export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  HATE_SPEECH = 'HATE_SPEECH',
  VIOLENCE = 'VIOLENCE',
  SCAM = 'SCAM',
  FAKE_FUNDRAISER = 'FAKE_FUNDRAISER',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ModerationAction {
  NONE = 'NONE',
  WARNING = 'WARNING',
  HIDE_CONTENT = 'HIDE_CONTENT',
  REMOVE_CONTENT = 'REMOVE_CONTENT',
  SUSPEND_USER = 'SUSPEND_USER',
  BAN_USER = 'BAN_USER',
}

registerEnumType(ReportReason, { name: 'ReportReason' });
registerEnumType(ReportStatus, { name: 'ReportStatus' });
registerEnumType(ModerationAction, { name: 'ModerationAction' });

// ==================== Output DTOs ====================

@ObjectType()
export class ReportUser {
  @Field(() => ID)
  id: string;

  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}

@ObjectType()
export class ReportedPost {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => [String])
  mediaUrls: string[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class Report {
  @Field(() => ID)
  id: string;

  @Field(() => ReportUser)
  reporter: ReportUser;

  @Field(() => ReportUser)
  reported: ReportUser;

  @Field(() => ReportedPost, { nullable: true })
  post?: ReportedPost;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  entityType?: string;

  @Field(() => ReportReason)
  reason: ReportReason;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ReportStatus)
  status: ReportStatus;

  @Field({ nullable: true })
  resolvedAt?: Date;

  @Field({ nullable: true })
  resolvedBy?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaginatedReports {
  @Field(() => [Report])
  items: Report[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class ReportOperationResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => ID, { nullable: true })
  reportId?: string;
}

@ObjectType()
export class ModerationStats {
  @Field(() => Int)
  pendingReports: number;

  @Field(() => Int)
  reviewedToday: number;

  @Field(() => Int)
  resolvedThisWeek: number;

  @Field(() => Int)
  totalReports: number;
}

// ==================== Input DTOs ====================

@InputType()
export class CreateReportInput {
  @Field()
  @IsUUID()
  reportedId: string;

  @Field(() => ReportReason)
  @IsEnum(ReportReason)
  reason: ReportReason;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  postId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  entityId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;
}

@InputType()
export class GetReportsInput {
  @Field(() => Int, { defaultValue: 20 })
  limit: number;

  @Field(() => Int, { defaultValue: 0 })
  offset: number;

  @Field(() => ReportStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @Field(() => ReportReason, { nullable: true })
  @IsOptional()
  @IsEnum(ReportReason)
  reason?: ReportReason;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  reportedId?: string;
}

@InputType()
export class ReviewReportInput {
  @Field(() => ID)
  @IsUUID()
  reportId: string;

  @Field(() => ReportStatus)
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @Field(() => ModerationAction)
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  suspensionReason?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  suspensionDays?: number;
}
