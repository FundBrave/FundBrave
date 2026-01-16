/**
 * Script to fix base64 avatars in the database
 * Identifies users with base64 data URL avatars and replaces them with empty strings
 *
 * Run with: ts-node fix-base64-avatars.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBase64Avatars() {
  console.log('🔍 Searching for users with base64 avatars...');

  try {
    // Find all users with avatars that start with "data:"
    const usersWithBase64Avatars = await prisma.user.findMany({
      where: {
        avatarUrl: {
          startsWith: 'data:',
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    console.log(`📊 Found ${usersWithBase64Avatars.length} users with base64 avatars`);

    if (usersWithBase64Avatars.length === 0) {
      console.log('✅ No base64 avatars found. Database is clean!');
      return;
    }

    // Show first few examples
    console.log('\n📋 Examples of users with base64 avatars:');
    usersWithBase64Avatars.slice(0, 5).forEach((user) => {
      const preview = user.avatarUrl?.substring(0, 50) + '...';
      console.log(`  - ${user.username} (${user.id}): ${preview}`);
    });

    console.log('\n🔧 Fixing avatars...');

    // Update all users with base64 avatars to have empty avatar URL
    const result = await prisma.user.updateMany({
      where: {
        avatarUrl: {
          startsWith: 'data:',
        },
      },
      data: {
        avatarUrl: null,
      },
    });

    console.log(`✅ Successfully cleared ${result.count} base64 avatars`);
    console.log('💡 Users can now re-upload their avatars, which will be stored in S3');
  } catch (error) {
    console.error('❌ Error fixing base64 avatars:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixBase64Avatars()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
