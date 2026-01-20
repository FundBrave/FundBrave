/**
 * @title Master Deployment Script
 * @notice Deploys all FundBrave contracts in the correct order
 * @dev Handles dependencies, configuration linking, and verification
 *
 * Deployment Order:
 * 1. FundBraveToken (FBT) - Governance token
 * 2. Fundraiser Implementation - For cloning
 * 3. StakingPool Implementation - For cloning
 * 4. WealthBuildingDonation - 80/20 donation mechanism
 * 5. PlatformTreasury - Fee collection and distribution
 * 6. FundraiserFactory - Main factory contract
 * 7. Post-deployment configuration - Linking contracts together
 */

const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("./config");
const {
  loadDeployments,
  saveDeployments,
  getDeployedAddress,
  sleep,
} = require("./utils");

// Import individual deployment scripts
const deployFundBraveToken = require("./01_deploy_FundBraveToken");
const deployFundraiser = require("./02_deploy_Fundraiser");
const deployStakingPool = require("./03_deploy_StakingPool");
const deployWealthBuildingDonation = require("./04_deploy_WealthBuildingDonation");
const deployPlatformTreasury = require("./05_deploy_PlatformTreasury");
const deployFundraiserFactory = require("./06_deploy_FundraiserFactory");

/**
 * @notice Configures contracts after deployment
 * @param deployments Object containing all deployed contract addresses
 */
async function configureContracts(deployments) {
  console.log("\n========================================");
  console.log("Configuring Contracts");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  const config = getNetworkConfig(network.name);

  // Get contract instances
  const fbt = await ethers.getContractAt(
    "FundBraveToken",
    deployments.FundBraveToken
  );
  const factory = await ethers.getContractAt(
    "FundraiserFactory",
    deployments.FundraiserFactory
  );
  const platformTreasury = await ethers.getContractAt(
    "PlatformTreasury",
    deployments.PlatformTreasury
  );
  const wealthBuildingDonation = await ethers.getContractAt(
    "WealthBuildingDonation",
    deployments.WealthBuildingDonation
  );

  // 1. Set FBT token in Factory
  console.log("Setting FBT token in FundraiserFactory...");
  try {
    const setFbtTx = await factory.setFBT(deployments.FundBraveToken);
    await setFbtTx.wait();
    console.log("  FBT set successfully");
  } catch (error) {
    console.log("  Error setting FBT:", error.message);
  }

  // 2. Set WealthBuildingDonation in Factory
  console.log("Setting WealthBuildingDonation in FundraiserFactory...");
  try {
    const setWbdTx = await factory.setWealthBuildingDonation(
      deployments.WealthBuildingDonation
    );
    await setWbdTx.wait();
    console.log("  WealthBuildingDonation set successfully");
  } catch (error) {
    console.log("  Error setting WealthBuildingDonation:", error.message);
  }

  // 3. Set PlatformTreasury in Factory
  console.log("Setting PlatformTreasury in FundraiserFactory...");
  try {
    const setPtTx = await factory.setPlatformTreasury(
      deployments.PlatformTreasury
    );
    await setPtTx.wait();
    console.log("  PlatformTreasury set successfully");
  } catch (error) {
    console.log("  Error setting PlatformTreasury:", error.message);
  }

  // 4. Authorize Factory as vester in FBT (for reward distribution)
  console.log("Authorizing Factory as vester in FBT...");
  try {
    const setVesterTx = await fbt.setAuthorizedVester(
      deployments.FundraiserFactory,
      true
    );
    await setVesterTx.wait();
    console.log("  Factory authorized as vester");
  } catch (error) {
    console.log("  Error authorizing vester:", error.message);
  }

  // 5. Authorize Factory and StakingPools as fee senders in PlatformTreasury
  console.log("Authorizing Factory as fee sender in PlatformTreasury...");
  try {
    const authFactoryTx = await platformTreasury.authorizeFeeSender(
      deployments.FundraiserFactory
    );
    await authFactoryTx.wait();
    console.log("  Factory authorized as fee sender");
  } catch (error) {
    console.log("  Error authorizing Factory:", error.message);
  }

  // 6. Update PlatformTreasury in WealthBuildingDonation
  console.log("Setting PlatformTreasury in WealthBuildingDonation...");
  try {
    const setTreasuryTx = await wealthBuildingDonation.setPlatformTreasury(
      deployments.PlatformTreasury
    );
    await setTreasuryTx.wait();
    console.log("  PlatformTreasury set successfully");
  } catch (error) {
    console.log("  Error setting PlatformTreasury:", error.message);
  }

  console.log("\nContract configuration complete!");
}

/**
 * @notice Main deployment function
 */
async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("FundBrave - Master Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("=".repeat(60));
  console.log("\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("Deployer has no ETH balance!");
  }

  const config = getNetworkConfig(network.name);
  console.log("\nNetwork Configuration:");
  console.log("- USDC:", config.usdc);
  console.log("- WETH:", config.weth);
  console.log("- Aave Pool:", config.aavePool);
  console.log("- Staking Pool Type:", config.stakingPoolType);

  // Track all deployments
  const deployments = {};

  try {
    // ============================================
    // Step 1: Deploy FundBraveToken
    // ============================================
    console.log("\n[1/6] Deploying FundBraveToken...");
    const fbtResult = await deployFundBraveToken();
    deployments.FundBraveToken = fbtResult.proxy;
    deployments.FundBraveTokenImplementation = fbtResult.implementation;
    await sleep(2000);

    // ============================================
    // Step 2: Deploy Fundraiser Implementation
    // ============================================
    console.log("\n[2/6] Deploying Fundraiser Implementation...");
    const fundraiserResult = await deployFundraiser();
    deployments.FundraiserImplementation = fundraiserResult.implementation;
    await sleep(2000);

    // ============================================
    // Step 3: Deploy StakingPool Implementation
    // ============================================
    console.log("\n[3/6] Deploying StakingPool Implementation...");
    const stakingPoolResult = await deployStakingPool();
    deployments.StakingPoolImplementation = stakingPoolResult.implementation;
    await sleep(2000);

    // ============================================
    // Step 4: Deploy WealthBuildingDonation
    // ============================================
    console.log("\n[4/6] Deploying WealthBuildingDonation...");
    const wbdResult = await deployWealthBuildingDonation({
      usdc: config.usdc,
      aavePool: config.aavePool,
      aUsdc: config.aUsdc,
      swapAdapter: config.swapAdapter,
      platformTreasury: deployer.address, // Will update after PlatformTreasury is deployed
    });
    deployments.WealthBuildingDonation = wbdResult.proxy;
    deployments.WealthBuildingDonationImplementation = wbdResult.implementation;
    await sleep(2000);

    // ============================================
    // Step 5: Deploy PlatformTreasury
    // ============================================
    console.log("\n[5/6] Deploying PlatformTreasury...");
    const ptResult = await deployPlatformTreasury({
      usdc: config.usdc,
      wealthBuildingDonation: deployments.WealthBuildingDonation,
      fbt: deployments.FundBraveToken,
    });
    deployments.PlatformTreasury = ptResult.proxy;
    deployments.PlatformTreasuryImplementation = ptResult.implementation;
    await sleep(2000);

    // ============================================
    // Step 6: Deploy FundraiserFactory
    // ============================================
    console.log("\n[6/6] Deploying FundraiserFactory...");
    const factoryResult = await deployFundraiserFactory({
      fundraiserImplementation: deployments.FundraiserImplementation,
      stakingPoolImplementation: deployments.StakingPoolImplementation,
      usdc: config.usdc,
      weth: config.weth,
      aavePool: config.aavePool,
      aUsdc: config.aUsdc,
      morphoVault: config.morphoVault,
      swapAdapter: config.swapAdapter,
      platformTreasury: deployments.PlatformTreasury,
      stakingPoolType: config.stakingPoolType,
    });
    deployments.FundraiserFactory = factoryResult.address;
    await sleep(2000);

    // ============================================
    // Step 7: Configure Contracts
    // ============================================
    console.log("\n[7/7] Configuring contract relationships...");
    await configureContracts(deployments);

    // ============================================
    // Summary
    // ============================================
    console.log("\n");
    console.log("=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("\nCore Contracts:");
    console.log(`  FundBraveToken (Proxy):         ${deployments.FundBraveToken}`);
    console.log(`  FundBraveToken (Impl):          ${deployments.FundBraveTokenImplementation}`);
    console.log(`  FundraiserFactory:              ${deployments.FundraiserFactory}`);
    console.log("\nImplementations (for Cloning):");
    console.log(`  Fundraiser Implementation:      ${deployments.FundraiserImplementation}`);
    console.log(`  StakingPool Implementation:     ${deployments.StakingPoolImplementation}`);
    console.log("\nSupporting Contracts:");
    console.log(`  WealthBuildingDonation (Proxy): ${deployments.WealthBuildingDonation}`);
    console.log(`  WealthBuildingDonation (Impl):  ${deployments.WealthBuildingDonationImplementation}`);
    console.log(`  PlatformTreasury (Proxy):       ${deployments.PlatformTreasury}`);
    console.log(`  PlatformTreasury (Impl):        ${deployments.PlatformTreasuryImplementation}`);
    console.log("=".repeat(60));

    // Check final balances
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log(`\nDeployment Cost: ${ethers.formatEther(gasUsed)} ETH`);
    console.log(`Remaining Balance: ${ethers.formatEther(finalBalance)} ETH`);

    // Save summary to deployments file
    const deploymentData = loadDeployments(network.name);
    deploymentData.summary = {
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      gasUsed: ethers.formatEther(gasUsed),
      networkConfig: config,
    };
    saveDeployments(network.name, deploymentData);

    console.log("\n=".repeat(60));
    console.log("DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60) + "\n");

    return deployments;
  } catch (error) {
    console.error("\n");
    console.error("=".repeat(60));
    console.error("DEPLOYMENT FAILED");
    console.error("=".repeat(60));
    console.error("Error:", error.message);
    console.error("\nPartially deployed contracts:");
    Object.entries(deployments).forEach(([name, address]) => {
      console.error(`  ${name}: ${address}`);
    });
    console.error("=".repeat(60) + "\n");
    throw error;
  }
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
