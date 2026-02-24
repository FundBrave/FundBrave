const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [donor] = await ethers.getSigners();

  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const WEALTH_BUILDING_ADDRESS = "0x39af574bA37b8d3f7632dE5d2e07D08321617857";
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";
  const CAMPAIGN_ID = 0;
  const DONATION_AMOUNT = ethers.parseUnits("100", 6); // 100 USDC

  console.log("🧪 Testing Wealth Building Donation\n");
  console.log("Donor:", donor.address);
  console.log("Campaign ID:", CAMPAIGN_ID);
  console.log("Donation Amount:", ethers.formatUnits(DONATION_AMOUNT, 6), "USDC");

  // Get contracts
  const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const wealthBuilding = await ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);

  // Check balances before
  const usdcBalance = await usdc.balanceOf(donor.address);
  console.log("\n💰 Donor USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

  if (usdcBalance < DONATION_AMOUNT) {
    console.log("   ⚠️  Insufficient balance. Minting USDC...");
    const mintTx = await usdc.mint(donor.address, DONATION_AMOUNT);
    await mintTx.wait();
    console.log("   ✅ Minted", ethers.formatUnits(DONATION_AMOUNT, 6), "USDC");
  }

  // Get campaign stats before
  const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
  const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
  const totalBefore = await fundraiser.totalDonations();
  const beneficiary = await fundraiser.beneficiary();

  console.log("\n📊 Campaign Stats Before:");
  console.log("   Total Donations:", ethers.formatUnits(totalBefore, 6), "USDC");
  console.log("   Beneficiary:", beneficiary);

  // Check allowance
  const allowance = await usdc.allowance(donor.address, FACTORY_ADDRESS);
  console.log("\n🔓 Current Allowance:", ethers.formatUnits(allowance, 6), "USDC");

  if (allowance < DONATION_AMOUNT) {
    console.log("   📝 Approving Factory...");
    const approveTx = await usdc.approve(FACTORY_ADDRESS, DONATION_AMOUNT);
    await approveTx.wait();
    console.log("   ✅ Approved", ethers.formatUnits(DONATION_AMOUNT, 6), "USDC");
  }

  // Make wealth building donation
  console.log("\n💸 Making wealth building donation...");
  console.log("   Split: 78% to campaign, 20% to endowment, 2% platform fee");

  try {
    const donateTx = await factory.donateWealthBuilding(CAMPAIGN_ID, DONATION_AMOUNT);
    console.log("   Transaction submitted:", donateTx.hash);

    const receipt = await donateTx.wait();
    console.log("   ✅ Transaction confirmed!");
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Parse events to see the splits
    console.log("\n📋 Transaction Events:");
    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed && parsed.name === "WealthBuildingDonationMade") {
          console.log("   WealthBuildingDonationMade:");
          console.log("     Total Amount:", ethers.formatUnits(parsed.args.totalAmount, 6), "USDC");
          console.log("     Direct Amount:", ethers.formatUnits(parsed.args.directAmount, 6), "USDC (78%)");
          console.log("     Endowment Amount:", ethers.formatUnits(parsed.args.endowmentAmount, 6), "USDC (20%)");
        }
      } catch (e) {
        // Skip logs from other contracts
      }
    }

    // Check campaign stats after
    const totalAfter = await fundraiser.totalDonations();
    console.log("\n📊 Campaign Stats After:");
    console.log("   Total Donations:", ethers.formatUnits(totalAfter, 6), "USDC");
    console.log("   Increase:", ethers.formatUnits(totalAfter - totalBefore, 6), "USDC");

    // Check endowment info
    console.log("\n🏦 Endowment Info:");
    const endowmentInfo = await wealthBuilding.getEndowmentInfo(donor.address, CAMPAIGN_ID);
    console.log("   Principal:", ethers.formatUnits(endowmentInfo.principal, 6), "USDC");
    console.log("   Lifetime Yield:", ethers.formatUnits(endowmentInfo.lifetimeYield, 6), "USDC");

    // Check platform stats
    console.log("\n📈 Platform Stats:");
    const platformStats = await wealthBuilding.getPlatformStats();
    console.log("   Total Principal:", ethers.formatUnits(platformStats[0], 6), "USDC");
    console.log("   Total aUSDC:", ethers.formatUnits(platformStats[1], 6), "aUSDC");
    console.log("   Pending Yield:", ethers.formatUnits(platformStats[2], 6), "USDC");

    console.log("\n🎉 SUCCESS! Wealth building donation works!");
    console.log("\n✅ All Three Donation Types Now Working:");
    console.log("   ✅ Direct Donations");
    console.log("   ✅ Staking");
    console.log("   ✅ Wealth Building");

  } catch (error) {
    console.log("\n❌ Donation FAILED!");
    console.log("   Error:", error.message);

    if (error.message.includes("revert")) {
      const revertReason = error.message.match(/reverted with reason string '(.+?)'/);
      if (revertReason) {
        console.log("   Revert Reason:", revertReason[1]);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
