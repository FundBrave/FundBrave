const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🔍 Debugging WealthBuildingDonation Deployment\n");
  console.log("Deployer:", deployer.address);

  const deployed = {
    USDC: "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b",
    aUSDC: "0x266d666Eed5934E2371e8A5aD0766174bba06EFc",
    AAVE_POOL: "0x27a07afD7CAc491e1e8b3c75913e50b57161487d"
  };

  console.log("\n📋 Using addresses:");
  console.log("  USDC:", deployed.USDC);
  console.log("  aUSDC:", deployed.aUSDC);
  console.log("  Aave Pool:", deployed.AAVE_POOL);

  // Step 1: Deploy implementation
  console.log("\n1️⃣  Deploying WealthBuildingDonation Implementation...");
  const WealthBuilding = await ethers.getContractFactory("WealthBuildingDonation");
  const wealthBuildingImpl = await WealthBuilding.deploy();
  await wealthBuildingImpl.waitForDeployment();
  const implAddress = await wealthBuildingImpl.getAddress();
  console.log("   ✅ Implementation:", implAddress);

  // Step 2: Encode initialize data
  console.log("\n2️⃣  Encoding initialize data...");
  const initData = WealthBuilding.interface.encodeFunctionData("initialize", [
    deployed.AAVE_POOL,   // _aavePool
    deployed.USDC,        // _usdc
    deployed.aUSDC,       // _aUsdc
    ethers.ZeroAddress,   // _swapAdapter (can be zero)
    deployer.address,     // _platformTreasury
    deployer.address      // _owner
  ]);
  console.log("   ✅ Init data length:", initData.length);

  // Step 3: Try to call initialize directly on implementation (should fail - for testing only)
  console.log("\n3️⃣  Testing initialize on implementation (should fail)...");
  try {
    await wealthBuildingImpl.initialize.staticCall(
      deployed.AAVE_POOL,
      deployed.USDC,
      deployed.aUSDC,
      ethers.ZeroAddress,
      deployer.address,
      deployer.address
    );
    console.log("   ⚠️  Initialize succeeded (unexpected - implementation should be locked)");
  } catch (error) {
    if (error.message.includes("InvalidInitialization")) {
      console.log("   ✅ Initialize properly blocked on implementation");
    } else {
      console.log("   ❌ Unexpected error:", error.message.substring(0, 100));
    }
  }

  // Step 4: Deploy proxy
  console.log("\n4️⃣  Deploying ERC1967Proxy...");
  try {
    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");

    console.log("   📤 Submitting proxy deployment transaction...");
    const proxy = await ERC1967Proxy.deploy(implAddress, initData);

    console.log("   ⏳ Waiting for deployment...");
    await proxy.waitForDeployment();

    const proxyAddress = await proxy.getAddress();
    console.log("   ✅ Proxy deployed:", proxyAddress);

    // Verify it's working
    console.log("\n5️⃣  Verifying proxy initialization...");
    const wealthBuilding = await ethers.getContractAt("WealthBuildingDonation", proxyAddress);

    const owner = await wealthBuilding.owner();
    const usdc = await wealthBuilding.usdc();
    const aavePool = await wealthBuilding.aavePool();
    const platformTreasury = await wealthBuilding.platformTreasury();

    console.log("   Owner:", owner);
    console.log("   USDC:", usdc);
    console.log("   Aave Pool:", aavePool);
    console.log("   Platform Treasury:", platformTreasury);

    if (owner.toLowerCase() === deployer.address.toLowerCase() &&
        usdc.toLowerCase() === deployed.USDC.toLowerCase() &&
        aavePool.toLowerCase() === deployed.AAVE_POOL.toLowerCase()) {
      console.log("\n🎉 SUCCESS! WealthBuildingDonation deployed correctly!");
      console.log("\n📝 Update .env.local:");
      console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=${proxyAddress}`);
    } else {
      console.log("\n⚠️  Proxy deployed but values don't match!");
    }

  } catch (error) {
    console.log("\n❌ PROXY DEPLOYMENT FAILED!");
    console.log("\nError details:");
    console.log("  Message:", error.message);

    if (error.message.includes("revert")) {
      console.log("\n🔍 The transaction reverted during proxy deployment.");
      console.log("This usually means the initialize function is failing.");

      // Try to extract more details
      if (error.data) {
        console.log("\nError data:", error.data);
      }

      console.log("\n💡 Possible causes:");
      console.log("  1. One of the zero-address checks is failing");
      console.log("  2. The __Ownable_init is failing (check OpenZeppelin version)");
      console.log("  3. The forceApprove call at the end is failing");
      console.log("  4. USDC contract doesn't support approve function");

      // Let's test each parameter
      console.log("\n🧪 Testing initialize parameters:");
      console.log("  AAVE_POOL == address(0)?", deployed.AAVE_POOL === ethers.ZeroAddress);
      console.log("  USDC == address(0)?", deployed.USDC === ethers.ZeroAddress);
      console.log("  aUSDC == address(0)?", deployed.aUSDC === ethers.ZeroAddress);
      console.log("  platformTreasury == address(0)?", deployer.address === ethers.ZeroAddress);
      console.log("  owner == address(0)?", deployer.address === ethers.ZeroAddress);
    }

    console.log("\n📊 Full error:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
