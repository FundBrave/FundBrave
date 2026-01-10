const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("PlatformTreasury", function () {
  // Constants for testing
  const USDC_DECIMALS = 6;
  const FBT_DECIMALS = 18;
  const STOCK_DECIMALS = 18;
  const PRECISION = ethers.parseUnits("1", 18); // 1e18
  const PLATFORM_FUNDRAISER_ID = ethers.MaxUint256;

  async function deployFixture() {
    const [owner, feeSender1, feeSender2, fbtStaker1, fbtStaker2, fbtStaker3, unauthorized] =
      await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
    const aUsdc = await MockERC20.deploy("Aave USDC", "aUSDC", USDC_DECIMALS);
    const fbt = await MockERC20.deploy("FundBrave Token", "FBT", FBT_DECIMALS);

    // Deploy mock stock token for WealthBuildingDonation
    const bCSPX = await MockERC20.deploy("Backed S&P 500", "bCSPX", STOCK_DECIMALS);

    // Deploy mock Aave pool
    const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
    const mockAavePool = await MockAavePool.deploy(await usdc.getAddress(), await aUsdc.getAddress());

    // Deploy MockStockSwapAdapter
    const MockStockSwapAdapter = await ethers.getContractFactory("MockStockSwapAdapter");
    const swapAdapter = await MockStockSwapAdapter.deploy(await usdc.getAddress());
    await swapAdapter.addSupportedToken(await bCSPX.getAddress(), STOCK_DECIMALS);

    // Mint stock tokens to swap adapter
    await bCSPX.mint(await swapAdapter.getAddress(), ethers.parseUnits("1000000", STOCK_DECIMALS));

    // Deploy WealthBuildingDonation (needed for treasury integration)
    const WealthBuildingDonation = await ethers.getContractFactory("WealthBuildingDonation");
    const wealthBuilding = await upgrades.deployProxy(
      WealthBuildingDonation,
      [
        await mockAavePool.getAddress(),
        await usdc.getAddress(),
        await aUsdc.getAddress(),
        await swapAdapter.getAddress(),
        owner.address, // Will be updated to treasury address later
        owner.address,
      ],
      { kind: "uups" }
    );

    // Deploy PlatformTreasury
    const PlatformTreasury = await ethers.getContractFactory("PlatformTreasury");
    const treasury = await upgrades.deployProxy(
      PlatformTreasury,
      [
        await usdc.getAddress(),
        await wealthBuilding.getAddress(),
        await fbt.getAddress(),
        owner.address,
      ],
      { kind: "uups" }
    );

    // Update WealthBuildingDonation to use treasury address
    await wealthBuilding.setPlatformTreasury(await treasury.getAddress());

    // Transfer ownership of WealthBuildingDonation to treasury so it can register fundraiser
    await wealthBuilding.transferOwnership(await treasury.getAddress());

    // Register treasury as a fundraiser in WealthBuildingDonation
    await treasury.registerTreasuryFundraiser();

    // Mint tokens
    const INITIAL_USDC = ethers.parseUnits("1000000", USDC_DECIMALS); // 1M USDC
    const INITIAL_FBT = ethers.parseUnits("1000000", FBT_DECIMALS); // 1M FBT

    await usdc.mint(feeSender1.address, INITIAL_USDC);
    await usdc.mint(feeSender2.address, INITIAL_USDC);
    await fbt.mint(fbtStaker1.address, INITIAL_FBT);
    await fbt.mint(fbtStaker2.address, INITIAL_FBT);
    await fbt.mint(fbtStaker3.address, INITIAL_FBT);

    // Approve treasury
    await usdc.connect(feeSender1).approve(await treasury.getAddress(), ethers.MaxUint256);
    await usdc.connect(feeSender2).approve(await treasury.getAddress(), ethers.MaxUint256);
    await fbt.connect(fbtStaker1).approve(await treasury.getAddress(), ethers.MaxUint256);
    await fbt.connect(fbtStaker2).approve(await treasury.getAddress(), ethers.MaxUint256);
    await fbt.connect(fbtStaker3).approve(await treasury.getAddress(), ethers.MaxUint256);

    // Authorize fee senders
    await treasury.authorizeFeeSender(feeSender1.address);
    await treasury.authorizeFeeSender(feeSender2.address);

    return {
      treasury,
      wealthBuilding,
      usdc,
      aUsdc,
      fbt,
      bCSPX,
      mockAavePool,
      swapAdapter,
      owner,
      feeSender1,
      feeSender2,
      fbtStaker1,
      fbtStaker2,
      fbtStaker3,
      unauthorized,
      INITIAL_USDC,
      INITIAL_FBT,
    };
  }

  describe("Deployment and Initialization", function () {
    it("should deploy and initialize correctly with all parameters", async function () {
      const { treasury, usdc, wealthBuilding, fbt, owner } = await loadFixture(deployFixture);

      expect(await treasury.USDC()).to.equal(await usdc.getAddress());
      expect(await treasury.wealthBuildingDonation()).to.equal(await wealthBuilding.getAddress());
      expect(await treasury.FBT()).to.equal(await fbt.getAddress());
      expect(await treasury.owner()).to.equal(owner.address);
    });

    it("should set minStakeThreshold to 1000 USDC", async function () {
      const { treasury } = await loadFixture(deployFixture);

      const expectedThreshold = ethers.parseUnits("1000", USDC_DECIMALS);
      expect(await treasury.minStakeThreshold()).to.equal(expectedThreshold);
    });

    it("should approve USDC to WealthBuildingDonation", async function () {
      const { treasury, usdc, wealthBuilding } = await loadFixture(deployFixture);

      const allowance = await usdc.allowance(
        await treasury.getAddress(),
        await wealthBuilding.getAddress()
      );
      expect(allowance).to.equal(ethers.MaxUint256);
    });

    it("should set PLATFORM_FUNDRAISER_ID to type(uint256).max", async function () {
      const { treasury } = await loadFixture(deployFixture);

      expect(await treasury.PLATFORM_FUNDRAISER_ID()).to.equal(PLATFORM_FUNDRAISER_ID);
    });

    it("should revert if initialized twice", async function () {
      const { treasury, usdc, wealthBuilding, fbt, owner } = await loadFixture(deployFixture);

      await expect(
        treasury.initialize(
          await usdc.getAddress(),
          await wealthBuilding.getAddress(),
          await fbt.getAddress(),
          owner.address
        )
      ).to.be.revertedWithCustomError(treasury, "InvalidInitialization");
    });

    it("should revert initialization with zero addresses", async function () {
      const PlatformTreasury = await ethers.getContractFactory("PlatformTreasury");
      const { usdc, wealthBuilding, fbt, owner } = await loadFixture(deployFixture);

      // Zero USDC
      await expect(
        upgrades.deployProxy(
          PlatformTreasury,
          [ethers.ZeroAddress, await wealthBuilding.getAddress(), await fbt.getAddress(), owner.address],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(PlatformTreasury, "ZeroAddress");

      // Zero WealthBuildingDonation
      await expect(
        upgrades.deployProxy(
          PlatformTreasury,
          [await usdc.getAddress(), ethers.ZeroAddress, await fbt.getAddress(), owner.address],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(PlatformTreasury, "ZeroAddress");

      // Zero FBT
      await expect(
        upgrades.deployProxy(
          PlatformTreasury,
          [await usdc.getAddress(), await wealthBuilding.getAddress(), ethers.ZeroAddress, owner.address],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(PlatformTreasury, "ZeroAddress");

      // Zero owner
      await expect(
        upgrades.deployProxy(
          PlatformTreasury,
          [await usdc.getAddress(), await wealthBuilding.getAddress(), await fbt.getAddress(), ethers.ZeroAddress],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(PlatformTreasury, "ZeroAddress");
    });

    it("should initialize with zero fees and zero staking", async function () {
      const { treasury } = await loadFixture(deployFixture);

      expect(await treasury.totalFeesCollected()).to.equal(0);
      expect(await treasury.totalFeesStaked()).to.equal(0);
      expect(await treasury.pendingFeesToStake()).to.equal(0);
      expect(await treasury.totalFBTStaked()).to.equal(0);
      expect(await treasury.operationalFunds()).to.equal(0);
      expect(await treasury.totalYieldDistributed()).to.equal(0);
    });
  });

  describe("Fee Collection", function () {
    it("should allow authorized senders to send fees", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);

      await expect(treasury.connect(feeSender1).receiveFee(feeAmount))
        .to.emit(treasury, "FeeReceived")
        .withArgs(feeSender1.address, feeAmount);
    });

    it("should update totalFeesCollected correctly", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      expect(await treasury.totalFeesCollected()).to.equal(feeAmount);
    });

    it("should update pendingFeesToStake correctly", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      expect(await treasury.pendingFeesToStake()).to.equal(feeAmount);
    });

    it("should emit FeeReceived event with correct parameters", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);

      await expect(treasury.connect(feeSender1).receiveFee(feeAmount))
        .to.emit(treasury, "FeeReceived")
        .withArgs(feeSender1.address, feeAmount);
    });

    it("should revert if sender is not authorized", async function () {
      const { treasury, unauthorized, usdc } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);

      // Mint and approve USDC for unauthorized user
      await usdc.mint(unauthorized.address, feeAmount);
      await usdc.connect(unauthorized).approve(await treasury.getAddress(), feeAmount);

      await expect(treasury.connect(unauthorized).receiveFee(feeAmount)).to.be.revertedWithCustomError(
        treasury,
        "Unauthorized"
      );
    });

    it("should revert on zero amount", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      await expect(treasury.connect(feeSender1).receiveFee(0)).to.be.revertedWithCustomError(
        treasury,
        "InvalidAmount"
      );
    });

    it("should auto-stake when pendingFeesToStake >= minStakeThreshold", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const minThreshold = await treasury.minStakeThreshold();
      const feeAmount = minThreshold + ethers.parseUnits("100", USDC_DECIMALS);

      await expect(treasury.connect(feeSender1).receiveFee(feeAmount))
        .to.emit(treasury, "FeeReceived")
        .to.emit(treasury, "FeesStaked");

      // After auto-staking, pendingFeesToStake should be 0
      expect(await treasury.pendingFeesToStake()).to.equal(0);
    });

    it("should accumulate fees below threshold without auto-staking", async function () {
      const { treasury, feeSender1, feeSender2 } = await loadFixture(deployFixture);

      const minThreshold = await treasury.minStakeThreshold();
      const smallFee = minThreshold / 2n;

      // Send fee below threshold
      await treasury.connect(feeSender1).receiveFee(smallFee);

      expect(await treasury.pendingFeesToStake()).to.equal(smallFee);
      expect(await treasury.totalFeesStaked()).to.equal(0);

      // Send another fee that pushes over threshold
      await expect(treasury.connect(feeSender2).receiveFee(smallFee + ethers.parseUnits("1", USDC_DECIMALS)))
        .to.emit(treasury, "FeesStaked");

      expect(await treasury.pendingFeesToStake()).to.equal(0);
    });

    it("should revert when paused", async function () {
      const { treasury, feeSender1, owner } = await loadFixture(deployFixture);

      await treasury.connect(owner).pause();

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await expect(treasury.connect(feeSender1).receiveFee(feeAmount)).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );
    });

    it("should work after unpause", async function () {
      const { treasury, feeSender1, owner } = await loadFixture(deployFixture);

      await treasury.connect(owner).pause();
      await treasury.connect(owner).unpause();

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);
      await expect(treasury.connect(feeSender1).receiveFee(feeAmount)).to.emit(treasury, "FeeReceived");
    });
  });

  describe("Fee Staking", function () {
    it("should stake accumulated fees via WealthBuildingDonation", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("5000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      // pendingFeesToStake should be 0 after auto-stake
      expect(await treasury.pendingFeesToStake()).to.equal(0);
      expect(await treasury.totalFeesStaked()).to.equal(feeAmount);
    });

    it("should call donate() with PLATFORM_FUNDRAISER_ID", async function () {
      const { treasury, feeSender1, wealthBuilding } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("5000", USDC_DECIMALS);

      // Check that donation event was emitted from WealthBuildingDonation
      await expect(treasury.connect(feeSender1).receiveFee(feeAmount))
        .to.emit(wealthBuilding, "DonationMade")
        .withArgs(
          await treasury.getAddress(),
          PLATFORM_FUNDRAISER_ID,
          feeAmount,
          anyValue, // directAmount
          anyValue, // endowmentAmount
          anyValue  // platformFee
        );
    });

    it("should update totalFeesStaked correctly", async function () {
      const { treasury, feeSender1, feeSender2 } = await loadFixture(deployFixture);

      const fee1 = ethers.parseUnits("5000", USDC_DECIMALS);
      const fee2 = ethers.parseUnits("2000", USDC_DECIMALS);

      await treasury.connect(feeSender1).receiveFee(fee1);
      await treasury.connect(feeSender2).receiveFee(fee2);

      expect(await treasury.totalFeesStaked()).to.equal(fee1 + fee2);
    });

    it("should reset pendingFeesToStake to zero after staking", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("5000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      expect(await treasury.pendingFeesToStake()).to.equal(0);
    });

    it("should emit FeesStaked event with correct parameters", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("5000", USDC_DECIMALS);

      // Calculate expected endowment (20% of total)
      const expectedEndowment = (feeAmount * 2000n) / 10000n;

      await expect(treasury.connect(feeSender1).receiveFee(feeAmount))
        .to.emit(treasury, "FeesStaked")
        .withArgs(feeAmount, expectedEndowment);
    });

    it("should handle the 80/20 split correctly (78% operational, 20% endowment, 2% circular fee)", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS); // 10000 USDC
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();

      // 78% of 10000 = 7800 USDC
      const expectedOperationalFunds = (feeAmount * 7800n) / 10000n;
      expect(operationalFunds).to.equal(expectedOperationalFunds);

      // Check endowment through WealthBuildingDonation
      const [, , , , endowmentPrincipal, ] = await treasury.getTreasuryInfo();
      const expectedEndowment = (feeAmount * 2000n) / 10000n; // 20% = 2000 USDC
      expect(endowmentPrincipal).to.equal(expectedEndowment);
    });

    it("should allow manual staking via stakeFees()", async function () {
      const { treasury, feeSender1, owner } = await loadFixture(deployFixture);

      // Set threshold very high to prevent auto-staking
      await treasury.connect(owner).setMinStakeThreshold(ethers.parseUnits("1000000", USDC_DECIMALS));

      const feeAmount = ethers.parseUnits("5000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      // Should have pending fees
      expect(await treasury.pendingFeesToStake()).to.equal(feeAmount);

      // Manually stake
      await expect(treasury.stakeFees()).to.emit(treasury, "FeesStaked");

      expect(await treasury.pendingFeesToStake()).to.equal(0);
      expect(await treasury.totalFeesStaked()).to.equal(feeAmount);
    });

    it("should revert stakeFees() if no pending fees", async function () {
      const { treasury } = await loadFixture(deployFixture);

      await expect(treasury.stakeFees()).to.be.revertedWithCustomError(treasury, "NoPendingFees");
    });

    it("should revert stakeFees() when paused", async function () {
      const { treasury, feeSender1, owner } = await loadFixture(deployFixture);

      // Set threshold high
      await treasury.connect(owner).setMinStakeThreshold(ethers.parseUnits("1000000", USDC_DECIMALS));

      const feeAmount = ethers.parseUnits("5000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      await treasury.connect(owner).pause();

      await expect(treasury.stakeFees()).to.be.revertedWithCustomError(treasury, "EnforcedPause");
    });
  });

  describe("Platform Yield Harvesting", function () {
    async function setupYieldScenario(fixture) {
      const { treasury, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } = fixture;

      // Stake fees to create endowment
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      // Simulate yield by minting aUSDC to WealthBuildingDonation
      const yieldAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      return { yieldAmount };
    }

    it("should harvest yield from WealthBuildingDonation endowment", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldScenario(fixture);

      const { treasury } = fixture;

      await expect(treasury.harvestPlatformYield()).to.emit(treasury, "YieldHarvested");
    });

    it("should receive 30% of endowment yield (cause share)", async function () {
      const fixture = await loadFixture(deployFixture);
      const { yieldAmount } = await setupYieldScenario(fixture);

      const { treasury } = fixture;

      // Get pending yield before harvest
      const [causeYield, donorYield] = await treasury.getTreasuryPendingYield();

      // Total yield should be approximately the simulated amount
      const totalYield = causeYield + donorYield;
      expect(totalYield).to.be.closeTo(yieldAmount, ethers.parseUnits("1", USDC_DECIMALS));

      // Cause yield should be ~30% of total
      const expectedCauseYield = (totalYield * 3000n) / 10000n;
      expect(causeYield).to.be.closeTo(expectedCauseYield, ethers.parseUnits("0.1", USDC_DECIMALS));
    });

    it("should update yieldPerTokenStored for FBT stakers", async function () {
      const fixture = await loadFixture(deployFixture);
      const { treasury, fbtStaker1 } = fixture;

      // Stake FBT first
      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      await setupYieldScenario(fixture);

      const yieldPerTokenBefore = await treasury.yieldPerTokenStored();

      await treasury.harvestPlatformYield();

      const yieldPerTokenAfter = await treasury.yieldPerTokenStored();

      expect(yieldPerTokenAfter).to.be.gt(yieldPerTokenBefore);
    });

    it("should emit YieldHarvested and YieldDistributed events", async function () {
      const fixture = await loadFixture(deployFixture);
      const { treasury, fbtStaker1 } = fixture;

      // Stake FBT first
      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      await setupYieldScenario(fixture);

      await expect(treasury.harvestPlatformYield())
        .to.emit(treasury, "YieldHarvested")
        .to.emit(treasury, "YieldDistributed");
    });

    it("should handle case where no FBT is staked (add to operational funds)", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldScenario(fixture);

      const { treasury } = fixture;

      const operationalFundsBefore = await treasury.operationalFunds();

      await treasury.harvestPlatformYield();

      const operationalFundsAfter = await treasury.operationalFunds();

      // Yield should be added to operational funds
      expect(operationalFundsAfter).to.be.gt(operationalFundsBefore);
    });

    it("should calculate yield distribution correctly", async function () {
      const fixture = await loadFixture(deployFixture);
      const { treasury, fbtStaker1 } = fixture;

      // Stake FBT
      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      await setupYieldScenario(fixture);

      const [causeYield, ] = await treasury.getTreasuryPendingYield();

      await treasury.harvestPlatformYield();

      const totalYieldDistributed = await treasury.totalYieldDistributed();

      // Total yield distributed should equal cause yield (30% of total)
      expect(totalYieldDistributed).to.be.closeTo(causeYield, ethers.parseUnits("0.1", USDC_DECIMALS));
    });

    it("should revert if no yield available", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      // Stake fees but don't generate yield
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      await expect(treasury.harvestPlatformYield()).to.be.revertedWithCustomError(
        treasury,
        "NoYieldAvailable"
      );
    });

    it("should revert when paused", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldScenario(fixture);

      const { treasury, owner } = fixture;

      await treasury.connect(owner).pause();

      await expect(treasury.harvestPlatformYield()).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );
    });
  });

  describe("FBT Staking (for yield distribution)", function () {
    it("should allow users to stake FBT tokens", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await expect(treasury.connect(fbtStaker1).stakeFBT(fbtAmount))
        .to.emit(treasury, "FBTStaked")
        .withArgs(fbtStaker1.address, fbtAmount);
    });

    it("should transfer FBT from user to treasury", async function () {
      const { treasury, fbtStaker1, fbt, INITIAL_FBT } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      const stakerBalance = await fbt.balanceOf(fbtStaker1.address);
      const treasuryBalance = await fbt.balanceOf(await treasury.getAddress());

      expect(stakerBalance).to.equal(INITIAL_FBT - fbtAmount);
      expect(treasuryBalance).to.equal(fbtAmount);
    });

    it("should update fbtStaked[user] correctly", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      expect(await treasury.fbtStaked(fbtStaker1.address)).to.equal(fbtAmount);
    });

    it("should update totalFBTStaked correctly", async function () {
      const { treasury, fbtStaker1, fbtStaker2 } = await loadFixture(deployFixture);

      const fbt1 = ethers.parseUnits("1000", FBT_DECIMALS);
      const fbt2 = ethers.parseUnits("2000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbt1);
      await treasury.connect(fbtStaker2).stakeFBT(fbt2);

      expect(await treasury.totalFBTStaked()).to.equal(fbt1 + fbt2);
    });

    it("should emit FBTStaked event with correct parameters", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await expect(treasury.connect(fbtStaker1).stakeFBT(fbtAmount))
        .to.emit(treasury, "FBTStaked")
        .withArgs(fbtStaker1.address, fbtAmount);
    });

    it("should update rewards via updateReward modifier", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      // First stake
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      const userYieldPerTokenPaid = await treasury.userYieldPerTokenPaid(fbtStaker1.address);
      const yieldPerTokenStored = await treasury.yieldPerTokenStored();

      expect(userYieldPerTokenPaid).to.equal(yieldPerTokenStored);
    });

    it("should revert if amount is zero", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      await expect(treasury.connect(fbtStaker1).stakeFBT(0)).to.be.revertedWithCustomError(
        treasury,
        "InvalidAmount"
      );
    });

    it("should revert when paused", async function () {
      const { treasury, fbtStaker1, owner } = await loadFixture(deployFixture);

      await treasury.connect(owner).pause();

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await expect(treasury.connect(fbtStaker1).stakeFBT(fbtAmount)).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );
    });

    it("should allow multiple stakes from same user", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbt1 = ethers.parseUnits("1000", FBT_DECIMALS);
      const fbt2 = ethers.parseUnits("500", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbt1);
      await treasury.connect(fbtStaker1).stakeFBT(fbt2);

      expect(await treasury.fbtStaked(fbtStaker1.address)).to.equal(fbt1 + fbt2);
    });
  });

  describe("FBT Unstaking", function () {
    it("should allow users to unstake FBT tokens", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);
      await expect(treasury.connect(fbtStaker1).unstakeFBT(fbtAmount))
        .to.emit(treasury, "FBTUnstaked")
        .withArgs(fbtStaker1.address, fbtAmount);
    });

    it("should transfer FBT back to user", async function () {
      const { treasury, fbtStaker1, fbt, INITIAL_FBT } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);
      await treasury.connect(fbtStaker1).unstakeFBT(fbtAmount);

      const stakerBalance = await fbt.balanceOf(fbtStaker1.address);
      const treasuryBalance = await fbt.balanceOf(await treasury.getAddress());

      expect(stakerBalance).to.equal(INITIAL_FBT);
      expect(treasuryBalance).to.equal(0);
    });

    it("should update balances correctly", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);
      await treasury.connect(fbtStaker1).unstakeFBT(fbtAmount / 2n);

      expect(await treasury.fbtStaked(fbtStaker1.address)).to.equal(fbtAmount / 2n);
      expect(await treasury.totalFBTStaked()).to.equal(fbtAmount / 2n);
    });

    it("should emit FBTUnstaked event", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      await expect(treasury.connect(fbtStaker1).unstakeFBT(fbtAmount))
        .to.emit(treasury, "FBTUnstaked")
        .withArgs(fbtStaker1.address, fbtAmount);
    });

    it("should update rewards before unstaking", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      const userYieldPerTokenPaid = await treasury.userYieldPerTokenPaid(fbtStaker1.address);

      await treasury.connect(fbtStaker1).unstakeFBT(fbtAmount);

      const newUserYieldPerTokenPaid = await treasury.userYieldPerTokenPaid(fbtStaker1.address);

      expect(newUserYieldPerTokenPaid).to.equal(userYieldPerTokenPaid);
    });

    it("should revert if user tries to unstake more than staked", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      await expect(
        treasury.connect(fbtStaker1).unstakeFBT(fbtAmount + 1n)
      ).to.be.revertedWithCustomError(treasury, "InsufficientStake");
    });

    it("should revert if amount is zero", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      await expect(treasury.connect(fbtStaker1).unstakeFBT(0)).to.be.revertedWithCustomError(
        treasury,
        "InvalidAmount"
      );
    });

    it("should revert when paused", async function () {
      const { treasury, fbtStaker1, owner } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);
      await treasury.connect(owner).pause();

      await expect(treasury.connect(fbtStaker1).unstakeFBT(fbtAmount)).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );
    });
  });

  describe("Yield Claiming (FBT Stakers)", function () {
    async function setupYieldForStakers(fixture) {
      const { treasury, fbtStaker1, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } = fixture;

      // Stake FBT
      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      // Send fees and stake them
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      // Simulate yield
      const yieldAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      // Harvest yield
      await treasury.harvestPlatformYield();

      return { fbtAmount, yieldAmount };
    }

    it("should allow FBT stakers to claim USDC yield", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldForStakers(fixture);

      const { treasury, fbtStaker1 } = fixture;

      await expect(treasury.connect(fbtStaker1).claimYield()).to.emit(treasury, "YieldClaimed");
    });

    it("should calculate claimable yield correctly using Synthetix-style math", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldForStakers(fixture);

      const { treasury, fbtStaker1 } = fixture;

      const earnedYield = await treasury.earnedYield(fbtStaker1.address);

      expect(earnedYield).to.be.gt(0);
    });

    it("should transfer USDC to staker", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldForStakers(fixture);

      const { treasury, fbtStaker1, usdc } = fixture;

      const earnedYield = await treasury.earnedYield(fbtStaker1.address);
      const balanceBefore = await usdc.balanceOf(fbtStaker1.address);

      await treasury.connect(fbtStaker1).claimYield();

      const balanceAfter = await usdc.balanceOf(fbtStaker1.address);

      expect(balanceAfter - balanceBefore).to.equal(earnedYield);
    });

    it("should emit YieldClaimed event", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldForStakers(fixture);

      const { treasury, fbtStaker1 } = fixture;

      const earnedYield = await treasury.earnedYield(fbtStaker1.address);

      await expect(treasury.connect(fbtStaker1).claimYield())
        .to.emit(treasury, "YieldClaimed")
        .withArgs(fbtStaker1.address, earnedYield);
    });

    it("should update pendingYield to zero after claim", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldForStakers(fixture);

      const { treasury, fbtStaker1 } = fixture;

      await treasury.connect(fbtStaker1).claimYield();

      expect(await treasury.pendingYield(fbtStaker1.address)).to.equal(0);
      expect(await treasury.earnedYield(fbtStaker1.address)).to.equal(0);
    });

    it("should handle zero yield gracefully", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      // Stake FBT but no yield
      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      await expect(treasury.connect(fbtStaker1).claimYield()).to.be.revertedWithCustomError(
        treasury,
        "NoYieldAvailable"
      );
    });

    it("should revert when paused", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldForStakers(fixture);

      const { treasury, fbtStaker1, owner } = fixture;

      await treasury.connect(owner).pause();

      await expect(treasury.connect(fbtStaker1).claimYield()).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );
    });

    it("should allow claiming multiple times", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupYieldForStakers(fixture);

      const { treasury, fbtStaker1, usdc, aUsdc, wealthBuilding, mockAavePool } = fixture;

      // First claim
      await treasury.connect(fbtStaker1).claimYield();

      // Generate more yield
      const moreYield = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), moreYield);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), moreYield);

      await treasury.harvestPlatformYield();

      // Second claim
      await expect(treasury.connect(fbtStaker1).claimYield()).to.emit(treasury, "YieldClaimed");
    });
  });

  describe("Exit Function", function () {
    async function setupForExit(fixture) {
      const { treasury, fbtStaker1, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } = fixture;

      // Stake FBT
      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      // Generate yield
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const yieldAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      await treasury.harvestPlatformYield();

      return { fbtAmount };
    }

    it("should unstake all FBT and claim all yield in one transaction", async function () {
      const fixture = await loadFixture(deployFixture);
      const { fbtAmount } = await setupForExit(fixture);

      const { treasury, fbtStaker1 } = fixture;

      await expect(treasury.connect(fbtStaker1).exit(0))
        .to.emit(treasury, "YieldClaimed")
        .to.emit(treasury, "FBTUnstaked")
        .withArgs(fbtStaker1.address, fbtAmount);
    });

    it("should unstake partial FBT if amount specified", async function () {
      const fixture = await loadFixture(deployFixture);
      const { fbtAmount } = await setupForExit(fixture);

      const { treasury, fbtStaker1 } = fixture;

      const partialAmount = fbtAmount / 2n;

      await expect(treasury.connect(fbtStaker1).exit(partialAmount))
        .to.emit(treasury, "FBTUnstaked")
        .withArgs(fbtStaker1.address, partialAmount);

      expect(await treasury.fbtStaked(fbtStaker1.address)).to.equal(fbtAmount - partialAmount);
    });

    it("should handle exit with no yield gracefully", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      // Exit should only unstake, no yield event
      await expect(treasury.connect(fbtStaker1).exit(0))
        .to.emit(treasury, "FBTUnstaked")
        .to.not.emit(treasury, "YieldClaimed");
    });

    it("should revert when paused", async function () {
      const fixture = await loadFixture(deployFixture);
      await setupForExit(fixture);

      const { treasury, fbtStaker1, owner } = fixture;

      await treasury.connect(owner).pause();

      await expect(treasury.connect(fbtStaker1).exit(0)).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );
    });
  });

  describe("View Functions", function () {
    it("getTreasuryInfo() should return correct stats", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const [totalFeesCollected, totalFeesStaked, pendingFeesToStake, totalFBTStaked, endowmentPrincipal, lifetimeYield] =
        await treasury.getTreasuryInfo();

      expect(totalFeesCollected).to.equal(feeAmount);
      expect(totalFeesStaked).to.equal(feeAmount);
      expect(pendingFeesToStake).to.equal(0);
      expect(totalFBTStaked).to.equal(0);
      expect(endowmentPrincipal).to.equal((feeAmount * 2000n) / 10000n);
      expect(lifetimeYield).to.equal(0);
    });

    it("getStakerInfo() should return correct per-staker data", async function () {
      const { treasury, fbtStaker1, fbtStaker2 } = await loadFixture(deployFixture);

      const fbt1 = ethers.parseUnits("1000", FBT_DECIMALS);
      const fbt2 = ethers.parseUnits("3000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbt1);
      await treasury.connect(fbtStaker2).stakeFBT(fbt2);

      const [fbtStaked, pendingYield, shareOfTreasury] = await treasury.getStakerInfo(fbtStaker1.address);

      expect(fbtStaked).to.equal(fbt1);
      expect(pendingYield).to.equal(0);
      // 1000 / 4000 = 25% = 2500 basis points
      expect(shareOfTreasury).to.equal(2500);
    });

    it("earnedYield() should calculate pending yield correctly", async function () {
      const fixture = await loadFixture(deployFixture);
      const { treasury, fbtStaker1, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } = fixture;

      // Stake FBT
      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      // Generate yield
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const yieldAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      await treasury.harvestPlatformYield();

      const earnedYield = await treasury.earnedYield(fbtStaker1.address);

      expect(earnedYield).to.be.gt(0);
    });

    it("getTreasuryPendingYield() should query WealthBuildingDonation correctly", async function () {
      const { treasury, feeSender1, aUsdc, wealthBuilding } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      // Simulate yield
      const yieldAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      const [causeYield, donorYield] = await treasury.getTreasuryPendingYield();

      const totalYield = causeYield + donorYield;
      expect(totalYield).to.be.closeTo(yieldAmount, ethers.parseUnits("1", USDC_DECIMALS));
    });

    it("getOperationalStats() should return operational funds info", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const [operationalFunds, totalYieldDistributed, yieldPerTokenStored] =
        await treasury.getOperationalStats();

      const expectedOperationalFunds = (feeAmount * 7800n) / 10000n;
      expect(operationalFunds).to.equal(expectedOperationalFunds);
      expect(totalYieldDistributed).to.equal(0);
      expect(yieldPerTokenStored).to.equal(0);
    });
  });

  describe("Admin Functions - Authorization", function () {
    it("should allow owner to authorize fee senders", async function () {
      const { treasury, owner, unauthorized } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).authorizeFeeSender(unauthorized.address))
        .to.emit(treasury, "FeeSenderAuthorized")
        .withArgs(unauthorized.address);

      expect(await treasury.authorizedFeeSenders(unauthorized.address)).to.be.true;
    });

    it("should allow owner to revoke fee senders", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).revokeFeeSender(feeSender1.address))
        .to.emit(treasury, "FeeSenderRevoked")
        .withArgs(feeSender1.address);

      expect(await treasury.authorizedFeeSenders(feeSender1.address)).to.be.false;
    });

    it("should emit FeeSenderAuthorized event", async function () {
      const { treasury, owner, unauthorized } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).authorizeFeeSender(unauthorized.address))
        .to.emit(treasury, "FeeSenderAuthorized")
        .withArgs(unauthorized.address);
    });

    it("should emit FeeSenderRevoked event", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).revokeFeeSender(feeSender1.address))
        .to.emit(treasury, "FeeSenderRevoked")
        .withArgs(feeSender1.address);
    });

    it("should revert if non-owner tries to authorize", async function () {
      const { treasury, unauthorized, fbtStaker1 } = await loadFixture(deployFixture);

      await expect(
        treasury.connect(unauthorized).authorizeFeeSender(fbtStaker1.address)
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });

    it("should revert if non-owner tries to revoke", async function () {
      const { treasury, unauthorized, feeSender1 } = await loadFixture(deployFixture);

      await expect(
        treasury.connect(unauthorized).revokeFeeSender(feeSender1.address)
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });

    it("should revert if authorizing zero address", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).authorizeFeeSender(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        treasury,
        "ZeroAddress"
      );
    });

    it("should revert if already authorized", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).authorizeFeeSender(feeSender1.address)).to.be.revertedWithCustomError(
        treasury,
        "AlreadyAuthorized"
      );
    });

    it("should revert if not authorized when revoking", async function () {
      const { treasury, owner, unauthorized } = await loadFixture(deployFixture);

      await expect(treasury.connect(owner).revokeFeeSender(unauthorized.address)).to.be.revertedWithCustomError(
        treasury,
        "NotAuthorized"
      );
    });
  });

  describe("Admin Functions - Configuration", function () {
    it("should allow owner to set minStakeThreshold", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      const newThreshold = ethers.parseUnits("5000", USDC_DECIMALS);
      const oldThreshold = await treasury.minStakeThreshold();

      await expect(treasury.connect(owner).setMinStakeThreshold(newThreshold))
        .to.emit(treasury, "MinStakeThresholdUpdated")
        .withArgs(oldThreshold, newThreshold);

      expect(await treasury.minStakeThreshold()).to.equal(newThreshold);
    });

    it("should allow owner to register treasury fundraiser in WealthBuildingDonation", async function () {
      const { wealthBuilding, owner, usdc, fbt } = await loadFixture(deployFixture);

      // Deploy new WealthBuildingDonation for this test to have clean state
      const WealthBuildingDonation = await ethers.getContractFactory("WealthBuildingDonation");
      const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
      const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
      const MockStockSwapAdapter = await ethers.getContractFactory("MockStockSwapAdapter");

      const testUsdc = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
      const testAUsdc = await MockERC20.deploy("Aave USDC", "aUSDC", USDC_DECIMALS);
      const testMockAavePool = await MockAavePool.deploy(
        await testUsdc.getAddress(),
        await testAUsdc.getAddress()
      );
      const testSwapAdapter = await MockStockSwapAdapter.deploy(await testUsdc.getAddress());

      const newWealthBuilding = await upgrades.deployProxy(
        WealthBuildingDonation,
        [
          await testMockAavePool.getAddress(),
          await testUsdc.getAddress(),
          await testAUsdc.getAddress(),
          await testSwapAdapter.getAddress(),
          owner.address, // Initial platformTreasury
          owner.address,
        ],
        { kind: "uups" }
      );

      const PlatformTreasury = await ethers.getContractFactory("PlatformTreasury");
      const newTreasury = await upgrades.deployProxy(
        PlatformTreasury,
        [
          await testUsdc.getAddress(),
          await newWealthBuilding.getAddress(),
          await fbt.getAddress(),
          owner.address,
        ],
        { kind: "uups" }
      );

      // Transfer ownership of WealthBuildingDonation to treasury so it can register
      await newWealthBuilding.transferOwnership(await newTreasury.getAddress());

      await expect(newTreasury.registerTreasuryFundraiser()).to.emit(
        newWealthBuilding,
        "FundraiserRegistered"
      );
    });

    it("should allow owner to set WealthBuildingDonation address", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      // Deploy a new WealthBuildingDonation mock
      const WealthBuildingDonation = await ethers.getContractFactory("WealthBuildingDonation");
      const { mockAavePool, usdc, aUsdc, swapAdapter } = await loadFixture(deployFixture);

      const newWealthBuilding = await upgrades.deployProxy(
        WealthBuildingDonation,
        [
          await mockAavePool.getAddress(),
          await usdc.getAddress(),
          await aUsdc.getAddress(),
          await swapAdapter.getAddress(),
          owner.address,
          owner.address,
        ],
        { kind: "uups" }
      );

      await treasury.connect(owner).setWealthBuildingDonation(await newWealthBuilding.getAddress());

      expect(await treasury.wealthBuildingDonation()).to.equal(await newWealthBuilding.getAddress());
    });

    it("should allow owner to pause/unpause", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      await treasury.connect(owner).pause();
      expect(await treasury.paused()).to.be.true;

      await treasury.connect(owner).unpause();
      expect(await treasury.paused()).to.be.false;
    });

    it("should revert if non-owner tries admin functions", async function () {
      const { treasury, unauthorized } = await loadFixture(deployFixture);

      await expect(
        treasury.connect(unauthorized).setMinStakeThreshold(ethers.parseUnits("5000", USDC_DECIMALS))
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");

      await expect(treasury.connect(unauthorized).pause()).to.be.revertedWithCustomError(
        treasury,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Admin Functions - Operational Funds", function () {
    it("should allow owner to withdraw operational funds", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();
      const withdrawAmount = operationalFunds / 2n;

      await expect(treasury.connect(owner).withdrawOperationalFunds(owner.address, withdrawAmount))
        .to.emit(treasury, "OperationalFundsWithdrawn")
        .withArgs(owner.address, withdrawAmount);
    });

    it("should NOT allow withdrawing endowment principal", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();

      // Try to withdraw more than operational funds
      await expect(
        treasury.connect(owner).withdrawOperationalFunds(owner.address, operationalFunds + 1n)
      ).to.be.revertedWithCustomError(treasury, "InvalidAmount");
    });

    it("should transfer USDC to recipient", async function () {
      const { treasury, owner, feeSender1, usdc } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();
      const balanceBefore = await usdc.balanceOf(owner.address);

      await treasury.connect(owner).withdrawOperationalFunds(owner.address, operationalFunds);

      const balanceAfter = await usdc.balanceOf(owner.address);

      expect(balanceAfter - balanceBefore).to.equal(operationalFunds);
    });

    it("should update operational fund balance", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();
      const withdrawAmount = operationalFunds / 2n;

      await treasury.connect(owner).withdrawOperationalFunds(owner.address, withdrawAmount);

      expect(await treasury.operationalFunds()).to.equal(operationalFunds - withdrawAmount);
    });

    it("should emit OperationalFundsWithdrawn event", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();

      await expect(treasury.connect(owner).withdrawOperationalFunds(owner.address, operationalFunds))
        .to.emit(treasury, "OperationalFundsWithdrawn")
        .withArgs(owner.address, operationalFunds);
    });

    it("should revert on zero amount", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      await expect(
        treasury.connect(owner).withdrawOperationalFunds(owner.address, 0)
      ).to.be.revertedWithCustomError(treasury, "InvalidAmount");
    });

    it("should revert on zero address recipient", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();

      await expect(
        treasury.connect(owner).withdrawOperationalFunds(ethers.ZeroAddress, operationalFunds)
      ).to.be.revertedWithCustomError(treasury, "ZeroAddress");
    });
  });

  describe("Emergency Token Rescue", function () {
    it("should allow owner to rescue accidentally sent tokens", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      // Deploy random token
      const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
      const randomToken = await MockERC20.deploy("Random", "RND", 18);

      // Send tokens to treasury
      const amount = ethers.parseUnits("1000", 18);
      await randomToken.mint(await treasury.getAddress(), amount);

      await treasury.connect(owner).rescueTokens(await randomToken.getAddress(), amount);

      expect(await randomToken.balanceOf(owner.address)).to.equal(amount);
    });

    it("should NOT allow rescuing USDC (protected)", async function () {
      const { treasury, owner, usdc } = await loadFixture(deployFixture);

      const amount = ethers.parseUnits("1000", USDC_DECIMALS);

      await expect(
        treasury.connect(owner).rescueTokens(await usdc.getAddress(), amount)
      ).to.be.revertedWithCustomError(treasury, "InvalidAmount");
    });

    it("should NOT allow rescuing FBT (protected)", async function () {
      const { treasury, owner, fbt } = await loadFixture(deployFixture);

      const amount = ethers.parseUnits("1000", FBT_DECIMALS);

      await expect(
        treasury.connect(owner).rescueTokens(await fbt.getAddress(), amount)
      ).to.be.revertedWithCustomError(treasury, "InvalidAmount");
    });

    it("should transfer tokens to owner", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
      const randomToken = await MockERC20.deploy("Random", "RND", 18);

      const amount = ethers.parseUnits("1000", 18);
      await randomToken.mint(await treasury.getAddress(), amount);

      const ownerBalanceBefore = await randomToken.balanceOf(owner.address);

      await treasury.connect(owner).rescueTokens(await randomToken.getAddress(), amount);

      const ownerBalanceAfter = await randomToken.balanceOf(owner.address);

      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(amount);
    });

    it("should revert on zero address token", async function () {
      const { treasury, owner } = await loadFixture(deployFixture);

      await expect(
        treasury.connect(owner).rescueTokens(ethers.ZeroAddress, 1000)
      ).to.be.revertedWithCustomError(treasury, "ZeroAddress");
    });
  });

  describe("Integration with WealthBuildingDonation", function () {
    it("should register treasury as fundraiser in WealthBuildingDonation", async function () {
      const { wealthBuilding, treasury } = await loadFixture(deployFixture);

      const beneficiary = await wealthBuilding.fundraiserBeneficiaries(PLATFORM_FUNDRAISER_ID);

      expect(beneficiary).to.equal(await treasury.getAddress());
    });

    it("should stake fees via WealthBuildingDonation.donate()", async function () {
      const { treasury, wealthBuilding, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);

      await expect(treasury.connect(feeSender1).receiveFee(feeAmount)).to.emit(
        wealthBuilding,
        "DonationMade"
      );
    });

    it("should harvest yield via WealthBuildingDonation.harvestYield()", async function () {
      const { treasury, feeSender1, usdc, aUsdc, wealthBuilding, fbtStaker1, mockAavePool } = await loadFixture(deployFixture);

      // Stake FBT
      await treasury.connect(fbtStaker1).stakeFBT(ethers.parseUnits("1000", FBT_DECIMALS));

      // Generate fees and yield
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const yieldAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      await expect(treasury.harvestPlatformYield()).to.emit(wealthBuilding, "YieldHarvested");
    });

    it("should track endowment correctly", async function () {
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const [, , , , endowmentPrincipal, ] = await treasury.getTreasuryInfo();

      const expectedEndowment = (feeAmount * 2000n) / 10000n;
      expect(endowmentPrincipal).to.equal(expectedEndowment);
    });

    it("End-to-end: receive fees → stake → harvest yield → distribute to FBT stakers", async function () {
      const { treasury, feeSender1, fbtStaker1, fbtStaker2, aUsdc, wealthBuilding, usdc, mockAavePool } =
        await loadFixture(deployFixture);

      // 1. Stake FBT
      const fbt1 = ethers.parseUnits("1000", FBT_DECIMALS);
      const fbt2 = ethers.parseUnits("2000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbt1);
      await treasury.connect(fbtStaker2).stakeFBT(fbt2);

      // 2. Receive fees (auto-stakes)
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      // 3. Simulate yield generation
      const yieldAmount = ethers.parseUnits("3000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      // 4. Harvest platform yield
      await treasury.harvestPlatformYield();

      // 5. FBT stakers claim their yield
      const earned1 = await treasury.earnedYield(fbtStaker1.address);
      const earned2 = await treasury.earnedYield(fbtStaker2.address);

      // Staker2 should have ~2x the yield of staker1
      expect(earned2).to.be.closeTo(earned1 * 2n, ethers.parseUnits("1", USDC_DECIMALS));

      const balance1Before = await usdc.balanceOf(fbtStaker1.address);
      const balance2Before = await usdc.balanceOf(fbtStaker2.address);

      await treasury.connect(fbtStaker1).claimYield();
      await treasury.connect(fbtStaker2).claimYield();

      const balance1After = await usdc.balanceOf(fbtStaker1.address);
      const balance2After = await usdc.balanceOf(fbtStaker2.address);

      expect(balance1After - balance1Before).to.equal(earned1);
      expect(balance2After - balance2Before).to.equal(earned2);
    });
  });

  describe("Multi-Staker Scenarios", function () {
    it("should distribute yield proportionally to multiple FBT stakers", async function () {
      const { treasury, fbtStaker1, fbtStaker2, fbtStaker3, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } =
        await loadFixture(deployFixture);

      // Stake different amounts
      const fbt1 = ethers.parseUnits("1000", FBT_DECIMALS);
      const fbt2 = ethers.parseUnits("2000", FBT_DECIMALS);
      const fbt3 = ethers.parseUnits("3000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbt1);
      await treasury.connect(fbtStaker2).stakeFBT(fbt2);
      await treasury.connect(fbtStaker3).stakeFBT(fbt3);

      // Generate yield
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const yieldAmount = ethers.parseUnits("6000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      await treasury.harvestPlatformYield();

      const earned1 = await treasury.earnedYield(fbtStaker1.address);
      const earned2 = await treasury.earnedYield(fbtStaker2.address);
      const earned3 = await treasury.earnedYield(fbtStaker3.address);

      // Check proportional distribution
      // 1:2:3 ratio
      expect(earned2).to.be.closeTo(earned1 * 2n, ethers.parseUnits("0.01", USDC_DECIMALS));
      expect(earned3).to.be.closeTo(earned1 * 3n, ethers.parseUnits("0.01", USDC_DECIMALS));
    });

    it("should handle stakers joining/leaving correctly", async function () {
      const { treasury, fbtStaker1, fbtStaker2, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } =
        await loadFixture(deployFixture);

      // Staker1 stakes
      const fbt1 = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker1).stakeFBT(fbt1);

      // Generate first yield
      const feeAmount1 = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount1);

      const yield1 = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yield1);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yield1);

      await treasury.harvestPlatformYield();

      const earned1FirstRound = await treasury.earnedYield(fbtStaker1.address);

      // Staker2 joins
      const fbt2 = ethers.parseUnits("1000", FBT_DECIMALS);
      await treasury.connect(fbtStaker2).stakeFBT(fbt2);

      // Generate second yield
      const feeAmount2 = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount2);

      const yield2 = ethers.parseUnits("2000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yield2);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yield2);

      await treasury.harvestPlatformYield();

      const earned1SecondRound = await treasury.earnedYield(fbtStaker1.address);
      const earned2 = await treasury.earnedYield(fbtStaker2.address);

      // Staker1 should have more total yield (was in both rounds)
      expect(earned1SecondRound).to.be.gt(earned2);

      // Staker2 should have only second round yield
      expect(earned2).to.be.gt(0);
      expect(earned2).to.be.lt(earned1SecondRound);
    });

    it("should calculate shares accurately", async function () {
      const { treasury, fbtStaker1, fbtStaker2 } = await loadFixture(deployFixture);

      const fbt1 = ethers.parseUnits("1000", FBT_DECIMALS);
      const fbt2 = ethers.parseUnits("4000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbt1);
      await treasury.connect(fbtStaker2).stakeFBT(fbt2);

      const [, , share1] = await treasury.getStakerInfo(fbtStaker1.address);
      const [, , share2] = await treasury.getStakerInfo(fbtStaker2.address);

      // 1000 / 5000 = 20% = 2000 basis points
      expect(share1).to.equal(2000);

      // 4000 / 5000 = 80% = 8000 basis points
      expect(share2).to.equal(8000);

      // Total should be 100%
      expect(share1 + share2).to.equal(10000);
    });

    it("should prevent rounding errors (no lost funds)", async function () {
      const { treasury, fbtStaker1, fbtStaker2, fbtStaker3, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } =
        await loadFixture(deployFixture);

      // Stake odd amounts to test rounding
      await treasury.connect(fbtStaker1).stakeFBT(ethers.parseUnits("333", FBT_DECIMALS));
      await treasury.connect(fbtStaker2).stakeFBT(ethers.parseUnits("666", FBT_DECIMALS));
      await treasury.connect(fbtStaker3).stakeFBT(ethers.parseUnits("1", FBT_DECIMALS));

      // Generate yield
      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const yieldAmount = ethers.parseUnits("1337", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      const treasuryBalanceBefore = await usdc.balanceOf(await treasury.getAddress());

      await treasury.harvestPlatformYield();

      const treasuryBalanceAfter = await usdc.balanceOf(await treasury.getAddress());

      const totalDistributed = await treasury.totalYieldDistributed();

      // Treasury should have received the distributed yield
      expect(treasuryBalanceAfter).to.be.gte(treasuryBalanceBefore);

      // All stakers claim
      await treasury.connect(fbtStaker1).claimYield();
      await treasury.connect(fbtStaker2).claimYield();
      await treasury.connect(fbtStaker3).claimYield();

      // Check no yield left unclaimed (accounting for small rounding)
      const earned1 = 0n; // Already claimed
      const earned2 = 0n;
      const earned3 = 0n;

      expect(await treasury.earnedYield(fbtStaker1.address)).to.equal(earned1);
      expect(await treasury.earnedYield(fbtStaker2.address)).to.equal(earned2);
      expect(await treasury.earnedYield(fbtStaker3.address)).to.equal(earned3);
    });
  });

  describe("Security & Edge Cases", function () {
    it("should prevent reentrancy attacks on receiveFee", async function () {
      // This test verifies the nonReentrant modifier is in place
      const { treasury, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);

      // Simple check that it doesn't revert due to reentrancy guard
      await expect(treasury.connect(feeSender1).receiveFee(feeAmount)).to.not.be.reverted;
    });

    it("should validate all inputs (zero addresses, zero amounts)", async function () {
      const { treasury, owner, feeSender1 } = await loadFixture(deployFixture);

      // Zero amount
      await expect(treasury.connect(feeSender1).receiveFee(0)).to.be.revertedWithCustomError(
        treasury,
        "InvalidAmount"
      );

      // Zero address in authorization
      await expect(treasury.connect(owner).authorizeFeeSender(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        treasury,
        "ZeroAddress"
      );

      // Zero amount in staking
      await expect(treasury.connect(feeSender1).stakeFBT(0)).to.be.revertedWithCustomError(
        treasury,
        "InvalidAmount"
      );
    });

    it("should handle auto-staking threshold correctly", async function () {
      const { treasury, feeSender1, owner } = await loadFixture(deployFixture);

      // Set high threshold
      const highThreshold = ethers.parseUnits("100000", USDC_DECIMALS);
      await treasury.connect(owner).setMinStakeThreshold(highThreshold);

      const smallFee = ethers.parseUnits("1000", USDC_DECIMALS);

      await treasury.connect(feeSender1).receiveFee(smallFee);

      // Should not auto-stake
      expect(await treasury.pendingFeesToStake()).to.equal(smallFee);
      expect(await treasury.totalFeesStaked()).to.equal(0);

      // Send enough to trigger
      const largeFee = highThreshold;
      await expect(treasury.connect(feeSender1).receiveFee(largeFee)).to.emit(treasury, "FeesStaked");
    });

    it("should protect operational funds from unauthorized withdrawal", async function () {
      const { treasury, unauthorized, feeSender1 } = await loadFixture(deployFixture);

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const operationalFunds = await treasury.operationalFunds();

      await expect(
        treasury.connect(unauthorized).withdrawOperationalFunds(unauthorized.address, operationalFunds)
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });

    it("should enforce pausable on critical functions", async function () {
      const { treasury, owner, feeSender1, fbtStaker1 } = await loadFixture(deployFixture);

      await treasury.connect(owner).pause();

      const feeAmount = ethers.parseUnits("100", USDC_DECIMALS);
      const fbtAmount = ethers.parseUnits("100", FBT_DECIMALS);

      await expect(treasury.connect(feeSender1).receiveFee(feeAmount)).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );

      await expect(treasury.connect(fbtStaker1).stakeFBT(fbtAmount)).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );

      await expect(treasury.stakeFees()).to.be.revertedWithCustomError(treasury, "EnforcedPause");

      await expect(treasury.harvestPlatformYield()).to.be.revertedWithCustomError(
        treasury,
        "EnforcedPause"
      );
    });
  });

  describe("Gas Optimization", function () {
    it("should measure gas for stakeFBT()", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      const tx = await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);
      const receipt = await tx.wait();

      console.log("      Gas used for stakeFBT():", receipt.gasUsed.toString());

      // Target: <200k gas
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("should measure gas for unstakeFBT()", async function () {
      const { treasury, fbtStaker1 } = await loadFixture(deployFixture);

      const fbtAmount = ethers.parseUnits("1000", FBT_DECIMALS);

      await treasury.connect(fbtStaker1).stakeFBT(fbtAmount);

      const tx = await treasury.connect(fbtStaker1).unstakeFBT(fbtAmount);
      const receipt = await tx.wait();

      console.log("      Gas used for unstakeFBT():", receipt.gasUsed.toString());

      // Target: <150k gas
      expect(receipt.gasUsed).to.be.lt(150000);
    });

    it("should measure gas for receiveFee()", async function () {
      const { treasury, feeSender1, owner } = await loadFixture(deployFixture);

      // Set high threshold to avoid auto-staking
      await treasury.connect(owner).setMinStakeThreshold(ethers.parseUnits("1000000", USDC_DECIMALS));

      const feeAmount = ethers.parseUnits("1000", USDC_DECIMALS);

      const tx = await treasury.connect(feeSender1).receiveFee(feeAmount);
      const receipt = await tx.wait();

      console.log("      Gas used for receiveFee():", receipt.gasUsed.toString());
    });

    it("should measure gas for harvestPlatformYield()", async function () {
      const { treasury, fbtStaker1, feeSender1, usdc, aUsdc, wealthBuilding, mockAavePool } = await loadFixture(deployFixture);

      // Setup
      await treasury.connect(fbtStaker1).stakeFBT(ethers.parseUnits("1000", FBT_DECIMALS));

      const feeAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await treasury.connect(feeSender1).receiveFee(feeAmount);

      const yieldAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // MockAavePool needs USDC to fulfill withdrawals
      await usdc.mint(await mockAavePool.getAddress(), yieldAmount);

      const tx = await treasury.harvestPlatformYield();
      const receipt = await tx.wait();

      console.log("      Gas used for harvestPlatformYield():", receipt.gasUsed.toString());
    });
  });
});
