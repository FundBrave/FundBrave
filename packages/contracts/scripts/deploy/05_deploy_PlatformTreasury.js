/**
 * @title PlatformTreasury Deployment Script
 * @notice Deploys the PlatformTreasury upgradeable contract
 * @dev PlatformTreasury is deployed as a UUPS proxy
 */

const { ethers, upgrades, network } = require("hardhat");
const { getNetworkConfig } = require("./config");
const {
  recordDeployment,
  logDeployment,
  verifyContract,
  getDeployedAddress,
} = require("./utils");

async function main(options = {}) {
  console.log("\n========================================");
  console.log("Deploying PlatformTreasury");
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
  const wealthBuildingDonationAddress =
    options.wealthBuildingDonation ||
    getDeployedAddress(network.name, "WealthBuildingDonation");
  const fbtAddress =
    options.fbt || getDeployedAddress(network.name, "FundBraveToken");

  // For testnets, use placeholder if dependencies not deployed
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const placeholderAddress = "0x0000000000000000000000000000000000000001";

  const effectiveUsdc =
    usdcAddress === zeroAddress ? placeholderAddress : usdcAddress;
  const effectiveWBD =
    !wealthBuildingDonationAddress ||
    wealthBuildingDonationAddress === zeroAddress
      ? placeholderAddress
      : wealthBuildingDonationAddress;
  const effectiveFbt =
    !fbtAddress || fbtAddress === zeroAddress ? placeholderAddress : fbtAddress;

  console.log("\nConfiguration:");
  console.log("- USDC:", effectiveUsdc);
  console.log("- WealthBuildingDonation:", effectiveWBD);
  console.log("- FBT:", effectiveFbt);

  // Get the contract factory
  const PlatformTreasury =
    await ethers.getContractFactory("PlatformTreasury");

  // Deploy as upgradeable proxy (UUPS pattern)
  console.log("\nDeploying PlatformTreasury as UUPS proxy...");

  const initArgs = [
    effectiveUsdc, // _usdc
    effectiveWBD, // _wealthBuildingDonation
    effectiveFbt, // _fbt
    deployer.address, // _owner
  ];

  console.log("\nInitializer arguments:");
  console.log("  _usdc:", initArgs[0]);
  console.log("  _wealthBuildingDonation:", initArgs[1]);
  console.log("  _fbt:", initArgs[2]);
  console.log("  _owner:", initArgs[3]);

  const platformTreasury = await upgrades.deployProxy(
    PlatformTreasury,
    initArgs,
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await platformTreasury.waitForDeployment();

  const contractAddress = await platformTreasury.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    contractAddress
  );

  // Get deployment transaction
  const deploymentTx = platformTreasury.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  logDeployment("PlatformTreasury", contractAddress, txHash);
  console.log("Implementation Address:", implementationAddress);

  // Record deployment
  recordDeployment(
    network.name,
    "PlatformTreasury",
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
      "contracts/PlatformTreasury.sol:PlatformTreasury"
    );
  }

  console.log("\n========================================");
  console.log("PlatformTreasury deployment complete!");
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
