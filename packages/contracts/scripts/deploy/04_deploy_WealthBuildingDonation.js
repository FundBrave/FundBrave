/**
 * @title WealthBuildingDonation Deployment Script
 * @notice Deploys the WealthBuildingDonation upgradeable contract
 * @dev WealthBuildingDonation is deployed as a UUPS proxy
 */

const { ethers, upgrades, network } = require("hardhat");
const { getNetworkConfig, validateConfig } = require("./config");
const {
  recordDeployment,
  logDeployment,
  verifyContract,
  getDeployedAddress,
} = require("./utils");

async function main(options = {}) {
  console.log("\n========================================");
  console.log("Deploying WealthBuildingDonation");
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
  const usdcAddress = options.usdc || config.usdc;
  const aavePoolAddress = options.aavePool || config.aavePool;
  const aUsdcAddress = options.aUsdc || config.aUsdc;
  const swapAdapterAddress = options.swapAdapter || config.swapAdapter;
  const platformTreasuryAddress =
    options.platformTreasury ||
    getDeployedAddress(network.name, "PlatformTreasury") ||
    deployer.address; // Use deployer as placeholder if not deployed yet

  // Validate configuration
  console.log("\nConfiguration:");
  console.log("- USDC:", usdcAddress);
  console.log("- Aave Pool:", aavePoolAddress);
  console.log("- aUSDC:", aUsdcAddress);
  console.log("- Swap Adapter:", swapAdapterAddress);
  console.log("- Platform Treasury:", platformTreasuryAddress);

  // For testnets without Aave, we use zero address and the contract won't work for yield
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const effectiveAavePool =
    aavePoolAddress === zeroAddress
      ? "0x0000000000000000000000000000000000000001" // Placeholder
      : aavePoolAddress;
  const effectiveAUsdc =
    aUsdcAddress === zeroAddress
      ? "0x0000000000000000000000000000000000000001" // Placeholder
      : aUsdcAddress;
  const effectiveUsdc =
    usdcAddress === zeroAddress
      ? "0x0000000000000000000000000000000000000001" // Placeholder
      : usdcAddress;

  // Get the contract factory
  const WealthBuildingDonation = await ethers.getContractFactory(
    "WealthBuildingDonation"
  );

  // Deploy as upgradeable proxy (UUPS pattern)
  console.log("\nDeploying WealthBuildingDonation as UUPS proxy...");

  const initArgs = [
    effectiveAavePool, // _aavePool
    effectiveUsdc, // _usdc
    effectiveAUsdc, // _aUsdc
    swapAdapterAddress, // _swapAdapter (can be zero)
    platformTreasuryAddress, // _platformTreasury
    deployer.address, // _owner
  ];

  console.log("\nInitializer arguments:");
  console.log("  _aavePool:", initArgs[0]);
  console.log("  _usdc:", initArgs[1]);
  console.log("  _aUsdc:", initArgs[2]);
  console.log("  _swapAdapter:", initArgs[3]);
  console.log("  _platformTreasury:", initArgs[4]);
  console.log("  _owner:", initArgs[5]);

  const wealthBuildingDonation = await upgrades.deployProxy(
    WealthBuildingDonation,
    initArgs,
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await wealthBuildingDonation.waitForDeployment();

  const contractAddress = await wealthBuildingDonation.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    contractAddress
  );

  // Get deployment transaction
  const deploymentTx = wealthBuildingDonation.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  logDeployment("WealthBuildingDonation", contractAddress, txHash);
  console.log("Implementation Address:", implementationAddress);

  // Record deployment
  recordDeployment(
    network.name,
    "WealthBuildingDonation",
    contractAddress,
    txHash,
    initArgs,
    true, // isProxy
    implementationAddress
  );

  // Verify on block explorer (skip for local networks)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting before verification...");
    await verifyContract(
      require("hardhat"),
      implementationAddress,
      [],
      "contracts/WealthBuildingDonation.sol:WealthBuildingDonation"
    );
  }

  console.log("\n========================================");
  console.log("WealthBuildingDonation deployment complete!");
  console.log("========================================\n");

  return {
    proxy: contractAddress,
    implementation: implementationAddress,
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
