const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Simplified deployment for Base Sepolia testnet
 * Focuses on core functionality needed for testing
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const deployed = {};

  // 1. Mock tokens
  console.log("1. Deploying Mock Tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  deployed.USDC = await usdc.getAddress();
  console.log("USDC:", deployed.USDC);

  const aUSDC = await MockERC20.deploy("Aave USDC", "aUSDC", 6);
  await aUSDC.waitForDeployment();
  deployed.aUSDC = await aUSDC.getAddress();
  console.log("aUSDC:", deployed.aUSDC);

  // 2. Mock Aave Pool
  console.log("\n2. Deploying Mock Aave Pool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const aavePool = await MockAavePool.deploy(deployed.USDC, deployed.aUSDC);
  await aavePool.waitForDeployment();
  deployed.AAVE_POOL = await aavePool.getAddress();
  console.log("MockAavePool:", deployed.AAVE_POOL);

  // 3. FBT Token
  console.log("\n3. Deploying FBT...");
  const FBT = await ethers.getContractFactory("FundBraveToken");
  const fbt = await upgrades.deployProxy(FBT, [deployer.address], { kind: "uups" });
  await fbt.waitForDeployment();
  deployed.FBT = await fbt.getAddress();
  console.log("FBT:", deployed.FBT);

  // 4. Receipt OFT
  console.log("\n4. Deploying ReceiptOFT...");
  const ReceiptOFT = await ethers.getContractFactory("ReceiptOFT");
  const lzEndpoint = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const receiptOFT = await ReceiptOFT.deploy("FundBrave Receipt", "rcptUSDC", lzEndpoint, deployer.address);
  await receiptOFT.waitForDeployment();
  deployed.ReceiptOFT = await receiptOFT.getAddress();
  console.log("ReceiptOFT:", deployed.ReceiptOFT);

  // 5. WealthBuildingDonation (deploy before Treasury)
  console.log("\n5. Deploying WealthBuildingDonation...");
  const WBD = await ethers.getContractFactory("WealthBuildingDonation");
  // Initialize with correct parameter order: aavePool, usdc, aUsdc, swapAdapter, platformTreasury, owner
  const wbd = await upgrades.deployProxy(
    WBD,
    [
      deployed.AAVE_POOL,        // _aavePool
      deployed.USDC,              // _usdc
      deployed.aUSDC,             // _aUsdc
      ethers.ZeroAddress,         // _swapAdapter (can be zero initially)
      ethers.ZeroAddress,         // _platformTreasury (placeholder, will update later)
      deployer.address            // _owner
    ],
    { kind: "uups" }
  );
  await wbd.waitForDeployment();
  deployed.WealthBuildingDonation = await wbd.getAddress();
  console.log("WealthBuildingDonation:", deployed.WealthBuildingDonation);

  // 6. PlatformTreasury
  console.log("\n6. Deploying PlatformTreasury...");
  const Treasury = await ethers.getContractFactory("PlatformTreasury");
  const treasury = await upgrades.deployProxy(
    Treasury,
    [
      deployed.USDC,
      deployed.WealthBuildingDonation,
      deployed.FBT,
      deployer.address
    ],
    { kind: "uups" }
  );
  await treasury.waitForDeployment();
  deployed.PlatformTreasury = await treasury.getAddress();
  console.log("PlatformTreasury:", deployed.PlatformTreasury);

  // 7. Update WBD with real treasury address
  console.log("\n7. Updating WBD treasury address...");
  const wbdContract = await ethers.getContractAt("WealthBuildingDonation", deployed.WealthBuildingDonation);
  await wbdContract.setPlatformTreasury(deployed.PlatformTreasury);
  console.log("Treasury address updated");

  // 8. ImpactDAOPool
  console.log("\n8. Deploying ImpactDAOPool...");
  const DAO = await ethers.getContractFactory("ImpactDAOPool");
  const dao = await upgrades.deployProxy(
    DAO,
    [deployed.FBT, deployed.USDC, deployed.AAVE_POOL, deployed.aUSDC, deployer.address],
    { kind: "uups" }
  );
  await dao.waitForDeployment();
  deployed.ImpactDAOPool = await dao.getAddress();
  console.log("ImpactDAOPool:", deployed.ImpactDAOPool);

  // 9. Implementation contracts
  console.log("\n9. Deploying Implementations...");
  const Fundraiser = await ethers.getContractFactory("Fundraiser");
  const fundraiserImpl = await Fundraiser.deploy();
  await fundraiserImpl.waitForDeployment();
  deployed.FundraiserImpl = await fundraiserImpl.getAddress();
  console.log("FundraiserImpl:", deployed.FundraiserImpl);

  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingImpl = await StakingPool.deploy();
  await stakingImpl.waitForDeployment();
  deployed.StakingPoolImpl = await stakingImpl.getAddress();
  console.log("StakingPoolImpl:", deployed.StakingPoolImpl);

  // 10. Factory
  console.log("\n10. Deploying Factory...");
  const Factory = await ethers.getContractFactory("FundraiserFactory");
  const factory = await Factory.deploy(
    deployed.FundraiserImpl,
    deployed.StakingPoolImpl,
    ethers.ZeroAddress, // No swap adapter
    deployed.USDC,
    ethers.ZeroAddress, // No WETH
    deployed.AAVE_POOL,
    deployed.aUSDC,
    ethers.ZeroAddress, // No Morpho
    0, // Aave staking type
    deployer.address
  );
  await factory.waitForDeployment();
  deployed.Factory = await factory.getAddress();
  console.log("Factory:", deployed.Factory);

  // 11. Configure Factory
  console.log("\n11. Configuring Factory...");
  await factory.setWealthBuildingDonation(deployed.WealthBuildingDonation);
  await factory.setImpactDAOPool(deployed.ImpactDAOPool);
  await factory.setPlatformTreasury(deployed.PlatformTreasury);
  await factory.setReceiptOFT(deployed.ReceiptOFT);
  await factory.setFBTToken(deployed.FBT);
  console.log("Factory configured");

  // 12. Grant permissions
  console.log("\n12. Granting Permissions...");
  const FUNDRAISER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FUNDRAISER_ROLE"));
  await wbdContract.grantRole(FUNDRAISER_ROLE, deployed.Factory);
  await receiptOFT.setController(deployed.Factory, true);
  console.log("Permissions granted");

  // 13. Mint test USDC
  console.log("\n13. Minting Test USDC...");
  await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
  console.log("Minted 100,000 USDC to deployer");

  // Save addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  fs.writeFileSync(
    path.join(deploymentsDir, "baseSepolia.json"),
    JSON.stringify(deployed, null, 2)
  );

  console.log("\n✅ Deployment Complete!");
  console.log("\nAddresses saved to deployments/baseSepolia.json");
  console.log("\nKey Contracts:");
  console.log("Factory:", deployed.Factory);
  console.log("USDC:", deployed.USDC);
  console.log("Aave Pool:", deployed.AAVE_POOL);
  console.log("\nTest the app at: packages/test-frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
