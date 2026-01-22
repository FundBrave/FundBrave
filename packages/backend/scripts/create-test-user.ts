/**
 * Create Test User Script
 *
 * This script creates the test user if it doesn't exist.
 * Run with: npx ts-node scripts/create-test-user.ts
 *
 * Test Credentials:
 * - Email: okwuosahpaschal@gmail.com
 * - Password: 84316860p*A
 */

import { PrismaClient, VerificationBadge } from '@prisma/client';
import { Wallet } from 'ethers';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_USER = {
  email: 'okwuosahpaschal@gmail.com',
  password: '84316860p*A',
  displayName: 'Paschal Okwuosah',
  username: 'paschal_okwuosah',
  bio: 'Platform founder and test user. Building the future of decentralized fundraising.',
  isVerifiedCreator: true,
  verificationBadge: VerificationBadge.GOLD,
};

async function createTestUser(): Promise<void> {
  console.log('Checking for test user...\n');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: TEST_USER.email.toLowerCase() },
    });

    if (existingUser) {
      console.log('Test user already exists!');
      console.log(`  ID: ${existingUser.id}`);
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Username: ${existingUser.username}`);
      console.log(`  Wallet: ${existingUser.walletAddress}`);
      console.log(`  Email Verified: ${existingUser.emailVerified}`);
      console.log(`  Has Password: ${!!existingUser.passwordHash}`);
      console.log(`  Is Active: ${existingUser.isActive}`);
      console.log(`  Is Suspended: ${existingUser.isSuspended}`);

      // If user exists but doesn't have a password hash, update it
      if (!existingUser.passwordHash) {
        console.log('\nUser exists but has no password. Adding password hash...');
        const passwordHash = await bcrypt.hash(TEST_USER.password, 14);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { passwordHash },
        });
        console.log('Password hash added successfully!');
      }

      // Ensure user is active and not suspended
      if (!existingUser.isActive || existingUser.isSuspended) {
        console.log('\nActivating user account...');
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            isActive: true,
            isSuspended: false,
            emailVerified: true,
          },
        });
        console.log('User account activated!');
      }

      // Verify the password can be compared correctly
      if (existingUser.passwordHash) {
        const isPasswordValid = await bcrypt.compare(TEST_USER.password, existingUser.passwordHash);
        console.log(`\nPassword verification test: ${isPasswordValid ? 'PASSED' : 'FAILED'}`);

        if (!isPasswordValid) {
          console.log('Resetting password to correct value...');
          const passwordHash = await bcrypt.hash(TEST_USER.password, 14);
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { passwordHash },
          });
          console.log('Password reset successfully!');
        }
      }

      return;
    }

    // Create new test user
    console.log('Creating test user...');

    const wallet = Wallet.createRandom();
    const passwordHash = await bcrypt.hash(TEST_USER.password, 14);

    const user = await prisma.user.create({
      data: {
        walletAddress: wallet.address.toLowerCase(),
        username: TEST_USER.username,
        displayName: TEST_USER.displayName,
        email: TEST_USER.email.toLowerCase(),
        emailVerified: true,
        passwordHash,
        bio: TEST_USER.bio,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${TEST_USER.username}`,
        location: 'San Francisco, USA',
        isVerifiedCreator: TEST_USER.isVerifiedCreator,
        verificationBadge: TEST_USER.verificationBadge,
        reputationScore: 850,
        followersCount: 1500,
        followingCount: 250,
        interests: ['web3', 'defi', 'social-impact', 'community', 'blockchain'],
        goals: ['raise-funds', 'support-causes', 'build-community'],
        onboardingCompleted: true,
        birthdate: new Date('1990-06-15'),
        isActive: true,
        isSuspended: false,
      },
    });

    console.log('\nTest user created successfully!');
    console.log('='.repeat(50));
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Wallet: ${user.walletAddress}`);
    console.log('='.repeat(50));
    console.log('\nYou can now log in with these credentials.');

  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

// Verify login would work
async function verifyLogin(): Promise<void> {
  console.log('\n\nVerifying login capability...\n');

  const user = await prisma.user.findFirst({
    where: {
      email: TEST_USER.email.toLowerCase(),
      isActive: true,
      isSuspended: false,
    },
  });

  if (!user) {
    console.log('FAILED: User not found or not active');
    return;
  }

  if (!user.passwordHash) {
    console.log('FAILED: User has no password hash');
    return;
  }

  const isPasswordValid = await bcrypt.compare(TEST_USER.password, user.passwordHash);

  if (isPasswordValid) {
    console.log('SUCCESS: Login credentials are valid!');
    console.log('\nThe user can log in with:');
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
  } else {
    console.log('FAILED: Password verification failed');
  }
}

// Run the script
createTestUser()
  .then(() => verifyLogin())
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
