const { ethers, network } = require("hardhat");

const networkConfig = {
  // ==========================================
  // 1. POLYGON (Chain ID: 137)
  // Bounties: Circle, 1inch, LayerZero, Polygon
  // ==========================================
  137: {
    name: "polygon",
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC.e
    weth: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    lzEndpoint: "0x1a44076050125825900e5895B754588209F5E5B3", // LZ V2 Endpoint
    stakingPoolType: 0, // Aave V3
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    aUsdc: "0x625E7708f30cA75bfd92586e17077590C60eb4cD",
    swapAdapterType: "1inch",
    oneInchRouter: "0x1111111254fb6c44bAC0bED2854e76F90643097d",
  },

  // ==========================================
  // 2. CELO (Chain ID: 42220)
  // Bounties: Celo (MiniPay), Circle
  // ==========================================
  42220: {
    name: "celo",
    usdc: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", // Celo USDC
    weth: "0x122013fd7dF1C6F636a5e8f085305C4F279955Db", // Wrapped Celo (verify)
    lzEndpoint: "0x1a44076050125825900e5895B754588209F5E5B3", // Verify Celo LZ V2
    stakingPoolType: 0, // Moola Market (Celo's Aave Fork)
    aavePool: "0x...MOOLA_POOL_ADDRESS...", // Use Moola Market Lending Pool
    aUsdc: "0x...MOOLA_MUSDC_...",
    swapAdapterType: "uniswap", // Use Uniswap/Ubeswap on Celo
    oneInchRouter: ethers.constants.AddressZero,
  },

  // ==========================================
  // 3. BASE (Chain ID: 8453)
  // Bounties: Base, Circle
  // ==========================================
  8453: {
    name: "base",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base native USDC
    weth: "0x4200000000000000000000000000000000000006", // WETH on Base
    lzEndpoint: "0x1a44076050125825900e5895B754588209F5E5B3",
    stakingPoolType: 0, // Aave V3 on Base
    aavePool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    aUsdc: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
    swapAdapterType: "1inch", // 1inch is on Base
    oneInchRouter: "0x1111111254fb6c44bAC0bED2854e76F90643097d",
  },

  // ==========================================
  // 4. ZIRCUIT (Testnet ID: 48899 / 48900)
  // Bounties: Zircuit Deployment
  // ==========================================
  48900: {
    name: "zircuit",
    usdc: "0x...ZIRCUIT_USDC...", // Check Zircuit docs
    weth: "0x...ZIRCUIT_WETH...",
    lzEndpoint: "0x...ZIRCUIT_LZ...", // LayerZero might be on testnet only
    stakingPoolType: 0, // Likely a fork or standard Aave if available
    aavePool: "0x...ZIRCUIT_LENDING_...",
    swapAdapterType: "uniswap",
  },

  // ==========================================
  // 5. ROOTSTOCK (Chain ID: 30 - Mainnet, 31 - Testnet)
  // Bounties: Bitcoin L2 Integration
  // ==========================================
  30: {
    name: "rootstock",
    usdc: "0x...RSK_USDC...", // rUSDT/USDC
    weth: "0x...RSK_WRBTC...", // Wrapped RBTC
    lzEndpoint: "0x...RSK_LZ...",
    stakingPoolType: 0, // Sovryn or Tropykus (Aave forks)
    aavePool: "0x...TROPYKUS_POOL...",
    swapAdapterType: "uniswap", // Sovryn Swap
  },

  // ==========================================
  // 6. STATUS L2 (Chain ID: 12345 - Placeholder)
  // Bounties: CoW Swap, Morpho
  // ==========================================
  12345: {
    name: "statusL2",
    usdc: "0x...STATUS_USDC...",
    weth: "0x...STATUS_WETH...",
    lzEndpoint: "0x...STATUS_LZ...",
    stakingPoolType: 1, // Morpho Blue
    morphoVault: "0x...MORPHO_VAULT...",
    swapAdapterType: "cowswap",
    cowBatcher: "0x...COW_BATCHER...",
  },

  // --- LOCALHOST ---
  31337: {
    name: "hardhat",
    stakingPoolType: 0,
    swapAdapterType: "1inch"
  }
};

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments;
  const { deployer, platformWallet } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const config = networkConfig[chainId];

  if (!config) return;

  log(`Deploying to ${config.name}...`);
  if (chainId === 31337) return; 

  // 1. Adapter
  let swapAdapterAddress;
  if (config.swapAdapterType === "1inch") {
      const d = await deploy("OneInchAdapter", { 
        from: deployer, args: [config.oneInchRouter, config.usdc, config.weth, deployer], log: true 
      });
      swapAdapterAddress = d.address;
  } else if (config.swapAdapterType === "cowswap") {
      const d = await deploy("CowSwapAdapter", { 
        from: deployer, args: [config.cowBatcher, config.usdc, config.weth, deployer], log: true 
      });
      swapAdapterAddress = d.address;
  }

  // 2. Impls
  const fundraiserImpl = await deploy("Fundraiser", { from: deployer, args: [], log: true });
  const stakingPoolImpl = await deploy("StakingPool", { from: deployer, args: [], log: true });

  // 3. Factory
  const factory = await deploy("FundraiserFactory", {
    from: deployer,
    args: [
        fundraiserImpl.address, stakingPoolImpl.address, swapAdapterAddress, config.usdc, config.weth,
        platformWallet || deployer, config.aavePool || ethers.constants.AddressZero,
        config.aUsdc || ethers.constants.AddressZero, config.morphoVault || ethers.constants.AddressZero,
        config.stakingPoolType
    ],
    log: true
  });

  // 4. ReceiptOFT (Deploy & Link)
  const receiptOFT = await deploy("ReceiptOFT", {
      from: deployer,
      args: ["Fundraiser Receipt", "rFUND", config.lzEndpoint, deployer],
      log: true
  });

  const factoryContract = await ethers.getContractAt("FundraiserFactory", factory.address);
  // Set ReceiptOFT on Factory
  if ((await factoryContract.receiptOFT()) === ethers.constants.AddressZero) {
    log("Linking ReceiptOFT to Factory...");
    await (await factoryContract.setReceiptOFT(receiptOFT.address)).wait();
  }

  // 5. Bridge (Deploy & Link)
  await deploy("FundBraveBridge", {
      from: deployer,
      args: [config.lzEndpoint, swapAdapterAddress, config.usdc, factory.address, deployer],
      log: true
  });
  
  if ((await factoryContract.fundBraveBridge()) === ethers.constants.AddressZero) {
    log("Linking Bridge to Factory...");
    await (await factoryContract.updateBridge((await get("FundBraveBridge")).address)).wait();
  }

  log(`Deployment Complete!`);
};
module.exports.tags = ["core"];