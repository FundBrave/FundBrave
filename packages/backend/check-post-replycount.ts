import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const postId = 'e97dae38-f89c-4766-8f31-46e6e1bf6a69';

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      replyCount: true,
      content: true,
      author: {
        select: {
          username: true
        }
      }
    }
  });

  if (post) {
    console.log('\nPost Details:');
    console.log(`ID: ${post.id}`);
    console.log(`Author: ${post.author.username}`);
    console.log(`Content: ${post.content?.substring(0, 60)}...`);
    console.log(`ReplyCount field: ${post.replyCount}`);
  }

  const actualCommentCount = await prisma.comment.count({
    where: { postId, parentId: null }
  });

  console.log(`Actual comment count in DB: ${actualCommentCount}`);
  console.log(`\nMismatch: replyCount (${post?.replyCount}) != actual comments (${actualCommentCount})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
