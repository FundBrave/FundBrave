const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Quick FundraiserFactory Deployment");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Read existing deployments
  const deploymentsPath = path.join(__dirname, "../../deployments/localhost.json");
  let deployments = {};
  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  }

  const fbtAddress = deployments.contracts?.FundBraveToken?.address;
  const fundraiserImpl = deployments.contracts?.FundraiserImplementation?.address;
  const stakingPoolImpl = deployments.contracts?.StakingPoolImplementation?.address;

  if (!fbtAddress || !fundraiserImpl || !stakingPoolImpl) {
    throw new Error("Missing required contract addresses. Run full deployment first.");
  }

  console.log("Using existing deployments:");
  console.log("  FBT:", fbtAddress);
  console.log("  Fundraiser Implementation:", fundraiserImpl);
  console.log("  StakingPool Implementation:", stakingPoolImpl);
  console.log();

  // Deploy mock USDC for testing
  console.log("Deploying Mock USDC...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);
  console.log();

  // Mint some USDC to deployer for testing
  await mockUSDC.mint(deployer.address, hre.ethers.parseUnits("1000000", 6));
  console.log("Minted 1,000,000 USDC to deployer\n");

  // Deploy mock WETH
  console.log("Deploying Mock WETH...");
  const MockWETH = await hre.ethers.getContractFactory("MockWETH");
  const mockWETH = await MockWETH.deploy();
  await mockWETH.waitForDeployment();
  const wethAddress = await mockWETH.getAddress();
  console.log("Mock WETH deployed to:", wethAddress);
  console.log();

  // Deploy FundraiserFactory
  console.log("Deploying FundraiserFactory...");
  const FundraiserFactory = await hre.ethers.getContractFactory("FundraiserFactory");

  const factory = await FundraiserFactory.deploy(
    fundraiserImpl,                          // _fundraiserImplementation
    stakingPoolImpl,                         // _stakingPoolImplementation
    hre.ethers.ZeroAddress,                  // _swapAdapter (not needed for basic testing)
    usdcAddress,                             // _usdc
    wethAddress,                             // _weth
    deployer.address,                        // _platformFeeRecipient
    hre.ethers.ZeroAddress,                  // _aavePool (not needed for basic testing)
    hre.ethers.ZeroAddress,                  // _aUsdc (not needed for basic testing)
    hre.ethers.ZeroAddress,                  // _morphoVault (not needed for basic testing)
    0                                        // _stakingPoolType (0 = no staking for now)
  );

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("\n============================================================");
  console.log("Contract: FundraiserFactory");
  console.log("Address: ", factoryAddress);
  console.log("============================================================\n");

  // Note: For basic testing, we're skipping role setup
  // In production, grant factory permission to mint FBT if needed
  console.log("Factory deployed successfully\n");

  // Save deployments
  deployments.contracts = deployments.contracts || {};
  deployments.contracts.MockUSDC = {
    address: usdcAddress,
    deployedAt: new Date().toISOString()
  };
  deployments.contracts.MockWETH = {
    address: wethAddress,
    deployedAt: new Date().toISOString()
  };
  deployments.contracts.FundraiserFactory = {
    address: factoryAddress,
    deployedAt: new Date().toISOString()
  };
  deployments.lastUpdated = new Date().toISOString();

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("Deployment addresses saved to:", deploymentsPath);

  console.log("\n========================================");
  console.log("Deployment Summary");
  console.log("========================================");
  console.log("FundBraveToken:        ", fbtAddress);
  console.log("MockUSDC:              ", usdcAddress);
  console.log("MockWETH:              ", wethAddress);
  console.log("Fundraiser Impl:       ", fundraiserImpl);
  console.log("StakingPool Impl:      ", stakingPoolImpl);
  console.log("FundraiserFactory:     ", factoryAddress);
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
