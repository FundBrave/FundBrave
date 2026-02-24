const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const WEALTH_BUILDING_ADDRESS = "0x6145e97Fbfb4c45f7cf7b7307f24B8d6Bc22CA43";
  const FUNDRAISER_ID = 0;
  const BENEFICIARY = "0x396E931faD8c43c7200D70BbDE91e962CfaCCa5e";

  console.log("📝 Registering Fundraiser in WealthBuildingDonation");
  console.log("Fundraiser ID:", FUNDRAISER_ID);
  console.log("Beneficiary:", BENEFICIARY);

  const wealthBuilding = await ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);

  // Check if already registered
  const currentBeneficiary = await wealthBuilding.fundraiserBeneficiaries(FUNDRAISER_ID);
  console.log("\nCurrent beneficiary:", currentBeneficiary);

  if (currentBeneficiary === ethers.ZeroAddress) {
    console.log("Registering...");
    const tx = await wealthBuilding.registerFundraiser(FUNDRAISER_ID, BENEFICIARY);
    await tx.wait();
    console.log("✅ Fundraiser registered!");
  } else {
    console.log("✅ Fundraiser already registered");
  }

  console.log("\n🎉 Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
