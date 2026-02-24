const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * MINIMAL deployment for quick testing - just USDC + Factory
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 MINIMAL Test Deployment");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const deployed = {};

  // 1. Deploy MockUSDC
  console.log("1️⃣  Deploying MockUSDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  deployed.USDC = await usdc.getAddress();
  console.log("   ✅ USDC:", deployed.USDC);

  // 2. Deploy aUSDC
  console.log("\n2️⃣  Deploying aUSDC...");
  const aUsdc = await MockERC20.deploy("Aave USDC", "aUSDC", 6);
  await aUsdc.waitForDeployment();
  deployed.aUSDC = await aUsdc.getAddress();
  console.log("   ✅ aUSDC:", deployed.aUSDC);

  // 3. Deploy MockAavePool
  console.log("\n3️⃣  Deploying MockAavePool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const aavePool = await MockAavePool.deploy(deployed.USDC, deployed.aUSDC);
  await aavePool.waitForDeployment();
  deployed.AAVE_POOL = await aavePool.getAddress();
  console.log("   ✅ AavePool:", deployed.AAVE_POOL);

  // 4. Deploy Fundraiser Implementation
  console.log("\n4️⃣  Deploying Fundraiser Implementation...");
  const Fundraiser = await ethers.getContractFactory("Fundraiser");
  const fundraiserImpl = await Fundraiser.deploy();
  await fundraiserImpl.waitForDeployment();
  deployed.FundraiserImpl = await fundraiserImpl.getAddress();
  console.log("   ✅ FundraiserImpl:", deployed.FundraiserImpl);

  // 5. Deploy StakingPool Implementation
  console.log("\n5️⃣  Deploying StakingPool Implementation...");
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingImpl = await StakingPool.deploy();
  await stakingImpl.waitForDeployment();
  deployed.StakingPoolImpl = await stakingImpl.getAddress();
  console.log("   ✅ StakingPoolImpl:", deployed.StakingPoolImpl);

  // 6. Deploy Factory with MINIMAL setup
  console.log("\n6️⃣  Deploying Factory (minimal setup)...");
  const Factory = await ethers.getContractFactory("FundraiserFactory");
  const factory = await Factory.deploy(
    deployed.FundraiserImpl,
    deployed.StakingPoolImpl,
    ethers.ZeroAddress, // No swap adapter
    deployed.USDC,
    ethers.ZeroAddress, // No WETH
    deployer.address,   // platformFeeRecipient
    deployed.AAVE_POOL,
    deployed.aUSDC,
    ethers.ZeroAddress, // No Morpho
    0 // Aave staking type
  );
  await factory.waitForDeployment();
  deployed.Factory = await factory.getAddress();
  console.log("   ✅ Factory:", deployed.Factory);

  // 7. Mint Test USDC
  console.log("\n7️⃣  Minting Test USDC...");
  await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
  console.log("   ✅ Minted 100,000 USDC to deployer");

  // Save
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);

  fs.writeFileSync(
    path.join(deploymentsDir, "baseSepolia-minimal.json"),
    JSON.stringify(deployed, null, 2)
  );

  console.log("\n\n🎉 MINIMAL DEPLOYMENT COMPLETE!\n");
  console.log("⚠️  NOTE: This is a MINIMAL setup for testing only");
  console.log("⚠️  WealthBuildingDonation, Treasury, DAO, FBT, and ReceiptOFT are NOT deployed\n");
  console.log("📝 Update test-frontend/.env.local with:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${deployed.Factory}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${deployed.USDC}`);
  console.log(`NEXT_PUBLIC_AAVE_POOL_ADDRESS=${deployed.AAVE_POOL}`);
  console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=0x0000000000000000000000000000000000000000`);
  console.log("\nAll addresses saved to: deployments/baseSepolia-minimal.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
