const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Adding categories to Factory");
  console.log("Deployer:", deployer.address);

  const factoryAddress = "0x81438751Aa471269092E5A184540fD4829E15f06";
  const factory = await hre.ethers.getContractAt("FundraiserFactory", factoryAddress);

  // Standard categories
  const categories = [
    "Medical",
    "Education",
    "Emergency",
    "Community",
    "Animals",
    "Environment",
    "Arts",
    "Sports",
    "Technology",
    "Other"
  ];

  console.log("\nAdding categories...");
  for (const category of categories) {
    try {
      const tx = await factory.addCategory(category);
      await tx.wait();
      console.log(`✅ Added: ${category}`);
    } catch (error) {
      console.log(`⚠️  Skipped ${category}: ${error.message.slice(0, 50)}`);
    }
  }

  console.log("\n✅ Categories configured!");
  console.log("You can now create campaigns!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
