const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying New MockAavePool");
  console.log("Deployer:", deployer.address);

  // Use existing USDC that's working
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";

  // 1. Deploy aUSDC
  console.log("\n1️⃣  Deploying aUSDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const aUsdc = await MockERC20.deploy("Aave USDC", "aUSDC", 6);
  await aUsdc.waitForDeployment();
  const aUSDC_ADDRESS = await aUsdc.getAddress();
  console.log("   ✅ aUSDC:", aUSDC_ADDRESS);

  // 2. Deploy MockAavePool
  console.log("\n2️⃣  Deploying MockAavePool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const aavePool = await MockAavePool.deploy(USDC_ADDRESS, aUSDC_ADDRESS);
  await aavePool.waitForDeployment();
  const AAVE_POOL_ADDRESS = await aavePool.getAddress();
  console.log("   ✅ Aave Pool:", AAVE_POOL_ADDRESS);

  console.log("\n\n🎉 DEPLOYMENT COMPLETE!\n");
  console.log("📝 Now run:");
  console.log(`npx hardhat run scripts/deploy-factory-with-new-aave.js --network baseSepolia`);
  console.log("");
  console.log("Addresses to use:");
  console.log(`USDC: ${USDC_ADDRESS}`);
  console.log(`aUSDC: ${aUSDC_ADDRESS}`);
  console.log(`AAVE_POOL: ${AAVE_POOL_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
