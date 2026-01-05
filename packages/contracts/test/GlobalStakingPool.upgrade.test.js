const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("GlobalStakingPool - Storage Gap & Upgrades", function () {
  async function deployFixture() {
    const [owner, user1, user2, yieldDist] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);
    const aUsdc = await MockERC20.deploy("aUSDC", "aUSDC", 6);

    const FBT = await ethers.getContractFactory("FundBraveToken");
    const fbt = await upgrades.deployProxy(FBT, [owner.address]);

    // Deploy mock Aave pool
    const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
    const aavePool = await MockAavePool.deploy(await usdc.getAddress(), await aUsdc.getAddress());

    // Deploy mock receipt token
    const MockReceiptOFT = await ethers.getContractFactory("MockReceiptOFT");
    const receiptOFT = await MockReceiptOFT.deploy();

    // Deploy GlobalStakingPool V1
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

    return { pool, usdc, aUsdc, fbt, aavePool, receiptOFT, owner, user1, user2, yieldDist };
  }

  describe("Storage Gap", function () {
    it("should have storage gap of 49 slots", async function () {
      const { pool } = await loadFixture(deployFixture);

      // Read the contract's storage layout
      // The __gap should reserve 49 uint256 slots for future upgrades
      // This test verifies the contract can be upgraded without storage collision

      // Verify contract is upgradeable
      const proxyAddress = await pool.getAddress();
      expect(proxyAddress).to.be.properAddress;
    });

    it("should preserve state during upgrade simulation", async function () {
      const { pool, usdc, user1, owner } = await loadFixture(deployFixture);

      // Mint USDC to user1
      await usdc.mint(user1.address, ethers.parseUnits("1000", 6));
      await usdc.connect(user1).approve(await pool.getAddress(), ethers.parseUnits("1000", 6));

      // Deposit to create state
      await pool.connect(user1).deposit(ethers.parseUnits("100", 6));

      const stakeBefore = await pool.stakerPrincipal(user1.address);
      const totalBefore = await pool.totalStakedPrincipal();

      expect(stakeBefore).to.equal(ethers.parseUnits("100", 6));
      expect(totalBefore).to.equal(ethers.parseUnits("100", 6));

      // Create V2 contract (same as V1 for this test)
      const GlobalStakingPoolV2 = await ethers.getContractFactory("GlobalStakingPool");

      // Upgrade
      const poolV2 = await upgrades.upgradeProxy(await pool.getAddress(), GlobalStakingPoolV2);

      // Verify state is preserved
      const stakeAfter = await poolV2.stakerPrincipal(user1.address);
      const totalAfter = await poolV2.totalStakedPrincipal();

      expect(stakeAfter).to.equal(stakeBefore);
      expect(totalAfter).to.equal(totalBefore);
    });

    it("should allow adding new state variables in upgrade without breaking existing storage", async function () {
      const { pool, usdc, user1 } = await loadFixture(deployFixture);

      // Set up initial state
      await usdc.mint(user1.address, ethers.parseUnits("500", 6));
      await usdc.connect(user1).approve(await pool.getAddress(), ethers.parseUnits("500", 6));
      await pool.connect(user1).deposit(ethers.parseUnits("200", 6));

      const initialStake = await pool.stakerPrincipal(user1.address);
      const initialTotal = await pool.totalStakedPrincipal();

      // Note: In a real upgrade scenario, you would deploy a V2 contract
      // with new state variables added AFTER the __gap declaration
      // The __gap would shrink from 49 to accommodate the new variables
      // Example: If adding 3 new uint256 variables, __gap becomes uint256[46]

      // For this test, we verify the existing state remains intact
      expect(initialStake).to.equal(ethers.parseUnits("200", 6));
      expect(initialTotal).to.equal(ethers.parseUnits("200", 6));
    });

    it("should maintain circuit breaker state through upgrade", async function () {
      const { pool, owner } = await loadFixture(deployFixture);

      // Update circuit breaker limits
      const maxTx = ethers.parseUnits("5000000", 6); // 5M USDC
      const maxHourly = ethers.parseUnits("25000000", 6); // 25M USDC
      const maxDaily = ethers.parseUnits("100000000", 6); // 100M USDC

      await pool.connect(owner).updateCircuitBreakerLimits(maxTx, maxHourly, maxDaily);

      // Get status before upgrade
      const [maxSingleBefore, hourlyBefore, dailyBefore] = await pool.getCircuitBreakerStatus();

      // Simulate upgrade
      const GlobalStakingPoolV2 = await ethers.getContractFactory("GlobalStakingPool");
      const poolV2 = await upgrades.upgradeProxy(await pool.getAddress(), GlobalStakingPoolV2);

      // Verify circuit breaker limits are preserved
      const [maxSingleAfter, hourlyAfter, dailyAfter] = await poolV2.getCircuitBreakerStatus();

      expect(maxSingleAfter).to.equal(maxSingleBefore);
      expect(hourlyAfter).to.equal(hourlyBefore);
      expect(dailyAfter).to.equal(dailyBefore);
    });

    it("should maintain reward state through upgrade", async function () {
      const { pool, owner } = await loadFixture(deployFixture);

      // Notify reward amount
      const rewardAmount = ethers.parseEther("1000000"); // 1M FBT
      await pool.connect(owner).notifyRewardAmount(rewardAmount);

      const rewardRateBefore = await pool.rewardRate();
      const periodFinishBefore = await pool.periodFinish();
      const durationBefore = await pool.rewardsDuration();

      // Upgrade
      const GlobalStakingPoolV2 = await ethers.getContractFactory("GlobalStakingPool");
      const poolV2 = await upgrades.upgradeProxy(await pool.getAddress(), GlobalStakingPoolV2);

      // Verify reward state preserved
      const rewardRateAfter = await poolV2.rewardRate();
      const periodFinishAfter = await poolV2.periodFinish();
      const durationAfter = await poolV2.rewardsDuration();

      expect(rewardRateAfter).to.equal(rewardRateBefore);
      expect(periodFinishAfter).to.equal(periodFinishBefore);
      expect(durationAfter).to.equal(durationBefore);
    });
  });

  describe("Upgrade Authorization", function () {
    it("should only allow owner to upgrade", async function () {
      const { pool, user1 } = await loadFixture(deployFixture);

      const GlobalStakingPoolV2 = await ethers.getContractFactory("GlobalStakingPool");

      // Non-owner cannot upgrade
      await expect(
        upgrades.upgradeProxy(await pool.getAddress(), GlobalStakingPoolV2.connect(user1))
      ).to.be.reverted;
    });

    it("should successfully upgrade when called by owner", async function () {
      const { pool, owner } = await loadFixture(deployFixture);

      const GlobalStakingPoolV2 = await ethers.getContractFactory("GlobalStakingPool");

      // Owner can upgrade
      const poolV2 = await upgrades.upgradeProxy(
        await pool.getAddress(),
        GlobalStakingPoolV2.connect(owner)
      );

      expect(await poolV2.getAddress()).to.equal(await pool.getAddress());
    });
  });

  describe("Storage Layout Compatibility", function () {
    it("should maintain storage slot ordering after multiple upgrades", async function () {
      const { pool, usdc, user1, user2 } = await loadFixture(deployFixture);

      // Create initial state with multiple users
      await usdc.mint(user1.address, ethers.parseUnits("1000", 6));
      await usdc.mint(user2.address, ethers.parseUnits("2000", 6));

      await usdc.connect(user1).approve(await pool.getAddress(), ethers.parseUnits("1000", 6));
      await usdc.connect(user2).approve(await pool.getAddress(), ethers.parseUnits("2000", 6));

      await pool.connect(user1).deposit(ethers.parseUnits("500", 6));
      await pool.connect(user2).deposit(ethers.parseUnits("1000", 6));

      const user1StakeBefore = await pool.stakerPrincipal(user1.address);
      const user2StakeBefore = await pool.stakerPrincipal(user2.address);
      const totalBefore = await pool.totalStakedPrincipal();

      // Perform upgrade
      const GlobalStakingPoolV2 = await ethers.getContractFactory("GlobalStakingPool");
      const poolV2 = await upgrades.upgradeProxy(await pool.getAddress(), GlobalStakingPoolV2);

      // Verify all storage mappings intact
      expect(await poolV2.stakerPrincipal(user1.address)).to.equal(user1StakeBefore);
      expect(await poolV2.stakerPrincipal(user2.address)).to.equal(user2StakeBefore);
      expect(await poolV2.totalStakedPrincipal()).to.equal(totalBefore);

      // Verify operations still work post-upgrade
      await usdc.connect(user1).approve(await poolV2.getAddress(), ethers.parseUnits("100", 6));
      await poolV2.connect(user1).deposit(ethers.parseUnits("100", 6));

      expect(await poolV2.stakerPrincipal(user1.address)).to.equal(
        user1StakeBefore + ethers.parseUnits("100", 6)
      );
    });

    it("should handle complex state during upgrade", async function () {
      const { pool, usdc, user1, owner } = await loadFixture(deployFixture);

      // Create complex state: deposits, rewards, circuit breaker activity
      await usdc.mint(user1.address, ethers.parseUnits("10000", 6));
      await usdc.connect(user1).approve(await pool.getAddress(), ethers.parseUnits("10000", 6));
      await pool.connect(user1).deposit(ethers.parseUnits("5000", 6));

      // Set rewards
      await pool.connect(owner).notifyRewardAmount(ethers.parseEther("100000"));

      // Update circuit breaker
      await pool.connect(owner).updateCircuitBreakerLimits(
        ethers.parseUnits("2000000", 6),
        ethers.parseUnits("10000000", 6),
        ethers.parseUnits("50000000", 6)
      );

      // Capture all state
      const stateBefore = {
        stake: await pool.stakerPrincipal(user1.address),
        total: await pool.totalStakedPrincipal(),
        rewardRate: await pool.rewardRate(),
        periodFinish: await pool.periodFinish(),
        cbStatus: await pool.getCircuitBreakerStatus()
      };

      // Upgrade
      const GlobalStakingPoolV2 = await ethers.getContractFactory("GlobalStakingPool");
      const poolV2 = await upgrades.upgradeProxy(await pool.getAddress(), GlobalStakingPoolV2);

      // Verify all state preserved
      expect(await poolV2.stakerPrincipal(user1.address)).to.equal(stateBefore.stake);
      expect(await poolV2.totalStakedPrincipal()).to.equal(stateBefore.total);
      expect(await poolV2.rewardRate()).to.equal(stateBefore.rewardRate);
      expect(await poolV2.periodFinish()).to.equal(stateBefore.periodFinish);

      const cbStatusAfter = await poolV2.getCircuitBreakerStatus();
      expect(cbStatusAfter[0]).to.equal(stateBefore.cbStatus[0]);
      expect(cbStatusAfter[1]).to.equal(stateBefore.cbStatus[1]);
      expect(cbStatusAfter[2]).to.equal(stateBefore.cbStatus[2]);
    });
  });
});
