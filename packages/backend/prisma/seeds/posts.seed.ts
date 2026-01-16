import { PrismaClient, PostType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { SeededUser } from './users.seed';
import { SeededCampaign } from './campaigns.seed';

const prisma = new PrismaClient();

export interface SeededPost {
  id: string;
  authorId: string;
  type: PostType;
  content: string | null;
}

/**
 * Post content templates
 */
const postTemplates = {
  campaignAnnouncement: [
    `🚀 Excited to announce my new campaign: {campaignName}!

{shortDescription}

Every donation makes a difference. Link in bio!

#Fundraising #SocialImpact #Community`,

    `Big news! Just launched {campaignName} 🎉

Together we can make this happen. Check it out and share if you believe in the mission!

#Web3ForGood #Fundraising #DeFi`,

    `Starting something important: {campaignName}

Your support means everything. Let's build something amazing together! 💪

#CommunityDriven #Impact #Blockchain`,
  ],

  personalUpdate: [
    `Just finished an incredible meeting with some amazing people working on {topic}. The future is bright! ✨`,

    `Been reflecting on why we do this work. It's not about the money—it's about the lives we change. Keep pushing forward! 💯`,

    `Grateful for this community. You all inspire me to be better every single day. 🙏`,

    `The journey isn't always easy, but it's always worth it. Remember why you started. 🌟`,

    `Today I learned that {insight}. Growth never stops!`,

    `Watching our community come together for {cause} reminds me why decentralization matters. Power to the people! ⚡`,

    `Sometimes you need to zoom out to see how far you've come. Proud of what we're building together! 🚀`,
  ],

  question: [
    `What's the most impactful project you've supported recently? Looking for inspiration! 🤔`,

    `Question for the community: How do you balance {topic1} with {topic2}? Would love your thoughts!`,

    `Curious—what made you first interested in Web3 for social good? Share your story! 👇`,

    `If you could solve one global problem with unlimited resources, what would it be and why?`,

    `What's one cause you're passionate about that doesn't get enough attention?`,
  ],

  mediaPost: [
    `Check out these photos from {location}. This is why we do what we do. 📸`,

    `A picture is worth a thousand words. Here's the impact your donations are making. 🙌`,

    `Behind the scenes of {activity}. The hard work you don't always see! 💪`,

    `Before and after. This is the power of community coming together. ✨`,
  ],

  thought: [
    `Hot take: {opinion}. What do you think? 🔥`,

    `Been thinking about how {topic} is changing {industry}. We're witnessing history unfold.`,

    `The intersection of {tech} and {cause} is where magic happens. Let's keep building! ⚡`,

    `Decentralization isn't just about technology—it's about giving power back to communities. That's the real revolution. 💫`,

    `We're not just building products, we're building movements. Never forget that! 🌊`,

    `The best time to support a cause was yesterday. The second best time is now. Don't wait! ⏰`,
  ],
};

const hashtags = [
  '#SocialImpact',
  '#DeFi',
  '#Fundraising',
  '#Web3',
  '#Community',
  '#Blockchain',
  '#CryptoForGood',
  '#Decentralization',
  '#Innovation',
  '#Sustainability',
  '#Education',
  '#Healthcare',
  '#ClimateAction',
  '#SocialGood',
  '#ImpactInvesting',
];

const topics = [
  'blockchain adoption',
  'sustainable development',
  'community building',
  'social entrepreneurship',
  'impact investing',
  'climate tech',
  'education access',
  'healthcare innovation',
  'financial inclusion',
  'decentralized governance',
];

/**
 * Generate hashtags for a post
 */
function generateHashtags(count: number = 3): string[] {
  return faker.helpers.arrayElements(hashtags, count);
}

/**
 * Extract hashtag content from post text
 */
async function extractAndCreateHashtags(postContent: string): Promise<string[]> {
  const hashtagMatches = postContent.match(/#\w+/g) || [];
  const hashtagIds: string[] = [];

  for (const tag of hashtagMatches) {
    const tagName = tag.slice(1).toLowerCase();

    try {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag: tagName },
        create: {
          tag: tagName,
          usageCount: 1,
          lastUsedAt: new Date(),
        },
        update: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      hashtagIds.push(hashtag.id);
    } catch (error) {
      console.error(`Failed to create hashtag ${tagName}:`, error);
    }
  }

  return hashtagIds;
}

/**
 * Generate mentions (@username) in post
 */
function generateMentions(users: SeededUser[], count: number = 2): string[] {
  return faker.helpers.arrayElements(users, count).map((u) => u.username);
}

/**
 * Create a campaign announcement post
 */
function createCampaignPost(
  user: SeededUser,
  campaign: SeededCampaign,
): string {
  const template = faker.helpers.arrayElement(postTemplates.campaignAnnouncement);
  const shortDesc = `We're raising funds to make a real difference. Join us!`;

  return template
    .replace('{campaignName}', campaign.name)
    .replace('{shortDescription}', shortDesc);
}

/**
 * Create a personal update post
 */
function createPersonalPost(users: SeededUser[]): string {
  const template = faker.helpers.arrayElement(postTemplates.personalUpdate);
  const topic = faker.helpers.arrayElement(topics);
  const insight = faker.helpers.arrayElement([
    'persistence beats talent every time',
    'community is everything in this space',
    'small actions compound into big impact',
    'transparency builds trust',
  ]);
  const cause = faker.helpers.arrayElement([
    'education',
    'climate action',
    'healthcare access',
    'community empowerment',
  ]);

  return template
    .replace('{topic}', topic)
    .replace('{insight}', insight)
    .replace('{cause}', cause);
}

/**
 * Create a question post
 */
function createQuestionPost(): string {
  const template = faker.helpers.arrayElement(postTemplates.question);
  const topic1 = faker.helpers.arrayElement(['growth', 'impact', 'sustainability', 'innovation']);
  const topic2 = faker.helpers.arrayElement(['profitability', 'transparency', 'speed', 'scale']);

  return template
    .replace('{topic1}', topic1)
    .replace('{topic2}', topic2);
}

/**
 * Create a media post
 */
function createMediaPost(): string {
  const template = faker.helpers.arrayElement(postTemplates.mediaPost);
  const location = faker.location.city();
  const activity = faker.helpers.arrayElement([
    'our latest project',
    'team collaboration',
    'community workshop',
    'field visit',
  ]);

  return template
    .replace('{location}', location)
    .replace('{activity}', activity);
}

/**
 * Create a thought/opinion post
 */
function createThoughtPost(): string {
  const template = faker.helpers.arrayElement(postTemplates.thought);
  const opinion = faker.helpers.arrayElement([
    'Traditional fundraising is broken. Web3 fixes this',
    'The future belongs to communities, not corporations',
    'Impact should be measurable and transparent',
    'Every donation should come with governance rights',
  ]);
  const tech = faker.helpers.arrayElement(['DeFi', 'blockchain', 'Web3', 'smart contracts']);
  const cause = faker.helpers.arrayElement(['social good', 'climate action', 'education', 'healthcare']);
  const industry = faker.helpers.arrayElement(['philanthropy', 'fundraising', 'social impact', 'development']);

  return template
    .replace('{opinion}', opinion)
    .replace('{tech}', tech)
    .replace('{cause}', cause)
    .replace('{industry}', industry)
    .replace('{topic}', faker.helpers.arrayElement(topics));
}

/**
 * Seed posts
 */
export async function seedPosts(
  users: SeededUser[],
  campaigns: SeededCampaign[],
): Promise<SeededPost[]> {
  console.log('🌱 Seeding posts...');

  const seededPosts: SeededPost[] = [];
  const totalPosts = faker.number.int({ min: 50, max: 100 });

  // Distribution of post types
  const typeDistribution = {
    campaignAnnouncement: 0.25,
    personal: 0.30,
    question: 0.10,
    media: 0.15,
    thought: 0.20,
  };

  for (let i = 0; i < totalPosts; i++) {
    const author = faker.helpers.arrayElement(users);
    const rand = Math.random();

    let postType: PostType = PostType.TEXT;
    let content: string;
    let mediaUrls: string[] = [];
    let fundraiserId: string | undefined;

    // Determine post type and content
    if (rand < typeDistribution.campaignAnnouncement) {
      // Campaign announcement - only if author has a campaign
      const authorCampaign = campaigns.find((c) => c.creatorId === author.id);
      if (authorCampaign) {
        postType = PostType.FUNDRAISER_NEW;
        content = createCampaignPost(author, authorCampaign);
        fundraiserId = authorCampaign.id;
      } else {
        // Fallback to personal post
        postType = PostType.TEXT;
        content = createPersonalPost(users);
      }
    } else if (rand < typeDistribution.campaignAnnouncement + typeDistribution.personal) {
      postType = PostType.TEXT;
      content = createPersonalPost(users);
    } else if (rand < typeDistribution.campaignAnnouncement + typeDistribution.personal + typeDistribution.question) {
      postType = PostType.TEXT;
      content = createQuestionPost();
    } else if (rand < typeDistribution.campaignAnnouncement + typeDistribution.personal + typeDistribution.question + typeDistribution.media) {
      postType = PostType.MEDIA;
      content = createMediaPost();
      mediaUrls = [
        `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/800/600`,
        ...(Math.random() < 0.3 ? [`https://picsum.photos/seed/${faker.string.alphanumeric(10)}/800/600`] : []),
      ];
    } else {
      postType = PostType.TEXT;
      content = createThoughtPost();
    }

    // Add mentions (20% chance)
    let mentions: string[] = [];
    if (Math.random() < 0.2) {
      mentions = generateMentions(users.filter((u) => u.id !== author.id), 1);
      content += `\n\ncc: ${mentions.map((m) => '@' + m).join(' ')}`;
    }

    // Generate engagement metrics
    const baseEngagement = faker.number.int({ min: 10, max: 200 });
    const likesCount = Math.floor(baseEngagement * faker.number.float({ min: 0.5, max: 1.5 }));
    const repostsCount = Math.floor(likesCount * faker.number.float({ min: 0.1, max: 0.3 }));
    const bookmarksCount = Math.floor(likesCount * faker.number.float({ min: 0.05, max: 0.15 }));
    const viewsCount = Math.floor(likesCount * faker.number.float({ min: 5, max: 15 }));

    try {
      const post = await prisma.post.create({
        data: {
          content,
          type: postType,
          authorId: author.id,
          mediaUrls,
          mentions,
          fundraiserId,
          likesCount,
          repostsCount,
          bookmarksCount,
          viewsCount,
          engagementScore: likesCount + repostsCount * 2 + bookmarksCount * 1.5,
          createdAt: faker.date.recent({ days: 30 }),
        },
      });

      // Create Media records if post has media
      if (mediaUrls.length > 0) {
        for (const url of mediaUrls) {
          await prisma.media.create({
            data: {
              postId: post.id,
              url,
              type: 'IMAGE',
              status: 'COMPLETED',
              mimeType: 'image/jpeg',
              thumbnail: url,
            },
          });
        }
      }

      // Extract and create hashtags, then link to post
      const hashtagIds = await extractAndCreateHashtags(content);
      for (const hashtagId of hashtagIds) {
        await prisma.postHashtag.create({
          data: {
            postId: post.id,
            hashtagId,
          },
        });
      }

      seededPosts.push({
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        content: post.content,
      });

      if (i % 10 === 0) {
        console.log(`  ✓ Created ${i + 1}/${totalPosts} posts...`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create post by ${author.username}:`, error);
    }
  }

  console.log(`✅ Created ${seededPosts.length} posts\n`);
  return seededPosts;
}

/**
 * Create some reposts (posts that reference other posts)
 */
export async function seedReposts(users: SeededUser[], existingPosts: SeededPost[]): Promise<void> {
  console.log('🌱 Seeding repost content...');

  const repostCount = faker.number.int({ min: 10, max: 20 });
  let created = 0;

  for (let i = 0; i < repostCount; i++) {
    const author = faker.helpers.arrayElement(users);
    const originalPost = faker.helpers.arrayElement(existingPosts.filter((p) => p.authorId !== author.id));

    // Create quote repost (30% chance) or simple repost (70% chance)
    const quoteComment = Math.random() < 0.3
      ? faker.helpers.arrayElement([
          '💯 This!',
          'Couldn\'t agree more!',
          'Everyone needs to see this 👏',
          'This is exactly what we need right now',
          'Amplifying this important message 🔊',
        ])
      : null;

    try {
      await prisma.post.create({
        data: {
          content: quoteComment,
          type: PostType.TEXT,
          authorId: author.id,
          parentId: originalPost.id, // Reference to original post
          createdAt: faker.date.recent({ days: 25 }),
        },
      });

      // Update original post repost count
      await prisma.post.update({
        where: { id: originalPost.id },
        data: { repostsCount: { increment: 1 } },
      });

      created++;
    } catch (error) {
      console.error(`  ✗ Failed to create repost:`, error);
    }
  }

  console.log(`✅ Created ${created} reposts\n`);
}
