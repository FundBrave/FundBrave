const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890abcdef',
      username: 'testuser',
      displayName: 'Test User',
    },
  });
  
  console.log('Created user:', user);
  
  // Fetch all users
  const users = await prisma.user.findMany();
  console.log('All users:', users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());