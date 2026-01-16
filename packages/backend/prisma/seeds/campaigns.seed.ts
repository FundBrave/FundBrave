import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { SeededUser } from './users.seed';

const prisma = new PrismaClient();

export interface SeededCampaign {
  id: string;
  name: string;
  onChainId: number;
  creatorId: string;
  status: 'active' | 'successful' | 'new' | 'urgent';
}

/**
 * Campaign templates with realistic data
 */
const campaignTemplates = [
  {
    name: 'Clean Water for Rural Communities',
    category: 'Healthcare',
    description: `Our mission is to bring clean, accessible water to rural communities that have been underserved for decades.

💧 **The Problem:**
Over 500 families in our region lack access to safe drinking water, leading to preventable diseases and lost economic opportunities.

🎯 **Our Solution:**
- Install 10 community water wells with filtration systems
- Train local maintenance teams
- Establish sustainable water management practices

📊 **Impact:**
- 500+ families will have clean water access
- 80% reduction in waterborne diseases
- 2,000+ people impacted

Every donation brings us closer to ensuring no child has to walk miles for clean water.`,
    goalAmount: '25000',
    type: 'activist',
  },
  {
    name: 'Tech Education for Underprivileged Youth',
    category: 'Education',
    description: `Empowering the next generation with technology skills and mentorship.

🚀 **Vision:**
Every young person, regardless of background, should have access to quality tech education and career opportunities.

📚 **What We're Building:**
- 6-month coding bootcamp for 50 students
- Laptops and internet access for all participants
- Industry mentors from leading tech companies
- Job placement support

🎓 **Curriculum:**
Web development, mobile apps, data science, and soft skills training.

💼 **Success Metrics:**
- 80% course completion rate
- 60% job placement within 3 months
- Average starting salary increase of 300%

Join us in breaking the cycle of poverty through education.`,
    goalAmount: '45000',
    type: 'activist',
  },
  {
    name: 'Sustainable Agriculture Startup',
    category: 'Tech',
    description: `Revolutionizing farming with AI-powered precision agriculture.

🌱 **The Innovation:**
Our IoT sensors and AI platform help small farmers increase yields by 40% while reducing water usage by 30%.

💡 **Technology Stack:**
- Soil moisture sensors with real-time monitoring
- Weather prediction AI models
- Mobile app for farm management
- Blockchain-based supply chain tracking

📈 **Market Opportunity:**
$12B precision agriculture market growing at 15% annually. We're targeting 10,000 small farms in our first year.

💰 **Use of Funds:**
- Product development: 40%
- Field trials: 25%
- Sales & marketing: 20%
- Operations: 15%

🏆 **Traction:**
- 200 pilot farms with proven results
- $120K in pre-orders
- Partnership with leading agri-tech distributor

Help us scale technology that feeds the world sustainably.`,
    goalAmount: '50000',
    type: 'entrepreneur',
  },
  {
    name: 'Mental Health Support Platform',
    category: 'Healthcare',
    description: `Making mental health support accessible and affordable for everyone.

🧠 **The Crisis:**
1 in 4 people experience mental health issues, but 60% never seek help due to cost, stigma, or access barriers.

💚 **Our Platform:**
- AI-powered chatbot for 24/7 crisis support
- Affordable teletherapy sessions ($25 vs $150 average)
- Anonymous community support groups
- Evidence-based self-help resources

🔒 **Privacy First:**
End-to-end encrypted, HIPAA compliant, completely anonymous option available.

📊 **Impact to Date:**
- 5,000+ users helped
- 4.8/5 average satisfaction rating
- 85% report improved mental well-being

💰 **Funding Goals:**
Expand to 10 languages, add video therapy, and subsidize 1,000 free sessions for those in need.

You're not alone. Together we can break the stigma.`,
    goalAmount: '35000',
    type: 'entrepreneur',
  },
  {
    name: 'Documentary: Voices of Climate Change',
    category: 'Arts',
    description: `A feature-length documentary giving voice to frontline communities impacted by climate change.

🎬 **The Film:**
Through intimate portraits of 8 families across 4 continents, we explore how climate change is reshaping lives, cultures, and futures.

🌍 **Why This Matters:**
Climate stories are often told by outsiders. We're putting the microphone in the hands of those living it.

📹 **Production Plan:**
- 6 months of filming across Papua New Guinea, Bangladesh, California, and Kenya
- Professional crew with award-winning cinematographer
- Original score by Grammy-nominated composer
- Film festival circuit + streaming release

🎯 **Distribution Strategy:**
- Sundance submission
- Educational screening program in 500 schools
- Free streaming in affected regions

💰 **Budget Breakdown:**
Travel & logistics (40%), crew & equipment (30%), post-production (20%), distribution (10%).

Help us amplify voices that need to be heard.`,
    goalAmount: '42000',
    type: 'artist',
  },
  {
    name: 'Community Art Space & Gallery',
    category: 'Arts',
    description: `Creating a hub for local artists and cultural expression in an underserved neighborhood.

🎨 **The Vision:**
Transform a vacant warehouse into a vibrant 5,000 sq ft community art center with studios, gallery space, and educational programs.

🏗️ **What We're Building:**
- 6 subsidized artist studios
- Public gallery space for emerging artists
- Youth art education program (free classes)
- Performance venue for 100 people
- Community workshop area

👥 **Community Impact:**
Our neighborhood has lost 3 art venues in 2 years due to gentrification. We're creating an affordable, accessible space that will:
- Provide 20 permanent artist studio spaces
- Host 50+ community events annually
- Serve 200+ youth through free programs

💵 **Funding Allocation:**
Renovation (50%), equipment (20%), first year operations (20%), programming (10%).

🎯 **Sustainability:**
Gallery sales, studio rents, and event hosting will make us self-sufficient after year 1.

Art belongs to everyone. Let's build it together.`,
    goalAmount: '38000',
    type: 'artist',
  },
  {
    name: 'Emergency Relief: Flood Victims',
    category: 'Environment',
    description: `⚠️ URGENT: Providing immediate relief to 200 families displaced by devastating floods.

🌊 **The Situation:**
Recent floods destroyed 150 homes, displaced 200 families, and contaminated the local water supply. People are living in temporary shelters with limited food, water, and medical supplies.

🆘 **Immediate Needs:**
- Emergency food & water (2 weeks supply)
- Medical supplies & mobile clinic
- Temporary shelter materials
- Water purification systems

📅 **Timeline:**
We need to act NOW. Every day without clean water increases disease risk.

💪 **Our Team:**
Partnering with local NGO with 15 years disaster response experience and established supply chains.

📊 **Budget:**
- Food & water: $8,000 (200 families x 2 weeks)
- Medical supplies: $5,000
- Shelter materials: $7,000
- Water purification: $5,000

🔄 **Long-term:**
After immediate relief, funds will support rebuilding efforts and flood prevention infrastructure.

Lives are at stake. Please donate today.`,
    goalAmount: '25000',
    type: 'activist',
    isUrgent: true,
  },
  {
    name: 'Women Entrepreneurs Micro-Loan Fund',
    category: 'Education',
    description: `Empowering women entrepreneurs in developing regions through micro-financing and mentorship.

👩‍💼 **The Mission:**
Break the cycle of poverty by providing women with capital, training, and support to start sustainable businesses.

💵 **How It Works:**
- Micro-loans from $500-$2,000
- 0% interest, 18-month repayment
- Business training & mentorship included
- 100% repayment rate in our pilot program

📈 **Track Record:**
- 150 women supported in pilot phase
- 95% businesses still operating after 2 years
- Average income increase of 250%
- 80% of profits reinvested in family education

🎯 **Goal:**
Fund 100 new women entrepreneurs across 5 countries.

🌟 **Impact Stories:**
"This loan helped me start a tailoring business. Now I employ 3 other women and my children attend school full-time." - Amara, Kenya

🔄 **Sustainability:**
As loans are repaid, funds are recycled to help more women. Your donation helps 3-4 women over time.

Invest in women. Transform communities.`,
    goalAmount: '30000',
    type: 'activist',
  },
  {
    name: 'Blockchain Healthcare Records System',
    category: 'Tech',
    description: `Building a secure, patient-owned healthcare records platform using blockchain technology.

🏥 **The Problem:**
Medical records are fragmented, insecure, and patients have no control over their own health data. This leads to:
- Duplicate tests costing $750B annually
- Medical errors from incomplete records
- Privacy breaches affecting millions

⛓️ **Our Solution:**
A decentralized platform where patients own and control their medical records, granting access to providers on demand.

🔐 **Technology:**
- Ethereum-based smart contracts
- IPFS for encrypted data storage
- Zero-knowledge proofs for privacy
- HIPAA compliant by design

🚀 **Development Roadmap:**
- Q1: Smart contract audit & deployment
- Q2: Mobile app development
- Q3: Pilot with 2 healthcare providers
- Q4: Public launch

💰 **Funding Breakdown:**
Security audits (30%), development (40%), pilot program (20%), legal compliance (10%).

📊 **Market Validation:**
- 3 healthcare systems committed to pilot
- Partnership with major EHR provider
- $2M valuation with path to Series A

Own your health data. Support the future of healthcare.`,
    goalAmount: '48000',
    type: 'entrepreneur',
  },
  {
    name: 'Music Production Studio for Youth',
    category: 'Arts',
    description: `Building a professional recording studio to empower young musicians from underserved communities.

🎵 **The Vision:**
Give talented youth access to industry-standard recording equipment and mentorship from professional producers.

🎚️ **Studio Specs:**
- Full recording booth with acoustic treatment
- Professional mixing console & monitors
- Digital audio workstation with plugins
- Production library & sound design tools

👨‍🎓 **Program Structure:**
- Free studio time for youth (ages 14-24)
- Weekly production workshops
- Mentorship from industry professionals
- Artist development & music business training
- Showcase events and industry connections

🎯 **Community Need:**
Studio time costs $100-$300/hour. Young artists without resources can't afford to create professional-quality music.

📈 **Success Metrics:**
- 50 youth served in year 1
- 100+ tracks produced
- 10 artists signed to indie labels
- 20 college scholarship recipients

💿 **Track Record:**
Our team has produced 5 Grammy-nominated albums and mentored 30+ successful artists.

💰 **Budget:**
Equipment (60%), renovation (25%), first year operations (15%).

Every great artist needs a chance. Let's give them one.`,
    goalAmount: '32000',
    type: 'artist',
  },
];

/**
 * Generate milestone data for a campaign
 */
function generateMilestones(goalAmount: bigint): any[] {
  const milestones: any[] = [];
  const goal = Number(goalAmount);

  // 25%, 50%, 75%, 100% milestones
  const percentages = [0.25, 0.5, 0.75, 1.0];
  const titles = ['First Quarter Reached!', 'Halfway There!', 'Almost There!', 'Goal Achieved!'];

  for (let i = 0; i < percentages.length; i++) {
    milestones.push({
      title: titles[i],
      description: `Reached ${percentages[i] * 100}% of our funding goal`,
      targetAmount: BigInt(Math.floor(goal * percentages[i] * 1e6)), // Convert to wei (6 decimals)
    });
  }

  return milestones;
}

/**
 * Generate updates for a campaign
 */
function generateUpdates(count: number): any[] {
  const updateTemplates = [
    {
      title: 'Project Launched!',
      content: `We're excited to announce the official launch of our project! Thank you to everyone who has supported us so far. Your contributions are already making a difference.`,
    },
    {
      title: 'Milestone Update',
      content: `Amazing progress! We've reached a major milestone and wanted to share what we've accomplished so far. The community support has been incredible.`,
    },
    {
      title: 'Behind the Scenes',
      content: `Here's a look at what's happening behind the scenes. Our team is working hard to ensure every dollar is used effectively and transparently.`,
    },
    {
      title: 'Impact Story',
      content: `Today we want to share a story that shows the real-world impact of your donations. This is why we do what we do.`,
    },
    {
      title: 'Thank You Supporters!',
      content: `A heartfelt thank you to all our supporters. Your generosity is changing lives and making our vision a reality.`,
    },
  ];

  return faker.helpers
    .arrayElements(updateTemplates, count)
    .map((template, index) => ({
      ...template,
      mediaUrls: Math.random() < 0.5 ? [`https://picsum.photos/seed/${faker.string.alphanumeric(10)}/800/600`] : [],
      createdAt: faker.date.recent({ days: 30 - index * 5 }),
    }));
}

/**
 * Seed fundraising campaigns
 */
export async function seedCampaigns(users: SeededUser[]): Promise<SeededCampaign[]> {
  console.log('🌱 Seeding campaigns...');

  const seededCampaigns: SeededCampaign[] = [];

  // Filter users by type
  const activists = users.filter((u) => u.type === 'activist');
  const entrepreneurs = users.filter((u) => u.type === 'entrepreneur');
  const artists = users.filter((u) => u.type === 'artist');

  const statusDistribution = [
    { status: 'active' as const, count: 3 },
    { status: 'successful' as const, count: 4 },
    { status: 'new' as const, count: 2 },
    { status: 'urgent' as const, count: 1 },
  ];

  let onChainId = 1;
  let campaignIndex = 0;

  for (const { status, count } of statusDistribution) {
    for (let i = 0; i < count; i++) {
      const template = campaignTemplates[campaignIndex++];
      if (!template) break;

      // Select creator based on template type
      let creator: SeededUser;
      if (template.type === 'activist') {
        creator = faker.helpers.arrayElement(activists);
      } else if (template.type === 'entrepreneur') {
        creator = faker.helpers.arrayElement(entrepreneurs);
      } else {
        creator = faker.helpers.arrayElement(artists);
      }

      const goalUSD = parseFloat(template.goalAmount);
      const goalWei = BigInt(Math.floor(goalUSD * 1e6)); // USDC has 6 decimals

      // Calculate raised amount based on status
      let raisedWei: bigint;
      let goalReached: boolean;
      let isActive: boolean;

      switch (status) {
        case 'successful':
          raisedWei = goalWei + BigInt(Math.floor(goalUSD * 0.1 * 1e6)); // 110% of goal
          goalReached = true;
          isActive = false;
          break;
        case 'active':
          raisedWei = BigInt(Math.floor(goalUSD * faker.number.float({ min: 0.3, max: 0.85 }) * 1e6));
          goalReached = false;
          isActive = true;
          break;
        case 'new':
          raisedWei = BigInt(Math.floor(goalUSD * faker.number.float({ min: 0.05, max: 0.2 }) * 1e6));
          goalReached = false;
          isActive = true;
          break;
        case 'urgent':
          raisedWei = BigInt(Math.floor(goalUSD * faker.number.float({ min: 0.4, max: 0.7 }) * 1e6));
          goalReached = false;
          isActive = true;
          break;
      }

      // Determine deadline
      let deadline: Date;
      if (status === 'successful') {
        deadline = faker.date.past({ years: 0.1 }); // Past deadline
      } else if (status === 'urgent') {
        deadline = faker.date.soon({ days: 7 }); // Within 7 days
      } else if (status === 'new') {
        deadline = faker.date.future({ years: 0.2 }); // 2-3 months away
      } else {
        deadline = faker.date.future({ years: 0.15 }); // 1-2 months away
      }

      const txHash = `0x${faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' })}`;

      try {
        const campaign = await prisma.fundraiser.create({
          data: {
            onChainId: onChainId++,
            txHash,
            name: template.name,
            description: template.description,
            images: [
              `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/1200/630`,
              `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/800/600`,
            ],
            categories: [template.category],
            region: faker.location.country(),
            goalAmount: template.goalAmount,
            raisedAmount: raisedWei,
            currency: 'USDC',
            beneficiary: creator.walletAddress,
            creatorId: creator.id,
            deadline,
            isActive,
            goalReached,
            isFeatured: Math.random() < 0.3,
            donorsCount: Math.floor(Number(raisedWei) / 1e6 / 50), // Avg $50 per donor
            updatesCount: status === 'new' ? 1 : faker.number.int({ min: 2, max: 5 }),
            createdAt: faker.date.past({ years: 0.3 }),
            milestones: {
              create: generateMilestones(goalWei).map((m) => ({
                ...m,
                isReached: m.targetAmount <= raisedWei,
                reachedAt: m.targetAmount <= raisedWei ? faker.date.past({ years: 0.1 }) : null,
              })),
            },
            updates: {
              create: generateUpdates(status === 'new' ? 1 : faker.number.int({ min: 2, max: 5 })),
            },
          },
        });

        seededCampaigns.push({
          id: campaign.id,
          name: campaign.name,
          onChainId: campaign.onChainId,
          creatorId: campaign.creatorId,
          status,
        });

        console.log(`  ✓ Created ${status} campaign: "${campaign.name}" by ${creator.username}`);
      } catch (error) {
        console.error(`  ✗ Failed to create campaign "${template.name}":`, error);
      }
    }
  }

  console.log(`✅ Created ${seededCampaigns.length} campaigns\n`);
  return seededCampaigns;
}
