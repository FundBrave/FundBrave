const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying New Factory with New USDC");
  console.log("Deployer:", deployer.address);

  const deployed = {};

  // NEW USDC with public mint
  deployed.USDC = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";

  // Existing contracts from previous deployments
  deployed.aUSDC = "0xC919390FD02e6E580FE0123d5083fC9c09722984";
  deployed.AAVE_POOL = "0x1F9CAFa79cA41C5eFAB673E65006993c055C6D6A";

  console.log("Using USDC:", deployed.USDC);

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
    deployed.USDC,      // NEW USDC!
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

  console.log("\n\n🎉 DEPLOYMENT COMPLETE!\n");
  console.log("📝 Update test-frontend/.env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${deployed.Factory}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${deployed.USDC}`);
  console.log("\nNow minting AND campaign creation should work!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
