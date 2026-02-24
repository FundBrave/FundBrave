const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy script for Base Sepolia testnet mini app
 *
 * Deploys minimal set of contracts needed for testing:
 * 1. MockUSDC (with public mint)
 * 2. MockAavePool (with simulateYield)
 * 3. FundraiserFactory + supporting contracts
 */
// Helper: wait for N milliseconds
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Helper: deploy with retry logic for "replacement transaction underpriced"
async function deployWithRetry(factory, args = [], retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const contract = await factory.deploy(...args);
      await contract.waitForDeployment();
      return contract;
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("replacement transaction underpriced") || msg.includes("nonce has already been used")) {
        console.log(`  ⏳ Retry ${attempt}/${retries} - waiting for pending tx to clear...`);
        await sleep(5000 * attempt); // exponential backoff: 5s, 10s, 15s
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed after max retries");
}

// Helper: deploy upgradeable proxy with retry
async function deployProxyWithRetry(factory, args, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const contract = await upgrades.deployProxy(factory, args, options);
      await contract.waitForDeployment();
      return contract;
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("replacement transaction underpriced") || msg.includes("nonce has already been used")) {
        console.log(`  ⏳ Proxy retry ${attempt}/${retries} - waiting for pending tx...`);
        await sleep(5000 * attempt);
      } else { throw err; }
    }
  }
  throw new Error("Failed after max retries");
}

// Helper: send tx with retry
async function txWithRetry(fn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const tx = await fn();
      if (tx && tx.wait) await tx.wait();
      return tx;
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("replacement transaction underpriced") || msg.includes("nonce has already been used")) {
        console.log(`  ⏳ Retry ${attempt}/${retries} - waiting for pending tx...`);
        await sleep(5000 * attempt);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed after max retries");
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);

  const deployedAddresses = {};

  // 1. Deploy MockERC20 as USDC (6 decimals + public mint)
  console.log("\n1. Deploying MockUSDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await deployWithRetry(MockERC20, ["USD Coin", "USDC", 6]);
  deployedAddresses.USDC = await usdc.getAddress();
  console.log("MockUSDC deployed to:", deployedAddresses.USDC);

  // 2. Deploy MockERC20 as aUSDC (aToken)
  console.log("\n2. Deploying aUSDC...");
  const aToken = await deployWithRetry(MockERC20, ["Aave USDC", "aUSDC", 6]);
  deployedAddresses.aUSDC = await aToken.getAddress();
  console.log("aUSDC deployed to:", deployedAddresses.aUSDC);

  // 3. Deploy MockAavePool
  console.log("\n3. Deploying MockAavePool...");
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const aavePool = await deployWithRetry(MockAavePool, [deployedAddresses.USDC, deployedAddresses.aUSDC]);
  deployedAddresses.AAVE_POOL = await aavePool.getAddress();
  console.log("MockAavePool deployed to:", deployedAddresses.AAVE_POOL);

  // 5. Deploy FundBrave Token (FBT) - upgradeable, needed by factory
  console.log("\n5. Deploying FundBrave Token...");
  const FBT = await ethers.getContractFactory("FundBraveToken");
  const fbt = await deployProxyWithRetry(FBT, [deployer.address], { kind: "uups" });
  deployedAddresses.FBT = await fbt.getAddress();
  console.log("FBT deployed to:", deployedAddresses.FBT);

  // 6. Deploy ReceiptOFT (needed by staking pools)
  console.log("\n6. Deploying ReceiptOFT...");
  const ReceiptOFT = await ethers.getContractFactory("ReceiptOFT");
  const lzEndpoint = "0x6EDCE65403992e310A62460808c4b910D972f10f"; // LayerZero endpoint on Base Sepolia
  const receiptOFT = await deployWithRetry(ReceiptOFT, [
    "FundBrave Receipt Token", "rcptUSDC", lzEndpoint, deployer.address
  ]);
  deployedAddresses.ReceiptOFT = await receiptOFT.getAddress();
  console.log("ReceiptOFT deployed to:", deployedAddresses.ReceiptOFT);

  // 7. Deploy PlatformTreasury first (with deployer as temporary WBD placeholder)
  // Both WBD and Treasury require each other's address at init (circular dependency),
  // so we deploy Treasury first with a placeholder, then WBD with real treasury,
  // then update Treasury with the real WBD address.
  console.log("\n7. Deploying PlatformTreasury (with temporary WBD placeholder)...");
  const PlatformTreasury = await ethers.getContractFactory("PlatformTreasury");
  const treasury = await deployProxyWithRetry(
    PlatformTreasury,
    [
      deployedAddresses.USDC,       // _usdc
      deployer.address,             // _wealthBuildingDonation (temporary placeholder - will update)
      deployedAddresses.FBT,        // _fbt
      deployer.address              // _owner
    ],
    { kind: "uups" }
  );
  deployedAddresses.PlatformTreasury = await treasury.getAddress();
  console.log("PlatformTreasury deployed to:", deployedAddresses.PlatformTreasury);

  // 8. Deploy WealthBuildingDonation with real treasury address
  console.log("\n8. Deploying WealthBuildingDonation...");
  const WealthBuildingDonation = await ethers.getContractFactory("WealthBuildingDonation");
  const wbd = await deployProxyWithRetry(
    WealthBuildingDonation,
    [
      deployedAddresses.AAVE_POOL,          // _aavePool
      deployedAddresses.USDC,               // _usdc
      deployedAddresses.aUSDC,              // _aUsdc
      ethers.ZeroAddress,                   // _swapAdapter (can be zero initially per contract comment)
      deployedAddresses.PlatformTreasury,   // _platformTreasury (real address now)
      deployer.address                      // _owner
    ],
    { kind: "uups" }
  );
  deployedAddresses.WealthBuildingDonation = await wbd.getAddress();
  console.log("WealthBuildingDonation deployed to:", deployedAddresses.WealthBuildingDonation);

  // 8a. Update PlatformTreasury with real WBD address
  console.log("\n8a. Updating PlatformTreasury with real WBD address...");
  await txWithRetry(() => treasury.setWealthBuildingDonation(deployedAddresses.WealthBuildingDonation));
  console.log("WealthBuildingDonation address updated in PlatformTreasury");

  await sleep(3000); // Wait between txs to avoid nonce conflicts

  // 9a. Deploy YieldDistributor (needed by ImpactDAOPool)
  console.log("\n9a. Deploying YieldDistributor...");
  const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
  const yieldDistributor = await deployWithRetry(YieldDistributor, [deployer.address]);
  deployedAddresses.YieldDistributor = await yieldDistributor.getAddress();
  console.log("YieldDistributor deployed to:", deployedAddresses.YieldDistributor);

  // 9b. Deploy ImpactDAOPool
  console.log("\n9b. Deploying ImpactDAOPool...");
  const ImpactDAOPool = await ethers.getContractFactory("ImpactDAOPool");
  const daoPool = await deployProxyWithRetry(
    ImpactDAOPool,
    [
      deployedAddresses.AAVE_POOL,         // _aavePool
      deployedAddresses.USDC,              // _usdc
      deployedAddresses.aUSDC,             // _aUsdc
      deployedAddresses.FBT,               // _fbt
      deployedAddresses.YieldDistributor,  // _yieldDistributor
      deployer.address,                    // _platformWallet
      deployer.address,                    // _owner
    ],
    { kind: "uups" }
  );
  deployedAddresses.ImpactDAOPool = await daoPool.getAddress();
  console.log("ImpactDAOPool deployed to:", deployedAddresses.ImpactDAOPool);

  // 10. Deploy implementation contracts for cloning
  console.log("\n10. Deploying Fundraiser implementation...");
  const Fundraiser = await ethers.getContractFactory("Fundraiser");
  const fundraiserImpl = await deployWithRetry(Fundraiser);
  deployedAddresses.FundraiserImplementation = await fundraiserImpl.getAddress();
  console.log("Fundraiser implementation deployed to:", deployedAddresses.FundraiserImplementation);

  console.log("\n11. Deploying StakingPool implementation...");
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingPoolImpl = await deployWithRetry(StakingPool);
  deployedAddresses.StakingPoolImplementation = await stakingPoolImpl.getAddress();
  console.log("StakingPool implementation deployed to:", deployedAddresses.StakingPoolImplementation);

  // 11a. Deploy MockSwapAdapter for multi-currency support
  console.log("\n11a. Deploying MockSwapAdapter...");
  const MockSwapAdapterFactory = await ethers.getContractFactory("MockSwapAdapter");
  const swapAdapterContract = await deployWithRetry(MockSwapAdapterFactory, [deployedAddresses.USDC]);
  deployedAddresses.SwapAdapter = await swapAdapterContract.getAddress();
  console.log("MockSwapAdapter deployed to:", deployedAddresses.SwapAdapter);

  // 11b. Deploy mock tokens for multi-currency testing
  console.log("\n11b. Deploying mock tokens for multi-currency...");
  const mockDAI = await deployWithRetry(MockERC20, ["Dai Stablecoin", "DAI", 18]);
  deployedAddresses.DAI = await mockDAI.getAddress();
  console.log("MockDAI deployed to:", deployedAddresses.DAI);

  const mockWETH = await ethers.getContractFactory("MockWETH");
  const wethContract = await deployWithRetry(mockWETH);
  deployedAddresses.WETH = await wethContract.getAddress();
  console.log("MockWETH deployed to:", deployedAddresses.WETH);

  // 12. Deploy FundraiserFactory
  console.log("\n12. Deploying FundraiserFactory...");
  const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");

  const factory = await deployWithRetry(FundraiserFactory, [
    deployedAddresses.FundraiserImplementation,   // _fundraiserImplementation
    deployedAddresses.StakingPoolImplementation,   // _stakingPoolImplementation
    deployedAddresses.SwapAdapter,                 // _swapAdapter (MockSwapAdapter for multi-currency)
    deployedAddresses.USDC,                        // _usdc
    deployedAddresses.WETH,                        // _weth
    deployer.address,                              // _platformFeeRecipient
    deployedAddresses.AAVE_POOL,                   // _aavePool
    deployedAddresses.aUSDC,                       // _aUsdc
    ethers.ZeroAddress,                            // _morphoVault (not used on testnet)
    0                                              // _stakingPoolType = 0 (Aave)
  ]);
  deployedAddresses.FundraiserFactory = await factory.getAddress();
  console.log("FundraiserFactory deployed to:", deployedAddresses.FundraiserFactory);

  // Wait for RPC to fully sync the factory deployment before calling methods
  await sleep(5000);

  // 13. Configure factory with auxiliary contracts
  // Re-instantiate factory via getContractAt to ensure clean ABI bindings
  console.log("\n13. Configuring FundraiserFactory...");
  const factoryContract = await ethers.getContractAt("FundraiserFactory", deployedAddresses.FundraiserFactory);

  await txWithRetry(() => factoryContract.setWealthBuildingDonation(deployedAddresses.WealthBuildingDonation));
  console.log("WealthBuildingDonation set");

  await txWithRetry(() => factoryContract.setImpactDAOPool(deployedAddresses.ImpactDAOPool));
  console.log("ImpactDAOPool set");

  await txWithRetry(() => factoryContract.setPlatformTreasury(deployedAddresses.PlatformTreasury));
  console.log("PlatformTreasury set");

  await txWithRetry(() => factoryContract.setReceiptOFT(deployedAddresses.ReceiptOFT));
  console.log("ReceiptOFT set");

  await txWithRetry(() => factoryContract.setFBT(deployedAddresses.FBT));
  console.log("FBT set");

  // 13a. Deploy Bridge Infrastructure
  console.log("\n13a. Deploying Bridge Infrastructure...");

  // Deploy MockWormholeCore
  const MockWormholeCore = await ethers.getContractFactory("MockWormholeCore");
  const mockWormholeCore = await deployWithRetry(MockWormholeCore);
  deployedAddresses.MockWormholeCore = await mockWormholeCore.getAddress();
  console.log("MockWormholeCore deployed to:", deployedAddresses.MockWormholeCore);

  // Deploy BridgeRouter
  const BridgeRouter = await ethers.getContractFactory("BridgeRouter");
  const bridgeRouter = await deployWithRetry(BridgeRouter, [
    deployedAddresses.USDC,                // _usdcToken
    deployedAddresses.FundraiserFactory,    // _fundraiserFactory
    deployer.address                       // _owner
  ]);
  deployedAddresses.BridgeRouter = await bridgeRouter.getAddress();
  console.log("BridgeRouter deployed to:", deployedAddresses.BridgeRouter);

  // Deploy WormholeReceiver
  const WormholeReceiver = await ethers.getContractFactory("WormholeReceiver");
  const wormholeReceiver = await deployWithRetry(WormholeReceiver, [
    deployedAddresses.MockWormholeCore,    // _wormholeCoreBridge
    deployedAddresses.BridgeRouter,        // _bridgeRouter
    deployedAddresses.SwapAdapter,         // _swapAdapter
    deployedAddresses.USDC,                // _usdcToken
    deployer.address                       // _owner
  ]);
  deployedAddresses.WormholeReceiver = await wormholeReceiver.getAddress();
  console.log("WormholeReceiver deployed to:", deployedAddresses.WormholeReceiver);

  // Deploy FundBraveBridge (LayerZero bridge)
  const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
  const fundBraveBridge = await deployWithRetry(FundBraveBridge, [
    lzEndpoint,                              // _endpoint (LayerZero)
    deployedAddresses.SwapAdapter,           // _swapAdapter
    deployedAddresses.USDC,                  // _usdcToken
    deployedAddresses.FundraiserFactory,     // _localFundraiserFactory
    deployer.address                         // _owner
  ]);
  deployedAddresses.FundBraveBridge = await fundBraveBridge.getAddress();
  console.log("FundBraveBridge deployed to:", deployedAddresses.FundBraveBridge);

  // Configure bridge infrastructure
  console.log("\n13b. Configuring Bridge Infrastructure...");

  // Set BridgeRouter on FundBraveBridge
  await txWithRetry(() => fundBraveBridge.setBridgeRouter(deployedAddresses.BridgeRouter));
  console.log("BridgeRouter set on FundBraveBridge");

  // Authorize FundBraveBridge and WormholeReceiver as bridge senders in BridgeRouter
  await txWithRetry(() => bridgeRouter.setAuthorizedBridge(deployedAddresses.FundBraveBridge, true));
  console.log("FundBraveBridge authorized in BridgeRouter");
  await txWithRetry(() => bridgeRouter.setAuthorizedBridge(deployedAddresses.WormholeReceiver, true));
  console.log("WormholeReceiver authorized in BridgeRouter");

  // Set bridge and router on Factory (using re-instantiated factoryContract)
  await txWithRetry(() => factoryContract.updateBridge(deployedAddresses.FundBraveBridge));
  console.log("FundBraveBridge set on Factory");
  await txWithRetry(() => factoryContract.setBridgeRouter(deployedAddresses.BridgeRouter));
  console.log("BridgeRouter set on Factory");

  // Set rate limits (100k USDC per hour per chain for testnet)
  const rateLimitAmount = ethers.parseUnits("100000", 6); // 100k USDC
  const rateLimitWindow = 3600; // 1 hour
  await txWithRetry(() => bridgeRouter.setRateLimit(1, rateLimitAmount, rateLimitWindow));     // Ethereum
  await txWithRetry(() => bridgeRouter.setRateLimit(137, rateLimitAmount, rateLimitWindow));   // Polygon
  await txWithRetry(() => bridgeRouter.setRateLimit(42161, rateLimitAmount, rateLimitWindow)); // Arbitrum
  await txWithRetry(() => bridgeRouter.setRateLimit(30, rateLimitAmount, rateLimitWindow));    // RSK
  await txWithRetry(() => bridgeRouter.setRateLimit(1399811149, rateLimitAmount, rateLimitWindow)); // Solana
  console.log("Rate limits configured for all chains");

  // Register Solana emitter in WormholeReceiver (mock address for testnet)
  const mockSolanaEmitter = ethers.zeroPadValue("0x01", 32); // Mock emitter
  await txWithRetry(() => wormholeReceiver.registerEmitter(1, mockSolanaEmitter)); // Wormhole chain 1 = Solana
  console.log("Mock Solana emitter registered in WormholeReceiver");

  // 14. Grant factory necessary permissions
  console.log("\n14. Granting permissions...");

  // Set factory as controllerAdmin on ReceiptOFT so it can register new staking pool clones as controllers
  const receiptContract = await ethers.getContractAt("ReceiptOFT", deployedAddresses.ReceiptOFT);
  await txWithRetry(() => receiptContract.setControllerAdmin(deployedAddresses.FundraiserFactory));
  console.log("Factory set as controllerAdmin in ReceiptOFT");

  // Set factory as authorized caller on WealthBuildingDonation so it can register fundraisers
  const wbdContract = await ethers.getContractAt("WealthBuildingDonation", deployedAddresses.WealthBuildingDonation);
  await txWithRetry(() => wbdContract.setAuthorizedFactory(deployedAddresses.FundraiserFactory));
  console.log("Factory set as authorizedFactory in WealthBuildingDonation");

  // Save deployment addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, "baseSepolia.json");
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deployedAddresses, null, 2)
  );
  console.log("\n✅ Deployment addresses saved to:", deploymentFile);

  // Mint test tokens to deployer for testing
  console.log("\n15. Minting test tokens...");
  const usdcContract = await ethers.getContractAt("MockERC20", deployedAddresses.USDC);
  await txWithRetry(() => usdcContract.mint(deployer.address, ethers.parseUnits("10000", 6)));
  console.log("Minted 10,000 test USDC to deployer");

  const daiContract = await ethers.getContractAt("MockERC20", deployedAddresses.DAI);
  await txWithRetry(() => daiContract.mint(deployer.address, ethers.parseUnits("10000", 18)));
  console.log("Minted 10,000 test DAI to deployer");

  // Mint USDC to MockSwapAdapter so it can fulfill swaps
  await txWithRetry(() => usdcContract.mint(deployedAddresses.SwapAdapter, ethers.parseUnits("1000000", 6)));
  console.log("Minted 1,000,000 USDC to MockSwapAdapter for swap liquidity");

  // Mint USDC to MockAavePool so it can fulfill withdrawals after yield simulation
  await txWithRetry(() => usdcContract.mint(deployedAddresses.AAVE_POOL, ethers.parseUnits("100000", 6)));
  console.log("Minted 100,000 USDC to MockAavePool for yield backing");

  // Mint USDC to BridgeRouter for bridge liquidity on testnet
  await txWithRetry(() => usdcContract.mint(deployedAddresses.BridgeRouter, ethers.parseUnits("500000", 6)));
  console.log("Minted 500,000 USDC to BridgeRouter for bridge liquidity");

  // Mint USDC to FundBraveBridge for bridge liquidity on testnet
  await txWithRetry(() => usdcContract.mint(deployedAddresses.FundBraveBridge, ethers.parseUnits("500000", 6)));
  console.log("Minted 500,000 USDC to FundBraveBridge for bridge liquidity");

  console.log("\n🎉 Deployment complete!");
  console.log("\nDeployed contracts:");
  console.log(JSON.stringify(deployedAddresses, null, 2));

  // Output .env.local format for test-frontend
  console.log("\n📋 Copy to packages/test-frontend/.env.local:");
  console.log(`NEXT_PUBLIC_CHAIN_ID=84532`);
  console.log(`NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=be6d31c7c662d2e0b9e8ac6cd2e14f49`);
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${deployedAddresses.FundraiserFactory}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${deployedAddresses.USDC}`);
  console.log(`NEXT_PUBLIC_AAVE_POOL_ADDRESS=${deployedAddresses.AAVE_POOL}`);
  console.log(`NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=${deployedAddresses.WealthBuildingDonation}`);
  console.log(`NEXT_PUBLIC_DAI_ADDRESS=${deployedAddresses.DAI}`);
  console.log(`NEXT_PUBLIC_WETH_ADDRESS=${deployedAddresses.WETH}`);
  console.log(`NEXT_PUBLIC_BRIDGE_ROUTER_ADDRESS=${deployedAddresses.BridgeRouter}`);
  console.log(`NEXT_PUBLIC_FUND_BRAVE_BRIDGE_ADDRESS=${deployedAddresses.FundBraveBridge}`);
  console.log(`NEXT_PUBLIC_WORMHOLE_RECEIVER_ADDRESS=${deployedAddresses.WormholeReceiver}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
