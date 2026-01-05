const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MorphoStakingPool - Pause Mechanism", function () {
  async function deployFixture() {
    const [owner, user1, user2, beneficiary, platformWallet, factory] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdt = await MockERC20.deploy("USDT", "USDT", 6);
    const fbt = await MockERC20.deploy("FBT", "FBT", 18);

    // Deploy mock Morpho vault
    const MockMetaMorpho = await ethers.getContractFactory("MockMetaMorpho");
    const morphoVault = await MockMetaMorpho.deploy(await usdt.getAddress());

    // Deploy MorphoStakingPool
    const MorphoStakingPool = await ethers.getContractFactory("MorphoStakingPool");
    const pool = await MorphoStakingPool.deploy(
      await morphoVault.getAddress(),
      await usdt.getAddress(),
      await fbt.getAddress(),
      beneficiary.address,
      platformWallet.address,
      factory.address,
      owner.address
    );

    await pool.waitForDeployment();

    return { pool, usdt, fbt, morphoVault, owner, user1, user2, beneficiary, platformWallet, factory };
  }

  describe("Pause/Unpause Functions", function () {
    it("should allow owner to pause the pool", async function () {
      const { pool, owner } = await loadFixture(deployFixture);

      await expect(pool.connect(owner).pause())
        .to.not.be.reverted;

      expect(await pool.paused()).to.be.true;
    });

    it("should allow owner to unpause the pool", async function () {
      const { pool, owner } = await loadFixture(deployFixture);

      await pool.connect(owner).pause();
      expect(await pool.paused()).to.be.true;

      await expect(pool.connect(owner).unpause())
        .to.not.be.reverted;

      expect(await pool.paused()).to.be.false;
    });

    it("should revert when non-owner tries to pause", async function () {
      const { pool, user1 } = await loadFixture(deployFixture);

      await expect(pool.connect(user1).pause())
        .to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
    });

    it("should revert when non-owner tries to unpause", async function () {
      const { pool, owner, user1 } = await loadFixture(deployFixture);

      await pool.connect(owner).pause();

      await expect(pool.connect(user1).unpause())
        .to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
    });
  });

  describe("depositFor When Paused", function () {
    it("should block depositFor when paused", async function () {
      const { pool, usdt, owner, user1, factory } = await loadFixture(deployFixture);

      // Pause the pool
      await pool.connect(owner).pause();

      // Mint USDT to factory and transfer to pool
      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(factory.address, amount);
      await usdt.connect(factory).transfer(await pool.getAddress(), amount);

      // Try to deposit (factory calling depositFor)
      await expect(
        pool.connect(factory).depositFor(user1.address, amount)
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");
    });

    it("should allow depositFor when not paused", async function () {
      const { pool, usdt, user1, factory } = await loadFixture(deployFixture);

      // Mint USDT to factory and transfer to pool
      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(factory.address, amount);
      await usdt.connect(factory).transfer(await pool.getAddress(), amount);

      // Should work when not paused
      await expect(
        pool.connect(factory).depositFor(user1.address, amount)
      ).to.emit(pool, "Staked")
        .withArgs(user1.address, amount);

      expect(await pool.stakerPrincipal(user1.address)).to.equal(amount);
    });

    it("should resume depositFor after unpause", async function () {
      const { pool, usdt, owner, user1, factory } = await loadFixture(deployFixture);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(factory.address, amount * 2n);

      // Pause
      await pool.connect(owner).pause();

      // Transfer for first attempt
      await usdt.connect(factory).transfer(await pool.getAddress(), amount);

      // Blocked
      await expect(
        pool.connect(factory).depositFor(user1.address, amount)
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");

      // Unpause
      await pool.connect(owner).unpause();

      // Works now
      await expect(
        pool.connect(factory).depositFor(user1.address, amount)
      ).to.not.be.reverted;

      expect(await pool.stakerPrincipal(user1.address)).to.equal(amount);
    });

    it("should revert depositFor when paused even for factory", async function () {
      const { pool, usdt, owner, user1, factory } = await loadFixture(deployFixture);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(factory.address, amount);
      await usdt.connect(factory).transfer(await pool.getAddress(), amount);

      await pool.connect(owner).pause();

      // Even factory (authorized caller) is blocked
      await expect(
        pool.connect(factory).depositFor(user1.address, amount)
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");
    });
  });

  describe("unstake When Paused", function () {
    async function setupWithStake() {
      const fixture = await loadFixture(deployFixture);
      const { pool, usdt, user1, factory } = fixture;

      // Setup: deposit first
      const amount = ethers.parseUnits("500", 6);
      await usdt.mint(factory.address, amount);
      await usdt.connect(factory).transfer(await pool.getAddress(), amount);
      await pool.connect(factory).depositFor(user1.address, amount);

      return fixture;
    }

    it("should block unstake when paused", async function () {
      const { pool, owner, user1 } = await setupWithStake();

      // Pause
      await pool.connect(owner).pause();

      // Try to unstake
      await expect(
        pool.connect(user1).unstake(ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");
    });

    it("should allow unstake when not paused", async function () {
      const { pool, user1 } = await setupWithStake();

      // Should work
      await expect(
        pool.connect(user1).unstake(ethers.parseUnits("100", 6))
      ).to.emit(pool, "Unstaked")
        .withArgs(user1.address, ethers.parseUnits("100", 6));

      expect(await pool.stakerPrincipal(user1.address)).to.equal(ethers.parseUnits("400", 6));
    });

    it("should resume unstake after unpause", async function () {
      const { pool, owner, user1 } = await setupWithStake();

      // Pause
      await pool.connect(owner).pause();

      // Blocked
      await expect(
        pool.connect(user1).unstake(ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");

      // Unpause
      await pool.connect(owner).unpause();

      // Works
      await expect(
        pool.connect(user1).unstake(ethers.parseUnits("100", 6))
      ).to.not.be.reverted;

      expect(await pool.stakerPrincipal(user1.address)).to.equal(ethers.parseUnits("400", 6));
    });

    it("should preserve stake amounts during pause", async function () {
      const { pool, owner, user1 } = await setupWithStake();

      const stakeBefore = await pool.stakerPrincipal(user1.address);

      // Pause
      await pool.connect(owner).pause();

      // Stake unchanged during pause
      expect(await pool.stakerPrincipal(user1.address)).to.equal(stakeBefore);

      // Unpause
      await pool.connect(owner).unpause();

      // Still unchanged
      expect(await pool.stakerPrincipal(user1.address)).to.equal(stakeBefore);
    });
  });

  describe("harvestAndDistribute When Paused", function () {
    async function setupWithYield() {
      const fixture = await loadFixture(deployFixture);
      const { pool, usdt, morphoVault, user1, factory, owner } = fixture;

      // Deposit
      const amount = ethers.parseUnits("10000", 6);
      await usdt.mint(factory.address, amount);
      await usdt.connect(factory).transfer(await pool.getAddress(), amount);
      await pool.connect(factory).depositFor(user1.address, amount);

      // Generate yield in Morpho vault - need to mint USDT to morphoVault first
      const yieldAmount = ethers.parseUnits("1000", 6);
      await usdt.mint(await morphoVault.getAddress(), yieldAmount);
      await morphoVault.connect(owner).generateYield(yieldAmount);

      return fixture;
    }

    it("should block harvestAndDistribute when paused", async function () {
      const { pool, owner, user1 } = await setupWithYield();

      // Pause
      await pool.connect(owner).pause();

      // Try to harvest
      await expect(
        pool.connect(user1).harvestAndDistribute()
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");
    });

    it("should allow harvestAndDistribute when not paused", async function () {
      const { pool, user1 } = await setupWithYield();

      // Should work
      await expect(
        pool.connect(user1).harvestAndDistribute()
      ).to.emit(pool, "YieldHarvested");
    });

    it("should resume harvestAndDistribute after unpause", async function () {
      const { pool, owner, user1 } = await setupWithYield();

      // Pause
      await pool.connect(owner).pause();

      // Blocked
      await expect(
        pool.connect(user1).harvestAndDistribute()
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");

      // Unpause
      await pool.connect(owner).unpause();

      // Works
      await expect(
        pool.connect(user1).harvestAndDistribute()
      ).to.not.be.reverted;
    });

    it("should preserve yield during pause and allow harvesting after unpause", async function () {
      const { pool, owner, user1, morphoVault } = await setupWithYield();

      // Pause
      await pool.connect(owner).pause();

      // More yield accrues during pause
      await morphoVault.generateYield(ethers.parseUnits("500", 6));

      // Cannot harvest while paused
      await expect(
        pool.connect(user1).harvestAndDistribute()
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");

      // Unpause
      await pool.connect(owner).unpause();

      // Can harvest all accumulated yield
      await expect(
        pool.connect(user1).harvestAndDistribute()
      ).to.emit(pool, "YieldHarvested");
    });
  });

  describe("Reward Claiming When Paused", function () {
    async function setupWithRewards() {
      const fixture = await loadFixture(deployFixture);
      const { pool, usdt, fbt, owner, user1, factory } = fixture;

      // Deposit
      const amount = ethers.parseUnits("1000", 6);
      await usdt.mint(factory.address, amount);
      await usdt.connect(factory).transfer(await pool.getAddress(), amount);
      await pool.connect(factory).depositFor(user1.address, amount);

      // Add FBT rewards
      await fbt.mint(await pool.getAddress(), ethers.parseEther("10000"));
      await pool.connect(owner).notifyRewardAmount(ethers.parseEther("10000"));

      return fixture;
    }

    it("should block claimAllRewards when paused", async function () {
      const { pool, owner, user1 } = await setupWithRewards();

      // Pause
      await pool.connect(owner).pause();

      // Cannot claim
      await expect(
        pool.connect(user1).claimAllRewards()
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");
    });

    it("should block claimStakerRewards when paused", async function () {
      const { pool, owner, user1 } = await setupWithRewards();

      await pool.connect(owner).pause();

      await expect(
        pool.connect(user1).claimStakerRewards()
      ).to.be.revertedWithCustomError(pool, "EnforcedPause");
    });

    it("should allow claiming rewards after unpause", async function () {
      const { pool, owner, user1 } = await setupWithRewards();

      // Pause
      await pool.connect(owner).pause();

      // Unpause
      await pool.connect(owner).unpause();

      // Should work
      await expect(
        pool.connect(user1).claimAllRewards()
      ).to.not.be.reverted;
    });
  });

  describe("Normal Operations When Not Paused", function () {
    it("should handle full workflow when never paused", async function () {
      const { pool, usdt, fbt, owner, user1, factory, morphoVault } = await loadFixture(deployFixture);

      // Verify not paused
      expect(await pool.paused()).to.be.false;

      // Deposit
      const depositAmount = ethers.parseUnits("5000", 6);
      await usdt.mint(factory.address, depositAmount);
      await usdt.connect(factory).transfer(await pool.getAddress(), depositAmount);
      await pool.connect(factory).depositFor(user1.address, depositAmount);

      // Generate yield
      await morphoVault.generateYield(ethers.parseUnits("500", 6));

      // Harvest
      await pool.harvestAndDistribute();

      // Add FBT rewards
      await fbt.mint(await pool.getAddress(), ethers.parseEther("1000"));
      await pool.connect(owner).notifyRewardAmount(ethers.parseEther("1000"));

      // Claim rewards
      await pool.connect(user1).claimAllRewards();

      // Unstake
      await pool.connect(user1).unstake(ethers.parseUnits("1000", 6));

      expect(await pool.stakerPrincipal(user1.address)).to.equal(ethers.parseUnits("4000", 6));
    });

    it("should handle multiple pause/unpause cycles", async function () {
      const { pool, usdt, owner, user1, factory } = await loadFixture(deployFixture);

      const amount1 = ethers.parseUnits("1000", 6);
      const amount2 = ethers.parseUnits("500", 6);

      await usdt.mint(factory.address, amount1 + amount2);

      // Deposit
      await usdt.connect(factory).transfer(await pool.getAddress(), amount1);
      await pool.connect(factory).depositFor(user1.address, amount1);

      // Cycle 1
      await pool.connect(owner).pause();
      await pool.connect(owner).unpause();

      // Deposit again
      await usdt.connect(factory).transfer(await pool.getAddress(), amount2);
      await pool.connect(factory).depositFor(user1.address, amount2);

      // Cycle 2
      await pool.connect(owner).pause();
      await pool.connect(owner).unpause();

      // Unstake
      await pool.connect(user1).unstake(ethers.parseUnits("300", 6));

      expect(await pool.stakerPrincipal(user1.address)).to.equal(ethers.parseUnits("1200", 6));
    });
  });

  describe("State Preservation During Pause", function () {
    it("should maintain all state variables through pause/unpause", async function () {
      const { pool, usdt, fbt, owner, user1, user2, factory } = await loadFixture(deployFixture);

      // Setup complex state
      const amount1 = ethers.parseUnits("3000", 6);
      const amount2 = ethers.parseUnits("2000", 6);

      await usdt.mint(factory.address, amount1 + amount2);

      await usdt.connect(factory).transfer(await pool.getAddress(), amount1);
      await pool.connect(factory).depositFor(user1.address, amount1);

      await usdt.connect(factory).transfer(await pool.getAddress(), amount2);
      await pool.connect(factory).depositFor(user2.address, amount2);

      await fbt.mint(await pool.getAddress(), ethers.parseEther("5000"));
      await pool.connect(owner).notifyRewardAmount(ethers.parseEther("5000"));

      // Capture state
      const stateBefore = {
        user1Stake: await pool.stakerPrincipal(user1.address),
        user2Stake: await pool.stakerPrincipal(user2.address),
        totalStake: await pool.totalStakedPrincipal(),
        rewardRate: await pool.rewardRate(),
        periodFinish: await pool.periodFinish()
      };

      // Pause
      await pool.connect(owner).pause();

      // State unchanged during pause
      expect(await pool.stakerPrincipal(user1.address)).to.equal(stateBefore.user1Stake);
      expect(await pool.stakerPrincipal(user2.address)).to.equal(stateBefore.user2Stake);
      expect(await pool.totalStakedPrincipal()).to.equal(stateBefore.totalStake);

      // Unpause
      await pool.connect(owner).unpause();

      // State still intact
      expect(await pool.stakerPrincipal(user1.address)).to.equal(stateBefore.user1Stake);
      expect(await pool.stakerPrincipal(user2.address)).to.equal(stateBefore.user2Stake);
      expect(await pool.totalStakedPrincipal()).to.equal(stateBefore.totalStake);
      expect(await pool.rewardRate()).to.equal(stateBefore.rewardRate);
    });
  });
});
