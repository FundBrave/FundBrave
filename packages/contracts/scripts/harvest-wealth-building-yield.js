/**
 * Script to manually harvest wealth building yield
 * This converts accumulated yield to stocks for a specific donor/campaign pair
 *
 * Usage:
 * npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia
 *
 * Or specify donor and campaign:
 * DONOR_ADDRESS=0x... CAMPAIGN_ID=0 npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🌾 Harvesting Wealth Building Yield\n");
  console.log("=".repeat(60));

  const [signer] = await hre.ethers.getSigners();

  // Get donor address from env or use signer
  const DONOR_ADDRESS = process.env.DONOR_ADDRESS || signer.address;
  const CAMPAIGN_ID = process.env.CAMPAIGN_ID ? parseInt(process.env.CAMPAIGN_ID) : 0;

  console.log(`📝 Harvesting for:`);
  console.log(`   Donor: ${DONOR_ADDRESS}`);
  console.log(`   Campaign ID: ${CAMPAIGN_ID}\n`);

  // Contract addresses
  const WEALTH_BUILDING_ADDRESS = "0x6145e97Fbfb4c45f7cf7b7307f24B8d6Bc22CA43";
  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";

  // Get contract instances
  const WealthBuilding = await hre.ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);
  const Factory = await hre.ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);

  // Get token addresses
  const USDC_ADDRESS = await WealthBuilding.usdc();
  const aUSDC_ADDRESS = await WealthBuilding.aUsdc();
  const aUSDC = await hre.ethers.getContractAt("IERC20", aUSDC_ADDRESS);

  console.log("📋 Contract Addresses:");
  console.log(`   WealthBuilding: ${WEALTH_BUILDING_ADDRESS}`);
  console.log(`   USDC: ${USDC_ADDRESS}`);
  console.log(`   aUSDC: ${aUSDC_ADDRESS}\n`);

  // Check if fundraiser is registered
  try {
    const beneficiary = await WealthBuilding.fundraiserBeneficiaries(CAMPAIGN_ID);
    if (beneficiary === hre.ethers.ZeroAddress) {
      console.log("❌ Fundraiser not registered in WealthBuilding contract!");
      console.log("\n💡 Register it first:");
      console.log(`   Call: WealthBuilding.registerFundraiser(${CAMPAIGN_ID}, beneficiaryAddress)`);
      console.log("   Or use the Factory.createFundraiser() which should auto-register\n");
      return;
    }
    console.log(`✅ Fundraiser ${CAMPAIGN_ID} is registered (beneficiary: ${beneficiary})\n`);
  } catch (error) {
    console.log("⚠️  Could not check fundraiser registration\n");
  }

  // Get current endowment info
  console.log("📊 Current Endowment State:");
  try {
    const endowmentInfo = await WealthBuilding.getEndowmentInfo(DONOR_ADDRESS, CAMPAIGN_ID);

    console.log(`   Principal (Locked): ${hre.ethers.formatUnits(endowmentInfo.principal, 6)} USDC`);
    console.log(`   Lifetime Yield: ${hre.ethers.formatUnits(endowmentInfo.lifetimeYield, 6)} USDC`);
    console.log(`   Yield to Cause: ${hre.ethers.formatUnits(endowmentInfo.causeYieldPaid, 6)} USDC`);
    console.log(`   Stocks Value: ${hre.ethers.formatUnits(endowmentInfo.donorStockValue, 6)} USDC`);
    console.log(`   Last Harvest: ${endowmentInfo.lastHarvestTime.toString()}\n`);

    if (endowmentInfo.principal === 0n) {
      console.log("⚠️  No endowment found for this donor/campaign!");
      console.log("\n💡 First make a wealth-building donation:");
      console.log(`   Call: Factory.donateWealthBuilding(${CAMPAIGN_ID}, amount)\n`);
      return;
    }
  } catch (error) {
    console.log("⚠️  Could not fetch endowment info");
    console.log(error.message + "\n");
  }

  // Get pending yield
  console.log("💰 Pending Yield:");
  try {
    const pendingYield = await WealthBuilding.getPendingYield(DONOR_ADDRESS, CAMPAIGN_ID);
    const causeYield = pendingYield[0];
    const donorYield = pendingYield[1];

    console.log(`   To Cause (30%): ${hre.ethers.formatUnits(causeYield, 6)} USDC`);
    console.log(`   To Donor (70%): ${hre.ethers.formatUnits(donorYield, 6)} USDC`);
    console.log(`   Total Pending: ${hre.ethers.formatUnits(causeYield + donorYield, 6)} USDC\n`);

    if (causeYield === 0n && donorYield === 0n) {
      console.log("⚠️  No yield available to harvest!");
      console.log("\n💡 Tips:");
      console.log("   1. Wait longer for yield to accrue in Aave");
      console.log("   2. Simulate yield: Call MockAavePool.simulateYield(amount)");
      console.log("   3. Make sure endowment principal > 0\n");
      return;
    }
  } catch (error) {
    console.log("⚠️  Could not fetch pending yield");
    console.log(error.message + "\n");
  }

  // Get platform stats
  console.log("🌍 Platform Stats:");
  try {
    const stats = await WealthBuilding.getPlatformStats();
    console.log(`   Total Principal: ${hre.ethers.formatUnits(stats._totalPrincipal, 6)} USDC`);
    console.log(`   Total aUSDC: ${hre.ethers.formatUnits(stats._totalAUSDC, 6)} aUSDC`);
    console.log(`   Pending Yield: ${hre.ethers.formatUnits(stats._pendingYield, 6)} USDC\n`);
  } catch (error) {
    console.log("⚠️  Could not fetch platform stats\n");
  }

  // Call harvestYield
  console.log("🚀 Calling harvestYield()...\n");

  try {
    const tx = await WealthBuilding.harvestYield(DONOR_ADDRESS, CAMPAIGN_ID);
    console.log(`   Transaction hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

    // Check new state
    console.log("📊 New Endowment State:");
    const newEndowmentInfo = await WealthBuilding.getEndowmentInfo(DONOR_ADDRESS, CAMPAIGN_ID);

    console.log(`   Principal (Locked): ${hre.ethers.formatUnits(newEndowmentInfo.principal, 6)} USDC`);
    console.log(`   Lifetime Yield: ${hre.ethers.formatUnits(newEndowmentInfo.lifetimeYield, 6)} USDC`);
    console.log(`   Yield to Cause: ${hre.ethers.formatUnits(newEndowmentInfo.causeYieldPaid, 6)} USDC`);
    console.log(`   Stocks Value: ${hre.ethers.formatUnits(newEndowmentInfo.donorStockValue, 6)} USDC\n`);

    // Check stock portfolio
    console.log("📈 Stock Portfolio:");
    try {
      const portfolio = await WealthBuilding.getDonorStockPortfolio(DONOR_ADDRESS);
      const tokens = portfolio[0];
      const balances = portfolio[1];

      if (tokens.length === 0) {
        console.log("   (No stocks yet - may be held as USDC until swap is configured)\n");
      } else {
        for (let i = 0; i < tokens.length; i++) {
          const tokenAddr = tokens[i];
          const balance = balances[i];

          if (tokenAddr === hre.ethers.ZeroAddress) {
            console.log(`   USDC (Unclaimed): ${hre.ethers.formatUnits(balance, 6)}`);
          } else {
            console.log(`   Token ${tokenAddr}: ${hre.ethers.formatUnits(balance, 6)}`);
          }
        }
        console.log();
      }
    } catch (error) {
      console.log("   Could not fetch portfolio\n");
    }

    console.log("✅ Harvest successful!");
    console.log("\n💡 Next steps:");
    console.log("   1. Check the frontend - yield should be updated");
    console.log("   2. Click 'Claim' on stock tokens to transfer them to your wallet");
    console.log(`   3. View on explorer: https://sepolia.basescan.org/tx/${tx.hash}\n`);

  } catch (error) {
    console.error("\n❌ Harvest failed:");
    console.error(error.message);

    if (error.message.includes("NoYieldAvailable")) {
      console.log("\n💡 No yield is available yet. Try:");
      console.log("   1. Waiting longer for yield to accrue");
      console.log("   2. Simulating yield with MockAavePool.simulateYield()");
    } else if (error.message.includes("NoEndowment")) {
      console.log("\n💡 This donor has no endowment for this campaign.");
      console.log("   Make a wealth-building donation first!");
    }
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
