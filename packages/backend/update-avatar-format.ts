import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update testuser123's avatar from SVG to PNG
  const user = await prisma.user.update({
    where: { email: 'testuser@example.com' },
    data: {
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/png?seed=d0511a6f0591d33c&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
    },
    select: {
      username: true,
      email: true,
      avatarUrl: true
    }
  });

  console.log('Updated avatar for testuser123:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
