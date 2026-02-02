/**
 * @title WealthBuildingDonation Manual Deployment Script
 * @notice Deploys WealthBuildingDonation using manual ERC1967 proxy (bypasses hardhat-upgrades)
 * @dev Run: npx hardhat run scripts/deploy/04_deploy_WealthBuildingDonation_Manual.js --network baseSepolia
 *
 * Prerequisites:
 * - FundBraveToken must be deployed
 *
 * Base Sepolia Config:
 * - USDC: 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f
 * - Aave Pool: 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27
 * - aUSDC: 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC
 */

const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("./config");
const {
  recordDeployment,
  logDeployment,
  sleep,
  getDeployedAddress,
} = require("./utils");

async function main() {
  console.log("\n========================================");
  console.log("Deploying WealthBuildingDonation (Manual UUPS)");
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

  // Configuration
  const aavePool = config.aavePool;
  const usdc = config.usdc;
  const aUsdc = config.aUsdc;
  const swapAdapter = config.swapAdapter || ethers.ZeroAddress;
  const platformTreasury = deployer.address; // Temporary, will update after PlatformTreasury is deployed
  const owner = deployer.address;

  console.log("\nConfiguration:");
  console.log("- Aave Pool:", aavePool);
  console.log("- USDC:", usdc);
  console.log("- aUSDC:", aUsdc);
  console.log("- Swap Adapter:", swapAdapter);
  console.log("- Platform Treasury (temp):", platformTreasury);
  console.log("- Owner:", owner);

  // Step 1: Deploy implementation
  console.log("\n[Step 1] Deploying WealthBuildingDonation implementation...");
  const WealthBuildingDonation = await ethers.getContractFactory("WealthBuildingDonation");
  const implementation = await WealthBuildingDonation.deploy();
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
    aavePool,
    usdc,
    aUsdc,
    swapAdapter,
    platformTreasury,
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
  const wbd = await ethers.getContractAt("WealthBuildingDonation", proxyAddress);

  try {
    const storedUsdc = await wbd.usdc();
    const storedOwner = await wbd.owner();
    const storedAavePool = await wbd.aavePool();

    console.log("Stored USDC:", storedUsdc);
    console.log("Stored Owner:", storedOwner);
    console.log("Stored Aave Pool:", storedAavePool);

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
    "WealthBuildingDonation",
    proxyAddress,
    "manual-uups-deployment",
    [aavePool, usdc, aUsdc, swapAdapter, platformTreasury, owner],
    true,
    implAddress
  );

  recordDeployment(
    network.name,
    "WealthBuildingDonationImplementation",
    implAddress,
    "manual-deployment",
    [],
    false,
    null
  );

  logDeployment("WealthBuildingDonation", proxyAddress, "manual-uups-deployment");
  console.log("Implementation Address:", implAddress);

  console.log("\n========================================");
  console.log("WealthBuildingDonation deployment complete!");
  console.log("========================================\n");

  console.log("IMPORTANT: After deploying PlatformTreasury, run:");
  console.log('  await wbd.setPlatformTreasury("PLATFORM_TREASURY_ADDRESS")');

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
