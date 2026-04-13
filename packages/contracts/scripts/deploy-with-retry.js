const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy with retry logic for unstable RPC
 */

async function deployWithRetry(factory, args, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`   Attempt ${i + 1}/${maxRetries}...`);
      const contract = await factory.deploy(...args);
      await contract.waitForDeployment();
      return contract;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`   Failed: ${error.message.slice(0, 50)}... retrying in 5s`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying with Retry Logic");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const deployed = {};

  // Use EXISTING contracts
  deployed.USDC = "0x683617aC1d2b58299a30bAB8328846875823305B";
  deployed.aUSDC = "0xC919390FD02e6E580FE0123d5083fC9c09722984";
  deployed.AAVE_POOL = "0x1F9CAFa79cA41C5eFAB673E65006993c055C6D6A";
  deployed.FBT = "0x6f7f56527418Ee40F98813e5599283d2E3be39De";

  console.log("✅ Using existing contracts\n");

  // 1. Deploy Fundraiser Implementation
  console.log("1️⃣  Deploying Fundraiser Implementation...");
  const Fundraiser = await ethers.getContractFactory("Fundraiser");
  const fundraiserImpl = await deployWithRetry(Fundraiser, []);
  deployed.FundraiserImpl = await fundraiserImpl.getAddress();
  console.log("   ✅ FundraiserImpl:", deployed.FundraiserImpl);

  // 2. Deploy StakingPool Implementation
  console.log("\n2️⃣  Deploying StakingPool Implementation...");
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingImpl = await deployWithRetry(StakingPool, []);
  deployed.StakingPoolImpl = await stakingImpl.getAddress();
  console.log("   ✅ StakingPoolImpl:", deployed.StakingPoolImpl);

  // 3. Deploy Factory
  console.log("\n3️⃣  Deploying Factory...");
  const Factory = await ethers.getContractFactory("FundraiserFactory");
  const factory = await deployWithRetry(Factory, [
    deployed.FundraiserImpl,
    deployed.StakingPoolImpl,
    ethers.ZeroAddress,
    deployed.USDC,
    ethers.ZeroAddress,
    deployer.address,
    deployed.AAVE_POOL,
    deployed.aUSDC,
    ethers.ZeroAddress,
    0
  ]);
  deployed.Factory = await factory.getAddress();
  console.log("   ✅ Factory:", deployed.Factory);

  // Save
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);

  fs.writeFileSync(
    path.join(deploymentsDir, "baseSepolia.json"),
    JSON.stringify(deployed, null, 2)
  );

  console.log("\n\n🎉 DEPLOYMENT COMPLETE!\n");
  console.log("📝 Update test-frontend/.env.local with:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${deployed.Factory}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${deployed.USDC}`);
  console.log(`NEXT_PUBLIC_AAVE_POOL_ADDRESS=${deployed.AAVE_POOL}`);
  console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=0x0000000000000000000000000000000000000000`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
