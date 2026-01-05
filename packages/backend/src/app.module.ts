import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { GraphqlConfigModule } from './graphql/graphql.module';

// Feature modules - Fundraising
import { FundraisersModule } from './modules/fundraisers/fundraisers.module';
import { DonationsModule } from './modules/donations/donations.module';
import { StakingModule } from './modules/staking/staking.module';

// Feature modules - New Funding Mechanisms
import { ImpactDAOModule } from './modules/impact-dao/impact-dao.module';
import { WealthBuildingModule } from './modules/wealth-building/wealth-building.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { FBTVestingModule } from './modules/fbt-vesting/fbt-vesting.module';
import { DAOVotingModule } from './modules/dao-voting/dao-voting.module';

// Feature modules - Social & User Management
import { UsersModule } from './modules/users/users.module';
import { SocialModule } from './modules/social/social.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Infrastructure modules
import { AuthModule } from './modules/auth/auth.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { WebSocketsModule } from './modules/websockets/websockets.module';
import { MessagingModule } from './modules/messaging/messaging.module';

// New feature modules
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ActivityModule } from './modules/activity/activity.module';
import { TrendingModule } from './modules/trending/trending.module';
import { QueueModule } from './modules/queue/queue.module';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting - Global throttler configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Scheduled Tasks - Cron jobs for trending, cleanup, etc.
    ScheduleModule.forRoot(),

    // Core infrastructure
    PrismaModule,
    GraphqlConfigModule,
    AuthModule,
    BlockchainModule,
    WebSocketsModule,

    // Fundraising & Donations
    FundraisersModule,
    DonationsModule,
    StakingModule,

    // New Funding Mechanisms (Three Pillars)
    ImpactDAOModule, // Pillar 1: Impact DAO - Collective funding via shared treasury
    WealthBuildingModule, // Pillar 2: Wealth-Building Donations - 80/20 split with stock portfolio
    TreasuryModule, // Platform Treasury - Fee collection and FBT staking
    FBTVestingModule, // FBT Token Vesting - Donation & engagement rewards
    DAOVotingModule, // Off-chain DAO Voting - Proposal creation and voting

    // Social & Community
    UsersModule,
    SocialModule,
    AnalyticsModule,

    // Messaging
    MessagingModule,

    // New Feature Modules
    NotificationsModule, // Real-time notifications with WebSocket support
    UploadModule, // S3 file upload service
    ModerationModule, // Content moderation and reporting system
    ActivityModule, // User activity logging (global module)
    TrendingModule, // Trending hashtags, fundraisers, users
    QueueModule, // Bull/Redis background job queue
    EmailModule, // Email service with templates (global module)
    HealthModule, // Health check endpoints for monitoring
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
