/**
 * @title Deployment Utilities
 * @notice Shared utilities for deployment scripts
 */

const fs = require("fs");
const path = require("path");

const DEPLOYMENTS_DIR = path.join(__dirname, "..", "..", "deployments");

/**
 * @notice Ensures the deployments directory exists
 */
function ensureDeploymentsDir() {
  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  }
}

/**
 * @notice Get the deployment file path for a network
 * @param networkName Name of the network
 * @returns Full path to the deployment JSON file
 */
function getDeploymentPath(networkName) {
  ensureDeploymentsDir();
  return path.join(DEPLOYMENTS_DIR, `${networkName}.json`);
}

/**
 * @notice Load existing deployments for a network
 * @param networkName Name of the network
 * @returns Deployment object or empty object if file doesn't exist
 */
function loadDeployments(networkName) {
  const deploymentPath = getDeploymentPath(networkName);

  if (fs.existsSync(deploymentPath)) {
    const content = fs.readFileSync(deploymentPath, "utf8");
    return JSON.parse(content);
  }

  return {
    network: networkName,
    chainId: null,
    deployedAt: null,
    contracts: {},
  };
}

/**
 * @notice Save deployment information to file
 * @param networkName Name of the network
 * @param deployments Deployment object to save
 */
function saveDeployments(networkName, deployments) {
  const deploymentPath = getDeploymentPath(networkName);
  deployments.lastUpdated = new Date().toISOString();
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
  console.log(`Deployments saved to: ${deploymentPath}`);
}

/**
 * @notice Record a contract deployment
 * @param networkName Name of the network
 * @param contractName Name of the contract
 * @param address Deployed contract address
 * @param txHash Deployment transaction hash
 * @param constructorArgs Constructor arguments used
 * @param isProxy Whether this is a proxy deployment
 * @param implementationAddress Implementation address (for proxies)
 */
function recordDeployment(
  networkName,
  contractName,
  address,
  txHash,
  constructorArgs = [],
  isProxy = false,
  implementationAddress = null
) {
  const deployments = loadDeployments(networkName);

  deployments.contracts[contractName] = {
    address,
    txHash,
    constructorArgs,
    isProxy,
    implementationAddress,
    deployedAt: new Date().toISOString(),
  };

  saveDeployments(networkName, deployments);
}

/**
 * @notice Get a deployed contract address
 * @param networkName Name of the network
 * @param contractName Name of the contract
 * @returns Contract address or null if not found
 */
function getDeployedAddress(networkName, contractName) {
  const deployments = loadDeployments(networkName);
  return deployments.contracts[contractName]?.address || null;
}

/**
 * @notice Wait for a specified number of block confirmations
 * @param tx Transaction object
 * @param confirmations Number of confirmations to wait for
 */
async function waitForConfirmations(tx, confirmations = 2) {
  console.log(`Waiting for ${confirmations} block confirmations...`);
  await tx.wait(confirmations);
  console.log(`Transaction confirmed after ${confirmations} blocks`);
}

/**
 * @notice Sleep for a specified duration
 * @param ms Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @notice Verify a contract on the block explorer
 * @param hre Hardhat Runtime Environment
 * @param address Contract address
 * @param constructorArguments Constructor arguments
 * @param contract Contract path (optional)
 */
async function verifyContract(
  hre,
  address,
  constructorArguments = [],
  contract = undefined
) {
  console.log(`\nVerifying contract at ${address}...`);

  // Wait a bit for the explorer to index the contract
  await sleep(30000);

  try {
    const verifyArgs = {
      address,
      constructorArguments,
    };

    if (contract) {
      verifyArgs.contract = contract;
    }

    await hre.run("verify:verify", verifyArgs);
    console.log("Contract verified successfully");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified");
    } else if (error.message.includes("does not have bytecode")) {
      console.log("Contract deployment not yet indexed, retrying in 30s...");
      await sleep(30000);
      try {
        await hre.run("verify:verify", {
          address,
          constructorArguments,
        });
        console.log("Contract verified successfully on retry");
      } catch (retryError) {
        console.error("Verification failed after retry:", retryError.message);
      }
    } else {
      console.error("Verification failed:", error.message);
    }
  }
}

/**
 * @notice Log deployment information in a formatted way
 * @param contractName Name of the contract
 * @param address Deployed address
 * @param txHash Transaction hash
 */
function logDeployment(contractName, address, txHash) {
  console.log("\n" + "=".repeat(60));
  console.log(`Contract: ${contractName}`);
  console.log(`Address:  ${address}`);
  console.log(`Tx Hash:  ${txHash}`);
  console.log("=".repeat(60) + "\n");
}

/**
 * @notice Format constructor arguments for verification
 * @param args Array of constructor arguments
 * @returns Formatted string for display
 */
function formatConstructorArgs(args) {
  return args.map((arg, i) => `  [${i}]: ${arg}`).join("\n");
}

module.exports = {
  loadDeployments,
  saveDeployments,
  recordDeployment,
  getDeployedAddress,
  waitForConfirmations,
  sleep,
  verifyContract,
  logDeployment,
  formatConstructorArgs,
  DEPLOYMENTS_DIR,
};
