/**
 * @title FundraiserFactory Manual Deployment Script
 * @notice Deploys FundraiserFactory (regular contract, no proxy needed)
 * @dev Run: npx hardhat run scripts/deploy/06_deploy_FundraiserFactory_Manual.js --network baseSepolia
 *
 * Prerequisites:
 * - FundraiserImplementation must be deployed
 * - StakingPoolImplementation must be deployed
 * - PlatformTreasury must be deployed
 *
 * Already Deployed (Base Sepolia):
 * - FundBraveToken: 0xE42A6ff84160Ac399607667C32392378Bbb270E0
 * - FundraiserImplementation: 0xf79732B4D25521F2C8d8619c568C065fBf69bc9e
 * - StakingPoolImplementation: 0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8
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
  console.log("Deploying FundraiserFactory");
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
  const fundraiserImplementation =
    options.fundraiserImplementation ||
    getDeployedAddress(network.name, "FundraiserImplementation");
  const stakingPoolImplementation =
    options.stakingPoolImplementation ||
    getDeployedAddress(network.name, "StakingPoolImplementation");
  const platformTreasury =
    options.platformTreasury || getDeployedAddress(network.name, "PlatformTreasury");

  const usdc = options.usdc || config.usdc;
  const weth = options.weth || config.weth;
  const aavePool = options.aavePool || config.aavePool;
  const aUsdc = options.aUsdc || config.aUsdc;
  const morphoVault = options.morphoVault || config.morphoVault || ethers.ZeroAddress;
  const swapAdapter = options.swapAdapter || config.swapAdapter || ethers.ZeroAddress;
  const stakingPoolType = options.stakingPoolType ?? config.stakingPoolType ?? 0;

  // Validate required addresses
  if (!fundraiserImplementation) {
    throw new Error(
      "FundraiserImplementation not found! Deploy it first using 02_deploy_Fundraiser.js"
    );
  }
  if (!stakingPoolImplementation) {
    throw new Error(
      "StakingPoolImplementation not found! Deploy it first using 03_deploy_StakingPool.js"
    );
  }
  if (!platformTreasury) {
    throw new Error(
      "PlatformTreasury not found! Deploy it first using 05_deploy_PlatformTreasury_Manual.js"
    );
  }

  console.log("\nConfiguration:");
  console.log("- Fundraiser Implementation:", fundraiserImplementation);
  console.log("- StakingPool Implementation:", stakingPoolImplementation);
  console.log("- USDC:", usdc);
  console.log("- WETH:", weth);
  console.log("- Platform Treasury:", platformTreasury);
  console.log("- Aave Pool:", aavePool);
  console.log("- aUSDC:", aUsdc);
  console.log("- Morpho Vault:", morphoVault);
  console.log("- Swap Adapter:", swapAdapter);
  console.log("- Staking Pool Type:", stakingPoolType);

  // Constructor arguments
  const constructorArgs = [
    fundraiserImplementation, // _fundraiserImplementation
    stakingPoolImplementation, // _stakingPoolImplementation
    swapAdapter, // _swapAdapter
    usdc, // _usdc
    weth, // _weth
    platformTreasury, // _platformFeeRecipient
    aavePool, // _aavePool
    aUsdc, // _aUsdc
    morphoVault, // _morphoVault
    stakingPoolType, // _stakingPoolType
  ];

  console.log("\nConstructor arguments:");
  console.log("  [0] _fundraiserImplementation:", constructorArgs[0]);
  console.log("  [1] _stakingPoolImplementation:", constructorArgs[1]);
  console.log("  [2] _swapAdapter:", constructorArgs[2]);
  console.log("  [3] _usdc:", constructorArgs[3]);
  console.log("  [4] _weth:", constructorArgs[4]);
  console.log("  [5] _platformFeeRecipient:", constructorArgs[5]);
  console.log("  [6] _aavePool:", constructorArgs[6]);
  console.log("  [7] _aUsdc:", constructorArgs[7]);
  console.log("  [8] _morphoVault:", constructorArgs[8]);
  console.log("  [9] _stakingPoolType:", constructorArgs[9]);

  // Deploy
  console.log("\n[Step 1] Deploying FundraiserFactory...");
  const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
  const factory = await FundraiserFactory.deploy(...constructorArgs);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("FundraiserFactory deployed at:", factoryAddress);

  // Wait for confirmations
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for confirmations...");
    const deployTx = factory.deploymentTransaction();
    if (deployTx) await deployTx.wait(2);
  }

  await sleep(3000);

  // Step 2: Verify initial state
  console.log("\n[Step 2] Verifying initial state...");
  try {
    const currentId = await factory.currentId();
    const totalCreated = await factory.totalFundraisersCreated();
    const categories = await factory.getAvailableCategories();

    console.log("Current ID:", currentId.toString());
    console.log("Total Fundraisers Created:", totalCreated.toString());
    console.log("Available Categories:", categories.join(", "));
    console.log("\nInitial state VERIFIED!");
  } catch (error) {
    console.error("Verification warning:", error.message);
  }

  // Record deployment
  recordDeployment(
    network.name,
    "FundraiserFactory",
    factoryAddress,
    "regular-deployment",
    constructorArgs,
    false,
    null
  );

  logDeployment("FundraiserFactory", factoryAddress, "regular-deployment");

  console.log("\n========================================");
  console.log("FundraiserFactory deployment complete!");
  console.log("========================================\n");

  console.log("IMPORTANT: Now run the configuration script to link all contracts:");
  console.log("  npx hardhat run scripts/deploy/07_configure_contracts.js --network baseSepolia");

  return {
    address: factoryAddress,
    constructorArgs,
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
