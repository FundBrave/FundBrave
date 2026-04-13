/**
 * Script to manually harvest staking yield from Aave
 * This simulates what Chainlink Automation should do automatically
 *
 * Usage:
 * npx hardhat run scripts/harvest-staking-yield.js --network baseSepolia
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🌾 Harvesting Staking Yield from Aave\n");
  console.log("=".repeat(60));

  const [signer] = await hre.ethers.getSigners();
  console.log(`📝 Using account: ${signer.address}\n`);

  // Contract addresses from deployment
  const STAKING_POOL_ADDRESS = "0x90119080aDf2038dB99E5a2e993DFB4427e12E18"; // Campaign 0 staking pool
  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";

  // Get contract instances
  const StakingPool = await hre.ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);
  const Factory = await hre.ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);

  // Get aUSDC and USDC addresses
  const aUSDC_ADDRESS = await StakingPool.aUSDC();
  const USDC_ADDRESS = await StakingPool.USDC();
  const aUSDC = await hre.ethers.getContractAt("IERC20", aUSDC_ADDRESS);
  const USDC = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS);

  console.log("📋 Contract Addresses:");
  console.log(`   StakingPool: ${STAKING_POOL_ADDRESS}`);
  console.log(`   USDC: ${USDC_ADDRESS}`);
  console.log(`   aUSDC: ${aUSDC_ADDRESS}\n`);

  // Check current state
  console.log("📊 Current State:");
  const totalStakedPrincipal = await StakingPool.totalStakedPrincipal();
  const aUSDCBalance = await aUSDC.balanceOf(STAKING_POOL_ADDRESS);
  const yieldPerTokenStored = await StakingPool.yieldPerTokenStored();
  const lastHarvestTimestamp = await StakingPool.lastHarvestTimestamp();

  console.log(`   Total Staked Principal: ${hre.ethers.formatUnits(totalStakedPrincipal, 6)} USDC`);
  console.log(`   aUSDC Balance: ${hre.ethers.formatUnits(aUSDCBalance, 6)} aUSDC`);
  console.log(`   Yield Per Token Stored: ${yieldPerTokenStored.toString()}`);

  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceLastHarvest = currentTime - Number(lastHarvestTimestamp);
  console.log(`   Last Harvest: ${lastHarvestTimestamp.toString()} (${timeSinceLastHarvest}s ago)\n`);

  // Calculate available yield
  const availableYield = aUSDCBalance - totalStakedPrincipal;
  console.log(`💰 Available Yield: ${hre.ethers.formatUnits(availableYield, 6)} USDC\n`);

  if (availableYield <= 0n) {
    console.log("⚠️  No yield available to harvest!");
    console.log("\n💡 Tips:");
    console.log("   1. Wait longer for yield to accrue in Aave");
    console.log("   2. Simulate yield: npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia");
    console.log("   3. Check if anyone has staked: totalStakedPrincipal > 0\n");
    return;
  }

  // Check if we can harvest (1 day cooldown)
  const HARVEST_INTERVAL = 86400; // 1 day in seconds
  if (timeSinceLastHarvest < HARVEST_INTERVAL) {
    console.log(`⏰ Harvest cooldown active. Can harvest in ${HARVEST_INTERVAL - timeSinceLastHarvest}s`);
    console.log("   (To bypass for testing, you can wait or modify the contract)\n");
    // Continue anyway for testing
  }

  // Call harvestAndDistribute
  console.log("🚀 Calling harvestAndDistribute()...\n");

  try {
    const tx = await StakingPool.harvestAndDistribute();
    console.log(`   Transaction hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

    // Check new state
    console.log("📊 New State:");
    const newAUSDCBalance = await aUSDC.balanceOf(STAKING_POOL_ADDRESS);
    const newYieldPerTokenStored = await StakingPool.yieldPerTokenStored();
    const newLastHarvestTimestamp = await StakingPool.lastHarvestTimestamp();

    console.log(`   aUSDC Balance: ${hre.ethers.formatUnits(newAUSDCBalance, 6)} aUSDC`);
    console.log(`   Yield Per Token Stored: ${newYieldPerTokenStored.toString()}`);
    console.log(`   Last Harvest: ${newLastHarvestTimestamp.toString()}\n`);

    // Check if a test user has rewards now
    console.log("🔍 Checking your rewards:");
    const yourPrincipal = await StakingPool.stakerPrincipal(signer.address);
    const yourRewards = await StakingPool.usdcRewards(signer.address);
    const yourEarnedUSDC = await StakingPool.earnedUSDC(signer.address);

    console.log(`   Your Staked Amount: ${hre.ethers.formatUnits(yourPrincipal, 6)} USDC`);
    console.log(`   Your Claimable Rewards: ${hre.ethers.formatUnits(yourEarnedUSDC, 6)} USDC`);
    console.log(`   Already Distributed: ${hre.ethers.formatUnits(yourRewards, 6)} USDC\n`);

    console.log("✅ Harvest successful!");
    console.log("\n💡 Next steps:");
    console.log("   1. Check the frontend - yield should now be visible");
    console.log("   2. Click 'Claim Rewards' to claim your USDC");
    console.log(`   3. View on explorer: https://sepolia.basescan.org/tx/${tx.hash}\n`);

  } catch (error) {
    console.error("\n❌ Harvest failed:");
    console.error(error.message);

    if (error.message.includes("Too soon")) {
      console.log("\n💡 The harvest interval (24 hours) hasn't passed yet.");
      console.log("   For testing, you can:");
      console.log("   1. Wait 24 hours");
      console.log("   2. Call this script again tomorrow");
      console.log("   3. Or modify HARVEST_INTERVAL in the contract for testing\n");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
