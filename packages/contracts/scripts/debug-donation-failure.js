const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const CAMPAIGN_ID = 0;

  console.log("🔍 Debugging Donation Failure\n");

  // Get contracts
  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
  const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);

  console.log("Campaign Address:", fundraiserAddr);
  console.log("Factory Address:", FACTORY_ADDRESS);

  // Check deadline
  const deadline = await fundraiser.deadline();
  const currentTime = Math.floor(Date.now() / 1000);
  const deadlineDate = new Date(Number(deadline) * 1000);
  console.log("\n📅 Deadline Check:");
  console.log("  Current Time:", new Date(currentTime * 1000).toLocaleString());
  console.log("  Deadline:", deadlineDate.toLocaleString());
  console.log("  Before Deadline:", currentTime < Number(deadline) ? "✅ YES" : "❌ NO (EXPIRED!)");

  // Check if paused
  const isPaused = await fundraiser.paused();
  console.log("\n⏸️  Paused Status:");
  console.log("  Is Paused:", isPaused ? "❌ YES (PROBLEM!)" : "✅ NO");

  // Check circuit breaker
  const isTriggered = await fundraiser.isCircuitBreakerTriggered();
  console.log("\n🔌 Circuit Breaker:");
  console.log("  Is Triggered:", isTriggered ? "❌ YES (PROBLEM!)" : "✅ NO");

  // Check factory paused status
  const factoryPaused = await factory.paused();
  console.log("\n🏭 Factory Status:");
  console.log("  Is Paused:", factoryPaused ? "❌ YES (PROBLEM!)" : "✅ NO");

  // Check fundraisers array length
  const fundraisersCount = await factory.fundraisersCount();
  console.log("\n📊 Factory Data:");
  console.log("  Fundraisers Count:", fundraisersCount.toString());
  console.log("  Campaign ID:", CAMPAIGN_ID);
  console.log("  ID Valid:", CAMPAIGN_ID < fundraisersCount ? "✅ YES" : "❌ NO");

  // Try to simulate the donation
  console.log("\n🧪 Simulating Donation...");
  try {
    const [signer] = await ethers.getSigners();
    const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";
    const amount = ethers.parseUnits("10", 6); // 10 USDC

    // Check user's USDC balance
    const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
    const balance = await usdc.balanceOf(signer.address);
    console.log("  User USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

    // Check allowance
    const allowance = await usdc.allowance(signer.address, FACTORY_ADDRESS);
    console.log("  Factory Allowance:", ethers.formatUnits(allowance, 6), "USDC");

    if (balance >= amount) {
      // Try static call to see what would happen
      await factory.donateERC20.staticCall(CAMPAIGN_ID, USDC_ADDRESS, amount);
      console.log("  ✅ Simulation PASSED - donation should work!");
    } else {
      console.log("  ⚠️  Insufficient balance for test");
    }
  } catch (error) {
    console.log("  ❌ Simulation FAILED with error:");
    console.log("  ", error.message);

    if (error.message.includes("revert")) {
      // Try to extract revert reason
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
