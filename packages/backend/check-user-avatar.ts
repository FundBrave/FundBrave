import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'testuser@example.com' },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      displayName: true
    }
  });

  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
