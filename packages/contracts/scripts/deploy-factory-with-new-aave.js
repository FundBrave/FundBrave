const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Factory with New Aave Pool");
  console.log("Deployer:", deployer.address);

  const deployed = {
    USDC: "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b",
    aUSDC: "0x266d666Eed5934E2371e8A5aD0766174bba06EFc",
    AAVE_POOL: "0x27a07afD7CAc491e1e8b3c75913e50b57161487d"
  };

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

  // 4. Deploy WealthBuildingDonation Implementation
  console.log("\n4️⃣  Deploying WealthBuildingDonation...");
  const WealthBuilding = await ethers.getContractFactory("WealthBuildingDonation");
  const wealthBuildingImpl = await WealthBuilding.deploy();
  await wealthBuildingImpl.waitForDeployment();
  const wealthImplAddress = await wealthBuildingImpl.getAddress();
  console.log("   ✅ Implementation:", wealthImplAddress);

  // 5. Deploy Proxy
  console.log("\n5️⃣  Deploying WealthBuilding Proxy...");
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

  // 6. Configure WealthBuilding in Factory
  console.log("\n6️⃣  Configuring WealthBuilding in Factory...");
  let tx = await factory.setWealthBuildingDonation(deployed.WealthBuilding);
  await tx.wait();
  console.log("   ✅ WealthBuilding configured");

  // 7. Add categories
  console.log("\n7️⃣  Adding categories...");
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
  console.log("🎯 All contracts deployed with matching addresses!");
  console.log("📌 IMPORTANT Next steps:");
  console.log("1. Update .env.local with addresses above");
  console.log("2. Create a campaign through the frontend");
  console.log("3. Register the campaign: Update and run scripts/register-fundraiser.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
