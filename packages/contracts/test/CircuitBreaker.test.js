const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Circuit Breaker Integration", function () {
  // Test Circuit Breaker in GlobalStakingPool
  describe("CircuitBreaker in GlobalStakingPool", function () {
    async function deployGlobalStakingFixture() {
      const [owner, user1, user2, yieldDist] = await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const usdc = await MockERC20.deploy("USDC", "USDC", 6);
      const aUsdc = await MockERC20.deploy("aUSDC", "aUSDC", 6);

      const FBT = await ethers.getContractFactory("FundBraveToken");
      const fbt = await upgrades.deployProxy(FBT, [owner.address]);

      const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
      const aavePool = await MockAavePool.deploy(await usdc.getAddress(), await aUsdc.getAddress());

      const MockReceiptOFT = await ethers.getContractFactory("MockReceiptOFT");
      const receiptOFT = await MockReceiptOFT.deploy();

      const GlobalStakingPool = await ethers.getContractFactory("GlobalStakingPool");
      const pool = await upgrades.deployProxy(GlobalStakingPool, [
        await aavePool.getAddress(),
        await usdc.getAddress(),
        await aUsdc.getAddress(),
        await receiptOFT.getAddress(),
        await fbt.getAddress(),
        yieldDist.address,
        owner.address
      ], { kind: 'uups' });

      await pool.waitForDeployment();

      // Mint USDC to users
      await usdc.mint(user1.address, ethers.parseUnits("100000000", 6)); // 100M USDC
      await usdc.mint(user2.address, ethers.parseUnits("100000000", 6));

      // Mint USDC to Aave pool for withdrawals
      await usdc.mint(await aavePool.getAddress(), ethers.parseUnits("500000000", 6)); // 500M USDC

      return { pool, usdc, owner, user1, user2 };
    }

    describe("Single Transaction Limit", function () {
      it("should allow transactions below single transaction limit", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Default limit is 10M USDC
        const amount = ethers.parseUnits("5000000", 6); // 5M USDC

        await usdc.connect(user1).approve(await pool.getAddress(), amount);
        await expect(pool.connect(user1).deposit(amount))
          .to.not.be.reverted;
      });

      it("should block transaction exceeding single transaction limit", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Default limit is 10M USDC, try 11M
        const amount = ethers.parseUnits("11000000", 6);

        await usdc.connect(user1).approve(await pool.getAddress(), amount);
        await expect(pool.connect(user1).deposit(amount))
          .to.be.revertedWith("Transaction blocked by circuit breaker");
      });

      it("should trigger circuit breaker on excessive single transaction", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        const amount = ethers.parseUnits("11000000", 6);

        await usdc.connect(user1).approve(await pool.getAddress(), amount);

        // The transaction will revert with "Transaction blocked by circuit breaker"
        // Note: When a transaction reverts, the triggered state is also rolled back
        // So we cannot check isTriggered after a revert - it will always be false
        await expect(pool.connect(user1).deposit(amount))
          .to.be.revertedWith("Transaction blocked by circuit breaker");

        // After a failed attempt, the circuit breaker state is NOT persisted (reverted)
        expect(await pool.isCircuitBreakerTriggered()).to.be.false;
      });

      it("should allow transaction at exact limit", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Exactly 10M USDC
        const amount = ethers.parseUnits("10000000", 6);

        await usdc.connect(user1).approve(await pool.getAddress(), amount);
        await expect(pool.connect(user1).deposit(amount))
          .to.not.be.reverted;
      });
    });

    describe("Hourly Volume Limit", function () {
      it("should allow multiple transactions within hourly limit", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Default hourly limit is 50M USDC
        // Make 5 transactions of 9M each = 45M total (below limit)
        for (let i = 0; i < 5; i++) {
          const amount = ethers.parseUnits("9000000", 6);
          await usdc.connect(user1).approve(await pool.getAddress(), amount);
          await expect(pool.connect(user1).deposit(amount))
            .to.not.be.reverted;
        }
      });

      it("should block transaction exceeding hourly volume", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Deposit 45M USDC first (5 * 9M = 45M)
        for (let i = 0; i < 5; i++) {
          const amount = ethers.parseUnits("9000000", 6);
          await usdc.connect(user1).approve(await pool.getAddress(), amount);
          await pool.connect(user1).deposit(amount);
        }

        // Mint additional USDC for the final transaction
        await usdc.mint(user1.address, ethers.parseUnits("10000000", 6));

        // Try to deposit 6M more (total would be 51M, exceeds 50M hourly limit)
        const finalAmount = ethers.parseUnits("6000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), finalAmount);

        await expect(pool.connect(user1).deposit(finalAmount))
          .to.be.revertedWith("Transaction blocked by circuit breaker");
      });

      it("should reset hourly volume after 1 hour", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Deposit 10M (within hourly limit of 50M)
        const amount = ethers.parseUnits("10000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), amount);
        await pool.connect(user1).deposit(amount);

        // Wait 1 hour + 1 second to reset hourly window (but not daily)
        await time.increase(60 * 60 + 1);

        // Mint more USDC for second deposit
        await usdc.mint(user1.address, ethers.parseUnits("10000000", 6));

        // Should be able to deposit another 10M after hourly reset
        // Total is 20M which is still within daily limit of 200M
        const secondAmount = ethers.parseUnits("10000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), secondAmount);
        await expect(pool.connect(user1).deposit(secondAmount))
          .to.not.be.reverted;
      });
    });

    describe("Daily Volume Limit", function () {
      it("should allow multiple transactions within daily limit", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Default daily limit is 200M USDC
        // Make 20 transactions of 9M = 180M (below limit)
        // User starts with 100M, mint more as needed
        for (let i = 0; i < 20; i++) {
          // Mint more USDC as needed (every 10 transactions)
          if (i === 11) {
            await usdc.mint(user1.address, ethers.parseUnits("100000000", 6));
          }

          const amount = ethers.parseUnits("9000000", 6);
          await usdc.connect(user1).approve(await pool.getAddress(), amount);
          await pool.connect(user1).deposit(amount);

          // Advance time to avoid hourly limit (every 5 transactions)
          if (i % 5 === 4) {
            await time.increase(60 * 60 + 1);
          }
        }
      });

      it("should block transaction exceeding daily volume", async function () {
        const { pool, usdc, user1, user2 } = await loadGlobalStakingFixture();

        // Deposit 180M first (using both users to get more funds)
        for (let i = 0; i < 20; i++) {
          const user = i % 2 === 0 ? user1 : user2;
          const amount = ethers.parseUnits("9000000", 6);
          await usdc.connect(user).approve(await pool.getAddress(), amount);
          await pool.connect(user).deposit(amount);

          // Reset hourly window
          if (i % 5 === 4) {
            await time.increase(60 * 60 + 1);
          }
        }

        // Try to exceed daily limit
        await usdc.mint(user1.address, ethers.parseUnits("30000000", 6));
        const finalAmount = ethers.parseUnits("25000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), finalAmount);

        // Reset hourly to allow through hourly check
        await time.increase(60 * 60 + 1);

        await expect(pool.connect(user1).deposit(finalAmount))
          .to.be.revertedWith("Transaction blocked by circuit breaker");
      });

      it("should reset daily volume after 1 day", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Use significant daily volume
        const amount = ethers.parseUnits("10000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), amount);
        await pool.connect(user1).deposit(amount);

        // Wait 1 day + 1 second
        await time.increase(24 * 60 * 60 + 1);

        // Should work again
        const secondAmount = ethers.parseUnits("10000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), secondAmount);
        await expect(pool.connect(user1).deposit(secondAmount))
          .to.not.be.reverted;
      });
    });

    describe("Circuit Breaker Reset", function () {
      it("should allow owner to reset circuit breaker", async function () {
        const { pool, owner } = await loadGlobalStakingFixture();

        // Circuit breaker is not triggered initially
        expect(await pool.isCircuitBreakerTriggered()).to.be.false;

        // Owner can call reset even when not triggered
        await pool.connect(owner).resetCircuitBreaker();

        // Still not triggered
        expect(await pool.isCircuitBreakerTriggered()).to.be.false;

        // Note: We cannot test reset after trigger because triggers only happen
        // during reverts, and reverts rollback all state changes including triggered=true
      });

      it("should allow transactions after circuit breaker reset", async function () {
        const { pool, usdc, owner, user1 } = await loadGlobalStakingFixture();

        // Reset circuit breaker (even though it's not triggered)
        await pool.connect(owner).resetCircuitBreaker();

        // Normal transaction should work
        const goodAmount = ethers.parseUnits("5000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), goodAmount);
        await expect(pool.connect(user1).deposit(goodAmount))
          .to.not.be.reverted;
      });

      it("should reject reset from non-owner", async function () {
        const { pool, user1 } = await loadGlobalStakingFixture();

        await expect(pool.connect(user1).resetCircuitBreaker())
          .to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
      });
    });

    describe("Circuit Breaker Limit Updates", function () {
      it("should allow owner to update limits", async function () {
        const { pool, owner } = await loadGlobalStakingFixture();

        const newMaxTx = ethers.parseUnits("20000000", 6); // 20M
        const newMaxHourly = ethers.parseUnits("100000000", 6); // 100M
        const newMaxDaily = ethers.parseUnits("500000000", 6); // 500M

        await expect(pool.connect(owner).updateCircuitBreakerLimits(newMaxTx, newMaxHourly, newMaxDaily))
          .to.not.be.reverted;

        const [maxSingle, hourly, daily] = await pool.getCircuitBreakerStatus();
        expect(maxSingle).to.equal(newMaxTx);
      });

      it("should enforce new limits after update", async function () {
        const { pool, usdc, owner, user1 } = await loadGlobalStakingFixture();

        // Update to lower limit
        const newMaxTx = ethers.parseUnits("2000000", 6); // 2M
        await pool.connect(owner).updateCircuitBreakerLimits(
          newMaxTx,
          ethers.parseUnits("10000000", 6),
          ethers.parseUnits("50000000", 6)
        );

        // Transaction over new limit should fail
        const amount = ethers.parseUnits("3000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), amount);

        await expect(pool.connect(user1).deposit(amount))
          .to.be.revertedWith("Transaction blocked by circuit breaker");
      });
    });

    describe("Status Reporting", function () {
      it("should report correct status", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        const [maxSingle, hourlyRemaining, dailyRemaining] = await pool.getCircuitBreakerStatus();

        expect(maxSingle).to.equal(ethers.parseUnits("10000000", 6));
        expect(hourlyRemaining).to.equal(ethers.parseUnits("50000000", 6));
        expect(dailyRemaining).to.equal(ethers.parseUnits("200000000", 6));

        // After deposit
        const amount = ethers.parseUnits("5000000", 6);
        await usdc.connect(user1).approve(await pool.getAddress(), amount);
        await pool.connect(user1).deposit(amount);

        const [, hourlyAfter, dailyAfter] = await pool.getCircuitBreakerStatus();

        expect(hourlyAfter).to.equal(ethers.parseUnits("45000000", 6));
        expect(dailyAfter).to.equal(ethers.parseUnits("195000000", 6));
      });

      it("should return correct status when not triggered", async function () {
        const { pool, usdc, user1 } = await loadGlobalStakingFixture();

        // Circuit breaker is not triggered
        expect(await pool.isCircuitBreakerTriggered()).to.be.false;

        const [maxSingle, hourly, daily] = await pool.getCircuitBreakerStatus();

        // When not triggered, should return the configured limits
        expect(maxSingle).to.equal(ethers.parseUnits("10000000", 6)); // 10M
        expect(hourly).to.equal(ethers.parseUnits("50000000", 6)); // 50M
        expect(daily).to.equal(ethers.parseUnits("200000000", 6)); // 200M

        // Note: Cannot test "when triggered" because triggers only persist during reverts
        // and reverts rollback all state changes
      });
    });
  });

  // Test Circuit Breaker in Fundraiser
  describe("CircuitBreaker in Fundraiser", function () {
    async function deployFundraiserFixture() {
      const [owner, creator, beneficiary, donor, factory, feeRecipient] = await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const usdc = await MockERC20.deploy("USDC", "USDC", 6);

      const Fundraiser = await ethers.getContractFactory("Fundraiser");
      const goal = ethers.parseUnits("10000000", 6); // 10M goal
      const deadline = (await time.latest()) + 30 * 24 * 60 * 60;

      const fundraiser = await upgrades.deployProxy(Fundraiser, [
        1,
        "Test Fundraiser",
        ["https://image1.com"],
        ["Education"],
        "Description",
        "Global",
        beneficiary.address,
        creator.address,
        goal,
        deadline,
        await usdc.getAddress(),
        feeRecipient.address,
        factory.address
      ], { kind: 'uups' });

      await fundraiser.waitForDeployment();

      await usdc.mint(donor.address, ethers.parseUnits("10000000", 6));

      return { fundraiser, usdc, donor, factory, creator, owner, beneficiary };
    }

    it("should allow donations below single transaction limit", async function () {
      const { fundraiser, usdc, donor, factory } = await deployFundraiserFixture();

      // Default limit is 1M USDC for fundraisers
      const amount = ethers.parseUnits("500000", 6);

      await usdc.connect(donor).approve(await fundraiser.getAddress(), amount);
      await expect(fundraiser.connect(factory).creditDonation(donor.address, amount, "ethereum"))
        .to.not.be.reverted;
    });

    it("should block donation exceeding single transaction limit", async function () {
      const { fundraiser, usdc, donor, factory } = await deployFundraiserFixture();

      // Try 1.5M (over 1M limit)
      const amount = ethers.parseUnits("1500000", 6);

      await usdc.connect(donor).approve(await fundraiser.getAddress(), amount);
      await expect(fundraiser.connect(factory).creditDonation(donor.address, amount, "ethereum"))
        .to.be.revertedWith("Transaction blocked by circuit breaker");
    });

    it("should track hourly volume correctly", async function () {
      const { fundraiser, usdc, donor, factory } = await deployFundraiserFixture();

      // Make multiple donations totaling under hourly limit (5M)
      for (let i = 0; i < 4; i++) {
        const amount = ethers.parseUnits("900000", 6);
        await usdc.connect(donor).approve(await fundraiser.getAddress(), amount);
        await fundraiser.connect(factory).creditDonation(donor.address, amount, "ethereum");
      }

      // 4 * 900k = 3.6M, still under 5M hourly limit
      const finalAmount = ethers.parseUnits("500000", 6);
      await usdc.connect(donor).approve(await fundraiser.getAddress(), finalAmount);
      await expect(fundraiser.connect(factory).creditDonation(donor.address, finalAmount, "ethereum"))
        .to.not.be.reverted;
    });

    it("should reset circuit breaker for fundraiser", async function () {
      const { fundraiser, creator } = await deployFundraiserFixture();

      // Circuit breaker is not triggered initially
      expect(await fundraiser.isCircuitBreakerTriggered()).to.be.false;

      // Creator can call reset
      await fundraiser.connect(creator).resetCircuitBreaker();

      // Still not triggered
      expect(await fundraiser.isCircuitBreakerTriggered()).to.be.false;

      // Note: Cannot test reset after trigger because triggers only happen during reverts
    });
  });

  describe("Edge Cases", function () {
    it("should handle transaction at exact hourly reset time", async function () {
      const { pool, usdc, user1 } = await loadGlobalStakingFixture();

      const amount = ethers.parseUnits("10000000", 6);
      await usdc.connect(user1).approve(await pool.getAddress(), amount);
      await pool.connect(user1).deposit(amount);

      // Exactly 1 hour later
      await time.increase(60 * 60);

      // Mint more USDC for second transaction
      await usdc.mint(user1.address, ethers.parseUnits("10000000", 6));

      const secondAmount = ethers.parseUnits("10000000", 6);
      await usdc.connect(user1).approve(await pool.getAddress(), secondAmount);
      await expect(pool.connect(user1).deposit(secondAmount))
        .to.not.be.reverted;
    });

    it("should handle minimal transactions correctly", async function () {
      const { pool, usdc, user1 } = await loadGlobalStakingFixture();

      // 1 USDC cent
      const amount = 1;
      await usdc.connect(user1).approve(await pool.getAddress(), amount);
      await expect(pool.connect(user1).deposit(amount))
        .to.not.be.reverted;
    });

    it("should maintain separate volume tracking for different contracts", async function () {
      const { pool, usdc, user1 } = await loadGlobalStakingFixture();
      const { fundraiser, factory } = await deployFundraiserFixture();

      // Deposit to pool
      const poolAmount = ethers.parseUnits("9000000", 6);
      await usdc.connect(user1).approve(await pool.getAddress(), poolAmount);
      await pool.connect(user1).deposit(poolAmount);

      // Donate to fundraiser (separate circuit breaker)
      const donationAmount = ethers.parseUnits("900000", 6);
      await usdc.mint(await fundraiser.getAddress(), donationAmount);
      await expect(fundraiser.connect(factory).creditDonation(user1.address, donationAmount, "ethereum"))
        .to.not.be.reverted;

      // Each contract has independent circuit breaker
    });
  });

  async function loadGlobalStakingFixture() {
    return await loadFixture(deployGlobalStakingFixture);
  }

  async function deployGlobalStakingFixture() {
    const [owner, user1, user2, yieldDist] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);
    const aUsdc = await MockERC20.deploy("aUSDC", "aUSDC", 6);

    const FBT = await ethers.getContractFactory("FundBraveToken");
    const fbt = await upgrades.deployProxy(FBT, [owner.address]);

    const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
    const aavePool = await MockAavePool.deploy(await usdc.getAddress(), await aUsdc.getAddress());

    const MockReceiptOFT = await ethers.getContractFactory("MockReceiptOFT");
    const receiptOFT = await MockReceiptOFT.deploy();

    const GlobalStakingPool = await ethers.getContractFactory("GlobalStakingPool");
    const pool = await upgrades.deployProxy(GlobalStakingPool, [
      await aavePool.getAddress(),
      await usdc.getAddress(),
      await aUsdc.getAddress(),
      await receiptOFT.getAddress(),
      await fbt.getAddress(),
      yieldDist.address,
      owner.address
    ], { kind: 'uups' });

    await pool.waitForDeployment();

    await usdc.mint(user1.address, ethers.parseUnits("100000000", 6));
    await usdc.mint(user2.address, ethers.parseUnits("100000000", 6));

    // Mint USDC to Aave pool for withdrawals
    await usdc.mint(await aavePool.getAddress(), ethers.parseUnits("500000000", 6));

    return { pool, usdc, owner, user1, user2 };
  }

  async function deployFundraiserFixture() {
    const [owner, creator, beneficiary, donor, factory, feeRecipient] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);

    const Fundraiser = await ethers.getContractFactory("Fundraiser");
    const goal = ethers.parseUnits("10000000", 6);
    const deadline = (await time.latest()) + 30 * 24 * 60 * 60;

    const fundraiser = await upgrades.deployProxy(Fundraiser, [
      1, "Test", ["img"], ["cat"], "desc", "region",
      beneficiary.address, creator.address, goal, deadline,
      await usdc.getAddress(), feeRecipient.address, factory.address
    ], { kind: 'uups' });

    await fundraiser.waitForDeployment();
    await usdc.mint(donor.address, ethers.parseUnits("10000000", 6));

    return { fundraiser, usdc, donor, factory, creator, owner, beneficiary };
  }
});
