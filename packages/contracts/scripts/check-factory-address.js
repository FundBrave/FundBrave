const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const CAMPAIGN_ID = 0;

  console.log("🔍 Checking Factory Address Configuration");
  console.log("Expected Factory:", FACTORY_ADDRESS);

  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
  console.log("\nFundraiser Address:", fundraiserAddr);

  const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);

  const storedFactoryAddress = await fundraiser.factoryAddress();
  console.log("\nStored Factory Address in Fundraiser:", storedFactoryAddress);
  console.log("Match:", storedFactoryAddress.toLowerCase() === FACTORY_ADDRESS.toLowerCase() ? "✅ YES" : "❌ NO");

  if (storedFactoryAddress.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) {
    console.log("\n⚠️  PROBLEM FOUND!");
    console.log("The Fundraiser has the wrong Factory address stored!");
    console.log("This is why direct donations are failing - the onlyFactory modifier rejects the calls.");
  } else {
    console.log("\n✅ Factory address is correct");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
