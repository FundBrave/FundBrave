const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const FACTORY_ADDRESS = "0x81438751Aa471269092E5A184540fD4829E15f06";
  const WEALTH_BUILDING_ADDRESS = "0x6145e97Fbfb4c45f7cf7b7307f24B8d6Bc22CA43";

  console.log("🔍 Verifying Factory Configuration");

  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);

  // Check WealthBuildingDonation address
  const wealthBuildingAddr = await factory.wealthBuildingDonation();
  console.log("\nWealthBuildingDonation configured:", wealthBuildingAddr);
  console.log("Expected:", WEALTH_BUILDING_ADDRESS);
  console.log("Match:", wealthBuildingAddr.toLowerCase() === WEALTH_BUILDING_ADDRESS.toLowerCase());

  // Check if paused
  const isPaused = await factory.paused();
  console.log("\nFactory paused:", isPaused);

  // Check fundraisers length
  const currentId = await factory.currentId();
  console.log("Current ID (next fundraiser):", currentId.toString());

  // Try to get fundraiser 0
  try {
    const fundraiserAddr = await factory.getFundraiserById(0n);
    console.log("Fundraiser 0 address:", fundraiserAddr);

    // Check fundraiser details
    const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
    const beneficiary = await fundraiser.beneficiary();
    console.log("Fundraiser 0 beneficiary:", beneficiary);
  } catch (error) {
    console.log("Error getting fundraiser 0:", error.message);
  }

  console.log("\n✅ Configuration check complete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
