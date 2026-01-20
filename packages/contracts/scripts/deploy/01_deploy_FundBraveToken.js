/**
 * @title FundBraveToken Deployment Script
 * @notice Deploys the FundBraveToken (FBT) upgradeable contract
 * @dev FBT is deployed as a UUPS proxy
 */

const { ethers, upgrades, network } = require("hardhat");
const {
  recordDeployment,
  logDeployment,
  verifyContract,
  waitForConfirmations,
} = require("./utils");

async function main() {
  console.log("\n========================================");
  console.log("Deploying FundBraveToken (FBT)");
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
  const FundBraveToken = await ethers.getContractFactory("FundBraveToken");

  // Deploy as upgradeable proxy (UUPS pattern)
  console.log("\nDeploying FundBraveToken as UUPS proxy...");

  const fbt = await upgrades.deployProxy(FundBraveToken, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });

  await fbt.waitForDeployment();

  const fbtAddress = await fbt.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    fbtAddress
  );

  // Get deployment transaction
  const deploymentTx = fbt.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";

  logDeployment("FundBraveToken", fbtAddress, txHash);
  console.log("Implementation Address:", implementationAddress);

  // Verify initial state
  console.log("\nVerifying initial state...");
  const tokenName = await fbt.name();
  const tokenSymbol = await fbt.symbol();
  const totalSupply = await fbt.totalSupply();
  const ownerBalance = await fbt.balanceOf(deployer.address);

  console.log(`Token Name: ${tokenName}`);
  console.log(`Token Symbol: ${tokenSymbol}`);
  console.log(`Total Supply: ${ethers.formatEther(totalSupply)} FBT`);
  console.log(`Owner Balance: ${ethers.formatEther(ownerBalance)} FBT`);

  // Record deployment
  recordDeployment(
    network.name,
    "FundBraveToken",
    fbtAddress,
    txHash,
    [deployer.address], // initializer args
    true, // isProxy
    implementationAddress
  );

  // Verify on block explorer (skip for local networks)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting before verification...");

    // Verify implementation contract
    await verifyContract(
      require("hardhat"),
      implementationAddress,
      [],
      "contracts/FundBraveToken.sol:FundBraveToken"
    );
  }

  console.log("\n========================================");
  console.log("FundBraveToken deployment complete!");
  console.log("========================================\n");

  return {
    proxy: fbtAddress,
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
