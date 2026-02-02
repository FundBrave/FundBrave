/**
 * @title Simple Deployment Script for Remaining Contracts
 * @notice Deploys WealthBuildingDonation, PlatformTreasury, and FundraiserFactory
 *         using direct ethers.js deployment with retry logic
 * @dev This script bypasses @openzeppelin/hardhat-upgrades entirely and deploys
 *      UUPS proxies manually using OpenZeppelin's ERC1967Proxy contract.
 *
 * Why this approach:
 * - The hardhat-upgrades plugin performs RPC calls to verify proxy structure
 * - These calls can fail on testnets with unreliable RPC endpoints
 * - Manual deployment gives us full control over the process
 *
 * Already Deployed (Base Sepolia):
 * - FundBraveToken (Proxy): 0xE42A6ff84160Ac399607667C32392378Bbb270E0
 * - FundraiserImplementation: 0xf79732B4D25521F2C8d8619c568C065fBf69bc9e
 * - StakingPoolImplementation: 0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8
 *
 * Network Config (Base Sepolia):
 * - Chain ID: 84532
 * - USDC: 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f
 * - WETH: 0x4200000000000000000000000000000000000006
 * - Aave Pool: 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27
 * - aUSDC: 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC
 */

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// =============================================================================
// CONFIGURATION
// =============================================================================

// Already deployed contracts on Base Sepolia
const DEPLOYED_CONTRACTS = {
  FundBraveToken: "0xE42A6ff84160Ac399607667C32392378Bbb270E0",
  FundBraveTokenImplementation: "0xcc8eC10b641d581c8D6ecA58287155bed3546a57",
  FundraiserImplementation: "0xf79732B4D25521F2C8d8619c568C065fBf69bc9e",
  StakingPoolImplementation: "0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8",
};

// Base Sepolia network configuration
const BASE_SEPOLIA_CONFIG = {
  usdc: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f",
  weth: "0x4200000000000000000000000000000000000006",
  aavePool: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
  aUsdc: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",
  morphoVault: ethers.ZeroAddress,
  swapAdapter: ethers.ZeroAddress,
  stakingPoolType: 0, // 0 = Aave
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  confirmations: 2,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * @notice Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @notice Execute a function with retry logic
 */
async function withRetry(fn, description, maxRetries = RETRY_CONFIG.maxRetries) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${maxRetries}: ${description}`);
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      console.log(`  Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        console.log(`  Waiting ${RETRY_CONFIG.retryDelay / 1000}s before retry...`);
        await sleep(RETRY_CONFIG.retryDelay);
      }
    }
  }

  throw lastError;
}

/**
 * @notice Deploy a contract with retry logic
 */
async function deployWithRetry(contractName, constructorArgs = []) {
  return withRetry(
    async () => {
      const Factory = await ethers.getContractFactory(contractName);
      const contract = await Factory.deploy(...constructorArgs);
      await contract.waitForDeployment();

      const address = await contract.getAddress();

      // Wait for confirmations on non-local networks
      if (network.name !== "hardhat" && network.name !== "localhost") {
        const deployTx = contract.deploymentTransaction();
        if (deployTx) {
          console.log(`  Waiting for ${RETRY_CONFIG.confirmations} confirmations...`);
          await deployTx.wait(RETRY_CONFIG.confirmations);
        }
      }

      return { contract, address };
    },
    `Deploying ${contractName}`
  );
}

/**
 * @notice Save deployment info to file
 */
function saveDeployment(networkName, contracts) {
  const deploymentsDir = path.join(__dirname, "..", "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);
  let existing = { network: networkName, contracts: {} };

  if (fs.existsSync(deploymentPath)) {
    existing = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  }

  // Merge new deployments
  for (const [name, data] of Object.entries(contracts)) {
    existing.contracts[name] = {
      address: data.address,
      txHash: data.txHash || "manual-deployment",
      constructorArgs: data.constructorArgs || [],
      isProxy: data.isProxy || false,
      implementationAddress: data.implementationAddress || null,
      deployedAt: new Date().toISOString(),
    };
  }

  existing.lastUpdated = new Date().toISOString();

  fs.writeFileSync(deploymentPath, JSON.stringify(existing, null, 2));
  console.log(`\nDeployments saved to: ${deploymentPath}`);
}

// =============================================================================
// DEPLOYMENT FUNCTIONS
// =============================================================================

/**
 * @notice Deploy WealthBuildingDonation implementation and proxy
 */
async function deployWealthBuildingDonation(deployer, config) {
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: Deploying WealthBuildingDonation");
  console.log("=".repeat(60));

  // Step 1a: Deploy implementation
  console.log("\n[1a] Deploying WealthBuildingDonation implementation...");
  const { contract: implementation, address: implAddress } = await deployWithRetry(
    "WealthBuildingDonation"
  );
  console.log(`  Implementation deployed: ${implAddress}`);

  await sleep(3000);

  // Step 1b: Prepare initialization data
  console.log("\n[1b] Preparing initialization data...");

  // Use deployer as temporary platformTreasury (will update later)
  const initArgs = [
    config.aavePool, // _aavePool
    config.usdc, // _usdc
    config.aUsdc, // _aUsdc
    config.swapAdapter, // _swapAdapter
    deployer.address, // _platformTreasury (temporary)
    deployer.address, // _owner
  ];

  console.log("  Init args:");
  console.log(`    _aavePool: ${initArgs[0]}`);
  console.log(`    _usdc: ${initArgs[1]}`);
  console.log(`    _aUsdc: ${initArgs[2]}`);
  console.log(`    _swapAdapter: ${initArgs[3]}`);
  console.log(`    _platformTreasury: ${initArgs[4]}`);
  console.log(`    _owner: ${initArgs[5]}`);

  // Encode initialization call
  const initInterface = implementation.interface;
  const initData = initInterface.encodeFunctionData("initialize", initArgs);

  // Step 1c: Deploy ERC1967 proxy
  console.log("\n[1c] Deploying ERC1967 proxy...");

  const { contract: proxy, address: proxyAddress } = await deployWithRetry(
    "ERC1967ProxyWrapper",
    [implAddress, initData]
  );
  console.log(`  Proxy deployed: ${proxyAddress}`);

  await sleep(3000);

  // Step 1d: Verify initialization
  console.log("\n[1d] Verifying proxy initialization...");
  const wbd = await ethers.getContractAt("WealthBuildingDonation", proxyAddress);

  try {
    const storedUsdc = await wbd.usdc();
    const storedOwner = await wbd.owner();
    console.log(`  Stored USDC: ${storedUsdc}`);
    console.log(`  Stored Owner: ${storedOwner}`);

    if (storedUsdc.toLowerCase() !== config.usdc.toLowerCase()) {
      throw new Error("USDC address mismatch!");
    }
    if (storedOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error("Owner address mismatch!");
    }
    console.log("  Verification PASSED!");
  } catch (error) {
    console.log(`  Warning: Verification issue - ${error.message}`);
  }

  return {
    proxy: proxyAddress,
    implementation: implAddress,
    contract: wbd,
  };
}

/**
 * @notice Deploy PlatformTreasury implementation and proxy
 */
async function deployPlatformTreasury(deployer, config, wbdAddress, fbtAddress) {
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: Deploying PlatformTreasury");
  console.log("=".repeat(60));

  // Step 2a: Deploy implementation
  console.log("\n[2a] Deploying PlatformTreasury implementation...");
  const { contract: implementation, address: implAddress } = await deployWithRetry(
    "PlatformTreasury"
  );
  console.log(`  Implementation deployed: ${implAddress}`);

  await sleep(3000);

  // Step 2b: Prepare initialization data
  console.log("\n[2b] Preparing initialization data...");

  const initArgs = [
    config.usdc, // _usdc
    wbdAddress, // _wealthBuildingDonation
    fbtAddress, // _fbt
    deployer.address, // _owner
  ];

  console.log("  Init args:");
  console.log(`    _usdc: ${initArgs[0]}`);
  console.log(`    _wealthBuildingDonation: ${initArgs[1]}`);
  console.log(`    _fbt: ${initArgs[2]}`);
  console.log(`    _owner: ${initArgs[3]}`);

  // Encode initialization call
  const initInterface = implementation.interface;
  const initData = initInterface.encodeFunctionData("initialize", initArgs);

  // Step 2c: Deploy ERC1967 proxy
  console.log("\n[2c] Deploying ERC1967 proxy...");

  const { contract: proxy, address: proxyAddress } = await deployWithRetry(
    "ERC1967ProxyWrapper",
    [implAddress, initData]
  );
  console.log(`  Proxy deployed: ${proxyAddress}`);

  await sleep(3000);

  // Step 2d: Verify initialization
  console.log("\n[2d] Verifying proxy initialization...");
  const pt = await ethers.getContractAt("PlatformTreasury", proxyAddress);

  try {
    const storedUsdc = await pt.USDC();
    const storedOwner = await pt.owner();
    console.log(`  Stored USDC: ${storedUsdc}`);
    console.log(`  Stored Owner: ${storedOwner}`);

    if (storedUsdc.toLowerCase() !== config.usdc.toLowerCase()) {
      throw new Error("USDC address mismatch!");
    }
    if (storedOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error("Owner address mismatch!");
    }
    console.log("  Verification PASSED!");
  } catch (error) {
    console.log(`  Warning: Verification issue - ${error.message}`);
  }

  return {
    proxy: proxyAddress,
    implementation: implAddress,
    contract: pt,
  };
}

/**
 * @notice Deploy FundraiserFactory (regular contract)
 */
async function deployFundraiserFactory(deployer, config, platformTreasuryAddress) {
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: Deploying FundraiserFactory");
  console.log("=".repeat(60));

  const constructorArgs = [
    DEPLOYED_CONTRACTS.FundraiserImplementation, // _fundraiserImplementation
    DEPLOYED_CONTRACTS.StakingPoolImplementation, // _stakingPoolImplementation
    config.swapAdapter, // _swapAdapter
    config.usdc, // _usdc
    config.weth, // _weth
    platformTreasuryAddress, // _platformFeeRecipient
    config.aavePool, // _aavePool
    config.aUsdc, // _aUsdc
    config.morphoVault, // _morphoVault
    config.stakingPoolType, // _stakingPoolType
  ];

  console.log("\nConstructor args:");
  console.log(`  _fundraiserImplementation: ${constructorArgs[0]}`);
  console.log(`  _stakingPoolImplementation: ${constructorArgs[1]}`);
  console.log(`  _swapAdapter: ${constructorArgs[2]}`);
  console.log(`  _usdc: ${constructorArgs[3]}`);
  console.log(`  _weth: ${constructorArgs[4]}`);
  console.log(`  _platformFeeRecipient: ${constructorArgs[5]}`);
  console.log(`  _aavePool: ${constructorArgs[6]}`);
  console.log(`  _aUsdc: ${constructorArgs[7]}`);
  console.log(`  _morphoVault: ${constructorArgs[8]}`);
  console.log(`  _stakingPoolType: ${constructorArgs[9]}`);

  console.log("\n[3a] Deploying FundraiserFactory...");
  const { contract: factory, address: factoryAddress } = await deployWithRetry(
    "FundraiserFactory",
    constructorArgs
  );
  console.log(`  FundraiserFactory deployed: ${factoryAddress}`);

  await sleep(3000);

  // Verify initial state
  console.log("\n[3b] Verifying initial state...");
  try {
    const currentId = await factory.currentId();
    const totalCreated = await factory.totalFundraisersCreated();
    console.log(`  Current ID: ${currentId}`);
    console.log(`  Total Fundraisers Created: ${totalCreated}`);
    console.log("  Verification PASSED!");
  } catch (error) {
    console.log(`  Warning: Verification issue - ${error.message}`);
  }

  return {
    address: factoryAddress,
    contract: factory,
    constructorArgs,
  };
}

/**
 * @notice Configure contracts post-deployment
 */
async function configureContracts(wbd, pt, factory, fbt, deployedAddresses) {
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: Configuring Contracts");
  console.log("=".repeat(60));

  const configurations = [
    {
      name: "Set FBT in FundraiserFactory",
      fn: async () => {
        const tx = await factory.setFBT(DEPLOYED_CONTRACTS.FundBraveToken);
        await tx.wait(RETRY_CONFIG.confirmations);
      },
    },
    {
      name: "Set WealthBuildingDonation in FundraiserFactory",
      fn: async () => {
        const tx = await factory.setWealthBuildingDonation(deployedAddresses.wealthBuildingDonation);
        await tx.wait(RETRY_CONFIG.confirmations);
      },
    },
    {
      name: "Set PlatformTreasury in FundraiserFactory",
      fn: async () => {
        const tx = await factory.setPlatformTreasury(deployedAddresses.platformTreasury);
        await tx.wait(RETRY_CONFIG.confirmations);
      },
    },
    {
      name: "Authorize Factory as vester in FBT",
      fn: async () => {
        const tx = await fbt.setAuthorizedVester(deployedAddresses.fundraiserFactory, true);
        await tx.wait(RETRY_CONFIG.confirmations);
      },
    },
    {
      name: "Authorize Factory as fee sender in PlatformTreasury",
      fn: async () => {
        const tx = await pt.authorizeFeeSender(deployedAddresses.fundraiserFactory);
        await tx.wait(RETRY_CONFIG.confirmations);
      },
    },
    {
      name: "Update PlatformTreasury in WealthBuildingDonation",
      fn: async () => {
        const tx = await wbd.setPlatformTreasury(deployedAddresses.platformTreasury);
        await tx.wait(RETRY_CONFIG.confirmations);
      },
    },
  ];

  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    console.log(`\n[4.${i + 1}] ${config.name}...`);

    try {
      await withRetry(config.fn, config.name);
      console.log("  SUCCESS!");
    } catch (error) {
      console.log(`  FAILED: ${error.message}`);
      console.log("  Continuing with next configuration...");
    }

    await sleep(2000);
  }

  console.log("\nConfiguration complete!");
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function main() {
  console.log("\n");
  console.log("=".repeat(70));
  console.log("  FundBrave - Simple Manual Deployment Script");
  console.log("  Deploys: WealthBuildingDonation, PlatformTreasury, FundraiserFactory");
  console.log("=".repeat(70));
  console.log(`\nNetwork: ${network.name}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Validate network
  if (network.name !== "baseSepolia" && network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWarning: This script is configured for Base Sepolia.");
    console.log("Update the configuration if deploying to a different network.");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("Deployer has no ETH balance!");
  }

  // Use Base Sepolia config or get from network config
  const config = BASE_SEPOLIA_CONFIG;

  console.log("\nConfiguration:");
  console.log(`  USDC: ${config.usdc}`);
  console.log(`  WETH: ${config.weth}`);
  console.log(`  Aave Pool: ${config.aavePool}`);
  console.log(`  aUSDC: ${config.aUsdc}`);

  console.log("\nAlready Deployed:");
  console.log(`  FundBraveToken: ${DEPLOYED_CONTRACTS.FundBraveToken}`);
  console.log(`  FundraiserImplementation: ${DEPLOYED_CONTRACTS.FundraiserImplementation}`);
  console.log(`  StakingPoolImplementation: ${DEPLOYED_CONTRACTS.StakingPoolImplementation}`);

  // Track all deployments
  const deployments = {};

  try {
    // Deploy WealthBuildingDonation
    const wbdResult = await deployWealthBuildingDonation(deployer, config);
    deployments.WealthBuildingDonation = {
      address: wbdResult.proxy,
      isProxy: true,
      implementationAddress: wbdResult.implementation,
    };
    deployments.WealthBuildingDonationImplementation = {
      address: wbdResult.implementation,
    };

    // Deploy PlatformTreasury
    const ptResult = await deployPlatformTreasury(
      deployer,
      config,
      wbdResult.proxy,
      DEPLOYED_CONTRACTS.FundBraveToken
    );
    deployments.PlatformTreasury = {
      address: ptResult.proxy,
      isProxy: true,
      implementationAddress: ptResult.implementation,
    };
    deployments.PlatformTreasuryImplementation = {
      address: ptResult.implementation,
    };

    // Deploy FundraiserFactory
    const factoryResult = await deployFundraiserFactory(deployer, config, ptResult.proxy);
    deployments.FundraiserFactory = {
      address: factoryResult.address,
      constructorArgs: factoryResult.constructorArgs,
    };

    // Configure contracts
    const fbt = await ethers.getContractAt("FundBraveToken", DEPLOYED_CONTRACTS.FundBraveToken);

    await configureContracts(
      wbdResult.contract,
      ptResult.contract,
      factoryResult.contract,
      fbt,
      {
        wealthBuildingDonation: wbdResult.proxy,
        platformTreasury: ptResult.proxy,
        fundraiserFactory: factoryResult.address,
      }
    );

    // Save deployments
    saveDeployment(network.name, deployments);

    // Print summary
    console.log("\n");
    console.log("=".repeat(70));
    console.log("  DEPLOYMENT SUMMARY");
    console.log("=".repeat(70));
    console.log("\nNewly Deployed Contracts:");
    console.log(`  WealthBuildingDonation (Proxy): ${wbdResult.proxy}`);
    console.log(`  WealthBuildingDonation (Impl):  ${wbdResult.implementation}`);
    console.log(`  PlatformTreasury (Proxy):       ${ptResult.proxy}`);
    console.log(`  PlatformTreasury (Impl):        ${ptResult.implementation}`);
    console.log(`  FundraiserFactory:              ${factoryResult.address}`);

    console.log("\nAll Contracts:");
    console.log(`  FundBraveToken:            ${DEPLOYED_CONTRACTS.FundBraveToken}`);
    console.log(`  FundraiserImplementation:  ${DEPLOYED_CONTRACTS.FundraiserImplementation}`);
    console.log(`  StakingPoolImplementation: ${DEPLOYED_CONTRACTS.StakingPoolImplementation}`);
    console.log(`  WealthBuildingDonation:    ${wbdResult.proxy}`);
    console.log(`  PlatformTreasury:          ${ptResult.proxy}`);
    console.log(`  FundraiserFactory:         ${factoryResult.address}`);

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log(`\nDeployment Cost: ${ethers.formatEther(gasUsed)} ETH`);
    console.log(`Remaining Balance: ${ethers.formatEther(finalBalance)} ETH`);

    console.log("\n" + "=".repeat(70));
    console.log("  DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70) + "\n");

    return deployments;
  } catch (error) {
    console.error("\n");
    console.error("=".repeat(70));
    console.error("  DEPLOYMENT FAILED");
    console.error("=".repeat(70));
    console.error(`Error: ${error.message}`);
    console.error("\nDeployed so far:");
    Object.entries(deployments).forEach(([name, data]) => {
      console.error(`  ${name}: ${data.address}`);
    });
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
