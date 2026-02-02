/**
 * @title PlatformTreasury Manual Deployment Script
 * @notice Deploys PlatformTreasury using manual ERC1967 proxy (bypasses hardhat-upgrades)
 * @dev Run: npx hardhat run scripts/deploy/05_deploy_PlatformTreasury_Manual.js --network baseSepolia
 *
 * Prerequisites:
 * - FundBraveToken must be deployed
 * - WealthBuildingDonation must be deployed
 *
 * Base Sepolia Config:
 * - USDC: 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f
 * - FundBraveToken: 0xE42A6ff84160Ac399607667C32392378Bbb270E0
 */

const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("./config");
const {
  recordDeployment,
  logDeployment,
  sleep,
  getDeployedAddress,
} = require("./utils");

async function main(options = {}) {
  console.log("\n========================================");
  console.log("Deploying PlatformTreasury (Manual UUPS)");
  console.log(`Network: ${network.name}`);
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Get network configuration
  const config = getNetworkConfig(network.name);

  // Get required addresses
  const usdc = options.usdc || config.usdc;
  const wealthBuildingDonation =
    options.wealthBuildingDonation || getDeployedAddress(network.name, "WealthBuildingDonation");
  const fbt = options.fbt || getDeployedAddress(network.name, "FundBraveToken");
  const owner = deployer.address;

  // Validate required addresses
  if (!wealthBuildingDonation) {
    throw new Error(
      "WealthBuildingDonation not found! Deploy it first using 04_deploy_WealthBuildingDonation_Manual.js"
    );
  }
  if (!fbt) {
    throw new Error("FundBraveToken not found! Deploy it first using 01_deploy_FundBraveToken.js");
  }

  console.log("\nConfiguration:");
  console.log("- USDC:", usdc);
  console.log("- WealthBuildingDonation:", wealthBuildingDonation);
  console.log("- FBT:", fbt);
  console.log("- Owner:", owner);

  // Step 1: Deploy implementation
  console.log("\n[Step 1] Deploying PlatformTreasury implementation...");
  const PlatformTreasury = await ethers.getContractFactory("PlatformTreasury");
  const implementation = await PlatformTreasury.deploy();
  await implementation.waitForDeployment();
  const implAddress = await implementation.getAddress();
  console.log("Implementation deployed at:", implAddress);

  // Wait for confirmations
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for confirmations...");
    const deployTx = implementation.deploymentTransaction();
    if (deployTx) await deployTx.wait(2);
  }

  await sleep(5000);

  // Step 2: Encode initialization data
  console.log("\n[Step 2] Encoding initialization data...");
  const initData = implementation.interface.encodeFunctionData("initialize", [
    usdc,
    wealthBuildingDonation,
    fbt,
    owner,
  ]);
  console.log("Init data encoded successfully");

  // Step 3: Deploy ERC1967 proxy
  console.log("\n[Step 3] Deploying ERC1967 proxy...");
  const ERC1967Proxy = await ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
  );
  const proxy = await ERC1967Proxy.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("Proxy deployed at:", proxyAddress);

  // Wait for confirmations
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for confirmations...");
    const proxyTx = proxy.deploymentTransaction();
    if (proxyTx) await proxyTx.wait(2);
  }

  await sleep(3000);

  // Step 4: Verify initialization
  console.log("\n[Step 4] Verifying proxy initialization...");
  const pt = await ethers.getContractAt("PlatformTreasury", proxyAddress);

  try {
    const storedUsdc = await pt.USDC();
    const storedOwner = await pt.owner();
    const storedWbd = await pt.wealthBuildingDonation();

    console.log("Stored USDC:", storedUsdc);
    console.log("Stored Owner:", storedOwner);
    console.log("Stored WealthBuildingDonation:", storedWbd);

    if (storedUsdc.toLowerCase() !== usdc.toLowerCase()) {
      throw new Error("USDC address mismatch!");
    }
    console.log("\nProxy initialization VERIFIED!");
  } catch (error) {
    console.error("Verification warning:", error.message);
  }

  // Record deployment
  recordDeployment(
    network.name,
    "PlatformTreasury",
    proxyAddress,
    "manual-uups-deployment",
    [usdc, wealthBuildingDonation, fbt, owner],
    true,
    implAddress
  );

  recordDeployment(
    network.name,
    "PlatformTreasuryImplementation",
    implAddress,
    "manual-deployment",
    [],
    false,
    null
  );

  logDeployment("PlatformTreasury", proxyAddress, "manual-uups-deployment");
  console.log("Implementation Address:", implAddress);

  console.log("\n========================================");
  console.log("PlatformTreasury deployment complete!");
  console.log("========================================\n");

  console.log("IMPORTANT: Now update WealthBuildingDonation with new PlatformTreasury address:");
  console.log(`  const wbd = await ethers.getContractAt("WealthBuildingDonation", "${wealthBuildingDonation}")`);
  console.log(`  await wbd.setPlatformTreasury("${proxyAddress}")`);

  return {
    proxy: proxyAddress,
    implementation: implAddress,
  };
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
