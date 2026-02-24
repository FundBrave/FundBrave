const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying WealthBuildingDonation");
  console.log("Deployer:", deployer.address);

  // Contract addresses
  const FACTORY_ADDRESS = "0x81438751Aa471269092E5A184540fD4829E15f06";
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";
  const AAVE_POOL_ADDRESS = "0x1F9CAFa79cA41C5eFAB673E65006993c055C6D6A";
  const AUSDC_ADDRESS = "0xC919390FD02e6E580FE0123d5083fC9c09722984";

  // 1. Deploy WealthBuildingDonation Implementation
  console.log("\n1️⃣  Deploying WealthBuildingDonation Implementation...");
  const WealthBuilding = await ethers.getContractFactory("WealthBuildingDonation");
  const wealthBuildingImpl = await WealthBuilding.deploy();
  await wealthBuildingImpl.waitForDeployment();
  const implAddress = await wealthBuildingImpl.getAddress();
  console.log("   ✅ Implementation:", implAddress);

  // 2. Deploy Proxy
  console.log("\n2️⃣  Deploying Proxy...");
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");

  // Encode initialize call
  const initData = WealthBuilding.interface.encodeFunctionData("initialize", [
    AAVE_POOL_ADDRESS,  // _aavePool
    USDC_ADDRESS,       // _usdc
    AUSDC_ADDRESS,      // _aUsdc
    ethers.ZeroAddress, // _swapAdapter (not needed for test)
    deployer.address,   // _platformTreasury
    deployer.address    // _owner
  ]);

  const proxy = await ERC1967Proxy.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const wealthBuildingAddress = await proxy.getAddress();
  console.log("   ✅ WealthBuildingDonation Proxy:", wealthBuildingAddress);

  // 2. Configure it in Factory
  console.log("\n2️⃣  Configuring WealthBuildingDonation in Factory...");
  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const tx = await factory.setWealthBuildingDonation(wealthBuildingAddress);
  await tx.wait();
  console.log("   ✅ WealthBuildingDonation configured in Factory");

  console.log("\n\n🎉 DEPLOYMENT COMPLETE!\n");
  console.log("📝 Update test-frontend/.env.local:");
  console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=${wealthBuildingAddress}`);
  console.log("\nWealth building donations should now work!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
