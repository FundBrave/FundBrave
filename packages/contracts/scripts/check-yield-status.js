/**
 * Diagnostic script to check why yield isn't showing
 * Checks all possible reasons for $0.00 display
 *
 * Usage:
 * npx hardhat run scripts/check-yield-status.js --network baseSepolia
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🔍 Yield Status Diagnostic Tool\n");
  console.log("=".repeat(70));

  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;

  console.log(`\n👤 Checking for user: ${userAddress}\n`);

  // Contract addresses
  const CAMPAIGN_ID = 0;
  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const STAKING_POOL_ADDRESS = "0x90119080aDf2038dB99E5a2e993DFB4427e12E18";
  const WEALTH_BUILDING_ADDRESS = "0x6145e97Fbfb4c45f7cf7b7307f24B8d6Bc22CA43";
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";

  // Get contract instances
  const Factory = await hre.ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const StakingPool = await hre.ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);
  const WealthBuilding = await hre.ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);
  const USDC = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);

  console.log("━".repeat(70));
  console.log("🏦 STAKING POOL DIAGNOSIS");
  console.log("━".repeat(70));

  // Check 1: Does user have any stake?
  const stakerPrincipal = await StakingPool.stakerPrincipal(userAddress);
  console.log(`\n1️⃣  User's Staked Amount: ${hre.ethers.formatUnits(stakerPrincipal, 6)} USDC`);

  if (stakerPrincipal === 0n) {
    console.log("   ❌ No stake found! You need to stake first.");
    console.log("   💡 Fix: Go to frontend → Staking tab → Stake USDC\n");
  } else {
    console.log("   ✅ User has staked\n");

    // Check 2: Is there yield in Aave?
    const aUSDC_ADDRESS = await StakingPool.aUSDC();
    const aUSDC = await hre.ethers.getContractAt("IERC20", aUSDC_ADDRESS);
    const totalStakedPrincipal = await StakingPool.totalStakedPrincipal();
    const aUSDCBalance = await aUSDC.balanceOf(STAKING_POOL_ADDRESS);
    const availableYield = aUSDCBalance - totalStakedPrincipal;

    console.log(`2️⃣  Total Staked Principal: ${hre.ethers.formatUnits(totalStakedPrincipal, 6)} USDC`);
    console.log(`   aUSDC Balance: ${hre.ethers.formatUnits(aUSDCBalance, 6)} aUSDC`);
    console.log(`   Available Yield: ${hre.ethers.formatUnits(availableYield, 6)} USDC`);

    if (availableYield <= 0n) {
      console.log("   ❌ No yield in Aave yet!");
      console.log("   💡 Fix: Run simulate-aave-yield.js to add yield\n");
    } else {
      console.log("   ✅ Yield is available in Aave\n");

      // Check 3: Has yield been harvested?
      const yieldPerTokenStored = await StakingPool.yieldPerTokenStored();
      const lastHarvestTimestamp = await StakingPool.lastHarvestTimestamp();

      console.log(`3️⃣  Yield Per Token Stored: ${yieldPerTokenStored.toString()}`);
      console.log(`   Last Harvest: ${lastHarvestTimestamp.toString()}`);

      if (yieldPerTokenStored === 0n) {
        console.log("   ❌ Yield has never been harvested!");
        console.log("   💡 Fix: Run harvest-staking-yield.js\n");
      } else {
        console.log("   ✅ Yield has been harvested at least once\n");

        // Check 4: User's claimable rewards
        const usdcRewards = await StakingPool.usdcRewards(userAddress);
        const earnedUSDC = await StakingPool.earnedUSDC(userAddress);
        const claimableYield = await StakingPool.claimableYield(userAddress);

        console.log(`4️⃣  User's Rewards:`);
        console.log(`   Already Distributed: ${hre.ethers.formatUnits(usdcRewards, 6)} USDC`);
        console.log(`   Total Claimable (earnedUSDC): ${hre.ethers.formatUnits(earnedUSDC, 6)} USDC`);
        console.log(`   Pending Distribution: ${hre.ethers.formatUnits(claimableYield, 6)} USDC`);

        if (earnedUSDC === 0n) {
          console.log("   ⚠️  Total claimable is still 0!");
          console.log("   💡 This could mean:");
          console.log("      - Yield was harvested BEFORE you staked");
          console.log("      - Or harvest needs to be called again");
          console.log("   💡 Fix: Run simulate + harvest again\n");
        } else {
          console.log("   ✅ User has claimable rewards!\n");
        }
      }
    }
  }

  console.log("━".repeat(70));
  console.log("💎 WEALTH BUILDING DIAGNOSIS");
  console.log("━".repeat(70));

  // Check 1: Does user have an endowment?
  try {
    const endowmentInfo = await WealthBuilding.getEndowmentInfo(userAddress, CAMPAIGN_ID);

    console.log(`\n1️⃣  User's Endowment Principal: ${hre.ethers.formatUnits(endowmentInfo.principal, 6)} USDC`);

    if (endowmentInfo.principal === 0n) {
      console.log("   ❌ No endowment found! You need to make a wealth-building donation first.");
      console.log("   💡 Fix: Go to frontend → Wealth Building tab → Donate USDC\n");
    } else {
      console.log("   ✅ User has an endowment\n");

      console.log(`   Lifetime Yield: ${hre.ethers.formatUnits(endowmentInfo.lifetimeYield, 6)} USDC`);
      console.log(`   Yield to Cause: ${hre.ethers.formatUnits(endowmentInfo.causeYieldPaid, 6)} USDC`);
      console.log(`   Stocks Value: ${hre.ethers.formatUnits(endowmentInfo.donorStockValue, 6)} USDC`);

      // Check 2: Is there pending yield?
      const pendingYield = await WealthBuilding.getPendingYield(userAddress, CAMPAIGN_ID);
      const causeYield = pendingYield[0];
      const donorYield = pendingYield[1];

      console.log(`\n2️⃣  Pending Yield (in Aave, not harvested):`);
      console.log(`   To Cause (30%): ${hre.ethers.formatUnits(causeYield, 6)} USDC`);
      console.log(`   To Donor (70%): ${hre.ethers.formatUnits(donorYield, 6)} USDC`);

      if (causeYield === 0n && donorYield === 0n) {
        console.log("   ❌ No pending yield!");
        console.log("   💡 Fix: Run simulate-aave-yield.js to add yield\n");
      } else {
        console.log("   ✅ Pending yield is available!\n");
        console.log("   💡 Action: Run harvest-wealth-building-yield.js to harvest it\n");
      }

      // Check 3: Stock portfolio
      const portfolio = await WealthBuilding.getDonorStockPortfolio(userAddress);
      const tokens = portfolio[0];
      const balances = portfolio[1];

      console.log(`3️⃣  Stock Portfolio:`);
      if (tokens.length === 0) {
        console.log("   📊 No stocks yet (nothing harvested)\n");
      } else {
        for (let i = 0; i < tokens.length; i++) {
          const tokenAddr = tokens[i];
          const balance = balances[i];
          if (tokenAddr === hre.ethers.ZeroAddress) {
            console.log(`   💵 USDC (Unclaimed): ${hre.ethers.formatUnits(balance, 6)}`);
          } else {
            console.log(`   📈 Token ${tokenAddr}: ${hre.ethers.formatUnits(balance, 6)}`);
          }
        }
        console.log();
      }
    }
  } catch (error) {
    console.log("\n❌ Error fetching endowment info:");
    console.log(error.message);
  }

  console.log("━".repeat(70));
  console.log("📋 SUMMARY & RECOMMENDED ACTIONS");
  console.log("━".repeat(70));

  console.log("\n🎯 To see non-zero numbers, follow this sequence:\n");

  console.log("1️⃣  Stake or Donate (if you haven't):");
  console.log("   cd packages/test-frontend && npm run dev");
  console.log("   → Go to campaign page → Stake or make wealth-building donation\n");

  console.log("2️⃣  Simulate yield:");
  console.log("   cd packages/contracts");
  console.log("   YIELD_AMOUNT=10 npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia\n");

  console.log("3️⃣  Harvest the yield:");
  console.log("   # For staking:");
  console.log("   npx hardhat run scripts/harvest-staking-yield.js --network baseSepolia");
  console.log("   # For wealth building:");
  console.log("   npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia\n");

  console.log("4️⃣  Refresh the frontend:");
  console.log("   Press F5 in browser → Numbers should now show!\n");

  console.log("━".repeat(70));
  console.log("\n💡 Quick Test (if you've already staked/donated):\n");
  console.log("cd packages/contracts");
  console.log("YIELD_AMOUNT=10 npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia");
  console.log("npx hardhat run scripts/harvest-staking-yield.js --network baseSepolia");
  console.log("npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia");
  console.log("\nThen refresh your browser! 🚀\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
