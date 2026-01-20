/**
 * @title StakingPool Implementation Deployment Script
 * @notice Deploys the StakingPool implementation contract (for cloning)
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
  console.log("Deploying StakingPool Implementation");
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
  const StakingPool = await ethers.getContractFactory("StakingPool");

  // Deploy implementation (NOT a proxy - used for cloning)
  console.log("\nDeploying StakingPool implementation...");
  console.log(
    "Note: This is an implementation contract used for Clones.clone() pattern"
  );

  const stakingPool = await StakingPool.deploy();
  await stakingPool.waitForDeployment();

  const stakingPoolAddress = await stakingPool.getAddress();

  // Get deployment transaction
  const deploymentTx = stakingPool.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  if (network.name !== "hardhat" && network.name !== "localhost") {
    await waitForConfirmations(deploymentTx, 2);
  }

  logDeployment("StakingPool (Implementation)", stakingPoolAddress, txHash);

  // Record deployment
  recordDeployment(
    network.name,
    "StakingPoolImplementation",
    stakingPoolAddress,
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
      stakingPoolAddress,
      [],
      "contracts/StakingPool.sol:StakingPool"
    );
  }

  console.log("\n========================================");
  console.log("StakingPool implementation deployment complete!");
  console.log("========================================\n");

  return {
    implementation: stakingPoolAddress,
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
