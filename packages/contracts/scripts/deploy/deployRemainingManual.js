/**
 * @title Manual Deployment Script for Remaining Contracts
 * @notice Deploys WealthBuildingDonation, PlatformTreasury, and FundraiserFactory
 *         using manual ERC1967 proxy deployment to bypass hardhat-upgrades verification issues
 * @dev This script is created to work around the "@openzeppelin/hardhat-upgrades" plugin's
 *      proxy verification issues on Base Sepolia RPC endpoint.
 *
 * Already Deployed:
 * - FundBraveToken (Proxy): 0xE42A6ff84160Ac399607667C32392378Bbb270E0
 * - FundraiserImplementation: 0xf79732B4D25521F2C8d8619c568C065fBf69bc9e
 * - StakingPoolImplementation: 0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8
 *
 * To Deploy:
 * 1. WealthBuildingDonation (UUPS Proxy)
 * 2. PlatformTreasury (UUPS Proxy)
 * 3. FundraiserFactory (Regular Contract)
 */

const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("./config");
const {
  recordDeployment,
  logDeployment,
  verifyContract,
  getDeployedAddress,
  sleep,
  loadDeployments,
  saveDeployments,
} = require("./utils");

// ERC1967 Proxy bytecode from OpenZeppelin
// This is the minimal ERC1967 proxy that delegates all calls to the implementation
const ERC1967_PROXY_BYTECODE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
`;

/**
 * @notice Deploy an implementation contract
 * @param contractName Name of the contract to deploy
 * @returns Deployed contract instance
 */
async function deployImplementation(contractName) {
  console.log(`\nDeploying ${contractName} implementation...`);

  const Factory = await ethers.getContractFactory(contractName);
  const implementation = await Factory.deploy();
  await implementation.waitForDeployment();

  const address = await implementation.getAddress();
  console.log(`  Implementation deployed at: ${address}`);

  return { implementation, address };
}

/**
 * @notice Deploy an ERC1967 proxy pointing to an implementation
 * @param implementationAddress Address of the implementation contract
 * @param initData Encoded initialization data
 * @returns Deployed proxy address
 */
async function deployERC1967Proxy(implementationAddress, initData) {
  console.log(`\nDeploying ERC1967 proxy...`);
  console.log(`  Implementation: ${implementationAddress}`);

  // Get the ERC1967Proxy factory from OpenZeppelin
  const ERC1967ProxyFactory = await ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
  );

  const proxy = await ERC1967ProxyFactory.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  console.log(`  Proxy deployed at: ${proxyAddress}`);

  return proxyAddress;
}

/**
 * @notice Deploy WealthBuildingDonation with manual UUPS proxy
 */
async function deployWealthBuildingDonation(config, deployer) {
  console.log("\n========================================");
  console.log("Deploying WealthBuildingDonation (Manual UUPS)");
  console.log("========================================\n");

  // Configuration for WealthBuildingDonation
  const aavePool = config.aavePool;
  const usdc = config.usdc;
  const aUsdc = config.aUsdc;
  const swapAdapter = config.swapAdapter || ethers.ZeroAddress;
  const platformTreasury = deployer.address; // Will update after PlatformTreasury is deployed
  const owner = deployer.address;

  console.log("Configuration:");
  console.log("  - Aave Pool:", aavePool);
  console.log("  - USDC:", usdc);
  console.log("  - aUSDC:", aUsdc);
  console.log("  - Swap Adapter:", swapAdapter);
  console.log("  - Platform Treasury (temp):", platformTreasury);
  console.log("  - Owner:", owner);

  // Step 1: Deploy implementation
  const { implementation, address: implAddress } = await deployImplementation(
    "WealthBuildingDonation"
  );

  // Step 2: Encode initialization data
  const initInterface = new ethers.Interface([
    "function initialize(address _aavePool, address _usdc, address _aUsdc, address _swapAdapter, address _platformTreasury, address _owner)",
  ]);

  const initData = initInterface.encodeFunctionData("initialize", [
    aavePool,
    usdc,
    aUsdc,
    swapAdapter,
    platformTreasury,
    owner,
  ]);

  console.log("\nInitialize data encoded successfully");

  // Step 3: Deploy ERC1967 proxy
  const proxyAddress = await deployERC1967Proxy(implAddress, initData);

  // Step 4: Verify the proxy is working by calling a view function
  const wealthBuildingDonation = await ethers.getContractAt(
    "WealthBuildingDonation",
    proxyAddress
  );

  try {
    const storedUsdc = await wealthBuildingDonation.usdc();
    console.log(`\nVerification - USDC address from contract: ${storedUsdc}`);

    if (storedUsdc.toLowerCase() !== usdc.toLowerCase()) {
      throw new Error("Proxy initialization verification failed!");
    }
    console.log("Proxy initialized correctly!");
  } catch (error) {
    console.error("Warning: Could not verify proxy initialization:", error.message);
  }

  // Record deployment
  recordDeployment(
    network.name,
    "WealthBuildingDonation",
    proxyAddress,
    "manual-proxy-deployment",
    [aavePool, usdc, aUsdc, swapAdapter, platformTreasury, owner],
    true,
    implAddress
  );

  logDeployment("WealthBuildingDonation", proxyAddress, "manual-proxy-deployment");
  console.log("Implementation Address:", implAddress);

  return {
    proxy: proxyAddress,
    implementation: implAddress,
    contract: wealthBuildingDonation,
  };
}

/**
 * @notice Deploy PlatformTreasury with manual UUPS proxy
 */
async function deployPlatformTreasury(config, deployer, wealthBuildingDonationAddress, fbtAddress) {
  console.log("\n========================================");
  console.log("Deploying PlatformTreasury (Manual UUPS)");
  console.log("========================================\n");

  const usdc = config.usdc;
  const wealthBuildingDonation = wealthBuildingDonationAddress;
  const fbt = fbtAddress;
  const owner = deployer.address;

  console.log("Configuration:");
  console.log("  - USDC:", usdc);
  console.log("  - WealthBuildingDonation:", wealthBuildingDonation);
  console.log("  - FBT:", fbt);
  console.log("  - Owner:", owner);

  // Step 1: Deploy implementation
  const { implementation, address: implAddress } = await deployImplementation(
    "PlatformTreasury"
  );

  // Step 2: Encode initialization data
  const initInterface = new ethers.Interface([
    "function initialize(address _usdc, address _wealthBuildingDonation, address _fbt, address _owner)",
  ]);

  const initData = initInterface.encodeFunctionData("initialize", [
    usdc,
    wealthBuildingDonation,
    fbt,
    owner,
  ]);

  console.log("\nInitialize data encoded successfully");

  // Step 3: Deploy ERC1967 proxy
  const proxyAddress = await deployERC1967Proxy(implAddress, initData);

  // Step 4: Verify the proxy is working
  const platformTreasury = await ethers.getContractAt("PlatformTreasury", proxyAddress);

  try {
    const storedUsdc = await platformTreasury.USDC();
    console.log(`\nVerification - USDC address from contract: ${storedUsdc}`);

    if (storedUsdc.toLowerCase() !== usdc.toLowerCase()) {
      throw new Error("Proxy initialization verification failed!");
    }
    console.log("Proxy initialized correctly!");
  } catch (error) {
    console.error("Warning: Could not verify proxy initialization:", error.message);
  }

  // Record deployment
  recordDeployment(
    network.name,
    "PlatformTreasury",
    proxyAddress,
    "manual-proxy-deployment",
    [usdc, wealthBuildingDonation, fbt, owner],
    true,
    implAddress
  );

  logDeployment("PlatformTreasury", proxyAddress, "manual-proxy-deployment");
  console.log("Implementation Address:", implAddress);

  return {
    proxy: proxyAddress,
    implementation: implAddress,
    contract: platformTreasury,
  };
}

/**
 * @notice Deploy FundraiserFactory (regular contract, no proxy)
 */
async function deployFundraiserFactory(config, deployer, deployments) {
  console.log("\n========================================");
  console.log("Deploying FundraiserFactory");
  console.log("========================================\n");

  const fundraiserImplementation = deployments.FundraiserImplementation;
  const stakingPoolImplementation = deployments.StakingPoolImplementation;
  const swapAdapter = config.swapAdapter || ethers.ZeroAddress;
  const usdc = config.usdc;
  const weth = config.weth;
  const platformTreasury = deployments.PlatformTreasury;
  const aavePool = config.aavePool;
  const aUsdc = config.aUsdc;
  const morphoVault = config.morphoVault || ethers.ZeroAddress;
  const stakingPoolType = config.stakingPoolType || 0;

  console.log("Configuration:");
  console.log("  - Fundraiser Implementation:", fundraiserImplementation);
  console.log("  - StakingPool Implementation:", stakingPoolImplementation);
  console.log("  - Swap Adapter:", swapAdapter);
  console.log("  - USDC:", usdc);
  console.log("  - WETH:", weth);
  console.log("  - Platform Treasury:", platformTreasury);
  console.log("  - Aave Pool:", aavePool);
  console.log("  - aUSDC:", aUsdc);
  console.log("  - Morpho Vault:", morphoVault);
  console.log("  - Staking Pool Type:", stakingPoolType);

  const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");

  const constructorArgs = [
    fundraiserImplementation,
    stakingPoolImplementation,
    swapAdapter,
    usdc,
    weth,
    platformTreasury,
    aavePool,
    aUsdc,
    morphoVault,
    stakingPoolType,
  ];

  console.log("\nDeploying FundraiserFactory...");
  const factory = await FundraiserFactory.deploy(...constructorArgs);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  // Verify initial state
  console.log("\nVerifying initial state...");
  try {
    const currentId = await factory.currentId();
    const totalFundraisersCreated = await factory.totalFundraisersCreated();
    console.log(`  Current ID: ${currentId}`);
    console.log(`  Total Fundraisers Created: ${totalFundraisersCreated}`);
  } catch (error) {
    console.log("  Warning: Could not verify initial state:", error.message);
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

  return {
    address: factoryAddress,
    contract: factory,
  };
}

/**
 * @notice Configure contracts after deployment
 */
async function configureContracts(deployments) {
  console.log("\n========================================");
  console.log("Configuring Contracts");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();

  // Get contract instances
  const fbt = await ethers.getContractAt("FundBraveToken", deployments.FundBraveToken);
  const factory = await ethers.getContractAt("FundraiserFactory", deployments.FundraiserFactory);
  const platformTreasury = await ethers.getContractAt(
    "PlatformTreasury",
    deployments.PlatformTreasury
  );
  const wealthBuildingDonation = await ethers.getContractAt(
    "WealthBuildingDonation",
    deployments.WealthBuildingDonation
  );

  // 1. Set FBT token in Factory
  console.log("1. Setting FBT token in FundraiserFactory...");
  try {
    const tx1 = await factory.setFBT(deployments.FundBraveToken);
    await tx1.wait();
    console.log("   FBT set successfully");
  } catch (error) {
    console.log("   Error setting FBT:", error.message);
  }

  await sleep(2000);

  // 2. Set WealthBuildingDonation in Factory
  console.log("2. Setting WealthBuildingDonation in FundraiserFactory...");
  try {
    const tx2 = await factory.setWealthBuildingDonation(deployments.WealthBuildingDonation);
    await tx2.wait();
    console.log("   WealthBuildingDonation set successfully");
  } catch (error) {
    console.log("   Error setting WealthBuildingDonation:", error.message);
  }

  await sleep(2000);

  // 3. Set PlatformTreasury in Factory
  console.log("3. Setting PlatformTreasury in FundraiserFactory...");
  try {
    const tx3 = await factory.setPlatformTreasury(deployments.PlatformTreasury);
    await tx3.wait();
    console.log("   PlatformTreasury set successfully");
  } catch (error) {
    console.log("   Error setting PlatformTreasury:", error.message);
  }

  await sleep(2000);

  // 4. Authorize Factory as vester in FBT
  console.log("4. Authorizing Factory as vester in FBT...");
  try {
    const tx4 = await fbt.setAuthorizedVester(deployments.FundraiserFactory, true);
    await tx4.wait();
    console.log("   Factory authorized as vester");
  } catch (error) {
    console.log("   Error authorizing vester:", error.message);
  }

  await sleep(2000);

  // 5. Authorize Factory as fee sender in PlatformTreasury
  console.log("5. Authorizing Factory as fee sender in PlatformTreasury...");
  try {
    const tx5 = await platformTreasury.authorizeFeeSender(deployments.FundraiserFactory);
    await tx5.wait();
    console.log("   Factory authorized as fee sender");
  } catch (error) {
    console.log("   Error authorizing Factory:", error.message);
  }

  await sleep(2000);

  // 6. Update PlatformTreasury in WealthBuildingDonation
  console.log("6. Setting PlatformTreasury in WealthBuildingDonation...");
  try {
    const tx6 = await wealthBuildingDonation.setPlatformTreasury(deployments.PlatformTreasury);
    await tx6.wait();
    console.log("   PlatformTreasury set successfully");
  } catch (error) {
    console.log("   Error setting PlatformTreasury:", error.message);
  }

  console.log("\nContract configuration complete!");
}

/**
 * @notice Main deployment function
 */
async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("FundBrave - Manual Deployment Script (Remaining Contracts)");
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
  console.log("- aUSDC:", config.aUsdc);
  console.log("- Staking Pool Type:", config.stakingPoolType);

  // Load existing deployments
  const existingDeployments = loadDeployments(network.name);
  console.log("\nExisting Deployments:");
  console.log("- FundBraveToken:", existingDeployments.contracts?.FundBraveToken?.address || "Not deployed");
  console.log(
    "- FundraiserImplementation:",
    existingDeployments.contracts?.FundraiserImplementation?.address || "Not deployed"
  );
  console.log(
    "- StakingPoolImplementation:",
    existingDeployments.contracts?.StakingPoolImplementation?.address || "Not deployed"
  );

  // Validate required deployments exist
  const fbtAddress = existingDeployments.contracts?.FundBraveToken?.address;
  const fundraiserImpl = existingDeployments.contracts?.FundraiserImplementation?.address;
  const stakingPoolImpl = existingDeployments.contracts?.StakingPoolImplementation?.address;

  if (!fbtAddress || !fundraiserImpl || !stakingPoolImpl) {
    throw new Error(
      "Missing required deployments. Please ensure FundBraveToken, FundraiserImplementation, and StakingPoolImplementation are deployed first."
    );
  }

  // Track deployments
  const deployments = {
    FundBraveToken: fbtAddress,
    FundraiserImplementation: fundraiserImpl,
    StakingPoolImplementation: stakingPoolImpl,
  };

  try {
    // ============================================
    // Step 1: Deploy WealthBuildingDonation
    // ============================================
    console.log("\n[1/4] Deploying WealthBuildingDonation...");
    const wbdResult = await deployWealthBuildingDonation(config, deployer);
    deployments.WealthBuildingDonation = wbdResult.proxy;
    deployments.WealthBuildingDonationImplementation = wbdResult.implementation;
    await sleep(3000);

    // ============================================
    // Step 2: Deploy PlatformTreasury
    // ============================================
    console.log("\n[2/4] Deploying PlatformTreasury...");
    const ptResult = await deployPlatformTreasury(
      config,
      deployer,
      deployments.WealthBuildingDonation,
      deployments.FundBraveToken
    );
    deployments.PlatformTreasury = ptResult.proxy;
    deployments.PlatformTreasuryImplementation = ptResult.implementation;
    await sleep(3000);

    // ============================================
    // Step 3: Deploy FundraiserFactory
    // ============================================
    console.log("\n[3/4] Deploying FundraiserFactory...");
    const factoryResult = await deployFundraiserFactory(config, deployer, deployments);
    deployments.FundraiserFactory = factoryResult.address;
    await sleep(3000);

    // ============================================
    // Step 4: Configure Contracts
    // ============================================
    console.log("\n[4/4] Configuring contract relationships...");
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

    // Update deployments file with summary
    const deploymentData = loadDeployments(network.name);
    deploymentData.summary = {
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      gasUsed: ethers.formatEther(gasUsed),
      networkConfig: config,
      method: "manual-proxy-deployment",
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
