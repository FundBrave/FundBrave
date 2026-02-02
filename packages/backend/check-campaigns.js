const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.fundraiser.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      onChainId: true,
      stakingPoolAddr: true,
      createdAt: true
    }
  });

  console.log('\n=== Latest Campaigns ===');
  campaigns.forEach((c, i) => {
    console.log(`\n${i + 1}. ${c.name}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   onChainId: ${c.onChainId || 'NULL'}`);
    console.log(`   stakingPoolAddr: ${c.stakingPoolAddr || 'NULL'}`);
    console.log(`   Created: ${c.createdAt}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
