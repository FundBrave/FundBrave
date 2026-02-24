/**
 * Database Reset Script
 * Clears all campaign/donation/stake data to resync with the current deployed smart contract.
 *
 * Usage:
 *   npx ts-node scripts/reset-db.ts
 *
 * What it does:
 *   1. Deletes all fundraiser-related data (donations, stakes, wealth building, updates, etc.)
 *   2. Keeps user accounts intact
 *   3. Keeps blockchain configuration intact
 *
 * After running this, campaigns will only appear when created via the current deployed factory contract.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetCampaignData(): Promise<void> {
  console.log('🔄 FundBrave Database Reset');
  console.log('============================');
  console.log('This will delete all campaign/donation/stake data.');
  console.log('User accounts and blockchain config will be preserved.\n');

  try {
    // Count existing data
    const fundraiserCount = await prisma.fundraiser.count();
    const donationCount = await prisma.donation.count();

    console.log(`📊 Current data:`);
    console.log(`   Fundraisers: ${fundraiserCount}`);
    console.log(`   Donations: ${donationCount}`);
    console.log('');

    if (fundraiserCount === 0 && donationCount === 0) {
      console.log('✅ Database is already clean. No action needed.');
      return;
    }

    console.log('🗑️  Clearing campaign-related data...\n');

    // Delete in dependency order to respect foreign key constraints
    // Start with the most dependent tables first

    // Votes & Proposals
    const deletedGlobalVotes = await prisma.globalPoolVote.deleteMany({});
    console.log(`   Deleted ${deletedGlobalVotes.count} global votes`);

    const deletedVotes = await prisma.vote.deleteMany({});
    console.log(`   Deleted ${deletedVotes.count} votes`);

    const deletedProposals = await prisma.proposal.deleteMany({});
    console.log(`   Deleted ${deletedProposals.count} proposals`);

    // Wealth building donations
    const deletedWB = await prisma.wealthBuildingDonation.deleteMany({});
    console.log(`   Deleted ${deletedWB.count} wealth building donations`);

    // Stakes
    const deletedStakes = await prisma.stake.deleteMany({});
    console.log(`   Deleted ${deletedStakes.count} stakes`);

    // Donations
    const deletedDonations = await prisma.donation.deleteMany({});
    console.log(`   Deleted ${deletedDonations.count} donations`);

    // Campaign updates & milestones
    const deletedUpdates = await prisma.fundraiserUpdate.deleteMany({});
    console.log(`   Deleted ${deletedUpdates.count} campaign updates`);

    const deletedMilestones = await prisma.milestone.deleteMany({});
    console.log(`   Deleted ${deletedMilestones.count} milestones`);

    // Comments on campaigns
    const deletedComments = await prisma.comment.deleteMany({});
    console.log(`   Deleted ${deletedComments.count} comments`);

    // Posts (community)
    const deletedReposts = await prisma.repost.deleteMany({});
    console.log(`   Deleted ${deletedReposts.count} reposts`);

    const deletedPosts = await prisma.post.deleteMany({});
    console.log(`   Deleted ${deletedPosts.count} posts`);

    // Finally, delete fundraisers
    const deletedFundraisers = await prisma.fundraiser.deleteMany({});
    console.log(`   Deleted ${deletedFundraisers.count} fundraisers`);

    console.log('\n✅ Campaign data cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart the backend: npm run start:dev');
    console.log('   2. Create campaigns through the frontend (they\'ll be created on the current deployed contract)');
    console.log('   3. Or seed on-chain campaigns: npm run seed -- --onchain');

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetCampaignData()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
