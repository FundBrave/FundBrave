const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";

  console.log("🔍 Checking campaigns in NEW Factory");
  console.log("Factory:", FACTORY_ADDRESS);

  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);

  const currentId = await factory.currentId();
  console.log("\nCurrent ID (next campaign):", currentId.toString());
  console.log("Number of campaigns:", currentId.toString());

  if (currentId > 0) {
    console.log("\nExisting campaigns:");
    for (let i = 0; i < currentId; i++) {
      const fundraiserAddr = await factory.getFundraiserById(i);
      console.log(`  Campaign ${i}: ${fundraiserAddr}`);
    }
  } else {
    console.log("\n⚠️  NO CAMPAIGNS YET! You need to create a campaign first.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
