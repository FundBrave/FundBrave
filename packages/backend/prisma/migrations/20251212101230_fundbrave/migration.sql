-- CreateEnum
CREATE TYPE "VerificationBadge" AS ENUM ('NONE', 'WORLD_ID', 'VERIFIED_CREATOR', 'OFFICIAL', 'GOLD');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('TEXT', 'MEDIA', 'POLL', 'DONATION_EVENT', 'FUNDRAISER_NEW', 'FUNDRAISER_UPDATE', 'MILESTONE_REACHED');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'GIF');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FeeSourceType" AS ENUM ('STAKING_POOL', 'IMPACT_DAO_POOL', 'WEALTH_BUILDING', 'FUNDRAISER', 'OTHER');

-- CreateEnum
CREATE TYPE "VestingType" AS ENUM ('DONATION_REWARD', 'ENGAGEMENT_REWARD', 'TEAM_ALLOCATION', 'INVESTOR', 'ECOSYSTEM');

-- CreateEnum
CREATE TYPE "ProposalCategory" AS ENUM ('YIELD_DISTRIBUTION', 'PARAMETER_CHANGE', 'FEATURE_REQUEST', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PASSED', 'REJECTED', 'EXECUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('FOR', 'AGAINST', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'REPOST', 'FOLLOW', 'MENTION', 'DONATION_RECEIVED', 'STAKE_RECEIVED', 'GOAL_REACHED', 'MILESTONE_REACHED', 'PROPOSAL_CREATED', 'PROPOSAL_EXECUTED', 'MESSAGE', 'SYSTEM', 'YIELD_HARVESTED', 'STOCK_PURCHASED', 'FBT_VESTED', 'FBT_REWARD', 'DAO_VOTE_STARTED', 'DAO_VOTE_ENDED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'VIOLENCE', 'SCAM', 'FAKE_FUNDRAISER', 'INAPPROPRIATE_CONTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('POST_CREATE', 'POST_VIEW', 'POST_LIKE', 'POST_UNLIKE', 'POST_REPOST', 'POST_BOOKMARK', 'COMMENT_CREATE', 'FOLLOW', 'UNFOLLOW', 'DONATION_CREATE', 'STAKE_CREATE', 'PROPOSAL_CREATE', 'VOTE_CAST', 'PROFILE_VIEW', 'FUNDRAISER_VIEW', 'SEARCH', 'IMPACT_DAO_STAKE', 'IMPACT_DAO_UNSTAKE', 'WEALTH_BUILDING_DONATE', 'FBT_STAKE', 'FBT_UNSTAKE', 'FBT_VEST_CLAIM', 'DAO_VOTE', 'YIELD_HARVEST', 'STOCK_CLAIM');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SYNCING', 'SYNCED', 'ERROR', 'PAUSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "twitterId" TEXT,
    "encryptedPrivateKey" TEXT,
    "encryptionIv" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "location" TEXT,
    "website" TEXT,
    "worldIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "worldIdNullifier" TEXT,
    "isVerifiedCreator" BOOLEAN NOT NULL DEFAULT false,
    "verificationBadge" "VerificationBadge",
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "fundraisersCount" INTEGER NOT NULL DEFAULT 0,
    "totalDonated" BIGINT NOT NULL DEFAULT 0,
    "totalStaked" BIGINT NOT NULL DEFAULT 0,
    "fbtBalance" BIGINT NOT NULL DEFAULT 0,
    "fbtStakedBalance" BIGINT NOT NULL DEFAULT 0,
    "fbtVestedTotal" BIGINT NOT NULL DEFAULT 0,
    "fbtVestedClaimed" BIGINT NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "nonce" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "type" "PostType" NOT NULL DEFAULT 'TEXT',
    "authorId" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "mentions" TEXT[],
    "fundraiserId" TEXT,
    "parentId" TEXT,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "repostsCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarksCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_hashtags" (
    "postId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_hashtags_pkey" PRIMARY KEY ("postId","hashtagId")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "thumbnail" TEXT,
    "alt" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reposts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reposts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundraisers" (
    "id" TEXT NOT NULL,
    "onChainId" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "categories" TEXT[],
    "region" TEXT,
    "goalAmount" TEXT NOT NULL DEFAULT '0',
    "raisedAmount" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "endowmentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "endowmentPrincipal" BIGINT NOT NULL DEFAULT 0,
    "endowmentYield" BIGINT NOT NULL DEFAULT 0,
    "beneficiary" TEXT NOT NULL,
    "stakingPoolAddr" TEXT,
    "creatorId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "goalReached" BOOLEAN NOT NULL DEFAULT false,
    "donorsCount" INTEGER NOT NULL DEFAULT 0,
    "stakersCount" INTEGER NOT NULL DEFAULT 0,
    "updatesCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "fundraisers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundraiser_updates" (
    "id" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fundraiser_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" BIGINT NOT NULL,
    "isReached" BOOLEAN NOT NULL DEFAULT false,
    "reachedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "amountUSD" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "sourceChain" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "donorId" TEXT,
    "donorAddress" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stakes" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "shares" BIGINT NOT NULL,
    "fundraiserId" TEXT,
    "stakerId" TEXT NOT NULL,
    "stakerAddress" TEXT NOT NULL,
    "causeShare" INTEGER,
    "stakerShare" INTEGER,
    "platformShare" INTEGER,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "stakedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unstakedAt" TIMESTAMP(3),

    CONSTRAINT "stakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "onChainId" INTEGER NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "requiredVotes" BIGINT NOT NULL,
    "upvotes" BIGINT NOT NULL DEFAULT 0,
    "downvotes" BIGINT NOT NULL DEFAULT 0,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,
    "votingPower" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_dao_stakes" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "stakerId" TEXT NOT NULL,
    "stakerAddress" TEXT NOT NULL,
    "principal" BIGINT NOT NULL,
    "daoShare" INTEGER NOT NULL DEFAULT 7900,
    "stakerShare" INTEGER NOT NULL DEFAULT 1900,
    "platformShare" INTEGER NOT NULL DEFAULT 200,
    "pendingUSDCYield" BIGINT NOT NULL DEFAULT 0,
    "pendingFBTReward" BIGINT NOT NULL DEFAULT 0,
    "claimedUSDCYield" BIGINT NOT NULL DEFAULT 0,
    "claimedFBTReward" BIGINT NOT NULL DEFAULT 0,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stakedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unstakedAt" TIMESTAMP(3),

    CONSTRAINT "impact_dao_stakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_dao_yield_harvests" (
    "id" TEXT NOT NULL,
    "stakeId" TEXT NOT NULL,
    "totalYield" BIGINT NOT NULL,
    "daoAmount" BIGINT NOT NULL,
    "stakerAmount" BIGINT NOT NULL,
    "platformAmount" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "chainId" INTEGER NOT NULL,
    "harvestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impact_dao_yield_harvests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_dao_pool_stats" (
    "id" TEXT NOT NULL,
    "totalStakedPrincipal" BIGINT NOT NULL DEFAULT 0,
    "totalYieldHarvested" BIGINT NOT NULL DEFAULT 0,
    "totalFBTDistributed" BIGINT NOT NULL DEFAULT 0,
    "stakersCount" INTEGER NOT NULL DEFAULT 0,
    "rewardRate" BIGINT NOT NULL DEFAULT 0,
    "periodFinish" TIMESTAMP(3),
    "rewardsDuration" INTEGER NOT NULL DEFAULT 604800,
    "lastHarvestAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impact_dao_pool_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wealth_building_donations" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donorAddress" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "beneficiaryAddr" TEXT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "directAmount" BIGINT NOT NULL,
    "endowmentAmount" BIGINT NOT NULL,
    "platformFee" BIGINT NOT NULL,
    "endowmentPrincipal" BIGINT NOT NULL DEFAULT 0,
    "lifetimeYield" BIGINT NOT NULL DEFAULT 0,
    "causeYieldPaid" BIGINT NOT NULL DEFAULT 0,
    "donorStockValue" BIGINT NOT NULL DEFAULT 0,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHarvestAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wealth_building_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wealth_building_yield_harvests" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "yieldAmount" BIGINT NOT NULL,
    "causeShare" BIGINT NOT NULL,
    "donorShare" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "chainId" INTEGER NOT NULL,
    "harvestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wealth_building_yield_harvests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_stock_portfolios" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donorAddress" TEXT NOT NULL,
    "stockToken" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "stockBalance" BIGINT NOT NULL,
    "totalUSDCInvested" BIGINT NOT NULL DEFAULT 0,
    "currentValueUSD" BIGINT NOT NULL DEFAULT 0,
    "donationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_stock_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_purchases" (
    "id" TEXT NOT NULL,
    "donorAddress" TEXT NOT NULL,
    "stockToken" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "usdcAmount" BIGINT NOT NULL,
    "stockAmount" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "chainId" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supported_stocks" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "isBackedToken" BOOLEAN NOT NULL DEFAULT true,
    "underlyingAsset" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastPrice" TEXT,
    "lastPriceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supported_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_fees" (
    "id" TEXT NOT NULL,
    "sourceContract" TEXT NOT NULL,
    "sourceType" "FeeSourceType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "chainId" INTEGER NOT NULL,
    "isStaked" BOOLEAN NOT NULL DEFAULT false,
    "stakedAt" TIMESTAMP(3),
    "stakedTxHash" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fbt_stakes" (
    "id" TEXT NOT NULL,
    "stakerId" TEXT NOT NULL,
    "stakerAddress" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "pendingYield" BIGINT NOT NULL DEFAULT 0,
    "claimedYield" BIGINT NOT NULL DEFAULT 0,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "chainId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stakedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unstakedAt" TIMESTAMP(3),

    CONSTRAINT "fbt_stakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_stats" (
    "id" TEXT NOT NULL,
    "totalFeesCollected" BIGINT NOT NULL DEFAULT 0,
    "totalFeesStaked" BIGINT NOT NULL DEFAULT 0,
    "pendingFeesToStake" BIGINT NOT NULL DEFAULT 0,
    "totalFBTStaked" BIGINT NOT NULL DEFAULT 0,
    "totalYieldDistributed" BIGINT NOT NULL DEFAULT 0,
    "operationalFunds" BIGINT NOT NULL DEFAULT 0,
    "endowmentPrincipal" BIGINT NOT NULL DEFAULT 0,
    "endowmentLifetimeYield" BIGINT NOT NULL DEFAULT 0,
    "minStakeThreshold" BIGINT NOT NULL DEFAULT 1000000000,
    "lastFeeStakedAt" TIMESTAMP(3),
    "lastYieldHarvestedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treasury_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fbt_vesting_schedules" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "releasedAmount" BIGINT NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "vestingType" "VestingType" NOT NULL,
    "claimableAmount" BIGINT NOT NULL DEFAULT 0,
    "isFullyVested" BOOLEAN NOT NULL DEFAULT false,
    "isFullyClaimed" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "chainId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fbt_vesting_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fbt_vesting_claims" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "chainId" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fbt_vesting_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fbt_burns" (
    "id" TEXT NOT NULL,
    "burnerAddress" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "reason" TEXT,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "chainId" INTEGER NOT NULL,
    "burnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fbt_burns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dao_proposals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProposalCategory" NOT NULL,
    "proposerId" TEXT NOT NULL,
    "votingStartTime" TIMESTAMP(3) NOT NULL,
    "votingEndTime" TIMESTAMP(3) NOT NULL,
    "quorumRequired" BIGINT NOT NULL,
    "totalVotesFor" BIGINT NOT NULL DEFAULT 0,
    "totalVotesAgainst" BIGINT NOT NULL DEFAULT 0,
    "totalVotesAbstain" BIGINT NOT NULL DEFAULT 0,
    "votersCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ProposalStatus" NOT NULL DEFAULT 'ACTIVE',
    "executedAt" TIMESTAMP(3),
    "executionTxHash" TEXT,
    "targetFundraisers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dao_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dao_votes" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "votingPower" BIGINT NOT NULL,
    "signature" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dao_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "postId" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "ActivityType" NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_sync" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "contractName" TEXT,
    "lastBlock" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SyncStatus" NOT NULL DEFAULT 'SYNCING',
    "error" TEXT,

    CONSTRAINT "blockchain_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_events" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "contractName" TEXT,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "args" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnLike" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnComment" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnFollow" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnMention" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnDonation" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnStake" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnYieldHarvest" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnStockPurchase" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnFBTVesting" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnDAOProposal" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supported_chains" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "explorerUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "supported_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supported_tokens" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "supported_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_pool_epochs" (
    "id" TEXT NOT NULL,
    "epochNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalYield" BIGINT NOT NULL DEFAULT 0,
    "isCalculated" BOOLEAN NOT NULL DEFAULT false,
    "isDistributed" BOOLEAN NOT NULL DEFAULT false,
    "distributionTx" TEXT,

    CONSTRAINT "global_pool_epochs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_pool_votes" (
    "id" TEXT NOT NULL,
    "epochId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "fundraiserId" TEXT NOT NULL,
    "weight" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_pool_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_pool_locks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "unlockDate" TIMESTAMP(3) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "votingPower" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_pool_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_registry" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractName" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "deploymentTx" TEXT,
    "deploymentBlock" INTEGER,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_worldIdNullifier_key" ON "users"("worldIdNullifier");

-- CreateIndex
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "blocks_blockerId_idx" ON "blocks"("blockerId");

-- CreateIndex
CREATE INDEX "blocks_blockedId_idx" ON "blocks"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_blockerId_blockedId_key" ON "blocks"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_fundraiserId_idx" ON "posts"("fundraiserId");

-- CreateIndex
CREATE INDEX "posts_parentId_idx" ON "posts"("parentId");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt");

-- CreateIndex
CREATE INDEX "posts_engagementScore_idx" ON "posts"("engagementScore");

-- CreateIndex
CREATE UNIQUE INDEX "hashtags_tag_key" ON "hashtags"("tag");

-- CreateIndex
CREATE INDEX "hashtags_usageCount_idx" ON "hashtags"("usageCount");

-- CreateIndex
CREATE INDEX "post_hashtags_hashtagId_idx" ON "post_hashtags"("hashtagId");

-- CreateIndex
CREATE INDEX "media_postId_idx" ON "media"("postId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_userId_commentId_key" ON "comment_likes"("userId", "commentId");

-- CreateIndex
CREATE INDEX "likes_postId_idx" ON "likes"("postId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_postId_key" ON "likes"("userId", "postId");

-- CreateIndex
CREATE INDEX "reposts_postId_idx" ON "reposts"("postId");

-- CreateIndex
CREATE INDEX "reposts_userId_idx" ON "reposts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reposts_userId_postId_key" ON "reposts"("userId", "postId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_postId_key" ON "bookmarks"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "fundraisers_onChainId_key" ON "fundraisers"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "fundraisers_txHash_key" ON "fundraisers"("txHash");

-- CreateIndex
CREATE INDEX "fundraisers_creatorId_idx" ON "fundraisers"("creatorId");

-- CreateIndex
CREATE INDEX "fundraisers_onChainId_idx" ON "fundraisers"("onChainId");

-- CreateIndex
CREATE INDEX "fundraisers_isActive_idx" ON "fundraisers"("isActive");

-- CreateIndex
CREATE INDEX "fundraisers_goalReached_idx" ON "fundraisers"("goalReached");

-- CreateIndex
CREATE INDEX "fundraiser_updates_fundraiserId_idx" ON "fundraiser_updates"("fundraiserId");

-- CreateIndex
CREATE INDEX "milestones_fundraiserId_idx" ON "milestones"("fundraiserId");

-- CreateIndex
CREATE UNIQUE INDEX "donations_txHash_key" ON "donations"("txHash");

-- CreateIndex
CREATE INDEX "donations_fundraiserId_idx" ON "donations"("fundraiserId");

-- CreateIndex
CREATE INDEX "donations_donorId_idx" ON "donations"("donorId");

-- CreateIndex
CREATE INDEX "donations_donorAddress_idx" ON "donations"("donorAddress");

-- CreateIndex
CREATE INDEX "donations_txHash_idx" ON "donations"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "stakes_txHash_key" ON "stakes"("txHash");

-- CreateIndex
CREATE INDEX "stakes_stakerId_idx" ON "stakes"("stakerId");

-- CreateIndex
CREATE INDEX "stakes_fundraiserId_idx" ON "stakes"("fundraiserId");

-- CreateIndex
CREATE INDEX "stakes_poolAddress_idx" ON "stakes"("poolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_onChainId_key" ON "proposals"("onChainId");

-- CreateIndex
CREATE INDEX "proposals_fundraiserId_idx" ON "proposals"("fundraiserId");

-- CreateIndex
CREATE INDEX "proposals_onChainId_idx" ON "proposals"("onChainId");

-- CreateIndex
CREATE INDEX "votes_proposalId_idx" ON "votes"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_proposalId_voterId_key" ON "votes"("proposalId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "impact_dao_stakes_txHash_key" ON "impact_dao_stakes"("txHash");

-- CreateIndex
CREATE INDEX "impact_dao_stakes_stakerId_idx" ON "impact_dao_stakes"("stakerId");

-- CreateIndex
CREATE INDEX "impact_dao_stakes_stakerAddress_idx" ON "impact_dao_stakes"("stakerAddress");

-- CreateIndex
CREATE INDEX "impact_dao_stakes_isActive_idx" ON "impact_dao_stakes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "impact_dao_yield_harvests_txHash_key" ON "impact_dao_yield_harvests"("txHash");

-- CreateIndex
CREATE INDEX "impact_dao_yield_harvests_stakeId_idx" ON "impact_dao_yield_harvests"("stakeId");

-- CreateIndex
CREATE UNIQUE INDEX "wealth_building_donations_txHash_key" ON "wealth_building_donations"("txHash");

-- CreateIndex
CREATE INDEX "wealth_building_donations_donorId_idx" ON "wealth_building_donations"("donorId");

-- CreateIndex
CREATE INDEX "wealth_building_donations_fundraiserId_idx" ON "wealth_building_donations"("fundraiserId");

-- CreateIndex
CREATE INDEX "wealth_building_donations_donorAddress_idx" ON "wealth_building_donations"("donorAddress");

-- CreateIndex
CREATE UNIQUE INDEX "wealth_building_yield_harvests_txHash_key" ON "wealth_building_yield_harvests"("txHash");

-- CreateIndex
CREATE INDEX "wealth_building_yield_harvests_donationId_idx" ON "wealth_building_yield_harvests"("donationId");

-- CreateIndex
CREATE INDEX "donor_stock_portfolios_donorId_idx" ON "donor_stock_portfolios"("donorId");

-- CreateIndex
CREATE INDEX "donor_stock_portfolios_stockToken_idx" ON "donor_stock_portfolios"("stockToken");

-- CreateIndex
CREATE UNIQUE INDEX "donor_stock_portfolios_donorId_stockToken_key" ON "donor_stock_portfolios"("donorId", "stockToken");

-- CreateIndex
CREATE UNIQUE INDEX "stock_purchases_txHash_key" ON "stock_purchases"("txHash");

-- CreateIndex
CREATE INDEX "stock_purchases_donorAddress_idx" ON "stock_purchases"("donorAddress");

-- CreateIndex
CREATE INDEX "stock_purchases_stockToken_idx" ON "stock_purchases"("stockToken");

-- CreateIndex
CREATE UNIQUE INDEX "supported_stocks_tokenAddress_key" ON "supported_stocks"("tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "platform_fees_txHash_key" ON "platform_fees"("txHash");

-- CreateIndex
CREATE INDEX "platform_fees_sourceContract_idx" ON "platform_fees"("sourceContract");

-- CreateIndex
CREATE INDEX "platform_fees_sourceType_idx" ON "platform_fees"("sourceType");

-- CreateIndex
CREATE INDEX "platform_fees_isStaked_idx" ON "platform_fees"("isStaked");

-- CreateIndex
CREATE UNIQUE INDEX "fbt_stakes_txHash_key" ON "fbt_stakes"("txHash");

-- CreateIndex
CREATE INDEX "fbt_stakes_stakerId_idx" ON "fbt_stakes"("stakerId");

-- CreateIndex
CREATE INDEX "fbt_stakes_stakerAddress_idx" ON "fbt_stakes"("stakerAddress");

-- CreateIndex
CREATE INDEX "fbt_stakes_isActive_idx" ON "fbt_stakes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "fbt_vesting_schedules_txHash_key" ON "fbt_vesting_schedules"("txHash");

-- CreateIndex
CREATE INDEX "fbt_vesting_schedules_recipientId_idx" ON "fbt_vesting_schedules"("recipientId");

-- CreateIndex
CREATE INDEX "fbt_vesting_schedules_recipientAddress_idx" ON "fbt_vesting_schedules"("recipientAddress");

-- CreateIndex
CREATE INDEX "fbt_vesting_schedules_vestingType_idx" ON "fbt_vesting_schedules"("vestingType");

-- CreateIndex
CREATE UNIQUE INDEX "fbt_vesting_claims_txHash_key" ON "fbt_vesting_claims"("txHash");

-- CreateIndex
CREATE INDEX "fbt_vesting_claims_scheduleId_idx" ON "fbt_vesting_claims"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "fbt_burns_txHash_key" ON "fbt_burns"("txHash");

-- CreateIndex
CREATE INDEX "fbt_burns_burnerAddress_idx" ON "fbt_burns"("burnerAddress");

-- CreateIndex
CREATE INDEX "dao_proposals_proposerId_idx" ON "dao_proposals"("proposerId");

-- CreateIndex
CREATE INDEX "dao_proposals_status_idx" ON "dao_proposals"("status");

-- CreateIndex
CREATE INDEX "dao_proposals_votingEndTime_idx" ON "dao_proposals"("votingEndTime");

-- CreateIndex
CREATE INDEX "dao_votes_proposalId_idx" ON "dao_votes"("proposalId");

-- CreateIndex
CREATE INDEX "dao_votes_voterId_idx" ON "dao_votes"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "dao_votes_proposalId_voterId_key" ON "dao_votes"("proposalId", "voterId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_actorId_idx" ON "notifications"("actorId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_receiverId_idx" ON "messages"("receiverId");

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");

-- CreateIndex
CREATE INDEX "reports_reportedId_idx" ON "reports"("reportedId");

-- CreateIndex
CREATE INDEX "reports_postId_idx" ON "reports"("postId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "trending_type_period_score_idx" ON "trending"("type", "period", "score");

-- CreateIndex
CREATE UNIQUE INDEX "trending_type_value_period_key" ON "trending"("type", "value", "period");

-- CreateIndex
CREATE INDEX "blockchain_sync_contractName_idx" ON "blockchain_sync"("contractName");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_sync_chainId_contractAddress_key" ON "blockchain_sync"("chainId", "contractAddress");

-- CreateIndex
CREATE INDEX "blockchain_events_eventName_idx" ON "blockchain_events"("eventName");

-- CreateIndex
CREATE INDEX "blockchain_events_contractAddress_idx" ON "blockchain_events"("contractAddress");

-- CreateIndex
CREATE INDEX "blockchain_events_processed_idx" ON "blockchain_events"("processed");

-- CreateIndex
CREATE INDEX "blockchain_events_blockNumber_idx" ON "blockchain_events"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_events_txHash_logIndex_chainId_key" ON "blockchain_events"("txHash", "logIndex", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "supported_tokens_chainId_address_key" ON "supported_tokens"("chainId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "supported_tokens_chainId_symbol_key" ON "supported_tokens"("chainId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "global_pool_epochs_epochNumber_key" ON "global_pool_epochs"("epochNumber");

-- CreateIndex
CREATE INDEX "global_pool_votes_epochId_idx" ON "global_pool_votes"("epochId");

-- CreateIndex
CREATE UNIQUE INDEX "global_pool_votes_epochId_voterId_fundraiserId_key" ON "global_pool_votes"("epochId", "voterId", "fundraiserId");

-- CreateIndex
CREATE INDEX "global_pool_locks_userId_idx" ON "global_pool_locks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reward_claims_txHash_key" ON "reward_claims"("txHash");

-- CreateIndex
CREATE INDEX "reward_claims_userId_idx" ON "reward_claims"("userId");

-- CreateIndex
CREATE INDEX "contract_registry_contractName_idx" ON "contract_registry"("contractName");

-- CreateIndex
CREATE UNIQUE INDEX "contract_registry_chainId_contractName_key" ON "contract_registry"("chainId", "contractName");

-- CreateIndex
CREATE UNIQUE INDEX "contract_registry_chainId_contractAddress_key" ON "contract_registry"("chainId", "contractAddress");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fundraisers" ADD CONSTRAINT "fundraisers_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fundraiser_updates" ADD CONSTRAINT "fundraiser_updates_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_stakerId_fkey" FOREIGN KEY ("stakerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_dao_stakes" ADD CONSTRAINT "impact_dao_stakes_stakerId_fkey" FOREIGN KEY ("stakerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_dao_yield_harvests" ADD CONSTRAINT "impact_dao_yield_harvests_stakeId_fkey" FOREIGN KEY ("stakeId") REFERENCES "impact_dao_stakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wealth_building_donations" ADD CONSTRAINT "wealth_building_donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wealth_building_donations" ADD CONSTRAINT "wealth_building_donations_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wealth_building_yield_harvests" ADD CONSTRAINT "wealth_building_yield_harvests_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "wealth_building_donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_stock_portfolios" ADD CONSTRAINT "donor_stock_portfolios_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_stock_portfolios" ADD CONSTRAINT "donor_stock_portfolios_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "wealth_building_donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fbt_stakes" ADD CONSTRAINT "fbt_stakes_stakerId_fkey" FOREIGN KEY ("stakerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fbt_vesting_schedules" ADD CONSTRAINT "fbt_vesting_schedules_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fbt_vesting_claims" ADD CONSTRAINT "fbt_vesting_claims_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "fbt_vesting_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dao_proposals" ADD CONSTRAINT "dao_proposals_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dao_votes" ADD CONSTRAINT "dao_votes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "dao_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dao_votes" ADD CONSTRAINT "dao_votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supported_tokens" ADD CONSTRAINT "supported_tokens_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "supported_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_pool_votes" ADD CONSTRAINT "global_pool_votes_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "global_pool_epochs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_pool_votes" ADD CONSTRAINT "global_pool_votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_pool_votes" ADD CONSTRAINT "global_pool_votes_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_pool_locks" ADD CONSTRAINT "global_pool_locks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
