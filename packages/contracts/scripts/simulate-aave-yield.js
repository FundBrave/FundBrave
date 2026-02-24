/**
 * Script to simulate yield accrual in MockAavePool
 * This adds yield to all staking pools and wealth building endowments
 *
 * Usage:
 * npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia
 *
 * Or specify custom amount (in USDC):
 * YIELD_AMOUNT=10 npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia
 */

const hre = require("hardhat");

async function main() {
  console.log("\n⚡ Simulating Aave Yield\n");
  console.log("=".repeat(60));

  const [signer] = await hre.ethers.getSigners();
  console.log(`📝 Using account: ${signer.address}\n`);

  // Get yield amount from env or use default (5 USDC)
  const YIELD_AMOUNT = process.env.YIELD_AMOUNT
    ? hre.ethers.parseUnits(process.env.YIELD_AMOUNT, 6)
    : hre.ethers.parseUnits("5", 6); // 5 USDC default

  console.log(`💰 Simulating ${hre.ethers.formatUnits(YIELD_AMOUNT, 6)} USDC yield\n`);

  // Contract addresses
  const AAVE_POOL_ADDRESS = "0x27a07afD7CAc491e1e8b3c75913e50b57161487d";
  const STAKING_POOL_ADDRESS = "0x90119080aDf2038dB99E5a2e993DFB4427e12E18";
  const WEALTH_BUILDING_ADDRESS = "0x6145e97Fbfb4c45f7cf7b7307f24B8d6Bc22CA43";
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";

  // Get contract instances
  const MockAavePool = await hre.ethers.getContractAt("MockAavePool", AAVE_POOL_ADDRESS);
  const USDC = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);

  console.log("📋 Contract Addresses:");
  console.log(`   MockAavePool: ${AAVE_POOL_ADDRESS}`);
  console.log(`   StakingPool: ${STAKING_POOL_ADDRESS}`);
  console.log(`   WealthBuilding: ${WEALTH_BUILDING_ADDRESS}`);
  console.log(`   USDC: ${USDC_ADDRESS}\n`);

  // Check aUSDC addresses
  const aUSDC_ADDRESS = await MockAavePool.aUsdc();
  const aUSDC = await hre.ethers.getContractAt("IERC20", aUSDC_ADDRESS);

  console.log(`   aUSDC: ${aUSDC_ADDRESS}\n`);

  // Check current balances
  console.log("📊 Current Balances:");
  const stakingAUSDCBefore = await aUSDC.balanceOf(STAKING_POOL_ADDRESS);
  const wealthAUSDCBefore = await aUSDC.balanceOf(WEALTH_BUILDING_ADDRESS);

  console.log(`   StakingPool aUSDC: ${hre.ethers.formatUnits(stakingAUSDCBefore, 6)}`);
  console.log(`   WealthBuilding aUSDC: ${hre.ethers.formatUnits(wealthAUSDCBefore, 6)}\n`);

  if (stakingAUSDCBefore === 0n && wealthAUSDCBefore === 0n) {
    console.log("⚠️  No funds deposited in Aave yet!");
    console.log("\n💡 First:");
    console.log("   1. Stake some USDC in the staking pool");
    console.log("   2. Or make a wealth-building donation");
    console.log("   Then run this script to simulate yield\n");
    return;
  }

  // Mint USDC to MockAavePool to simulate yield
  console.log("🪙 Minting USDC to MockAavePool (simulates yield accrual)...");
  const mintTx = await USDC.mint(AAVE_POOL_ADDRESS, YIELD_AMOUNT);
  await mintTx.wait();
  console.log("   ✅ USDC minted\n");

  // Call simulateYield to distribute to aUSDC holders
  console.log("⚡ Calling MockAavePool.simulateYield()...");
  const tx = await MockAavePool.simulateYield(YIELD_AMOUNT);
  console.log(`   Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log("   ✅ Yield simulated\n");

  // Check new balances
  console.log("📊 New Balances:");
  const stakingAUSDCAfter = await aUSDC.balanceOf(STAKING_POOL_ADDRESS);
  const wealthAUSDCAfter = await aUSDC.balanceOf(WEALTH_BUILDING_ADDRESS);

  console.log(`   StakingPool aUSDC: ${hre.ethers.formatUnits(stakingAUSDCAfter, 6)} (+${hre.ethers.formatUnits(stakingAUSDCAfter - stakingAUSDCBefore, 6)})`);
  console.log(`   WealthBuilding aUSDC: ${hre.ethers.formatUnits(wealthAUSDCAfter, 6)} (+${hre.ethers.formatUnits(wealthAUSDCAfter - wealthAUSDCBefore, 6)})\n`);

  console.log("✅ Yield simulation complete!");
  console.log("\n💡 Next steps:");
  console.log("   1. Run harvest scripts to distribute the yield:");
  console.log("      - For staking: npx hardhat run scripts/harvest-staking-yield.js --network baseSepolia");
  console.log("      - For wealth building: npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia");
  console.log("   2. Check the frontend - pending yield should now be visible");
  console.log(`   3. View on explorer: https://sepolia.basescan.org/tx/${tx.hash}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
