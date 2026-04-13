/**
 * ALL-IN-ONE SCRIPT: Fix $0.00 Yield Display
 *
 * This script automatically:
 * 1. Checks your current status
 * 2. Simulates yield if needed
 * 3. Harvests staking yield
 * 4. Harvests wealth building yield
 * 5. Shows you the results
 *
 * Usage:
 * npx hardhat run scripts/fix-zero-yield.js --network baseSepolia
 *
 * Custom yield amount:
 * YIELD_AMOUNT=20 npx hardhat run scripts/fix-zero-yield.js --network baseSepolia
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🔧 FIX $0.00 YIELD DISPLAY - All-In-One Script\n");
  console.log("=".repeat(70));

  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;

  // Get yield amount from env or use default
  const YIELD_AMOUNT = process.env.YIELD_AMOUNT
    ? hre.ethers.parseUnits(process.env.YIELD_AMOUNT, 6)
    : hre.ethers.parseUnits("10", 6); // 10 USDC default

  console.log(`\n👤 User: ${userAddress}`);
  console.log(`💰 Yield to simulate: ${hre.ethers.formatUnits(YIELD_AMOUNT, 6)} USDC\n`);

  // Contract addresses
  const CAMPAIGN_ID = 0;
  const STAKING_POOL_ADDRESS = "0x90119080aDf2038dB99E5a2e993DFB4427e12E18";
  const WEALTH_BUILDING_ADDRESS = "0x6145e97Fbfb4c45f7cf7b7307f24B8d6Bc22CA43";
  const AAVE_POOL_ADDRESS = "0x27a07afD7CAc491e1e8b3c75913e50b57161487d";
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";

  // Get contract instances
  const StakingPool = await hre.ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);
  const WealthBuilding = await hre.ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);
  const MockAavePool = await hre.ethers.getContractAt("MockAavePool", AAVE_POOL_ADDRESS);
  const USDC = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);

  console.log("━".repeat(70));
  console.log("STEP 1: Checking Your Current Status");
  console.log("━".repeat(70));

  // Check staking position
  const stakedAmount = await StakingPool.stakerPrincipal(userAddress);
  console.log(`\n🏦 Staking: ${hre.ethers.formatUnits(stakedAmount, 6)} USDC staked`);

  // Check wealth building position
  try {
    const endowmentInfo = await WealthBuilding.getEndowmentInfo(userAddress, CAMPAIGN_ID);
    console.log(`💎 Wealth Building: ${hre.ethers.formatUnits(endowmentInfo.principal, 6)} USDC endowment`);

    if (stakedAmount === 0n && endowmentInfo.principal === 0n) {
      console.log("\n⚠️  You don't have any positions yet!");
      console.log("\n💡 First:");
      console.log("   1. Go to http://localhost:3000");
      console.log("   2. Navigate to a campaign");
      console.log("   3. Stake USDC or make a wealth-building donation");
      console.log("   4. Then run this script again\n");
      return;
    }
  } catch (error) {
    if (stakedAmount === 0n) {
      console.log("\n⚠️  No positions found. Please stake or donate first!\n");
      return;
    }
  }

  console.log("\n✅ You have positions! Continuing...\n");

  console.log("━".repeat(70));
  console.log("STEP 2: Simulating Yield in Aave");
  console.log("━".repeat(70));

  try {
    // Mint USDC to Aave Pool
    console.log("\n🪙 Minting USDC to MockAavePool...");
    const mintTx = await USDC.mint(AAVE_POOL_ADDRESS, YIELD_AMOUNT);
    await mintTx.wait();
    console.log("   ✅ USDC minted");

    // Simulate yield
    console.log("\n⚡ Simulating yield distribution...");
    const simulateTx = await MockAavePool.simulateYield(YIELD_AMOUNT);
    await simulateTx.wait();
    console.log("   ✅ Yield simulated");

    // Check new balances
    const aUSDC_ADDRESS = await StakingPool.aUSDC();
    const aUSDC = await hre.ethers.getContractAt("IERC20", aUSDC_ADDRESS);
    const stakingBalance = await aUSDC.balanceOf(STAKING_POOL_ADDRESS);
    const wealthBalance = await aUSDC.balanceOf(WEALTH_BUILDING_ADDRESS);

    console.log(`\n📊 New aUSDC Balances:`);
    console.log(`   StakingPool: ${hre.ethers.formatUnits(stakingBalance, 6)} aUSDC`);
    console.log(`   WealthBuilding: ${hre.ethers.formatUnits(wealthBalance, 6)} aUSDC`);

  } catch (error) {
    console.log("\n⚠️  Error simulating yield:");
    console.log(error.message);
    console.log("\nContinuing to harvest existing yield...\n");
  }

  console.log("\n━".repeat(70));
  console.log("STEP 3: Harvesting Staking Yield");
  console.log("━".repeat(70));

  if (stakedAmount > 0n) {
    try {
      console.log("\n🌾 Calling harvestAndDistribute()...");
      const harvestTx = await StakingPool.harvestAndDistribute();
      console.log(`   Transaction: ${harvestTx.hash}`);
      await harvestTx.wait();
      console.log("   ✅ Staking yield harvested");

      // Check rewards
      const earnedUSDC = await StakingPool.earnedUSDC(userAddress);
      console.log(`\n💰 Your New Claimable Rewards: ${hre.ethers.formatUnits(earnedUSDC, 6)} USDC`);

    } catch (error) {
      if (error.message.includes("Too soon")) {
        console.log("\n⏰ Harvest cooldown active (24 hours between harvests)");
        console.log("   Skipping staking harvest...");
      } else if (error.message.includes("No yield")) {
        console.log("\n📊 No new yield available for staking");
      } else {
        console.log("\n⚠️  Staking harvest failed:");
        console.log(error.message);
      }
    }
  } else {
    console.log("\n⏭️  Skipping (no staked amount)");
  }

  console.log("\n━".repeat(70));
  console.log("STEP 4: Harvesting Wealth Building Yield");
  console.log("━".repeat(70));

  try {
    const endowmentInfo = await WealthBuilding.getEndowmentInfo(userAddress, CAMPAIGN_ID);

    if (endowmentInfo.principal > 0n) {
      try {
        // Check pending yield first
        const pendingYield = await WealthBuilding.getPendingYield(userAddress, CAMPAIGN_ID);
        const totalPending = pendingYield[0] + pendingYield[1];

        if (totalPending > 0n) {
          console.log(`\n💰 Pending Yield: ${hre.ethers.formatUnits(totalPending, 6)} USDC`);
          console.log("🌾 Calling harvestYield()...");

          const harvestWealthTx = await WealthBuilding.harvestYield(userAddress, CAMPAIGN_ID);
          console.log(`   Transaction: ${harvestWealthTx.hash}`);
          await harvestWealthTx.wait();
          console.log("   ✅ Wealth building yield harvested");

          // Check new state
          const newEndowmentInfo = await WealthBuilding.getEndowmentInfo(userAddress, CAMPAIGN_ID);
          console.log(`\n📊 Your Endowment Stats:`);
          console.log(`   Lifetime Yield: ${hre.ethers.formatUnits(newEndowmentInfo.lifetimeYield, 6)} USDC`);
          console.log(`   Yield to Cause: ${hre.ethers.formatUnits(newEndowmentInfo.causeYieldPaid, 6)} USDC`);
          console.log(`   Your Stocks Value: ${hre.ethers.formatUnits(newEndowmentInfo.donorStockValue, 6)} USDC`);

        } else {
          console.log("\n📊 No pending yield for wealth building");
        }

      } catch (error) {
        if (error.message.includes("NoYieldAvailable")) {
          console.log("\n📊 No yield available yet for wealth building");
        } else {
          console.log("\n⚠️  Wealth building harvest failed:");
          console.log(error.message);
        }
      }
    } else {
      console.log("\n⏭️  Skipping (no endowment)");
    }
  } catch (error) {
    console.log("\n⏭️  Skipping (no endowment found)");
  }

  console.log("\n━".repeat(70));
  console.log("✅ COMPLETE - Summary");
  console.log("━".repeat(70));

  console.log("\n🎉 All done! Here's what happened:\n");

  // Final summary
  try {
    if (stakedAmount > 0n) {
      const finalEarnedUSDC = await StakingPool.earnedUSDC(userAddress);
      console.log(`🏦 Staking:`);
      console.log(`   Staked: ${hre.ethers.formatUnits(stakedAmount, 6)} USDC`);
      console.log(`   Claimable: ${hre.ethers.formatUnits(finalEarnedUSDC, 6)} USDC`);
    }

    const finalEndowmentInfo = await WealthBuilding.getEndowmentInfo(userAddress, CAMPAIGN_ID);
    if (finalEndowmentInfo.principal > 0n) {
      console.log(`\n💎 Wealth Building:`);
      console.log(`   Endowment: ${hre.ethers.formatUnits(finalEndowmentInfo.principal, 6)} USDC`);
      console.log(`   Lifetime Yield: ${hre.ethers.formatUnits(finalEndowmentInfo.lifetimeYield, 6)} USDC`);
      console.log(`   Stocks Value: ${hre.ethers.formatUnits(finalEndowmentInfo.donorStockValue, 6)} USDC`);
    }
  } catch (error) {
    // Ignore errors in summary
  }

  console.log("\n💡 Next Steps:");
  console.log("   1. Open your browser");
  console.log("   2. Press F5 to refresh");
  console.log("   3. Check your campaign page or dashboard");
  console.log("   4. Numbers should now show! 🎯\n");

  console.log("📊 Dashboard: http://localhost:3000/dashboard");
  console.log("📈 Campaign: http://localhost:3000/campaigns/0\n");

  console.log("━".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
