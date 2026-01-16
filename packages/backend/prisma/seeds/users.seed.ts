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
  type: 'activist' | 'entrepreneur' | 'artist' | 'donor';
}

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
 * Seed 20 diverse users
 */
export async function seedUsers(): Promise<SeededUser[]> {
  console.log('🌱 Seeding users...');

  const seededUsers: SeededUser[] = [];
  const userTypes: Array<'activist' | 'entrepreneur' | 'artist' | 'donor'> = [
    ...Array(5).fill('activist'),
    ...Array(5).fill('entrepreneur'),
    ...Array(5).fill('artist'),
    ...Array(5).fill('donor'),
  ];

  // Hash default password for hybrid users
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

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

  console.log(`✅ Created ${seededUsers.length} users\n`);
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
