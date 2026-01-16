import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { SeededUser } from './users.seed';
import { SeededPost } from './posts.seed';

const prisma = new PrismaClient();

/**
 * Comment templates
 */
const commentTemplates = [
  'This is amazing! Keep up the great work! 🙌',
  'Love this initiative! How can I get involved?',
  'Exactly what we need right now. Thank you for doing this! 💯',
  'This is so important. Shared with my network!',
  'Incredible impact! The world needs more of this.',
  'Just donated! Let\'s make this happen! 💪',
  'Been following your work for a while. This is your best project yet!',
  'The transparency here is refreshing. More organizations should do this.',
  'How do you measure the impact? Would love to learn more!',
  'This model could be replicated in other communities. Brilliant!',
  'Question: What\'s the timeline for implementation?',
  'Backed this immediately. The mission resonates deeply.',
  'Your approach to this problem is innovative. Excited to see the results!',
  'The community support here is incredible! 🔥',
  'This gives me hope. Thank you for your dedication.',
];

const replyTemplates = [
  'Thanks for the support! 🙏',
  'Great question! We\'re planning to...',
  'Appreciate you spreading the word!',
  'Absolutely! Would love to chat more about this.',
  'This means everything to us. Thank you! ❤️',
  'Exactly! That\'s the goal we\'re working towards.',
  'Good point! We\'re definitely considering that.',
  'Thank you for backing the project! Your support makes a real difference.',
];

/**
 * Seed comments and nested replies
 */
export async function seedComments(
  users: SeededUser[],
  posts: SeededPost[],
): Promise<void> {
  console.log('🌱 Seeding comments...');

  const commentCount = faker.number.int({ min: 100, max: 200 });
  let created = 0;
  const createdCommentIds: string[] = [];

  // Create top-level comments
  for (let i = 0; i < commentCount; i++) {
    const post = faker.helpers.arrayElement(posts);
    const author = faker.helpers.arrayElement(users.filter((u) => u.id !== post.authorId));
    const content = faker.helpers.arrayElement(commentTemplates);

    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: author.id,
          postId: post.id,
          createdAt: faker.date.between({
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date(),
          }),
        },
      });

      createdCommentIds.push(comment.id);
      created++;

      // Update post reply count
      await prisma.post.update({
        where: { id: post.id },
        data: { replyCount: { increment: 1 } },
      });
    } catch (error) {
      console.error(`  ✗ Failed to create comment:`, error);
    }
  }

  // Create nested replies (30% of comments get replies)
  const replyCount = Math.floor(created * 0.3);
  let repliesCreated = 0;

  for (let i = 0; i < replyCount; i++) {
    const parentCommentId = faker.helpers.arrayElement(createdCommentIds);
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      include: { post: true },
    });

    if (!parentComment) continue;

    // Reply from either the post author or another user
    const isPostAuthorReply = Math.random() < 0.4;
    const author = isPostAuthorReply
      ? users.find((u) => u.id === parentComment.post.authorId)!
      : faker.helpers.arrayElement(users.filter((u) => u.id !== parentComment.authorId));

    const content = faker.helpers.arrayElement(replyTemplates);

    try {
      await prisma.comment.create({
        data: {
          content,
          authorId: author.id,
          postId: parentComment.postId,
          parentId: parentCommentId,
          createdAt: faker.date.between({
            from: parentComment.createdAt,
            to: new Date(),
          }),
        },
      });

      repliesCreated++;

      // Update post reply count
      await prisma.post.update({
        where: { id: parentComment.postId },
        data: { replyCount: { increment: 1 } },
      });
    } catch (error) {
      console.error(`  ✗ Failed to create nested reply:`, error);
    }
  }

  console.log(`✅ Created ${created} comments and ${repliesCreated} nested replies\n`);
}

/**
 * Seed likes on posts
 */
export async function seedLikes(
  users: SeededUser[],
  posts: SeededPost[],
): Promise<void> {
  console.log('🌱 Seeding likes...');

  const totalLikes = faker.number.int({ min: 500, max: 1000 });
  let created = 0;
  const likedPairs = new Set<string>();

  for (let i = 0; i < totalLikes; i++) {
    const user = faker.helpers.arrayElement(users);
    const post = faker.helpers.arrayElement(posts);
    const pairKey = `${user.id}-${post.id}`;

    // Skip if user already liked this post
    if (likedPairs.has(pairKey) || post.authorId === user.id) {
      continue;
    }

    try {
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
          createdAt: faker.date.recent({ days: 28 }),
        },
      });

      likedPairs.add(pairKey);
      created++;
    } catch (error) {
      // Skip duplicate likes (unique constraint)
      continue;
    }
  }

  console.log(`✅ Created ${created} likes\n`);
}

/**
 * Seed reposts (Repost model, not reply posts)
 */
export async function seedRepostRecords(
  users: SeededUser[],
  posts: SeededPost[],
): Promise<void> {
  console.log('🌱 Seeding reposts...');

  const totalReposts = faker.number.int({ min: 50, max: 100 });
  let created = 0;
  const repostedPairs = new Set<string>();

  for (let i = 0; i < totalReposts; i++) {
    const user = faker.helpers.arrayElement(users);
    const post = faker.helpers.arrayElement(posts);
    const pairKey = `${user.id}-${post.id}`;

    // Skip if user already reposted this post
    if (repostedPairs.has(pairKey) || post.authorId === user.id) {
      continue;
    }

    // 30% chance of quote repost
    const quoteComment = Math.random() < 0.3
      ? faker.helpers.arrayElement([
          '💯',
          'This!',
          'Important message!',
          'Everyone should see this',
          'Amplifying! 🔊',
        ])
      : null;

    try {
      await prisma.repost.create({
        data: {
          userId: user.id,
          postId: post.id,
          comment: quoteComment,
          createdAt: faker.date.recent({ days: 28 }),
        },
      });

      repostedPairs.add(pairKey);
      created++;
    } catch (error) {
      // Skip duplicate reposts (unique constraint)
      continue;
    }
  }

  console.log(`✅ Created ${created} reposts\n`);
}

/**
 * Seed bookmarks
 */
export async function seedBookmarks(
  users: SeededUser[],
  posts: SeededPost[],
): Promise<void> {
  console.log('🌱 Seeding bookmarks...');

  const totalBookmarks = faker.number.int({ min: 20, max: 30 });
  let created = 0;
  const bookmarkedPairs = new Set<string>();

  // Each user bookmarks 1-3 posts
  for (const user of users) {
    const bookmarkCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < bookmarkCount; i++) {
      const post = faker.helpers.arrayElement(posts);
      const pairKey = `${user.id}-${post.id}`;

      if (bookmarkedPairs.has(pairKey)) {
        continue;
      }

      try {
        await prisma.bookmark.create({
          data: {
            userId: user.id,
            postId: post.id,
            createdAt: faker.date.recent({ days: 25 }),
          },
        });

        bookmarkedPairs.add(pairKey);
        created++;

        if (created >= totalBookmarks) break;
      } catch (error) {
        // Skip duplicate bookmarks (unique constraint)
        continue;
      }
    }

    if (created >= totalBookmarks) break;
  }

  console.log(`✅ Created ${created} bookmarks\n`);
}

/**
 * Seed follow relationships
 */
export async function seedFollows(users: SeededUser[]): Promise<void> {
  console.log('🌱 Seeding follow relationships...');

  const totalFollows = faker.number.int({ min: 50, max: 80 });
  let created = 0;
  const followPairs = new Set<string>();

  // Create realistic social graph
  for (let i = 0; i < totalFollows; i++) {
    const follower = faker.helpers.arrayElement(users);
    const following = faker.helpers.arrayElement(users.filter((u) => u.id !== follower.id));
    const pairKey = `${follower.id}-${following.id}`;

    if (followPairs.has(pairKey)) {
      continue;
    }

    try {
      await prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: following.id,
          createdAt: faker.date.past({ years: 0.5 }),
        },
      });

      followPairs.add(pairKey);
      created++;

      // Update denormalized counts
      await prisma.user.update({
        where: { id: follower.id },
        data: { followingCount: { increment: 1 } },
      });

      await prisma.user.update({
        where: { id: following.id },
        data: { followersCount: { increment: 1 } },
      });
    } catch (error) {
      // Skip duplicate follows (unique constraint)
      continue;
    }
  }

  // Create some mutual follows (friends)
  const mutualFollowCount = Math.floor(created * 0.2);
  const existingFollows = await prisma.follow.findMany({
    take: mutualFollowCount,
  });

  for (const follow of existingFollows) {
    const reversePairKey = `${follow.followingId}-${follow.followerId}`;

    if (followPairs.has(reversePairKey)) {
      continue;
    }

    try {
      await prisma.follow.create({
        data: {
          followerId: follow.followingId,
          followingId: follow.followerId,
          createdAt: faker.date.past({ years: 0.5 }),
        },
      });

      followPairs.add(reversePairKey);

      // Update denormalized counts
      await prisma.user.update({
        where: { id: follow.followingId },
        data: { followingCount: { increment: 1 } },
      });

      await prisma.user.update({
        where: { id: follow.followerId },
        data: { followersCount: { increment: 1 } },
      });
    } catch (error) {
      // Skip if already exists
      continue;
    }
  }

  console.log(`✅ Created ${created} follow relationships (including some mutual follows)\n`);
}

/**
 * Seed comment likes
 */
export async function seedCommentLikes(users: SeededUser[]): Promise<void> {
  console.log('🌱 Seeding comment likes...');

  // Get some comments to like
  const comments = await prisma.comment.findMany({
    take: 50,
    select: { id: true, authorId: true },
  });

  let created = 0;
  const likedPairs = new Set<string>();

  for (const comment of comments) {
    // Each comment gets 2-5 likes
    const likeCount = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < likeCount; i++) {
      const user = faker.helpers.arrayElement(users.filter((u) => u.id !== comment.authorId));
      const pairKey = `${user.id}-${comment.id}`;

      if (likedPairs.has(pairKey)) {
        continue;
      }

      try {
        await prisma.commentLike.create({
          data: {
            userId: user.id,
            commentId: comment.id,
            createdAt: faker.date.recent({ days: 28 }),
          },
        });

        likedPairs.add(pairKey);
        created++;

        // Update comment like count
        await prisma.comment.update({
          where: { id: comment.id },
          data: { likesCount: { increment: 1 } },
        });
      } catch (error) {
        // Skip duplicate likes (unique constraint)
        continue;
      }
    }
  }

  console.log(`✅ Created ${created} comment likes\n`);
}

/**
 * Seed all interactions
 */
export async function seedInteractions(
  users: SeededUser[],
  posts: SeededPost[],
): Promise<void> {
  console.log('🔗 Seeding all interactions...\n');

  await seedFollows(users);
  await seedLikes(users, posts);
  await seedRepostRecords(users, posts);
  await seedBookmarks(users, posts);
  await seedComments(users, posts);
  await seedCommentLikes(users);

  console.log('✅ All interactions seeded successfully!\n');
}
