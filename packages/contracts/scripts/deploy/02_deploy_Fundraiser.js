/**
 * @title Fundraiser Implementation Deployment Script
 * @notice Deploys the Fundraiser implementation contract (for cloning)
 * @dev This is NOT a proxy - it's an implementation used by Clones.clone() in FundraiserFactory
 */

const { ethers, network } = require("hardhat");
const {
  recordDeployment,
  logDeployment,
  verifyContract,
  waitForConfirmations,
} = require("./utils");

async function main() {
  console.log("\n========================================");
  console.log("Deploying Fundraiser Implementation");
  console.log(`Network: ${network.name}`);
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Get the contract factory
  const Fundraiser = await ethers.getContractFactory("Fundraiser");

  // Deploy implementation (NOT a proxy - used for cloning)
  console.log("\nDeploying Fundraiser implementation...");
  console.log(
    "Note: This is an implementation contract used for Clones.clone() pattern"
  );

  const fundraiser = await Fundraiser.deploy();
  await fundraiser.waitForDeployment();

  const fundraiserAddress = await fundraiser.getAddress();

  // Get deployment transaction
  const deploymentTx = fundraiser.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  if (network.name !== "hardhat" && network.name !== "localhost") {
    await waitForConfirmations(deploymentTx, 2);
  }

  logDeployment("Fundraiser (Implementation)", fundraiserAddress, txHash);

  // Record deployment
  recordDeployment(
    network.name,
    "FundraiserImplementation",
    fundraiserAddress,
    txHash,
    [], // No constructor args
    false, // Not a proxy
    null
  );

  // Verify on block explorer (skip for local networks)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting before verification...");
    await verifyContract(
      require("hardhat"),
      fundraiserAddress,
      [],
      "contracts/Fundraiser.sol:Fundraiser"
    );
  }

  console.log("\n========================================");
  console.log("Fundraiser implementation deployment complete!");
  console.log("========================================\n");

  return {
    implementation: fundraiserAddress,
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
