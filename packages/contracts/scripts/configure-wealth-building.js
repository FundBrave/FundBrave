const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const WEALTH_BUILDING_ADDRESS = "0x39af574bA37b8d3f7632dE5d2e07D08321617857";
  const CAMPAIGN_ID = 0;

  console.log("🔧 Configuring WealthBuildingDonation\n");
  console.log("Factory:", FACTORY_ADDRESS);
  console.log("WealthBuilding:", WEALTH_BUILDING_ADDRESS);
  console.log("Campaign ID:", CAMPAIGN_ID);

  // Get contracts
  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const wealthBuilding = await ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);

  // Step 1: Set WealthBuilding in Factory
  console.log("\n1️⃣  Setting WealthBuilding address in Factory...");
  let tx = await factory.setWealthBuildingDonation(WEALTH_BUILDING_ADDRESS);
  await tx.wait();
  console.log("   ✅ WealthBuilding configured in Factory");

  // Verify
  const configuredAddress = await factory.wealthBuildingDonation();
  console.log("   Configured address:", configuredAddress);

  // Step 2: Get campaign beneficiary
  console.log("\n2️⃣  Getting campaign beneficiary...");
  const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
  const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
  const beneficiary = await fundraiser.beneficiary();
  console.log("   Beneficiary:", beneficiary);

  // Step 3: Register fundraiser in WealthBuilding
  console.log("\n3️⃣  Registering fundraiser in WealthBuilding...");
  tx = await wealthBuilding.registerFundraiser(CAMPAIGN_ID, beneficiary);
  await tx.wait();
  console.log("   ✅ Fundraiser registered");

  // Verify
  const registeredBeneficiary = await wealthBuilding.fundraiserBeneficiaries(CAMPAIGN_ID);
  console.log("   Registered beneficiary:", registeredBeneficiary);

  if (registeredBeneficiary.toLowerCase() === beneficiary.toLowerCase()) {
    console.log("\n🎉 SUCCESS! WealthBuildingDonation is fully configured!");
    console.log("\n📝 Next steps:");
    console.log("1. Update test-frontend/.env.local:");
    console.log(`   NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=${WEALTH_BUILDING_ADDRESS}`);
    console.log("2. Restart the frontend");
    console.log("3. Test wealth building donations!");
  } else {
    console.log("\n⚠️  Beneficiary mismatch!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
