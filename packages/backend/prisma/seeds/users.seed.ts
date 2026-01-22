import { PrismaClient, VerificationBadge } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Wallet } from 'ethers';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface SeededUser {
  id: string;
  walletAddress: string;
  username: string;
  displayName: string;
  type: 'activist' | 'entrepreneur' | 'artist' | 'donor' | 'test';
}

/**
 * Pre-defined test users for development and testing
 * These users have known credentials for easy testing
 */
const TEST_USERS = [
  {
    email: 'okwuosahpaschal@gmail.com',
    password: '84316860p*A',
    displayName: 'Paschal Okwuosah',
    username: 'paschal_okwuosah',
    type: 'activist' as const,
    bio: 'Platform founder and test user. Building the future of decentralized fundraising.',
    isVerifiedCreator: true,
    verificationBadge: VerificationBadge.GOLD,
  },
  {
    email: 'test@fundbrave.com',
    password: 'TestUser123!',
    displayName: 'Test User',
    username: 'testuser',
    type: 'donor' as const,
    bio: 'Test account for platform development and QA testing.',
    isVerifiedCreator: false,
    verificationBadge: VerificationBadge.NONE,
  },
  {
    email: 'admin@fundbrave.com',
    password: 'AdminPass123!',
    displayName: 'FundBrave Admin',
    username: 'fundbrave_admin',
    type: 'entrepreneur' as const,
    bio: 'Platform administrator account.',
    isVerifiedCreator: true,
    verificationBadge: VerificationBadge.OFFICIAL,
  },
  {
    email: 'creator@fundbrave.com',
    password: 'Creator123!',
    displayName: 'Demo Creator',
    username: 'demo_creator',
    type: 'artist' as const,
    bio: 'Demo creator account for showcasing platform features.',
    isVerifiedCreator: true,
    verificationBadge: VerificationBadge.VERIFIED_CREATOR,
  },
  {
    email: 'donor@fundbrave.com',
    password: 'Donor123!',
    displayName: 'Demo Donor',
    username: 'demo_donor',
    type: 'donor' as const,
    bio: 'Demo donor account for testing donation flows.',
    isVerifiedCreator: false,
    verificationBadge: VerificationBadge.NONE,
  },
];

/**
 * Generate realistic user data based on user type
 */
function generateUserData(
  type: 'activist' | 'entrepreneur' | 'artist' | 'donor',
  index: number,
): any {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`;
  const displayName = `${firstName} ${lastName}`;
  const wallet = Wallet.createRandom();

  const bioTemplates = {
    activist: [
      `Passionate about social justice and community empowerment. Fighting for a better tomorrow. 🌍`,
      `Environmental activist | Climate action advocate | Making change happen one step at a time`,
      `Human rights defender | Social entrepreneur | Building sustainable communities`,
      `Grassroots organizer | Equity & inclusion advocate | Let's create positive change together`,
      `Community leader focused on education, healthcare, and social impact`,
    ],
    entrepreneur: [
      `Founder & CEO building innovative solutions for social good | Tech for impact 🚀`,
      `Serial entrepreneur | Startup builder | Using business to solve real problems`,
      `Building the future of sustainable technology | Innovation + Impact`,
      `Fintech entrepreneur | Democratizing access to financial services`,
      `Scaling solutions that matter | Social enterprise founder`,
    ],
    artist: [
      `Independent artist creating work that inspires change 🎨`,
      `Musician | Producer | Using art to amplify underrepresented voices`,
      `Digital artist | NFT creator | Supporting creative communities`,
      `Documentary filmmaker | Storyteller | Giving voice to untold stories`,
      `Creative director | Designer | Art for social impact`,
    ],
    donor: [
      `Supporting causes I believe in | Crypto philanthropist`,
      `Impact investor | Passionate about education and healthcare access`,
      `DeFi enthusiast | Supporting grassroots movements worldwide`,
      `Believer in the power of community | Always looking to support good causes`,
      `Web3 advocate | Using blockchain for positive social change`,
    ],
  };

  const interests = {
    activist: [
      'climate-change',
      'human-rights',
      'education',
      'healthcare',
      'poverty',
    ],
    entrepreneur: ['tech', 'innovation', 'sustainability', 'fintech', 'impact'],
    artist: ['art', 'music', 'culture', 'creativity', 'storytelling'],
    donor: ['philanthropy', 'defi', 'web3', 'social-impact', 'community'],
  };

  const goals = {
    activist: ['raise-funds', 'build-community', 'create-awareness'],
    entrepreneur: ['raise-funds', 'scale-impact', 'innovate'],
    artist: ['raise-funds', 'showcase-work', 'support-causes'],
    donor: ['support-causes', 'discover-projects', 'track-impact'],
  };

  // 30% chance of having email/password (hybrid Web2+Web3)
  const hasEmail = Math.random() < 0.3;
  const email = hasEmail ? faker.internet.email({ firstName, lastName }).toLowerCase() : null;

  return {
    walletAddress: wallet.address,
    username,
    displayName,
    email,
    emailVerified: hasEmail ? faker.datatype.boolean() : false,
    bio: faker.helpers.arrayElement(bioTemplates[type]),
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${username}`,
    location: faker.location.city() + ', ' + faker.location.country(),
    website:
      Math.random() < 0.4
        ? `https://${username}.com`
        : null,
    isVerifiedCreator: type === 'activist' || type === 'entrepreneur',
    verificationBadge:
      type === 'activist' || type === 'entrepreneur'
        ? VerificationBadge.VERIFIED_CREATOR
        : VerificationBadge.NONE,
    reputationScore: faker.number.int({ min: 0, max: 1000 }),
    followersCount: faker.number.int({ min: 10, max: 5000 }),
    followingCount: faker.number.int({ min: 5, max: 500 }),
    interests: interests[type],
    goals: goals[type],
    onboardingCompleted: true,
    birthdate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    createdAt: faker.date.past({ years: 1 }),
    lastSeenAt: faker.date.recent({ days: 7 }),
  };
}

/**
 * Create pre-defined test users with known credentials
 */
async function seedTestUsers(): Promise<SeededUser[]> {
  console.log('🧪 Seeding test users with known credentials...');

  const seededUsers: SeededUser[] = [];

  for (const testUser of TEST_USERS) {
    const wallet = Wallet.createRandom();
    const passwordHash = await bcrypt.hash(testUser.password, 14);

    const userData = {
      walletAddress: wallet.address.toLowerCase(),
      username: testUser.username,
      displayName: testUser.displayName,
      email: testUser.email.toLowerCase(),
      emailVerified: true, // Test users have verified emails
      passwordHash,
      bio: testUser.bio,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${testUser.username}`,
      location: 'San Francisco, USA',
      isVerifiedCreator: testUser.isVerifiedCreator,
      verificationBadge: testUser.verificationBadge,
      reputationScore: faker.number.int({ min: 500, max: 1000 }),
      followersCount: faker.number.int({ min: 100, max: 5000 }),
      followingCount: faker.number.int({ min: 50, max: 500 }),
      interests: ['web3', 'defi', 'social-impact', 'community'],
      goals: ['raise-funds', 'support-causes', 'build-community'],
      onboardingCompleted: true,
      birthdate: faker.date.birthdate({ min: 25, max: 45, mode: 'age' }),
      createdAt: new Date('2024-01-01'),
      lastSeenAt: new Date(),
    };

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: testUser.email.toLowerCase() },
      });

      if (existingUser) {
        console.log(`  ⏭️  Test user ${testUser.email} already exists, skipping...`);
        seededUsers.push({
          id: existingUser.id,
          walletAddress: existingUser.walletAddress,
          username: existingUser.username!,
          displayName: existingUser.displayName!,
          type: testUser.type,
        });
        continue;
      }

      const user = await prisma.user.create({
        data: userData,
      });

      seededUsers.push({
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username!,
        displayName: user.displayName!,
        type: testUser.type,
      });

      console.log(`  ✓ Created test user: ${testUser.email} / ${testUser.password}`);
    } catch (error) {
      console.error(`  ✗ Failed to create test user ${testUser.email}:`, error);
    }
  }

  return seededUsers;
}

/**
 * Seed 20 diverse users + 5 test users
 */
export async function seedUsers(): Promise<SeededUser[]> {
  console.log('🌱 Seeding users...');

  const seededUsers: SeededUser[] = [];

  // First, create test users with known credentials
  const testUsers = await seedTestUsers();
  seededUsers.push(...testUsers);

  console.log('\n🎭 Seeding random users...');

  const userTypes: Array<'activist' | 'entrepreneur' | 'artist' | 'donor'> = [
    ...Array(5).fill('activist'),
    ...Array(5).fill('entrepreneur'),
    ...Array(5).fill('artist'),
    ...Array(5).fill('donor'),
  ];

  // Hash default password for hybrid users
  const defaultPasswordHash = await bcrypt.hash('Password123!', 14);

  for (let i = 0; i < userTypes.length; i++) {
    const type = userTypes[i];
    const userData = generateUserData(type, i + 1);

    // Add password hash if user has email
    if (userData.email) {
      userData.passwordHash = defaultPasswordHash;
    }

    try {
      const user = await prisma.user.create({
        data: userData,
      });

      seededUsers.push({
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username!,
        displayName: user.displayName!,
        type,
      });

      console.log(`  ✓ Created ${type}: ${user.username} (${user.walletAddress.slice(0, 8)}...)`);
    } catch (error) {
      console.error(`  ✗ Failed to create user ${userData.username}:`, error);
    }
  }

  console.log(`\n✅ Created ${seededUsers.length} total users (${testUsers.length} test + ${seededUsers.length - testUsers.length} random)\n`);

  // Print test credentials summary
  console.log('📋 Test User Credentials:');
  console.log('='.repeat(60));
  for (const testUser of TEST_USERS) {
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Password: ${testUser.password}`);
    console.log('-'.repeat(60));
  }
  console.log('');

  return seededUsers;
}

/**
 * Get seeded users (for use in other seed files)
 */
export async function getSeededUsers(): Promise<SeededUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      walletAddress: true,
      username: true,
      displayName: true,
    },
    take: 20,
    orderBy: { createdAt: 'asc' },
  });

  return users.map((u) => ({
    id: u.id,
    walletAddress: u.walletAddress,
    username: u.username!,
    displayName: u.displayName!,
    type: 'donor' as const, // Default type for existing users
  }));
}
