/**
 * @title Deployment Configuration
 * @notice Network-specific configuration for FundBrave contract deployments
 * @dev All addresses and settings for different networks
 */

const networkConfigs = {
  // Local Hardhat Network
  hardhat: {
    // Mock addresses for local testing
    usdc: "0x0000000000000000000000000000000000000001",
    weth: "0x0000000000000000000000000000000000000002",
    aavePool: "0x0000000000000000000000000000000000000000",
    aUsdc: "0x0000000000000000000000000000000000000000",
    morphoVault: "0x0000000000000000000000000000000000000000",
    swapAdapter: "0x0000000000000000000000000000000000000000",
    stakingPoolType: 0, // 0 = Aave, 1 = Morpho
  },

  // Ethereum Sepolia
  sepolia: {
    usdc: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // USDC on Sepolia
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // WETH on Sepolia
    aavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // Aave V3 Pool
    aUsdc: "0x16dA4541aD1807f4443d92D26044C1147406EB80", // aUSDC
    morphoVault: "0x0000000000000000000000000000000000000000",
    swapAdapter: "0x0000000000000000000000000000000000000000",
    stakingPoolType: 0,
  },

  // Base Sepolia
  baseSepolia: {
    usdc: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f", // USDC on Base Sepolia (Aave)
    weth: "0x4200000000000000000000000000000000000006", // WETH on Base Sepolia
    aavePool: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27", // Aave V3 Pool (Base Sepolia)
    aUsdc: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC", // aUSDC (Aave Base Sepolia)
    morphoVault: "0x0000000000000000000000000000000000000000",
    swapAdapter: "0x0000000000000000000000000000000000000000",
    stakingPoolType: 0,
  },

  // StatusL2 Testnet
  statusL2Testnet: {
    // Note: These are placeholder addresses - update with actual StatusL2 deployed addresses
    usdc: "0x0000000000000000000000000000000000000000", // USDC on StatusL2 Testnet
    weth: "0x0000000000000000000000000000000000000000", // WETH on StatusL2 Testnet
    aavePool: "0x0000000000000000000000000000000000000000", // Aave Pool (if available)
    aUsdc: "0x0000000000000000000000000000000000000000", // aUSDC (if available)
    morphoVault: "0x0000000000000000000000000000000000000000",
    swapAdapter: "0x0000000000000000000000000000000000000000",
    stakingPoolType: 0, // Default to Aave-style
  },

  // Polygon Mumbai
  mumbai: {
    usdc: "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97",
    weth: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
    aavePool: "0x0b913A76beFF3887d35073b8e5530755D60F78C7",
    aUsdc: "0x9daBC9860F8792AeE427808BDeF1f77eFeF0f24E",
    morphoVault: "0x0000000000000000000000000000000000000000",
    swapAdapter: "0x0000000000000000000000000000000000000000",
    stakingPoolType: 0,
  },

  // Avalanche Fuji
  fuji: {
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    weth: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
    aavePool: "0x0000000000000000000000000000000000000000",
    aUsdc: "0x0000000000000000000000000000000000000000",
    morphoVault: "0x0000000000000000000000000000000000000000",
    swapAdapter: "0x0000000000000000000000000000000000000000",
    stakingPoolType: 0,
  },
};

/**
 * @notice Get configuration for the current network
 * @param networkName Name of the network
 * @returns Network configuration object
 */
function getNetworkConfig(networkName) {
  const config = networkConfigs[networkName];
  if (!config) {
    console.warn(
      `Warning: No configuration found for network "${networkName}". Using hardhat defaults.`
    );
    return networkConfigs.hardhat;
  }
  return config;
}

/**
 * @notice Validate that required addresses are set (non-zero)
 * @param config Network configuration to validate
 * @param requiredFields Array of field names that must be non-zero
 * @returns Boolean indicating if all required fields are valid
 */
function validateConfig(config, requiredFields) {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const invalid = [];

  for (const field of requiredFields) {
    if (!config[field] || config[field] === zeroAddress) {
      invalid.push(field);
    }
  }

  if (invalid.length > 0) {
    console.warn(
      `Warning: The following required fields are not set: ${invalid.join(", ")}`
    );
    return false;
  }

  return true;
}

module.exports = {
  networkConfigs,
  getNetworkConfig,
  validateConfig,
};
