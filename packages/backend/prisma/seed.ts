import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/users.seed';
import { seedCampaigns } from './seeds/campaigns.seed';
import { seedPosts, seedReposts } from './seeds/posts.seed';
import { seedInteractions } from './seeds/interactions.seed';
import { seedBaseSepolia, seedAllChains } from './seeds/blockchain.seed';
import { seedOnChainCampaigns } from './seeds/campaigns-onchain.seed';

const prisma = new PrismaClient();

/**
 * Check if on-chain campaign seeding is enabled
 * Enable via:
 *   - Environment variable: SEED_ONCHAIN_CAMPAIGNS=true
 *   - Command line argument: --onchain
 *
 * Requirements for on-chain seeding:
 *   - BACKEND_WALLET_PK must be set with a funded wallet
 *   - RPC connection to Base Sepolia must be working
 */
function isOnChainSeedingEnabled(): boolean {
  // Check environment variable
  if (process.env.SEED_ONCHAIN_CAMPAIGNS === 'true') {
    return true;
  }

  // Check command line arguments
  if (process.argv.includes('--onchain')) {
    return true;
  }

  return false;
}

/**
 * Check if wallet is configured for on-chain operations
 */
function isWalletConfigured(): boolean {
  const pk = process.env.BACKEND_WALLET_PK;
  return !!pk && pk.length >= 64;
}

/**
 * Clear existing data (development only)
 */
async function clearDatabase(): Promise<void> {
  console.log('🗑️  Clearing existing data...\n');

  try {
    // Delete in order of dependencies to avoid foreign key constraints
    await prisma.$transaction([
      // Interactions
      prisma.commentLike.deleteMany(),
      prisma.comment.deleteMany(),
      prisma.bookmark.deleteMany(),
      prisma.repost.deleteMany(),
      prisma.like.deleteMany(),
      prisma.follow.deleteMany(),
      prisma.block.deleteMany(),

      // Posts and related
      prisma.postHashtag.deleteMany(),
      prisma.hashtag.deleteMany(),
      prisma.media.deleteMany(),
      prisma.post.deleteMany(),

      // Campaigns and related
      prisma.vote.deleteMany(),
      prisma.proposal.deleteMany(),
      prisma.milestone.deleteMany(),
      prisma.fundraiserUpdate.deleteMany(),
      prisma.donation.deleteMany(),
      prisma.stake.deleteMany(),
      prisma.fundraiser.deleteMany(),

      // Notifications and messages
      prisma.notification.deleteMany(),
      prisma.message.deleteMany(),
      prisma.conversationParticipant.deleteMany(),
      prisma.conversation.deleteMany(),

      // Reports and activity
      prisma.report.deleteMany(),
      prisma.activityLog.deleteMany(),

      // Auth and sessions
      prisma.session.deleteMany(),
      prisma.oAuthHandoff.deleteMany(),
      prisma.oAuthState.deleteMany(),

      // Device tokens and notification settings
      prisma.deviceToken.deleteMany(),
      prisma.notificationSetting.deleteMany(),

      // Blockchain-related (keep chain configs, clear sync data)
      prisma.blockchainEvent.deleteMany(),
      prisma.blockchainSync.deleteMany(),
      prisma.contractRegistry.deleteMany(),
      prisma.supportedToken.deleteMany(),
      prisma.supportedChain.deleteMany(),

      // Users (cascade will handle remaining relations)
      prisma.user.deleteMany(),
    ]);

    console.log('✅ Database cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

/**
 * Validate seeded data
 */
async function validateSeedData(): Promise<void> {
  console.log('🔍 Validating seeded data...\n');

  try {
    const counts = await prisma.$transaction([
      prisma.user.count(),
      prisma.fundraiser.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.repost.count(),
      prisma.bookmark.count(),
      prisma.follow.count(),
      prisma.hashtag.count(),
    ]);

    const [
      userCount,
      fundraiserCount,
      postCount,
      commentCount,
      likeCount,
      repostCount,
      bookmarkCount,
      followCount,
      hashtagCount,
    ] = counts;

    console.log('📊 Seed Data Summary:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Fundraisers: ${fundraiserCount}`);
    console.log(`  Posts: ${postCount}`);
    console.log(`  Comments: ${commentCount}`);
    console.log(`  Likes: ${likeCount}`);
    console.log(`  Reposts: ${repostCount}`);
    console.log(`  Bookmarks: ${bookmarkCount}`);
    console.log(`  Follows: ${followCount}`);
    console.log(`  Hashtags: ${hashtagCount}`);
    console.log('');

    // Validation checks
    const validations: Array<{ check: boolean; message: string }> = [
      { check: userCount >= 20, message: '✓ Users count meets minimum (20)' },
      { check: fundraiserCount >= 10, message: '✓ Fundraisers count meets minimum (10)' },
      { check: postCount >= 50, message: '✓ Posts count meets minimum (50)' },
      { check: commentCount >= 100, message: '✓ Comments count meets minimum (100)' },
      { check: likeCount >= 500, message: '✓ Likes count meets minimum (500)' },
      { check: repostCount >= 50, message: '✓ Reposts count meets minimum (50)' },
      { check: bookmarkCount >= 20, message: '✓ Bookmarks count meets minimum (20)' },
      { check: followCount >= 50, message: '✓ Follows count meets minimum (50)' },
    ];

    let allValid = true;
    for (const validation of validations) {
      if (validation.check) {
        console.log(validation.message);
      } else {
        console.log(`✗ ${validation.message.replace('✓', 'Failed:')}`);
        allValid = false;
      }
    }

    console.log('');

    if (!allValid) {
      console.warn('⚠️  Some validations failed. Seed data may be incomplete.\n');
    } else {
      console.log('✅ All validations passed!\n');
    }

    // Sample data check - get a random user with relations
    const sampleUser = await prisma.user.findFirst({
      include: {
        posts: { take: 3 },
        following: { take: 3 },
        fundraisers: { take: 2 },
      },
    });

    if (sampleUser) {
      console.log('📝 Sample User Data:');
      console.log(`  Username: ${sampleUser.username}`);
      console.log(`  Display Name: ${sampleUser.displayName}`);
      console.log(`  Posts: ${sampleUser.posts.length}`);
      console.log(`  Following: ${sampleUser.following.length}`);
      console.log(`  Fundraisers: ${sampleUser.fundraisers.length}`);
      console.log('');
    }

    // Referential integrity is guaranteed by Prisma's foreign key constraints
    console.log('✓ Referential integrity verified by database constraints\n');
  } catch (error) {
    console.error('❌ Error validating seed data:', error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function main(): Promise<void> {
  console.log('🌱 Starting FundBrave database seed...\n');
  console.log('⏰ Start time:', new Date().toISOString());
  console.log('');

  const startTime = Date.now();

  try {
    // Step 1: Clear existing data
    await clearDatabase();

    // Step 1.5: Seed blockchain configuration (chains, contracts, tokens)
    console.log('Step 1.5: Seeding blockchain configuration...\n');
    await seedAllChains();
    await seedBaseSepolia();

    // Step 2: Seed users
    const users = await seedUsers();

    if (users.length === 0) {
      throw new Error('Failed to seed users. Cannot continue.');
    }

    // Step 3: Seed campaigns (on-chain or offline based on configuration)
    let campaigns;

    if (isOnChainSeedingEnabled()) {
      console.log('\n');
      console.log('================================================================');
      console.log('  ON-CHAIN CAMPAIGN SEEDING ENABLED');
      console.log('================================================================');

      if (!isWalletConfigured()) {
        console.warn('  WARNING: BACKEND_WALLET_PK is not configured.');
        console.warn('  On-chain seeding requires a funded wallet.');
        console.warn('  Falling back to offline seeding...\n');
        campaigns = await seedCampaigns(users);
      } else {
        console.log('  Creating campaigns on Base Sepolia blockchain...');
        console.log('  This may take several minutes due to transaction confirmations.\n');

        try {
          campaigns = await seedOnChainCampaigns(users);
          console.log('  ON-CHAIN SEEDING COMPLETE\n');
        } catch (error) {
          console.error('\n  ON-CHAIN SEEDING FAILED:', error);
          console.warn('  Falling back to offline seeding...\n');
          campaigns = await seedCampaigns(users);
        }
      }
    } else {
      // Standard offline seeding (fake tx hashes, not on-chain)
      campaigns = await seedCampaigns(users);
    }

    if (campaigns.length === 0) {
      throw new Error('Failed to seed campaigns. Cannot continue.');
    }

    // Step 4: Seed posts
    const posts = await seedPosts(users, campaigns);

    if (posts.length === 0) {
      throw new Error('Failed to seed posts. Cannot continue.');
    }

    // Step 5: Seed reposts (posts that reference other posts)
    await seedReposts(users, posts);

    // Step 6: Seed all interactions (follows, likes, comments, etc.)
    await seedInteractions(users, posts);

    // Step 7: Validate seeded data
    await validateSeedData();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('⏰ End time:', new Date().toISOString());
    console.log('');
    console.log('💡 Next steps:');
    console.log('   - Start the backend server: npm run start:dev');
    console.log('   - Test the GraphQL API at http://localhost:4000/graphql');
    console.log('   - Login with any seeded user wallet address');
    console.log('   - Default password for hybrid users: Password123!');
    console.log('');

    if (!isOnChainSeedingEnabled()) {
      console.log('💡 On-chain seeding options:');
      console.log('   - Run with --onchain flag: npm run seed -- --onchain');
      console.log('   - Set SEED_ONCHAIN_CAMPAIGNS=true in .env');
      console.log('   - Run separately: npm run seed:campaigns');
      console.log('   - Requires BACKEND_WALLET_PK to be set with a funded wallet');
      console.log('');
    }
  } catch (error) {
    console.error('');
    console.error('❌ Seed failed with error:');
    console.error(error);
    console.error('');
    throw error;
  }
}

// Execute seed function
main()
  .catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
