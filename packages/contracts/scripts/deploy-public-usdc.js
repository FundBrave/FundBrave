const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying MockUSDC with PUBLIC mint");
  console.log("Deployer:", deployer.address);

  // Deploy MockERC20 with public mint function
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();

  const usdcAddress = await usdc.getAddress();
  console.log("✅ New USDC with PUBLIC mint:", usdcAddress);

  // Test that mint works
  console.log("\n✅ Testing public mint...");
  await usdc.mint(deployer.address, hre.ethers.parseUnits("100000", 6));
  const balance = await usdc.balanceOf(deployer.address);
  console.log("✅ Minted successfully! Balance:", hre.ethers.formatUnits(balance, 6), "USDC");

  console.log("\n📝 Update test-frontend/.env.local:");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log("\n⚠️  Note: Factory still uses old USDC, so campaign creation may not work.");
  console.log("    But you can test minting!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
