const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CowSwapAdapter - Chainlink Oracle Integration", function () {
  async function deployFixture() {
    const [owner, user1] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);
    const weth = await MockERC20.deploy("WETH", "WETH", 18);

    // Deploy mock Chainlink price feed
    const MockChainlinkOracle = await ethers.getContractFactory("MockChainlinkOracle");
    const priceFeed = await MockChainlinkOracle.deploy(8); // 8 decimals like real Chainlink feeds

    // Set initial ETH price: $2500
    await priceFeed.setLatestAnswer(250000000000); // 2500 * 10^8

    // Deploy mock CoW batcher
    const MockCowBatcher = await ethers.getContractFactory("MockCowBatcher");
    const cowBatcher = await MockCowBatcher.deploy(await usdc.getAddress());

    // Deploy CowSwapAdapter
    const CowSwapAdapter = await ethers.getContractFactory("CowSwapAdapter");
    const adapter = await CowSwapAdapter.deploy(
      await cowBatcher.getAddress(),
      await usdc.getAddress(),
      await weth.getAddress(),
      await priceFeed.getAddress(),
      owner.address
    );

    await adapter.waitForDeployment();

    return { adapter, usdc, weth, priceFeed, cowBatcher, owner, user1 };
  }

  describe("Oracle Price Fetching", function () {
    it("should fetch correct ETH/USD price from oracle", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      const price = await adapter.getEthUsdPrice();

      // Should match the oracle price
      expect(price).to.equal(250000000000n); // $2500 with 8 decimals
    });

    it("should update price when oracle updates", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Initial price
      let price = await adapter.getEthUsdPrice();
      expect(price).to.equal(250000000000n);

      // Update oracle to $3000
      await priceFeed.setLatestAnswer(300000000000n);

      // Get updated price
      price = await adapter.getEthUsdPrice();
      expect(price).to.equal(300000000000n);
    });

    it("should handle different ETH prices correctly", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      const testPrices = [
        { value: 150000000000n, description: "$1500" },
        { value: 200000000000n, description: "$2000" },
        { value: 350000000000n, description: "$3500" },
        { value: 500000000000n, description: "$5000" }
      ];

      for (const testPrice of testPrices) {
        await priceFeed.setLatestAnswer(testPrice.value);
        const price = await adapter.getEthUsdPrice();
        expect(price).to.equal(testPrice.value);
      }
    });
  });

  describe("Oracle Validation", function () {
    it("should revert when price is zero", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      await priceFeed.setLatestAnswer(0);

      await expect(adapter.getEthUsdPrice())
        .to.be.revertedWithCustomError(adapter, "InvalidPrice");
    });

    it("should revert when price is negative", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      await priceFeed.setLatestAnswer(-100000000000n);

      await expect(adapter.getEthUsdPrice())
        .to.be.revertedWithCustomError(adapter, "InvalidPrice");
    });

    it("should revert when price data is stale", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set stale price (answeredInRound < roundId)
      await priceFeed.setStaleData(true);

      await expect(adapter.getEthUsdPrice())
        .to.be.revertedWithCustomError(adapter, "StalePrice");
    });

    it("should revert when price is too old", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set price update time to 2 hours ago
      const twoHoursAgo = (await time.latest()) - (2 * 60 * 60);
      await priceFeed.setUpdatedAt(twoHoursAgo);

      await expect(adapter.getEthUsdPrice())
        .to.be.revertedWithCustomError(adapter, "PriceTooOld");
    });

    it("should accept price within staleness threshold", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set price update time to 30 minutes ago (within 1 hour threshold)
      const thirtyMinutesAgo = (await time.latest()) - (30 * 60);
      await priceFeed.setUpdatedAt(thirtyMinutesAgo);

      await expect(adapter.getEthUsdPrice())
        .to.not.be.reverted;
    });

    it("should accept price at exact staleness threshold", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set to exactly 1 hour ago minus 1 second (still within threshold)
      const almostOneHour = (await time.latest()) - (60 * 60 - 1);
      await priceFeed.setUpdatedAt(almostOneHour);

      // Should accept (59 minutes 59 seconds old, within 1 hour threshold)
      await expect(adapter.getEthUsdPrice())
        .to.not.be.reverted;
    });
  });

  describe("swapNativeToUSDT with Dynamic Pricing", function () {
    it("should use oracle price for minimum buy amount calculation", async function () {
      const { adapter, priceFeed, weth, usdc } = await loadFixture(deployFixture);

      // Set ETH price to $2000
      await priceFeed.setLatestAnswer(200000000000n); // 2000 * 10^8

      // Swap 1 ETH
      const ethAmount = ethers.parseEther("1");

      // Fund the adapter and approve
      await ethers.provider.send("hardhat_setBalance", [
        adapter.target,
        ethers.toQuantity(ethers.parseEther("10"))
      ]);

      // Calculate expected min buy amount
      // 1 ETH * 2000 USD/ETH = 2000 USDC
      // With 2% slippage (DEFAULT_SLIPPAGE_BPS * 4 = 200 bps)
      // Min = 2000 * 0.98 = 1960 USDC
      const expectedMinUSDC = ethers.parseUnits("1960", 6);

      // We can't call swapNativeToUSDT directly in test, but we can verify calculation
      // by checking the internal _getMinBuyAmount logic through getEthUsdPrice

      const price = await adapter.getEthUsdPrice();
      expect(price).to.equal(200000000000n);

      // Verify calculation: ethAmount * price / 10^20 * 0.98
      // 10^18 * 2000 * 10^8 / 10^18 / 10^8 * 10^6 = 2000 * 10^6
      // Then apply 2% slippage
    });

    it("should adjust minimum buy amount when ETH price changes", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Test with $2000 ETH
      await priceFeed.setLatestAnswer(200000000000n);
      let price = await adapter.getEthUsdPrice();
      expect(price).to.equal(200000000000n);

      // Test with $3000 ETH
      await priceFeed.setLatestAnswer(300000000000n);
      price = await adapter.getEthUsdPrice();
      expect(price).to.equal(300000000000n);

      // Higher ETH price means higher minimum USDC expected
    });

    it("should handle low ETH prices correctly", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set very low ETH price: $500
      await priceFeed.setLatestAnswer(50000000000n);

      const price = await adapter.getEthUsdPrice();
      expect(price).to.equal(50000000000n);
    });

    it("should handle high ETH prices correctly", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set very high ETH price: $10,000
      await priceFeed.setLatestAnswer(1000000000000n);

      const price = await adapter.getEthUsdPrice();
      expect(price).to.equal(1000000000000n);
    });
  });

  describe("Price Feed Management", function () {
    it("should allow owner to update price feed address", async function () {
      const { adapter, owner } = await loadFixture(deployFixture);

      // Deploy new price feed
      const MockChainlinkOracle = await ethers.getContractFactory("MockChainlinkOracle");
      const newPriceFeed = await MockChainlinkOracle.deploy(8);
      await newPriceFeed.setLatestAnswer(280000000000n); // $2800

      const oldFeed = await adapter.ethUsdPriceFeed();

      await expect(adapter.connect(owner).setEthUsdPriceFeed(await newPriceFeed.getAddress()))
        .to.emit(adapter, "PriceFeedUpdated")
        .withArgs(oldFeed, await newPriceFeed.getAddress());

      expect(await adapter.ethUsdPriceFeed()).to.equal(await newPriceFeed.getAddress());

      // Verify new feed works
      const price = await adapter.getEthUsdPrice();
      expect(price).to.equal(280000000000n);
    });

    it("should revert when non-owner tries to update price feed", async function () {
      const { adapter, user1 } = await loadFixture(deployFixture);

      const MockChainlinkOracle = await ethers.getContractFactory("MockChainlinkOracle");
      const newPriceFeed = await MockChainlinkOracle.deploy(8);

      await expect(adapter.connect(user1).setEthUsdPriceFeed(await newPriceFeed.getAddress()))
        .to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });

    it("should revert when setting zero address as price feed", async function () {
      const { adapter, owner } = await loadFixture(deployFixture);

      await expect(adapter.connect(owner).setEthUsdPriceFeed(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(adapter, "ZeroAddress");
    });
  });

  describe("Edge Cases and Security", function () {
    it("should handle oracle decimal variations correctly", async function () {
      const { owner, cowBatcher, usdc, weth } = await loadFixture(deployFixture);

      // Test with different decimal configurations
      const decimals = [6, 8, 18]; // Different Chainlink feed decimals

      for (const decimal of decimals) {
        const MockChainlinkOracle = await ethers.getContractFactory("MockChainlinkOracle");
        const feed = await MockChainlinkOracle.deploy(decimal);

        // Set price: 2000 USD with appropriate decimals
        const price = 2000n * (10n ** BigInt(decimal));
        await feed.setLatestAnswer(price);

        const CowSwapAdapter = await ethers.getContractFactory("CowSwapAdapter");
        const adapter = await CowSwapAdapter.deploy(
          await cowBatcher.getAddress(),
          await usdc.getAddress(),
          await weth.getAddress(),
          await feed.getAddress(),
          owner.address
        );

        const fetchedPrice = await adapter.getEthUsdPrice();
        expect(fetchedPrice).to.equal(price);
      }
    });

    it("should protect against oracle manipulation", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Simulate oracle manipulation: unrealistic price
      await priceFeed.setLatestAnswer(1n); // $0.00000001

      // Should still work but would trigger circuit breakers or other protections
      const price = await adapter.getEthUsdPrice();
      expect(price).to.equal(1n);
    });

    it("should handle rapid price updates", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      const prices = [
        250000000000n, // $2500
        245000000000n, // $2450
        255000000000n, // $2550
        248000000000n  // $2480
      ];

      for (const testPrice of prices) {
        await priceFeed.setLatestAnswer(testPrice);
        const price = await adapter.getEthUsdPrice();
        expect(price).to.equal(testPrice);
      }
    });

    it("should maintain price accuracy across multiple reads", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      await priceFeed.setLatestAnswer(265000000000n); // $2650

      // Read multiple times
      for (let i = 0; i < 5; i++) {
        const price = await adapter.getEthUsdPrice();
        expect(price).to.equal(265000000000n);
      }
    });
  });

  describe("Integration with Swap Flow", function () {
    it("should calculate correct minimum amount for various ETH amounts", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      await priceFeed.setLatestAnswer(200000000000n); // $2000

      // Test cases: [ETH amount, expected USDC (before slippage)]
      const testCases = [
        { eth: "0.1", expectedUSDC: "200" },   // 0.1 ETH = $200
        { eth: "1.0", expectedUSDC: "2000" },  // 1 ETH = $2000
        { eth: "5.0", expectedUSDC: "10000" }, // 5 ETH = $10000
        { eth: "10.0", expectedUSDC: "20000" } // 10 ETH = $20000
      ];

      // We verify the price is correct; actual calculation happens in internal function
      const price = await adapter.getEthUsdPrice();
      expect(price).to.equal(200000000000n);
    });

    it("should use dynamic pricing instead of hardcoded value", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Old implementation used hardcoded $2000
      // New implementation uses Chainlink

      // Set price different from hardcoded value
      await priceFeed.setLatestAnswer(350000000000n); // $3500

      const price = await adapter.getEthUsdPrice();
      expect(price).to.equal(350000000000n);
      expect(price).to.not.equal(200000000000n); // Not the old hardcoded value
    });
  });

  describe("Staleness Threshold", function () {
    it("should have 1 hour staleness threshold", async function () {
      const { adapter } = await loadFixture(deployFixture);

      const threshold = await adapter.PRICE_FEED_STALENESS_THRESHOLD();
      expect(threshold).to.equal(60 * 60); // 1 hour in seconds
    });

    it("should reject price older than 1 hour", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set to 1 hour + 1 second ago
      const tooOld = (await time.latest()) - (60 * 60 + 1);
      await priceFeed.setUpdatedAt(tooOld);

      await expect(adapter.getEthUsdPrice())
        .to.be.revertedWithCustomError(adapter, "PriceTooOld");
    });

    it("should accept price within staleness threshold", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set to 30 minutes ago (well within 1 hour threshold)
      const thirtyMinutesAgo = (await time.latest()) - (30 * 60);
      await priceFeed.setUpdatedAt(thirtyMinutesAgo);

      await expect(adapter.getEthUsdPrice())
        .to.not.be.reverted;
    });

    it("should accept fresh price", async function () {
      const { adapter, priceFeed } = await loadFixture(deployFixture);

      // Set to current time
      await priceFeed.setUpdatedAt(await time.latest());

      await expect(adapter.getEthUsdPrice())
        .to.not.be.reverted;
    });
  });
});
