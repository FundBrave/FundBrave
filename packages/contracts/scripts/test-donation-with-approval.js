const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();

  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";
  const CAMPAIGN_ID = 0;
  const DONATION_AMOUNT = ethers.parseUnits("10", 6); // 10 USDC

  console.log("🧪 Testing Direct Donation with Approval\n");
  console.log("Wallet:", signer.address);
  console.log("Campaign ID:", CAMPAIGN_ID);
  console.log("Donation Amount:", ethers.formatUnits(DONATION_AMOUNT, 6), "USDC");

  // Get contracts
  const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);

  // Check balance
  const balance = await usdc.balanceOf(signer.address);
  console.log("\n💰 USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

  if (balance < DONATION_AMOUNT) {
    console.log("\n⚠️  Insufficient balance. Minting USDC...");
    const mintTx = await usdc.mint(signer.address, DONATION_AMOUNT);
    await mintTx.wait();
    console.log("✅ Minted", ethers.formatUnits(DONATION_AMOUNT, 6), "USDC");
  }

  // Check current allowance
  const currentAllowance = await usdc.allowance(signer.address, FACTORY_ADDRESS);
  console.log("\n🔓 Current Allowance:", ethers.formatUnits(currentAllowance, 6), "USDC");

  if (currentAllowance < DONATION_AMOUNT) {
    console.log("\n📝 Approving Factory to spend USDC...");
    const approveTx = await usdc.approve(FACTORY_ADDRESS, DONATION_AMOUNT);
    await approveTx.wait();
    console.log("✅ Approved", ethers.formatUnits(DONATION_AMOUNT, 6), "USDC");
  }

  // Get fundraiser before donation
  const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
  const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
  const totalBefore = await fundraiser.totalDonations();
  console.log("\n📊 Campaign Stats Before:");
  console.log("  Total Donations:", ethers.formatUnits(totalBefore, 6), "USDC");

  // Make donation
  console.log("\n💸 Making donation...");
  try {
    const donateTx = await factory.donateERC20(CAMPAIGN_ID, USDC_ADDRESS, DONATION_AMOUNT);
    console.log("  Transaction submitted:", donateTx.hash);

    const receipt = await donateTx.wait();
    console.log("  ✅ Transaction confirmed!");
    console.log("  Gas used:", receipt.gasUsed.toString());

    // Check stats after
    const totalAfter = await fundraiser.totalDonations();
    console.log("\n📊 Campaign Stats After:");
    console.log("  Total Donations:", ethers.formatUnits(totalAfter, 6), "USDC");
    console.log("  Increase:", ethers.formatUnits(totalAfter - totalBefore, 6), "USDC");

    console.log("\n🎉 SUCCESS! Direct donation works!");
    console.log("\n📌 Note: Users need to approve the Factory contract before making donations.");
    console.log("   The frontend should check allowance and request approval if needed.");
  } catch (error) {
    console.log("  ❌ Donation FAILED!");
    console.log("  Error:", error.message);

    if (error.message.includes("revert")) {
      const revertReason = error.message.match(/reverted with reason string '(.+?)'/);
      if (revertReason) {
        console.log("  Revert Reason:", revertReason[1]);
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
