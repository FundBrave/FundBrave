import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mediaCount = await prisma.media.count();
  console.log('Total Media records:', mediaCount);

  const postsWithMedia = await prisma.post.findMany({
    where: {
      media: {
        some: {}
      }
    },
    take: 5,
    include: {
      media: true,
      author: {
        select: {
          username: true
        }
      }
    }
  });

  console.log('\nPosts with media:');
  postsWithMedia.forEach(post => {
    console.log(`\nPost ID: ${post.id}`);
    console.log(`Author: ${post.author.username}`);
    console.log(`Content: ${post.content?.substring(0, 60)}...`);
    console.log(`Media count: ${post.media.length}`);
    post.media.forEach(m => {
      console.log(`  - ${m.url}`);
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
