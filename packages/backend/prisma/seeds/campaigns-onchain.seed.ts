/**
 * On-Chain Campaign Seeding Script
 *
 * This script creates fundraiser campaigns both on-chain (via FundraiserFactory contract)
 * and in the database. Each campaign is first created on the blockchain, then the
 * returned on-chain data (ID, contract address, tx hash) is used to create the database record.
 *
 * Requirements:
 * - BACKEND_WALLET_PK environment variable must be set with a funded wallet
 * - The wallet must have enough ETH to pay for gas on Base Sepolia
 * - RPC connection to Base Sepolia must be working
 *
 * Usage:
 *   npm run seed:campaigns
 *   # or
 *   ts-node prisma/seeds/campaigns-onchain.seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  Network,
  parseUnits,
  formatUnits,
  TransactionReceipt,
  Log,
  Interface,
} from 'ethers';
import { SeededUser } from './users.seed';

// Load environment variables
config();

const prisma = new PrismaClient();

// ==================== Configuration ====================

const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

// FundraiserFactory contract address on Base Sepolia
const FUNDRAISER_FACTORY_ADDRESS =
  process.env.BASE_SEPOLIA_FUNDRAISER_FACTORY || '0x7253b4E79cc708873b83Bb3C3F50F3e81b21819c';

// USDC address on Base Sepolia
const USDC_ADDRESS = process.env.BASE_SEPOLIA_USDC || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// FundraiserFactory ABI (minimal for createFundraiser)
const FUNDRAISER_FACTORY_ABI = [
  'event FundraiserCreated(address indexed fundraiser, address indexed owner, uint256 indexed id, string name, uint256 goal, uint256 deadline)',
  'event StakingPoolCreated(uint256 indexed fundraiserId, address indexed poolAddress)',
  'function createFundraiser(string name, string[] images, string[] categories, string description, string region, address beneficiary, uint256 goal, uint256 durationInDays) returns (address)',
  'function fundraisersCount() view returns (uint256)',
  'function getFundraiserById(uint256 id) view returns (address)',
  'function currentId() view returns (uint256)',
];

// ==================== Campaign Templates ====================

interface CampaignTemplate {
  name: string;
  description: string;
  category: string;
  region: string;
  goalUSD: number; // Goal in USD (will be converted to USDC with 6 decimals)
  durationDays: number;
  images: string[];
  type: 'activist' | 'entrepreneur' | 'artist';
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    name: 'Clean Water for Rural Villages',
    description: `Providing clean, accessible drinking water to underserved rural communities across sub-Saharan Africa.

**The Challenge:**
Over 300 million people in Africa lack access to safe drinking water. In the rural villages we serve, families walk an average of 6 kilometers daily to collect water from contaminated sources.

**Our Solution:**
- Install 15 community solar-powered water wells
- Train local maintenance technicians for sustainability
- Establish water management committees in each village
- Provide water quality testing and monitoring

**Expected Impact:**
- 8,000+ people with clean water access
- 75% reduction in waterborne diseases
- 300+ hours per family reclaimed annually
- Local job creation through maintenance programs

Every contribution brings us closer to ensuring no child walks miles for water that could make them sick.`,
    category: 'Healthcare',
    region: 'Kenya',
    goalUSD: 25000,
    durationDays: 60,
    images: [
      'https://images.unsplash.com/photo-1541544741670-a5c1fd3b4b5e?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1509099927050-3dd7ebc97717?w=800&h=600&fit=crop',
    ],
    type: 'activist',
  },
  {
    name: 'Tech Skills Bootcamp for Youth',
    description: `Empowering underprivileged youth with technology skills and pathways to meaningful careers in the digital economy.

**Vision:**
Every young person, regardless of socioeconomic background, deserves access to quality tech education and career opportunities.

**Program Structure:**
- 16-week intensive coding bootcamp
- Laptop and internet access provided for all 50 participants
- Industry mentors from top tech companies
- Career coaching and interview preparation
- Job placement assistance post-graduation

**Curriculum Highlights:**
Full-stack web development, React, Node.js, databases, cloud deployment, and essential soft skills.

**Success Metrics:**
- 85% course completion rate target
- 70% job placement within 6 months
- Average starting salary: $45,000
- 100% career pathway visibility

Join us in breaking the cycle of poverty through technology education.`,
    category: 'Education',
    region: 'Nigeria',
    goalUSD: 45000,
    durationDays: 90,
    images: [
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop',
    ],
    type: 'activist',
  },
  {
    name: 'AI-Powered Precision Agriculture',
    description: `Revolutionizing small-scale farming with affordable IoT sensors and AI-driven insights for sustainable food production.

**The Innovation:**
Our platform combines low-cost soil sensors, weather prediction AI, and mobile-first design to help smallholder farmers increase yields by 40% while reducing water usage by 30%.

**Technology Stack:**
- Custom IoT soil moisture and nutrient sensors ($15 per unit)
- Machine learning crop prediction models
- Multilingual mobile app with offline support
- Blockchain-based supply chain transparency

**Market Opportunity:**
The precision agriculture market is projected to reach $12B by 2027. We're targeting 25,000 small farms in our first year.

**Use of Funds:**
- Product development: 40%
- Field trials and validation: 25%
- Sales and distribution: 20%
- Operations: 15%

**Traction:**
- 500 pilot farms with proven yield improvements
- $180K in pre-orders
- Strategic partnership with regional agricultural cooperative

Help us scale technology that feeds communities sustainably.`,
    category: 'Technology',
    region: 'India',
    goalUSD: 55000,
    durationDays: 75,
    images: [
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=600&fit=crop',
    ],
    type: 'entrepreneur',
  },
  {
    name: 'Mental Health Support Network',
    description: `Building an accessible, affordable, and stigma-free mental health support platform for underserved communities.

**The Crisis:**
1 in 4 people globally experience mental health challenges, yet 70% never receive treatment due to cost, stigma, or access barriers.

**Our Platform:**
- AI-powered chatbot for 24/7 crisis support and triage
- Sliding-scale teletherapy ($15-$50 per session)
- Peer support groups moderated by trained facilitators
- Culturally-adapted self-help resources in 12 languages

**Privacy & Security:**
End-to-end encryption, HIPAA-compliant infrastructure, and optional anonymous access.

**Impact to Date:**
- 12,000+ users supported across 3 countries
- 4.7/5 average satisfaction rating
- 82% report improved mental well-being after 8 weeks
- 24/7 crisis line with <2 minute average response time

**Funding Goals:**
Scale to 15 languages, launch video therapy, and provide 2,000 subsidized sessions for those in financial hardship.

You're not alone. Together, we can make mental health support universally accessible.`,
    category: 'Healthcare',
    region: 'Global',
    goalUSD: 40000,
    durationDays: 60,
    images: [
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=600&fit=crop',
    ],
    type: 'entrepreneur',
  },
  {
    name: 'Voices of the Amazon Documentary',
    description: `A feature-length documentary amplifying indigenous voices and showcasing their role as guardians of the Amazon rainforest.

**The Film:**
Through intimate portraits of 6 indigenous communities across Brazil, Peru, and Ecuador, we explore how traditional knowledge and modern activism combine to protect the world's largest rainforest.

**Why This Matters:**
The Amazon stores 150-200 billion tons of carbon and produces 20% of Earth's oxygen. Indigenous communities protect 80% of remaining biodiversity but rarely control the narrative about their land.

**Production Plan:**
- 8 months of embedded filming with community consent
- Indigenous co-directors and crew members
- Original score by Grammy-winning Latin American composers
- Impact campaign and educational resources

**Distribution Strategy:**
- Major film festival premiere (Sundance/Toronto submission)
- Netflix/Amazon acquisition pursuit
- Free educational screenings in 1,000+ schools globally
- Community ownership of footage for advocacy

**Budget Breakdown:**
Travel & community partnerships (35%), crew & equipment (30%), post-production (25%), distribution (10%)

Help us amplify voices that hold the key to our planet's future.`,
    category: 'Arts & Culture',
    region: 'Brazil',
    goalUSD: 48000,
    durationDays: 90,
    images: [
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&h=600&fit=crop',
    ],
    type: 'artist',
  },
  {
    name: 'Community Art Space Revival',
    description: `Transforming an abandoned warehouse into a vibrant 8,000 sq ft community art center in an underserved urban neighborhood.

**The Vision:**
Create an affordable, inclusive space where local artists can create, exhibit, and teach while connecting with their community.

**What We're Building:**
- 12 subsidized artist studios ($150/month vs. $800 market rate)
- 2,000 sq ft public gallery for emerging artists
- Youth art education wing (free after-school programs)
- 150-seat performance and event venue
- Community workshop space with shared equipment

**Community Impact:**
Our neighborhood has lost 5 cultural spaces to gentrification in 3 years. This project will:
- Provide 30+ affordable workspace opportunities
- Host 100+ community events annually
- Serve 400+ youth through free programs
- Generate $200K in local economic activity

**Funding Allocation:**
Building renovation (45%), equipment & furnishing (25%), first year operations (20%), programming launch (10%)

**Sustainability Plan:**
Studio rentals, event hosting, and workshop fees will achieve financial sustainability by year 2.

Art belongs to everyone. Let's build this together.`,
    category: 'Arts & Culture',
    region: 'United States',
    goalUSD: 42000,
    durationDays: 75,
    images: [
      'https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop',
    ],
    type: 'artist',
  },
  {
    name: 'Emergency Flood Relief Fund',
    description: `URGENT: Providing immediate relief and recovery support to 400 families displaced by devastating floods in Bangladesh.

**Current Situation:**
Unprecedented monsoon flooding has destroyed 250 homes, contaminated water supplies, and displaced 1,800 people. Families are sheltering in temporary camps with critical shortages of food, clean water, and medical supplies.

**Immediate Response (First 30 Days):**
- Emergency food packages for 400 families (2-week supply)
- Water purification systems and clean water distribution
- Mobile medical clinic deployment
- Temporary shelter materials and tarps
- Hygiene kits to prevent disease outbreak

**Recovery Phase (Days 30-90):**
- Permanent shelter reconstruction
- Livelihood restoration support
- School supplies for affected children
- Community water infrastructure repair

**Our Partner:**
Working with established local NGO with 20 years of disaster response experience and pre-positioned supply chains.

**Budget Breakdown:**
- Food & water: $10,000 (400 families)
- Medical supplies & clinic: $6,000
- Shelter materials: $8,000
- Water systems: $4,000
- Recovery fund: $7,000

Lives are at stake. Every hour matters. Please donate today.`,
    category: 'Emergency Relief',
    region: 'Bangladesh',
    goalUSD: 35000,
    durationDays: 45,
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop',
    ],
    type: 'activist',
  },
  {
    name: 'Women Entrepreneur Microloan Fund',
    description: `Empowering women entrepreneurs in East Africa through accessible microfinancing, business training, and peer mentorship networks.

**Our Model:**
Provide women with the capital, skills, and community support needed to start and grow sustainable businesses.

**How It Works:**
- Microloans from $250-$1,500
- 0% interest, 18-month flexible repayment
- Mandatory 8-week business training included
- Peer lending circles for accountability and support
- Ongoing mentorship from successful women entrepreneurs

**Proven Results (3-Year Track Record):**
- 280 women entrepreneurs funded
- 96% loan repayment rate
- 94% of businesses still operating after 2 years
- 320% average income increase
- 85% of profits reinvested in family education

**Target Impact:**
Fund 150 new women entrepreneurs across Kenya, Uganda, and Tanzania.

**Success Story:**
"This loan helped me expand from selling vegetables on the roadside to opening my own shop. Now I employ 2 other women and all my children attend school." - Grace M., Nairobi

**Sustainability:**
As loans are repaid, funds are recycled to support more women. Your donation impacts 4-5 women over time.

Invest in women. Transform communities. Break cycles.`,
    category: 'Economic Development',
    region: 'Kenya',
    goalUSD: 32000,
    durationDays: 60,
    images: [
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    ],
    type: 'activist',
  },
  {
    name: 'Decentralized Health Records Platform',
    description: `Building a patient-owned, blockchain-secured health records system that puts individuals in control of their medical data.

**The Problem:**
Medical records are fragmented across providers, insecure, and patients have no control. This causes:
- $750B annually in duplicate testing
- 250,000+ deaths from medical errors due to incomplete records
- Millions affected by healthcare data breaches

**Our Solution:**
A decentralized platform where patients own and control access to their complete medical history, granting permission to providers on-demand.

**Technical Architecture:**
- Zero-knowledge proofs for privacy-preserving verification
- IPFS for encrypted, distributed data storage
- Smart contract-based access control
- Interoperability with existing EHR systems
- HIPAA and GDPR compliant by design

**Development Roadmap:**
- Q1: Security audit and smart contract deployment
- Q2: Mobile app beta with 500 users
- Q3: Integration with 5 healthcare providers
- Q4: Public launch and API release

**Funding Allocation:**
Security audits (30%), development (40%), pilot programs (20%), regulatory compliance (10%)

**Validation:**
- 8 healthcare systems committed to pilot integration
- Letter of intent from major EHR vendor
- $3.5M valuation with path to Series A

Own your health data. Support the future of healthcare.`,
    category: 'Technology',
    region: 'United States',
    goalUSD: 50000,
    durationDays: 90,
    images: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=600&fit=crop',
    ],
    type: 'entrepreneur',
  },
  {
    name: 'Youth Music Production Studio',
    description: `Creating a free, professional-grade recording studio and music education program for talented youth from underserved communities.

**The Vision:**
Give every young person with musical talent access to industry-standard equipment, professional training, and pathways to music careers.

**Studio Specifications:**
- Professional recording booth with acoustic treatment
- SSL console and high-end monitoring system
- Complete Pro Tools and Ableton Live production suite
- Comprehensive plugin and sample library
- Video production capability for music content

**Education Program:**
- Free studio access for youth ages 14-24
- Weekly production workshops and masterclasses
- 1-on-1 mentorship from industry professionals
- Music business and marketing education
- Showcase events with industry representatives

**Why This Matters:**
Professional studio time costs $100-$400/hour. Talented young artists without resources cannot afford to develop professionally. We bridge that gap.

**Program Goals (Year 1):**
- Serve 75 young artists
- Produce 150+ professional-quality tracks
- Host 4 major showcase events
- Place 15 artists with management or labels
- Award 10 music college scholarships

**Our Team:**
Founded by Grammy-winning producers who've mentored 50+ successful artists.

**Budget:**
Equipment (55%), studio construction (30%), first year programming (15%)

Every great artist deserves a chance. Let's give them one.`,
    category: 'Arts & Culture',
    region: 'United States',
    goalUSD: 38000,
    durationDays: 75,
    images: [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=630&fit=crop',
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=600&fit=crop',
    ],
    type: 'artist',
  },
];

// ==================== Helper Functions ====================

/**
 * Parse FundraiserCreated event from transaction logs
 */
function parseFundraiserCreatedEvent(
  logs: readonly Log[],
): {
  fundraiserAddress: string;
  owner: string;
  id: bigint;
  name: string;
  goal: bigint;
  deadline: bigint;
} | null {
  const iface = new Interface(FUNDRAISER_FACTORY_ABI);

  for (const log of logs) {
    try {
      const parsed = iface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (parsed && parsed.name === 'FundraiserCreated') {
        return {
          fundraiserAddress: parsed.args[0] as string,
          owner: parsed.args[1] as string,
          id: parsed.args[2] as bigint,
          name: parsed.args[3] as string,
          goal: parsed.args[4] as bigint,
          deadline: parsed.args[5] as bigint,
        };
      }
    } catch {
      // Log doesn't match, continue
    }
  }

  return null;
}

/**
 * Parse StakingPoolCreated event from transaction logs
 */
function parseStakingPoolCreatedEvent(
  logs: readonly Log[],
): {
  fundraiserId: bigint;
  poolAddress: string;
} | null {
  const iface = new Interface(FUNDRAISER_FACTORY_ABI);

  for (const log of logs) {
    try {
      const parsed = iface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (parsed && parsed.name === 'StakingPoolCreated') {
        return {
          fundraiserId: parsed.args.fundraiserId,
          poolAddress: parsed.args.poolAddress,
        };
      }
    } catch (e) {
      // Skip logs that don't match
    }
  }

  return null;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format USDC amount for display
 */
function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6);
}

/**
 * Parse USD amount to USDC (6 decimals)
 */
function parseUSDC(usdAmount: number): bigint {
  return parseUnits(usdAmount.toString(), 6);
}

// ==================== Database Operations ====================

/**
 * Clean all existing campaigns and related data from database
 */
async function cleanExistingCampaigns(): Promise<void> {
  console.log('\n========================================');
  console.log('   Cleaning Existing Campaigns');
  console.log('========================================\n');

  try {
    // Delete in order of dependencies
    const results = await prisma.$transaction([
      // Delete campaign-related data first
      prisma.vote.deleteMany(),
      prisma.proposal.deleteMany(),
      prisma.milestone.deleteMany(),
      prisma.fundraiserUpdate.deleteMany(),
      prisma.donation.deleteMany(),
      prisma.stake.deleteMany({ where: { fundraiserId: { not: null } } }),
      prisma.wealthBuildingDonation.deleteMany(),
      prisma.globalPoolVote.deleteMany(),
      // Delete fundraisers last
      prisma.fundraiser.deleteMany(),
    ]);

    console.log('  [OK] Deleted related records:');
    console.log(`       - Votes: ${results[0].count}`);
    console.log(`       - Proposals: ${results[1].count}`);
    console.log(`       - Milestones: ${results[2].count}`);
    console.log(`       - Updates: ${results[3].count}`);
    console.log(`       - Donations: ${results[4].count}`);
    console.log(`       - Stakes: ${results[5].count}`);
    console.log(`       - WealthBuildingDonations: ${results[6].count}`);
    console.log(`       - GlobalPoolVotes: ${results[7].count}`);
    console.log(`       - Fundraisers: ${results[8].count}`);

    console.log('\n  [SUCCESS] Database cleaned successfully\n');
  } catch (error) {
    console.error('  [ERROR] Failed to clean database:', error);
    throw error;
  }
}

/**
 * Generate milestone data for a campaign
 */
function generateMilestones(
  goalWei: bigint,
): Array<{
  title: string;
  description: string;
  targetAmount: bigint;
}> {
  const percentages = [0.25, 0.5, 0.75, 1.0];
  const titles = [
    'First Quarter Reached!',
    'Halfway There!',
    'Almost There!',
    'Goal Achieved!',
  ];
  const descriptions = [
    '25% of our funding goal has been reached',
    'We have reached 50% of our target',
    '75% funded - the finish line is in sight',
    'Goal achieved - thank you to all supporters',
  ];

  return percentages.map((pct, i) => ({
    title: titles[i],
    description: descriptions[i],
    targetAmount: BigInt(Math.floor(Number(goalWei) * pct)),
  }));
}

// ==================== Blockchain Operations ====================

/**
 * Initialize blockchain provider and wallet
 */
async function initializeBlockchain(): Promise<{
  provider: JsonRpcProvider;
  signer: Wallet;
  factory: Contract;
}> {
  console.log('\n========================================');
  console.log('   Initializing Blockchain Connection');
  console.log('========================================\n');

  // Check for private key
  const privateKey = process.env.BACKEND_WALLET_PK;
  if (!privateKey) {
    throw new Error(
      'BACKEND_WALLET_PK environment variable is required.\n' +
        'Please set it in your .env file with a funded wallet private key.',
    );
  }

  // Create static network to avoid detection issues
  const network = Network.from({
    chainId: BASE_SEPOLIA_CHAIN_ID,
    name: 'base-sepolia',
  });

  // Create provider with Alchemy if available, fallback to public RPC
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  const rpcUrl = alchemyKey
    ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
    : BASE_SEPOLIA_RPC;

  console.log(`  RPC URL: ${alchemyKey ? 'Alchemy (configured)' : 'Public RPC'}`);

  const provider = new JsonRpcProvider(rpcUrl, network, {
    staticNetwork: network,
    batchMaxCount: 1,
  });

  // Test connection
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`  [OK] Connected to Base Sepolia at block ${blockNumber}`);
  } catch (error) {
    throw new Error(
      `Failed to connect to Base Sepolia RPC.\n` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
        `Consider setting ALCHEMY_API_KEY in your .env for more reliable connections.`,
    );
  }

  // Create signer
  const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const signer = new Wallet(normalizedKey, provider);

  console.log(`  [OK] Wallet initialized: ${signer.address}`);

  // Check wallet balance
  const balance = await provider.getBalance(signer.address);
  const balanceEth = formatUnits(balance, 18);
  console.log(`  [OK] Wallet balance: ${parseFloat(balanceEth).toFixed(6)} ETH`);

  if (balance === 0n) {
    throw new Error(
      `Wallet has no ETH for gas. Please fund ${signer.address} on Base Sepolia.\n` +
        `Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia`,
    );
  }

  // Create factory contract
  const factory = new Contract(FUNDRAISER_FACTORY_ADDRESS, FUNDRAISER_FACTORY_ABI, signer);

  // Verify factory is deployed
  const code = await provider.getCode(FUNDRAISER_FACTORY_ADDRESS);
  if (code === '0x') {
    throw new Error(
      `FundraiserFactory not deployed at ${FUNDRAISER_FACTORY_ADDRESS} on Base Sepolia.`,
    );
  }

  console.log(`  [OK] FundraiserFactory verified at ${FUNDRAISER_FACTORY_ADDRESS}`);

  // Get current fundraiser count
  try {
    const count = await factory.fundraisersCount();
    console.log(`  [OK] Current fundraiser count on-chain: ${count}`);
  } catch (error) {
    console.log('  [WARN] Could not get fundraiser count (contract may not have this function)');
  }

  return { provider, signer, factory };
}

/**
 * Create a single fundraiser on-chain
 */
async function createFundraiserOnChain(
  factory: Contract,
  template: CampaignTemplate,
  beneficiaryAddress: string,
  index: number,
): Promise<{
  txHash: string;
  onChainId: number;
  fundraiserAddress: string;
  stakingPoolAddr: string;
  deadline: Date;
  gasUsed: bigint;
}> {
  console.log(`\n  [${index + 1}/10] Creating: "${template.name}"`);

  const goalWei = parseUSDC(template.goalUSD);

  console.log(`         Goal: $${template.goalUSD.toLocaleString()} USDC`);
  console.log(`         Duration: ${template.durationDays} days`);
  console.log(`         Beneficiary: ${beneficiaryAddress.slice(0, 10)}...`);

  try {
    // Call createFundraiser
    const tx = await factory.createFundraiser(
      template.name,
      template.images,
      [template.category],
      template.description,
      template.region,
      beneficiaryAddress,
      goalWei,
      template.durationDays,
    );

    console.log(`         TX submitted: ${tx.hash.slice(0, 18)}...`);

    // Wait for confirmation
    const receipt: TransactionReceipt = await tx.wait(2); // Wait for 2 confirmations

    if (!receipt || receipt.status === 0) {
      throw new Error('Transaction failed or reverted');
    }

    console.log(`         TX confirmed in block ${receipt.blockNumber}`);

    // Parse the FundraiserCreated event
    const eventData = parseFundraiserCreatedEvent(receipt.logs);

    if (!eventData) {
      throw new Error('FundraiserCreated event not found in transaction logs');
    }

    // Parse the StakingPoolCreated event
    const stakingPoolData = parseStakingPoolCreatedEvent(receipt.logs);

    if (!stakingPoolData) {
      throw new Error('StakingPoolCreated event not found in transaction logs');
    }

    // Calculate deadline from event
    const deadline = new Date(Number(eventData.deadline) * 1000);

    console.log(`         [OK] On-chain ID: ${eventData.id}`);
    console.log(`         [OK] Fundraiser address: ${eventData.fundraiserAddress.slice(0, 18)}...`);
    console.log(`         [OK] Staking Pool address: ${stakingPoolData.poolAddress.slice(0, 18)}...`);
    console.log(`         [OK] Deadline: ${deadline.toISOString().split('T')[0]}`);
    console.log(`         [OK] Gas used: ${receipt.gasUsed.toString()}`);

    return {
      txHash: tx.hash,
      onChainId: Number(eventData.id),
      fundraiserAddress: eventData.fundraiserAddress,
      stakingPoolAddr: stakingPoolData.poolAddress,
      deadline,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for common errors
    if (errorMessage.includes('insufficient funds')) {
      throw new Error('Insufficient ETH for gas. Please fund the wallet.');
    }
    if (errorMessage.includes('nonce')) {
      throw new Error('Nonce error. Try again or reset the wallet nonce.');
    }
    if (errorMessage.includes('revert')) {
      throw new Error(`Contract reverted: ${errorMessage}`);
    }

    throw new Error(`Failed to create fundraiser on-chain: ${errorMessage}`);
  }
}

// ==================== Main Seeding Function ====================

export interface SeededOnChainCampaign {
  id: string;
  name: string;
  onChainId: number;
  txHash: string;
  fundraiserAddress: string;
  creatorId: string;
}

/**
 * Main function to seed campaigns on-chain and in database
 */
export async function seedOnChainCampaigns(
  users?: SeededUser[],
): Promise<SeededOnChainCampaign[]> {
  console.log('\n========================================');
  console.log('   FundBrave On-Chain Campaign Seeder');
  console.log('========================================');
  console.log(`   Target: ${CAMPAIGN_TEMPLATES.length} campaigns`);
  console.log(`   Chain: Base Sepolia (${BASE_SEPOLIA_CHAIN_ID})`);
  console.log(`   Factory: ${FUNDRAISER_FACTORY_ADDRESS}`);
  console.log('========================================\n');

  const startTime = Date.now();
  const seededCampaigns: SeededOnChainCampaign[] = [];
  let totalGasUsed = 0n;

  try {
    // Step 1: Initialize blockchain connection
    const { provider, signer, factory } = await initializeBlockchain();

    // Step 2: Clean existing campaigns
    await cleanExistingCampaigns();

    // Step 3: Get or load users for campaign creators
    let campaignCreators: Array<{ id: string; walletAddress: string; type?: string }>;

    if (users && users.length > 0) {
      campaignCreators = users;
      console.log(`  [OK] Using ${users.length} provided users as campaign creators`);
    } else {
      // Load users from database
      const dbUsers = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'asc' },
        select: { id: true, walletAddress: true },
      });

      if (dbUsers.length === 0) {
        throw new Error(
          'No users found in database. Please run the main seed first (npm run seed) or provide users.',
        );
      }

      campaignCreators = dbUsers;
      console.log(`  [OK] Loaded ${dbUsers.length} users from database as campaign creators`);
    }

    // Step 4: Create campaigns on-chain and in database
    console.log('\n========================================');
    console.log('   Creating Campaigns On-Chain');
    console.log('========================================');

    for (let i = 0; i < CAMPAIGN_TEMPLATES.length; i++) {
      const template = CAMPAIGN_TEMPLATES[i];

      // Select creator (round-robin)
      const creator = campaignCreators[i % campaignCreators.length];

      // Use creator's wallet as beneficiary
      const beneficiaryAddress = creator.walletAddress;

      try {
        // Create on-chain
        const onChainResult = await createFundraiserOnChain(
          factory,
          template,
          beneficiaryAddress,
          i,
        );

        totalGasUsed += onChainResult.gasUsed;

        // Create in database
        const goalWei = parseUSDC(template.goalUSD);

        const campaign = await prisma.fundraiser.create({
          data: {
            onChainId: onChainResult.onChainId,
            txHash: onChainResult.txHash,
            name: template.name,
            description: template.description,
            images: template.images,
            categories: [template.category],
            region: template.region,
            goalAmount: template.goalUSD.toString(),
            raisedAmount: 0n,
            currency: 'USDC',
            beneficiary: beneficiaryAddress,
            stakingPoolAddr: onChainResult.stakingPoolAddr,
            creatorId: creator.id,
            deadline: onChainResult.deadline,
            isActive: true,
            isFeatured: i < 3, // Feature first 3 campaigns
            goalReached: false,
            donorsCount: 0,
            stakersCount: 0,
            updatesCount: 0,
            milestones: {
              create: generateMilestones(goalWei),
            },
          },
        });

        seededCampaigns.push({
          id: campaign.id,
          name: campaign.name,
          onChainId: campaign.onChainId,
          txHash: campaign.txHash,
          fundraiserAddress: onChainResult.fundraiserAddress,
          creatorId: campaign.creatorId,
        });

        console.log(`         [OK] Database record created: ${campaign.id.slice(0, 8)}...`);

        // Add small delay between transactions to avoid rate limiting
        if (i < CAMPAIGN_TEMPLATES.length - 1) {
          console.log('         Waiting 2s before next transaction...');
          await sleep(2000);
        }
      } catch (error) {
        console.error(
          `         [ERROR] Failed to create "${template.name}":`,
          error instanceof Error ? error.message : 'Unknown error',
        );
        // Continue with next campaign
      }
    }

    // Step 5: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const gasEth = formatUnits(totalGasUsed, 18);

    console.log('\n========================================');
    console.log('   Seeding Complete');
    console.log('========================================');
    console.log(`   Campaigns created: ${seededCampaigns.length}/${CAMPAIGN_TEMPLATES.length}`);
    console.log(`   Total gas used: ${totalGasUsed.toString()} (~${parseFloat(gasEth).toFixed(6)} ETH)`);
    console.log(`   Duration: ${duration}s`);
    console.log('========================================\n');

    // Verify final count
    const dbCount = await prisma.fundraiser.count();
    console.log(`  [VERIFY] Database fundraiser count: ${dbCount}`);

    return seededCampaigns;
  } catch (error) {
    console.error('\n[FATAL ERROR]:', error);
    throw error;
  }
}

// ==================== Standalone Execution ====================

async function main(): Promise<void> {
  console.log('\n');
  console.log('################################################################');
  console.log('#                                                              #');
  console.log('#       FundBrave On-Chain Campaign Seeding Script             #');
  console.log('#                                                              #');
  console.log('#  This script will:                                           #');
  console.log('#  1. Clean all existing campaigns from the database           #');
  console.log('#  2. Create 10 campaigns on the blockchain                    #');
  console.log('#  3. Store campaign data in the database                      #');
  console.log('#                                                              #');
  console.log('#  Requirements:                                               #');
  console.log('#  - BACKEND_WALLET_PK must be set with funded wallet          #');
  console.log('#  - Users must exist in database (run npm run seed first)     #');
  console.log('#                                                              #');
  console.log('################################################################\n');

  try {
    await seedOnChainCampaigns();

    console.log('\n[SUCCESS] On-chain campaign seeding completed!\n');
    console.log('Next steps:');
    console.log('  - Start the backend server: npm run start:dev');
    console.log('  - View campaigns in the frontend');
    console.log('  - Campaigns are now on-chain and can receive donations');
    console.log('');
  } catch (error) {
    console.error('\n[FAILED] Campaign seeding failed:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
