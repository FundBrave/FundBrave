const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Complete FundBrave System");
  console.log("Deployer:", deployer.address);
  console.log("");

  const deployed = {};

  // 1. Deploy MockERC20 (USDC)
  console.log("1️⃣  Deploying MockERC20 (USDC)...");
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
  console.log("   ✅ Aave Pool:", deployed.AAVE_POOL);

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

  // 6. Deploy Factory
  console.log("\n6️⃣  Deploying Factory...");
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

  // 7. Deploy WealthBuildingDonation Implementation
  console.log("\n7️⃣  Deploying WealthBuildingDonation...");
  const WealthBuilding = await ethers.getContractFactory("WealthBuildingDonation");
  const wealthBuildingImpl = await WealthBuilding.deploy();
  await wealthBuildingImpl.waitForDeployment();
  const wealthImplAddress = await wealthBuildingImpl.getAddress();
  console.log("   ✅ Implementation:", wealthImplAddress);

  // 8. Deploy Proxy
  console.log("\n8️⃣  Deploying WealthBuilding Proxy...");
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const initData = WealthBuilding.interface.encodeFunctionData("initialize", [
    deployed.AAVE_POOL,  // _aavePool
    deployed.USDC,       // _usdc
    deployed.aUSDC,      // _aUsdc
    ethers.ZeroAddress,  // _swapAdapter
    deployer.address,    // _platformTreasury
    deployer.address     // _owner
  ]);
  const proxy = await ERC1967Proxy.deploy(wealthImplAddress, initData);
  await proxy.waitForDeployment();
  deployed.WealthBuilding = await proxy.getAddress();
  console.log("   ✅ WealthBuilding Proxy:", deployed.WealthBuilding);

  // 9. Configure WealthBuilding in Factory
  console.log("\n9️⃣  Configuring WealthBuilding in Factory...");
  let tx = await factory.setWealthBuildingDonation(deployed.WealthBuilding);
  await tx.wait();
  console.log("   ✅ WealthBuilding configured");

  // 10. Add categories
  console.log("\n🔟 Adding categories...");
  const categories = ["Medical", "Education", "Environment", "Community", "Emergency"];
  for (const category of categories) {
    tx = await factory.addCategory(category);
    await tx.wait();
  }
  console.log("   ✅ Categories added");

  console.log("\n\n🎉 DEPLOYMENT COMPLETE!\n");
  console.log("📝 Update test-frontend/.env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${deployed.Factory}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${deployed.USDC}`);
  console.log(`NEXT_PUBLIC_AAVE_POOL_ADDRESS=${deployed.AAVE_POOL}`);
  console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=${deployed.WealthBuilding}`);
  console.log("");
  console.log("🎯 All contracts deployed with matching USDC address!");
  console.log("📌 Next steps:");
  console.log("1. Update .env.local with addresses above");
  console.log("2. Mint USDC: npx hardhat run scripts/mint-usdc.js --network baseSepolia");
  console.log("3. Create campaign through frontend");
  console.log("4. Register campaign: npx hardhat run scripts/register-fundraiser.js --network baseSepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
