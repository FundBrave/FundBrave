import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'testuser@example.com' },
    select: {
      emailVerificationOtp: true,
      email: true,
      username: true
    }
  });

  if (user) {
    console.log('\n=== OTP CODE ===');
    console.log(`Email: ${user.email}`);
    console.log(`Username: ${user.username}`);
    console.log(`OTP: ${user.emailVerificationOtp}`);
    console.log('================\n');
  } else {
    console.log('User not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
