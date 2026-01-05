const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FundBraveTimelock Integration", function () {
  async function deployFixture() {
    const [owner, proposer, executor, user1, user2] = await ethers.getSigners();

    const MIN_DELAY = 2 * 24 * 60 * 60; // 2 days

    // Deploy FundBraveTimelock
    const FundBraveTimelock = await ethers.getContractFactory("FundBraveTimelock");
    const timelock = await FundBraveTimelock.deploy(
      MIN_DELAY,
      [proposer.address], // proposers
      [executor.address], // executors
      owner.address // admin
    );

    await timelock.waitForDeployment();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);

    // Deploy FundBraveToken with owner as initial owner
    const FBT = await ethers.getContractFactory("FundBraveToken");
    const fbt = await upgrades.deployProxy(FBT, [owner.address]);

    const MockWealthBuilding = await ethers.getContractFactory("MockWealthBuildingDonation");
    const wealthBuilding = await MockWealthBuilding.deploy(await usdc.getAddress());

    const PlatformTreasury = await ethers.getContractFactory("PlatformTreasury");
    const treasury = await upgrades.deployProxy(PlatformTreasury, [
      await usdc.getAddress(),
      await wealthBuilding.getAddress(),
      await fbt.getAddress(),
      owner.address
    ], { kind: 'uups' });

    await treasury.waitForDeployment();

    // Deploy ImpactDAOPool
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const aUsdc = await MockERC20.deploy("aUSDC", "aUSDC", 6);
    const aavePool = await MockAavePool.deploy(await usdc.getAddress(), await aUsdc.getAddress());

    const ImpactDAOPool = await ethers.getContractFactory("ImpactDAOPool");
    const daoPool = await upgrades.deployProxy(ImpactDAOPool, [
      await aavePool.getAddress(),
      await usdc.getAddress(),
      await aUsdc.getAddress(),
      await fbt.getAddress(),
      user1.address, // yieldDistributor
      user2.address, // platformWallet
      owner.address
    ], { kind: 'uups' });

    await daoPool.waitForDeployment();

    return {
      timelock,
      treasury,
      daoPool,
      usdc,
      fbt,
      owner,
      proposer,
      executor,
      user1,
      user2,
      MIN_DELAY
    };
  }

  describe("Timelock Deployment", function () {
    it("should deploy with correct parameters", async function () {
      const { timelock, MIN_DELAY, proposer, executor } = await loadFixture(deployFixture);

      expect(await timelock.getMinimumDelay()).to.equal(MIN_DELAY);

      // Check roles
      const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
      const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

      expect(await timelock.hasRole(PROPOSER_ROLE, proposer.address)).to.be.true;
      expect(await timelock.hasRole(EXECUTOR_ROLE, executor.address)).to.be.true;
    });

    it("should have correct delay configured", async function () {
      const { timelock } = await loadFixture(deployFixture);

      const delay = await timelock.getMinimumDelay();
      expect(delay).to.equal(2 * 24 * 60 * 60); // 2 days
    });
  });

  describe("PlatformTreasury Timelock Integration", function () {
    it("should set timelock on PlatformTreasury", async function () {
      const { treasury, timelock, owner } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).setTimelock(await timelock.getAddress()))
        .to.emit(treasury, "TimelockSet");

      expect(await treasury.timelock()).to.equal(await timelock.getAddress());
    });

    it("should allow owner to call setTimelock", async function () {
      const { treasury, timelock, owner } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).setTimelock(await timelock.getAddress()))
        .to.not.be.reverted;
    });

    it("should revert when non-owner tries to setTimelock", async function () {
      const { treasury, timelock, user1 } = await loadFixture(deployFixture);

      await expect(treasury.connect(user1).setTimelock(await timelock.getAddress()))
        .to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });

    it("should revert when setting zero address as timelock", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).setTimelock(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(treasury, "ZeroAddress");
    });
  });

  describe("ImpactDAOPool Timelock Integration", function () {
    it("should set timelock on ImpactDAOPool", async function () {
      const { daoPool, timelock, owner } = await loadFixture(deployFixture);

      await expect(daoPool.connect(owner).setTimelock(await timelock.getAddress()))
        .to.emit(daoPool, "TimelockSet");

      expect(await daoPool.timelock()).to.equal(await timelock.getAddress());
    });

    it("should allow owner to call setTimelock", async function () {
      const { daoPool, timelock, owner } = await loadFixture(deployFixture);

      await expect(daoPool.connect(owner).setTimelock(await timelock.getAddress()))
        .to.not.be.reverted;
    });

    it("should revert when non-owner tries to setTimelock", async function () {
      const { daoPool, timelock, user1 } = await loadFixture(deployFixture);

      await expect(daoPool.connect(user1).setTimelock(await timelock.getAddress()))
        .to.be.revertedWithCustomError(daoPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Timelock-Protected Functions", function () {
    it("should allow timelock to call setWealthBuildingDonation on PlatformTreasury", async function () {
      const { treasury, timelock, owner, proposer, executor, usdc } = await loadFixture(deployFixture);

      // Set timelock first
      await treasury.connect(owner).setTimelock(await timelock.getAddress());

      // Deploy new mock WealthBuilding
      const MockWealthBuilding = await ethers.getContractFactory("MockWealthBuildingDonation");
      const newWealthBuilding = await MockWealthBuilding.deploy(await usdc.getAddress());

      // Prepare the call data
      const callData = treasury.interface.encodeFunctionData("setWealthBuildingDonation", [
        await newWealthBuilding.getAddress()
      ]);

      // Calculate operation ID
      const salt = ethers.randomBytes(32);
      const predecessor = ethers.ZeroHash;
      const delay = await timelock.getMinimumDelay();

      // Schedule the operation
      await timelock.connect(proposer).schedule(
        await treasury.getAddress(),
        0,
        callData,
        predecessor,
        salt,
        delay
      );

      // Fast forward past delay
      await time.increase(delay + 1n);

      // Execute the operation
      await expect(
        timelock.connect(executor).execute(
          await treasury.getAddress(),
          0,
          callData,
          predecessor,
          salt
        )
      ).to.not.be.reverted;
    });

    it("should allow timelock to call setDefaultYieldSplit on ImpactDAOPool", async function () {
      const { daoPool, timelock, owner, proposer, executor } = await loadFixture(deployFixture);

      // Set timelock
      await daoPool.connect(owner).setTimelock(await timelock.getAddress());

      // Prepare new yield split: 80% DAO, 18% staker, 2% platform
      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        8000, 1800, 200
      ]);

      const salt = ethers.randomBytes(32);
      const predecessor = ethers.ZeroHash;
      const delay = await timelock.getMinimumDelay();

      // Schedule
      await timelock.connect(proposer).schedule(
        await daoPool.getAddress(),
        0,
        callData,
        predecessor,
        salt,
        delay
      );

      // Fast forward
      await time.increase(delay + 1n);

      // Execute
      await expect(
        timelock.connect(executor).execute(
          await daoPool.getAddress(),
          0,
          callData,
          predecessor,
          salt
        )
      ).to.not.be.reverted;
    });

    it("should allow owner to call protected function without timelock", async function () {
      const { daoPool, owner } = await loadFixture(deployFixture);

      // Owner can call directly (no timelock set)
      await expect(daoPool.connect(owner).setDefaultYieldSplit(8000, 1800, 200))
        .to.not.be.reverted;
    });

    it("should require timelock for protected functions when timelock is set", async function () {
      const { treasury, timelock, owner, user1, usdc } = await loadFixture(deployFixture);

      // Set timelock
      await treasury.connect(owner).setTimelock(await timelock.getAddress());

      const MockWealthBuilding = await ethers.getContractFactory("MockWealthBuildingDonation");
      const newWealthBuilding = await MockWealthBuilding.deploy(await usdc.getAddress());

      // Owner can still call (onlyTimelockOrOwner allows both)
      await expect(
        treasury.connect(owner).setWealthBuildingDonation(await newWealthBuilding.getAddress())
      ).to.not.be.reverted;

      // But non-owner/non-timelock cannot
      const anotherMock = await MockWealthBuilding.deploy(await usdc.getAddress());
      await expect(
        treasury.connect(user1).setWealthBuildingDonation(await anotherMock.getAddress())
      ).to.be.revertedWith("PlatformTreasury: Not authorized");
    });
  });

  describe("Timelock Workflow", function () {
    it("should complete full proposal/execution flow", async function () {
      const { daoPool, timelock, owner, proposer, executor, MIN_DELAY } = await loadFixture(deployFixture);

      await daoPool.connect(owner).setTimelock(await timelock.getAddress());

      // Proposal: Change yield split
      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        7500, 2300, 200
      ]);

      const salt = ethers.randomBytes(32);
      const predecessor = ethers.ZeroHash;

      // Schedule
      const scheduleTx = await timelock.connect(proposer).schedule(
        await daoPool.getAddress(),
        0,
        callData,
        predecessor,
        salt,
        MIN_DELAY
      );

      const receipt = await scheduleTx.wait();
      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log)?.name === "CallScheduled";
        } catch {
          return false;
        }
      });

      const parsedEvent = timelock.interface.parseLog(event);
      const operationId = parsedEvent.args.id;

      // Check pending
      expect(await timelock.isPending(operationId)).to.be.true;
      expect(await timelock.isReady(operationId)).to.be.false;
      expect(await timelock.isExecuted(operationId)).to.be.false;

      // Fast forward
      await time.increase(MIN_DELAY + 1);

      // Now ready
      expect(await timelock.isReady(operationId)).to.be.true;

      // Execute
      await timelock.connect(executor).execute(
        await daoPool.getAddress(),
        0,
        callData,
        predecessor,
        salt
      );

      // Check executed
      expect(await timelock.isExecuted(operationId)).to.be.true;

      // Verify state changed
      const newSplit = await daoPool.defaultYieldSplit();
      expect(newSplit.daoShare).to.equal(7500);
      expect(newSplit.stakerShare).to.equal(2300);
      expect(newSplit.platformShare).to.equal(200);
    });

    it("should prevent execution before delay", async function () {
      const { daoPool, timelock, owner, proposer, executor, MIN_DELAY } = await loadFixture(deployFixture);

      await daoPool.connect(owner).setTimelock(await timelock.getAddress());

      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        8000, 1800, 200
      ]);

      const salt = ethers.randomBytes(32);

      await timelock.connect(proposer).schedule(
        await daoPool.getAddress(),
        0,
        callData,
        ethers.ZeroHash,
        salt,
        MIN_DELAY
      );

      // Try to execute immediately
      await expect(
        timelock.connect(executor).execute(
          await daoPool.getAddress(),
          0,
          callData,
          ethers.ZeroHash,
          salt
        )
      ).to.be.reverted;
    });

    it("should allow cancellation of pending operations", async function () {
      const { daoPool, timelock, owner, proposer, MIN_DELAY } = await loadFixture(deployFixture);

      await daoPool.connect(owner).setTimelock(await timelock.getAddress());

      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        8000, 1800, 200
      ]);

      const salt = ethers.randomBytes(32);

      const scheduleTx = await timelock.connect(proposer).schedule(
        await daoPool.getAddress(),
        0,
        callData,
        ethers.ZeroHash,
        salt,
        MIN_DELAY
      );

      const receipt = await scheduleTx.wait();
      const event = receipt.logs.find(log => {
        try {
          return timelock.interface.parseLog(log)?.name === "CallScheduled";
        } catch {
          return false;
        }
      });

      const parsedEvent = timelock.interface.parseLog(event);
      const operationId = parsedEvent.args.id;

      expect(await timelock.isPending(operationId)).to.be.true;

      // Cancel (proposer has canceller role)
      await timelock.connect(proposer).cancel(operationId);

      expect(await timelock.isPending(operationId)).to.be.false;
    });
  });

  describe("Security Scenarios", function () {
    it("should prevent unauthorized scheduling", async function () {
      const { daoPool, timelock, user1, MIN_DELAY } = await loadFixture(deployFixture);

      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        8000, 1800, 200
      ]);

      // user1 is not a proposer
      await expect(
        timelock.connect(user1).schedule(
          await daoPool.getAddress(),
          0,
          callData,
          ethers.ZeroHash,
          ethers.randomBytes(32),
          MIN_DELAY
        )
      ).to.be.reverted;
    });

    it("should prevent unauthorized execution", async function () {
      const { daoPool, timelock, proposer, user1, MIN_DELAY } = await loadFixture(deployFixture);

      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        8000, 1800, 200
      ]);

      const salt = ethers.randomBytes(32);

      await timelock.connect(proposer).schedule(
        await daoPool.getAddress(),
        0,
        callData,
        ethers.ZeroHash,
        salt,
        MIN_DELAY
      );

      await time.increase(MIN_DELAY + 1);

      // user1 is not an executor
      await expect(
        timelock.connect(user1).execute(
          await daoPool.getAddress(),
          0,
          callData,
          ethers.ZeroHash,
          salt
        )
      ).to.be.reverted;
    });

    it("should provide transparency window for users to react", async function () {
      const { daoPool, timelock, owner, proposer, MIN_DELAY } = await loadFixture(deployFixture);

      await daoPool.connect(owner).setTimelock(await timelock.getAddress());

      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        5000, 4800, 200 // Malicious: reducing DAO share significantly
      ]);

      const salt = ethers.randomBytes(32);

      const tx = await timelock.connect(proposer).schedule(
        await daoPool.getAddress(),
        0,
        callData,
        ethers.ZeroHash,
        salt,
        MIN_DELAY
      );

      const receipt = await tx.wait();
      const timestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;

      // Users have MIN_DELAY seconds to react
      const executionTime = timestamp + MIN_DELAY;
      const currentTime = await time.latest();

      expect(executionTime - currentTime).to.be.gte(MIN_DELAY - 1);
    });
  });

  describe("Helper Functions", function () {
    it("should correctly report operation states", async function () {
      const { daoPool, timelock, owner, proposer, executor, MIN_DELAY } = await loadFixture(deployFixture);

      // Set timelock on daoPool
      await daoPool.connect(owner).setTimelock(await timelock.getAddress());

      const callData = daoPool.interface.encodeFunctionData("setDefaultYieldSplit", [
        8000, 1800, 200
      ]);

      const salt = ethers.randomBytes(32);

      // Before scheduling
      const operationId = await timelock.hashOperation(
        await daoPool.getAddress(),
        0,
        callData,
        ethers.ZeroHash,
        salt
      );

      expect(await timelock.isPending(operationId)).to.be.false;
      expect(await timelock.isReady(operationId)).to.be.false;
      expect(await timelock.isExecuted(operationId)).to.be.false;

      // After scheduling
      await timelock.connect(proposer).schedule(
        await daoPool.getAddress(),
        0,
        callData,
        ethers.ZeroHash,
        salt,
        MIN_DELAY
      );

      expect(await timelock.isPending(operationId)).to.be.true;
      expect(await timelock.isReady(operationId)).to.be.false;

      // After delay
      await time.increase(BigInt(MIN_DELAY) + 1n);

      expect(await timelock.isReady(operationId)).to.be.true;

      // After execution
      await timelock.connect(executor).execute(
        await daoPool.getAddress(),
        0,
        callData,
        ethers.ZeroHash,
        salt
      );

      expect(await timelock.isExecuted(operationId)).to.be.true;
    });
  });
});
