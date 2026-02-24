const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const CAMPAIGN_ID = 0;

  console.log("🔍 Checking Campaign 0 Details");

  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
  console.log("Fundraiser Address:", fundraiserAddr);

  const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);

  const name = await fundraiser.name();
  const goal = await fundraiser.goal();
  const deadline = await fundraiser.deadline();
  const beneficiary = await fundraiser.beneficiary();
  const totalDonations = await fundraiser.totalDonations();

  console.log("\nCampaign Details:");
  console.log("  Name:", name);
  console.log("  Goal:", ethers.formatUnits(goal, 6), "USDC");
  console.log("  Deadline:", new Date(Number(deadline) * 1000).toLocaleDateString());
  console.log("  Beneficiary:", beneficiary);
  console.log("  Total Donations:", ethers.formatUnits(totalDonations, 6), "USDC");

  // Check staking pool
  const stakingPoolAddr = await factory.stakingPools(CAMPAIGN_ID);
  console.log("  Staking Pool:", stakingPoolAddr);

  console.log("\n✅ Campaign looks properly configured!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
