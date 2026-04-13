const hre = require("hardhat");

async function main() {
  const factoryAddress = "0x81438751Aa471269092E5A184540fD4829E15f06";
  const factory = await hre.ethers.getContractAt("FundraiserFactory", factoryAddress);

  console.log("Checking campaign...\n");

  // Check campaign count first
  const count = await factory.currentId();
  console.log("Total campaigns:", count.toString());
  console.log("Campaign IDs: 0 to", (Number(count) - 1).toString(), "\n");

  if (count === 0n) {
    console.log("⚠️  No campaigns exist!");
    return;
  }

  try {
    const campaignId = 0; // Try ID 0 first
    const fundraiserAddress = await factory.getFundraiserById(campaignId);
    console.log(`✅ Campaign ${campaignId} fundraiser address:`, fundraiserAddress);

    const fundraiser = await hre.ethers.getContractAt("Fundraiser", fundraiserAddress);

    const name = await fundraiser.name();
    const description = await fundraiser.description();
    const goal = await fundraiser.goal();
    const raised = await fundraiser.totalRaised();
    const beneficiary = await fundraiser.beneficiary();
    const deadline = await fundraiser.deadline();

    console.log("\nCampaign Details:");
    console.log("Name:", name);
    console.log("Description:", description);
    console.log("Goal:", hre.ethers.formatUnits(goal, 6), "USDC");
    console.log("Raised:", hre.ethers.formatUnits(raised, 6), "USDC");
    console.log("Beneficiary:", beneficiary);
    console.log("Deadline:", new Date(Number(deadline) * 1000).toISOString());

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("InvalidFundraiserId")) {
      console.log("\n⚠️  Campaign ID 1 does not exist!");
      console.log("Please check that you created a campaign successfully.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
