/**
 * Quick test script to verify RPC connection to Base Sepolia
 * Run with: node test-connection.js
 */

const { JsonRpcProvider } = require('ethers');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing Base Sepolia RPC Connection...\n');

  const endpoints = [
    {
      name: 'Alchemy',
      url: process.env.ALCHEMY_API_KEY
        ? `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : null,
    },
    {
      name: 'Custom RPC',
      url: process.env.BASE_SEPOLIA_RPC_URL,
    },
    {
      name: 'Public RPC',
      url: 'https://sepolia.base.org',
    },
  ];

  let successCount = 0;

  for (const endpoint of endpoints) {
    if (!endpoint.url) {
      console.log(`⏭️  ${endpoint.name}: Not configured`);
      continue;
    }

    try {
      const provider = new JsonRpcProvider(endpoint.url);
      const startTime = Date.now();
      const blockNumber = await provider.getBlockNumber();
      const latency = Date.now() - startTime;

      console.log(`✅ ${endpoint.name}: Connected`);
      console.log(`   Block: ${blockNumber}`);
      console.log(`   Latency: ${latency}ms`);
      console.log(`   URL: ${endpoint.url.slice(0, 50)}...`);
      successCount++;
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed`);
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('─'.repeat(60));
  console.log(`\n📊 Summary: ${successCount}/${endpoints.filter(e => e.url).length} endpoints working\n`);

  if (successCount === 0) {
    console.log('⚠️  No working RPC endpoints found!');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Add ALCHEMY_API_KEY to .env file');
    console.log('   Get free key at: https://www.alchemy.com/');
    console.log('3. Verify .env file is in packages/backend/');
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ Connection test passed! Backend should start successfully.');
    process.exit(0);
  }
}

testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
