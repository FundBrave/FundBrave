const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy only Factory + Implementations using existing USDC, aUSDC, AavePool from previous deployment
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Factory (reusing existing contracts)");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const deployed = {};

  // Use EXISTING contracts from the comprehensive deployment attempt
  deployed.USDC = "0x683617aC1d2b58299a30bAB8328846875823305B";
  deployed.aUSDC = "0xC919390FD02e6E580FE0123d5083fC9c09722984";
  deployed.AAVE_POOL = "0x1F9CAFa79cA41C5eFAB673E65006993c055C6D6A";
  deployed.FBT = "0x6f7f56527418Ee40F98813e5599283d2E3be39De";

  console.log("✅ Using existing USDC:", deployed.USDC);
  console.log("✅ Using existing aUSDC:", deployed.aUSDC);
  console.log("✅ Using existing AavePool:", deployed.AAVE_POOL);
  console.log("✅ Using existing FBT:", deployed.FBT);

  // 1. Deploy Fundraiser Implementation
  console.log("\n1️⃣  Deploying Fundraiser Implementation...");
  const Fundraiser = await ethers.getContractFactory("Fundraiser");
  const fundraiserImpl = await Fundraiser.deploy();
  await fundraiserImpl.waitForDeployment();
  deployed.FundraiserImpl = await fundraiserImpl.getAddress();
  console.log("   ✅ FundraiserImpl:", deployed.FundraiserImpl);

  // 2. Deploy StakingPool Implementation
  console.log("\n2️⃣  Deploying StakingPool Implementation...");
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingImpl = await StakingPool.deploy();
  await stakingImpl.waitForDeployment();
  deployed.StakingPoolImpl = await stakingImpl.getAddress();
  console.log("   ✅ StakingPoolImpl:", deployed.StakingPoolImpl);

  // 3. Deploy Factory
  console.log("\n3️⃣  Deploying Factory...");
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

  // Save
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);

  fs.writeFileSync(
    path.join(deploymentsDir, "baseSepolia-factory.json"),
    JSON.stringify(deployed, null, 2)
  );

  console.log("\n\n🎉 FACTORY DEPLOYMENT COMPLETE!\n");
  console.log("⚠️  NOTE: This uses existing USDC/aUSDC/AavePool/FBT from previous deployment");
  console.log("⚠️  WealthBuildingDonation, Treasury, DAO, and ReceiptOFT are NOT deployed\n");
  console.log("📝 Update test-frontend/.env.local with:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${deployed.Factory}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${deployed.USDC}`);
  console.log(`NEXT_PUBLIC_AAVE_POOL_ADDRESS=${deployed.AAVE_POOL}`);
  console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=0x0000000000000000000000000000000000000000`);
  console.log("\nAll addresses saved to: deployments/baseSepolia-factory.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
