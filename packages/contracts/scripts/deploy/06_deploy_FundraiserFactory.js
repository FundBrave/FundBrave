/**
 * @title FundraiserFactory Deployment Script
 * @notice Deploys the FundraiserFactory contract (non-upgradeable)
 * @dev FundraiserFactory is a regular contract with AccessControl
 */

const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("./config");
const {
  recordDeployment,
  logDeployment,
  verifyContract,
  getDeployedAddress,
  waitForConfirmations,
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

  // Get required addresses from options or previous deployments
  const fundraiserImplementation =
    options.fundraiserImplementation ||
    getDeployedAddress(network.name, "FundraiserImplementation");
  const stakingPoolImplementation =
    options.stakingPoolImplementation ||
    getDeployedAddress(network.name, "StakingPoolImplementation");
  const platformTreasuryAddress =
    options.platformTreasury ||
    getDeployedAddress(network.name, "PlatformTreasury");

  const usdcAddress = options.usdc || config.usdc;
  const wethAddress = options.weth || config.weth;
  const aavePoolAddress = options.aavePool || config.aavePool;
  const aUsdcAddress = options.aUsdc || config.aUsdc;
  const morphoVaultAddress = options.morphoVault || config.morphoVault;
  const swapAdapterAddress = options.swapAdapter || config.swapAdapter;
  const stakingPoolType = options.stakingPoolType ?? config.stakingPoolType ?? 0;

  // Validate required addresses
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const placeholderAddress = "0x0000000000000000000000000000000000000001";

  if (!fundraiserImplementation) {
    throw new Error(
      "Fundraiser implementation not deployed. Run 02_deploy_Fundraiser.js first."
    );
  }
  if (!stakingPoolImplementation) {
    throw new Error(
      "StakingPool implementation not deployed. Run 03_deploy_StakingPool.js first."
    );
  }

  // Use placeholder addresses for testnets without full DeFi infrastructure
  const effectiveUsdc =
    usdcAddress === zeroAddress ? placeholderAddress : usdcAddress;
  const effectiveWeth =
    wethAddress === zeroAddress ? placeholderAddress : wethAddress;
  const effectivePlatformTreasury =
    platformTreasuryAddress || deployer.address;
  const effectiveSwapAdapter = swapAdapterAddress || zeroAddress;
  const effectiveAavePool = aavePoolAddress || zeroAddress;
  const effectiveAUsdc = aUsdcAddress || zeroAddress;
  const effectiveMorphoVault = morphoVaultAddress || zeroAddress;

  console.log("\nConfiguration:");
  console.log("- Fundraiser Implementation:", fundraiserImplementation);
  console.log("- StakingPool Implementation:", stakingPoolImplementation);
  console.log("- Swap Adapter:", effectiveSwapAdapter);
  console.log("- USDC:", effectiveUsdc);
  console.log("- WETH:", effectiveWeth);
  console.log("- Platform Fee Recipient:", effectivePlatformTreasury);
  console.log("- Aave Pool:", effectiveAavePool);
  console.log("- aUSDC:", effectiveAUsdc);
  console.log("- Morpho Vault:", effectiveMorphoVault);
  console.log("- Staking Pool Type:", stakingPoolType);

  // Get the contract factory
  const FundraiserFactory =
    await ethers.getContractFactory("FundraiserFactory");

  // Constructor arguments
  const constructorArgs = [
    fundraiserImplementation, // _fundraiserImplementation
    stakingPoolImplementation, // _stakingPoolImplementation
    effectiveSwapAdapter, // _swapAdapter
    effectiveUsdc, // _usdc
    effectiveWeth, // _weth
    effectivePlatformTreasury, // _platformFeeRecipient
    effectiveAavePool, // _aavePool
    effectiveAUsdc, // _aUsdc
    effectiveMorphoVault, // _morphoVault
    stakingPoolType, // _stakingPoolType
  ];

  console.log("\nConstructor arguments:");
  console.log("  _fundraiserImplementation:", constructorArgs[0]);
  console.log("  _stakingPoolImplementation:", constructorArgs[1]);
  console.log("  _swapAdapter:", constructorArgs[2]);
  console.log("  _usdc:", constructorArgs[3]);
  console.log("  _weth:", constructorArgs[4]);
  console.log("  _platformFeeRecipient:", constructorArgs[5]);
  console.log("  _aavePool:", constructorArgs[6]);
  console.log("  _aUsdc:", constructorArgs[7]);
  console.log("  _morphoVault:", constructorArgs[8]);
  console.log("  _stakingPoolType:", constructorArgs[9]);

  // Deploy
  console.log("\nDeploying FundraiserFactory...");

  const factory = await FundraiserFactory.deploy(...constructorArgs);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  // Get deployment transaction
  const deploymentTx = factory.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  if (network.name !== "hardhat" && network.name !== "localhost") {
    await waitForConfirmations(deploymentTx, 2);
  }

  logDeployment("FundraiserFactory", factoryAddress, txHash);

  // Verify initial state
  console.log("\nVerifying initial state...");
  const currentId = await factory.currentId();
  const totalFundraisersCreated = await factory.totalFundraisersCreated();
  const categories = await factory.getAvailableCategories();

  console.log(`Current ID: ${currentId}`);
  console.log(`Total Fundraisers Created: ${totalFundraisersCreated}`);
  console.log(`Available Categories: ${categories.join(", ")}`);

  // Record deployment
  recordDeployment(
    network.name,
    "FundraiserFactory",
    factoryAddress,
    txHash,
    constructorArgs,
    false, // Not a proxy
    null
  );

  // Verify on block explorer (skip for local networks)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting before verification...");
    await verifyContract(
      require("hardhat"),
      factoryAddress,
      constructorArgs,
      "contracts/FundraiserFactory.sol:FundraiserFactory"
    );
  }

  console.log("\n========================================");
  console.log("FundraiserFactory deployment complete!");
  console.log("========================================\n");

  return {
    address: factoryAddress,
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
