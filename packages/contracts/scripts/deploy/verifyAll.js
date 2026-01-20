/**
 * @title Verification Script
 * @notice Verifies all deployed contracts on the block explorer
 * @dev Reads deployment data from the deployments directory
 */

const { network } = require("hardhat");
const { loadDeployments, verifyContract, sleep } = require("./utils");

async function main() {
  console.log("\n========================================");
  console.log("Contract Verification");
  console.log(`Network: ${network.name}`);
  console.log("========================================\n");

  const deployments = loadDeployments(network.name);

  if (!deployments.contracts || Object.keys(deployments.contracts).length === 0) {
    console.log("No deployments found for this network.");
    console.log("Run the deployment scripts first.");
    return;
  }

  const hre = require("hardhat");
  const contracts = deployments.contracts;

  // Define verification order and contract paths
  const verificationOrder = [
    {
      name: "FundBraveToken",
      key: "FundBraveToken",
      path: "contracts/FundBraveToken.sol:FundBraveToken",
      isProxy: true,
    },
    {
      name: "Fundraiser",
      key: "FundraiserImplementation",
      path: "contracts/Fundraiser.sol:Fundraiser",
      isProxy: false,
    },
    {
      name: "StakingPool",
      key: "StakingPoolImplementation",
      path: "contracts/StakingPool.sol:StakingPool",
      isProxy: false,
    },
    {
      name: "WealthBuildingDonation",
      key: "WealthBuildingDonation",
      path: "contracts/WealthBuildingDonation.sol:WealthBuildingDonation",
      isProxy: true,
    },
    {
      name: "PlatformTreasury",
      key: "PlatformTreasury",
      path: "contracts/PlatformTreasury.sol:PlatformTreasury",
      isProxy: true,
    },
    {
      name: "FundraiserFactory",
      key: "FundraiserFactory",
      path: "contracts/FundraiserFactory.sol:FundraiserFactory",
      isProxy: false,
    },
  ];

  for (const contract of verificationOrder) {
    const deployment = contracts[contract.key];

    if (!deployment) {
      console.log(`Skipping ${contract.name} - not deployed`);
      continue;
    }

    console.log(`\nVerifying ${contract.name}...`);

    // For proxy contracts, verify the implementation
    const addressToVerify = contract.isProxy
      ? deployment.implementationAddress
      : deployment.address;

    if (!addressToVerify) {
      console.log(`  Skipping - no address found`);
      continue;
    }

    console.log(`  Address: ${addressToVerify}`);

    // Proxy contracts have no constructor args for the implementation
    const constructorArgs = contract.isProxy
      ? []
      : deployment.constructorArgs || [];

    try {
      await verifyContract(
        hre,
        addressToVerify,
        constructorArgs,
        contract.path
      );
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }

    // Wait between verifications to avoid rate limiting
    await sleep(5000);
  }

  console.log("\n========================================");
  console.log("Verification complete!");
  console.log("========================================\n");
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
