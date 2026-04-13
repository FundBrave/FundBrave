const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const WEALTH_BUILDING_ADDRESS = "0x39af574bA37b8d3f7632dE5d2e07D08321617857";
  const CAMPAIGN_ID = 0;

  console.log("🔍 Verifying Configuration\n");

  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const wealthBuilding = await ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);

  // Check deployer roles
  console.log("1️⃣  Checking deployer roles...");
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const hasAdminRole = await factory.hasRole(ADMIN_ROLE, deployer.address);
  console.log("   Deployer has ADMIN_ROLE:", hasAdminRole);

  // Read Factory's wealthBuildingDonation
  console.log("\n2️⃣  Checking Factory configuration...");
  const configuredWB = await factory.wealthBuildingDonation();
  console.log("   WealthBuilding in Factory:", configuredWB);
  console.log("   Is zero address:", configuredWB === ethers.ZeroAddress);

  if (configuredWB === ethers.ZeroAddress) {
    console.log("\n   ⚠️  WealthBuilding not configured. Setting it now...");
    const tx = await factory.setWealthBuildingDonation(WEALTH_BUILDING_ADDRESS);
    console.log("   Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("   Transaction confirmed in block:", receipt.blockNumber);

    // Read again
    const configuredWB2 = await factory.wealthBuildingDonation();
    console.log("   WealthBuilding in Factory (after):", configuredWB2);
  }

  // Check WealthBuilding owner
  console.log("\n3️⃣  Checking WealthBuilding ownership...");
  const wbOwner = await wealthBuilding.owner();
  console.log("   WealthBuilding owner:", wbOwner);
  console.log("   Is deployer:", wbOwner.toLowerCase() === deployer.address.toLowerCase());

  // Check fundraiser registration
  console.log("\n4️⃣  Checking fundraiser registration...");
  const registeredBeneficiary = await wealthBuilding.fundraiserBeneficiaries(CAMPAIGN_ID);
  console.log("   Registered beneficiary:", registeredBeneficiary);
  console.log("   Is zero address:", registeredBeneficiary === ethers.ZeroAddress);

  if (registeredBeneficiary === ethers.ZeroAddress) {
    console.log("\n   ⚠️  Fundraiser not registered. Registering now...");
    const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
    const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
    const beneficiary = await fundraiser.beneficiary();

    const tx = await wealthBuilding.registerFundraiser(CAMPAIGN_ID, beneficiary);
    console.log("   Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("   Transaction confirmed in block:", receipt.blockNumber);

    // Read again
    const registeredBeneficiary2 = await wealthBuilding.fundraiserBeneficiaries(CAMPAIGN_ID);
    console.log("   Registered beneficiary (after):", registeredBeneficiary2);
  }

  // Final verification
  console.log("\n5️⃣  Final verification...");
  const finalWB = await factory.wealthBuildingDonation();
  const finalBeneficiary = await wealthBuilding.fundraiserBeneficiaries(CAMPAIGN_ID);

  console.log("   WealthBuilding configured:", finalWB !== ethers.ZeroAddress ? "✅" : "❌");
  console.log("   Fundraiser registered:", finalBeneficiary !== ethers.ZeroAddress ? "✅" : "❌");

  if (finalWB !== ethers.ZeroAddress && finalBeneficiary !== ethers.ZeroAddress) {
    console.log("\n🎉 Configuration complete!");
    console.log("\n📝 Update .env.local:");
    console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=${WEALTH_BUILDING_ADDRESS}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
