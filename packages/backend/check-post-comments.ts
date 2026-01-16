import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const postId = 'e97dae38-f89c-4766-8f31-46e6e1bf6a69';

  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      author: {
        select: {
          username: true,
          displayName: true
        }
      },
      replies: {
        select: {
          id: true
        }
      }
    },
    take: 5
  });

  console.log('\nComments for post', postId);
  console.log('Total top-level comments:', comments.length);
  comments.forEach((c, i) => {
    console.log(`\nComment ${i+1}:`);
    console.log(`  Author: ${c.author.displayName || c.author.username}`);
    console.log(`  Content: ${c.content.substring(0, 60)}...`);
    console.log(`  Replies: ${c.replies.length}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
