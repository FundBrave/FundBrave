import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersWithEmail = await prisma.user.findMany({
    where: {
      email: {
        not: null
      }
    },
    select: {
      username: true,
      email: true,
      displayName: true
    },
    take: 10
  });

  console.log('Users with email/password authentication:');
  usersWithEmail.forEach(user => {
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName}`);
    console.log('Password: Password123!');
    console.log('---');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
