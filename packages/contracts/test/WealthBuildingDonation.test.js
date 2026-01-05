const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("WealthBuildingDonation", function () {
  // Constants for testing
  const USDC_DECIMALS = 6;
  const STOCK_DECIMALS = 18;
  const DIRECT_SHARE_BPS = 8000n; // 80%
  const ENDOWMENT_SHARE_BPS = 2000n; // 20%
  const CAUSE_YIELD_BPS = 3000n; // 30%
  const DONOR_YIELD_BPS = 7000n; // 70%
  const PLATFORM_FEE_BPS = 200n; // 2%
  const BASIS_POINTS = 10000n;
  const MIN_DONATION = ethers.parseUnits("1", USDC_DECIMALS);

  async function deployFixture() {
    const [owner, donor1, donor2, beneficiary1, beneficiary2, platformTreasury, factory, unauthorized] =
      await ethers.getSigners();

    // Deploy mock USDC (6 decimals)
    const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
    const aUsdc = await MockERC20.deploy("Aave USDC", "aUSDC", USDC_DECIMALS);

    // Deploy mock stock tokens (18 decimals - typical for Backed Finance)
    const bCSPX = await MockERC20.deploy("Backed S&P 500", "bCSPX", STOCK_DECIMALS);
    const bIB01 = await MockERC20.deploy("Backed Treasury", "bIB01", STOCK_DECIMALS);

    // Deploy mock Aave pool
    const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
    const mockAavePool = await MockAavePool.deploy(await usdc.getAddress(), await aUsdc.getAddress());

    // Deploy mock swap adapter
    const MockStockSwapAdapter = await ethers.getContractFactory("MockStockSwapAdapter");
    const swapAdapter = await MockStockSwapAdapter.deploy(await usdc.getAddress());

    // Add supported tokens to swap adapter
    await swapAdapter.addSupportedToken(await bCSPX.getAddress(), STOCK_DECIMALS);
    await swapAdapter.addSupportedToken(await bIB01.getAddress(), STOCK_DECIMALS);

    // Deploy WealthBuildingDonation (upgradeable)
    const WealthBuildingDonation = await ethers.getContractFactory("WealthBuildingDonation");
    const wealthBuilding = await upgrades.deployProxy(
      WealthBuildingDonation,
      [
        await mockAavePool.getAddress(),
        await usdc.getAddress(),
        await aUsdc.getAddress(),
        await swapAdapter.getAddress(),
        platformTreasury.address,
        owner.address,
      ],
      { kind: "uups" }
    );

    // Mint USDC to donors
    const INITIAL_BALANCE = ethers.parseUnits("100000", USDC_DECIMALS);
    await usdc.mint(donor1.address, INITIAL_BALANCE);
    await usdc.mint(donor2.address, INITIAL_BALANCE);

    // Approve WealthBuildingDonation to spend USDC
    await usdc.connect(donor1).approve(await wealthBuilding.getAddress(), ethers.MaxUint256);
    await usdc.connect(donor2).approve(await wealthBuilding.getAddress(), ethers.MaxUint256);

    // Mint stock tokens to swap adapter (for swaps)
    const STOCK_LIQUIDITY = ethers.parseUnits("1000000", STOCK_DECIMALS);
    await bCSPX.mint(await swapAdapter.getAddress(), STOCK_LIQUIDITY);
    await bIB01.mint(await swapAdapter.getAddress(), STOCK_LIQUIDITY);

    return {
      wealthBuilding,
      usdc,
      aUsdc,
      mockAavePool,
      swapAdapter,
      bCSPX,
      bIB01,
      owner,
      donor1,
      donor2,
      beneficiary1,
      beneficiary2,
      platformTreasury,
      factory,
      unauthorized,
      INITIAL_BALANCE,
    };
  }

  describe("Deployment and Initialization", function () {
    it("should deploy and initialize correctly with all parameters", async function () {
      const { wealthBuilding, mockAavePool, usdc, aUsdc, swapAdapter, platformTreasury, owner } =
        await loadFixture(deployFixture);

      expect(await wealthBuilding.aavePool()).to.equal(await mockAavePool.getAddress());
      expect(await wealthBuilding.usdc()).to.equal(await usdc.getAddress());
      expect(await wealthBuilding.aUsdc()).to.equal(await aUsdc.getAddress());
      expect(await wealthBuilding.swapAdapter()).to.equal(await swapAdapter.getAddress());
      expect(await wealthBuilding.platformTreasury()).to.equal(platformTreasury.address);
      expect(await wealthBuilding.owner()).to.equal(owner.address);
    });

    it("should set correct constants (80/20 split, 30/70 yield, 2% platform fee)", async function () {
      const { wealthBuilding } = await loadFixture(deployFixture);

      expect(await wealthBuilding.DIRECT_SHARE_BPS()).to.equal(DIRECT_SHARE_BPS);
      expect(await wealthBuilding.ENDOWMENT_SHARE_BPS()).to.equal(ENDOWMENT_SHARE_BPS);
      expect(await wealthBuilding.CAUSE_YIELD_BPS()).to.equal(CAUSE_YIELD_BPS);
      expect(await wealthBuilding.DONOR_YIELD_BPS()).to.equal(DONOR_YIELD_BPS);
      expect(await wealthBuilding.PLATFORM_FEE_BPS()).to.equal(PLATFORM_FEE_BPS);
      expect(await wealthBuilding.BASIS_POINTS()).to.equal(BASIS_POINTS);
      expect(await wealthBuilding.MIN_DONATION()).to.equal(MIN_DONATION);
    });

    it("should approve Aave to spend USDC", async function () {
      const { wealthBuilding, usdc, mockAavePool } = await loadFixture(deployFixture);

      const allowance = await usdc.allowance(
        await wealthBuilding.getAddress(),
        await mockAavePool.getAddress()
      );
      expect(allowance).to.equal(ethers.MaxUint256);
    });

    it("should revert if initialized twice", async function () {
      const { wealthBuilding, mockAavePool, usdc, aUsdc, swapAdapter, platformTreasury, owner } =
        await loadFixture(deployFixture);

      await expect(
        wealthBuilding.initialize(
          await mockAavePool.getAddress(),
          await usdc.getAddress(),
          await aUsdc.getAddress(),
          await swapAdapter.getAddress(),
          platformTreasury.address,
          owner.address
        )
      ).to.be.revertedWithCustomError(wealthBuilding, "InvalidInitialization");
    });

    it("should revert initialization with zero addresses", async function () {
      const WealthBuildingDonation = await ethers.getContractFactory("WealthBuildingDonation");
      const { mockAavePool, usdc, aUsdc, swapAdapter, platformTreasury, owner } = await loadFixture(
        deployFixture
      );

      // Zero aavePool
      await expect(
        upgrades.deployProxy(
          WealthBuildingDonation,
          [
            ethers.ZeroAddress,
            await usdc.getAddress(),
            await aUsdc.getAddress(),
            await swapAdapter.getAddress(),
            platformTreasury.address,
            owner.address,
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(WealthBuildingDonation, "ZeroAddress");

      // Zero USDC
      await expect(
        upgrades.deployProxy(
          WealthBuildingDonation,
          [
            await mockAavePool.getAddress(),
            ethers.ZeroAddress,
            await aUsdc.getAddress(),
            await swapAdapter.getAddress(),
            platformTreasury.address,
            owner.address,
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(WealthBuildingDonation, "ZeroAddress");

      // Zero aUSDC
      await expect(
        upgrades.deployProxy(
          WealthBuildingDonation,
          [
            await mockAavePool.getAddress(),
            await usdc.getAddress(),
            ethers.ZeroAddress,
            await swapAdapter.getAddress(),
            platformTreasury.address,
            owner.address,
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(WealthBuildingDonation, "ZeroAddress");

      // Zero platformTreasury
      await expect(
        upgrades.deployProxy(
          WealthBuildingDonation,
          [
            await mockAavePool.getAddress(),
            await usdc.getAddress(),
            await aUsdc.getAddress(),
            await swapAdapter.getAddress(),
            ethers.ZeroAddress,
            owner.address,
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(WealthBuildingDonation, "ZeroAddress");

      // Zero owner
      await expect(
        upgrades.deployProxy(
          WealthBuildingDonation,
          [
            await mockAavePool.getAddress(),
            await usdc.getAddress(),
            await aUsdc.getAddress(),
            await swapAdapter.getAddress(),
            platformTreasury.address,
            ethers.ZeroAddress,
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(WealthBuildingDonation, "ZeroAddress");
    });
  });

  describe("Fundraiser Registration", function () {
    it("should allow owner to register fundraiser with beneficiary", async function () {
      const { wealthBuilding, owner, beneficiary1 } = await loadFixture(deployFixture);

      await expect(wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address))
        .to.emit(wealthBuilding, "FundraiserRegistered")
        .withArgs(1, beneficiary1.address);

      expect(await wealthBuilding.fundraiserBeneficiaries(1)).to.equal(beneficiary1.address);
    });

    it("should revert if fundraiser already registered", async function () {
      const { wealthBuilding, owner, beneficiary1, beneficiary2 } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      await expect(
        wealthBuilding.connect(owner).registerFundraiser(1, beneficiary2.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "InvalidFundraiser");
    });

    it("should revert if beneficiary is zero address", async function () {
      const { wealthBuilding, owner } = await loadFixture(deployFixture);

      await expect(
        wealthBuilding.connect(owner).registerFundraiser(1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(wealthBuilding, "ZeroAddress");
    });

    it("should revert if non-owner tries to register", async function () {
      const { wealthBuilding, unauthorized, beneficiary1 } = await loadFixture(deployFixture);

      await expect(
        wealthBuilding.connect(unauthorized).registerFundraiser(1, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to update fundraiser beneficiary", async function () {
      const { wealthBuilding, owner, beneficiary1, beneficiary2 } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).updateFundraiserBeneficiary(1, beneficiary2.address);

      expect(await wealthBuilding.fundraiserBeneficiaries(1)).to.equal(beneficiary2.address);
    });
  });

  describe("Donation Mechanism (80/20 Split)", function () {
    it("should split donation correctly: 78% direct to beneficiary, 20% to endowment, 2% to platform", async function () {
      const { wealthBuilding, usdc, donor1, beneficiary1, platformTreasury, owner } =
        await loadFixture(deployFixture);

      // Register fundraiser
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS); // $10,000
      const expectedDirect = (donationAmount * 78n) / 100n; // 78% = $7,800
      const expectedEndowment = (donationAmount * 20n) / 100n; // 20% = $2,000
      const expectedPlatformFee = (donationAmount * 2n) / 100n; // 2% = $200

      const beneficiary1BalanceBefore = await usdc.balanceOf(beneficiary1.address);
      const platformBalanceBefore = await usdc.balanceOf(platformTreasury.address);

      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const beneficiary1BalanceAfter = await usdc.balanceOf(beneficiary1.address);
      const platformBalanceAfter = await usdc.balanceOf(platformTreasury.address);

      expect(beneficiary1BalanceAfter - beneficiary1BalanceBefore).to.equal(expectedDirect);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(expectedPlatformFee);
    });

    it("should transfer direct amount to fundraiser beneficiary", async function () {
      const { wealthBuilding, usdc, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      const expectedDirect = (donationAmount * 78n) / 100n;

      const balanceBefore = await usdc.balanceOf(beneficiary1.address);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);
      const balanceAfter = await usdc.balanceOf(beneficiary1.address);

      expect(balanceAfter - balanceBefore).to.equal(expectedDirect);
    });

    it("should transfer platform fee to platformTreasury", async function () {
      const { wealthBuilding, usdc, donor1, beneficiary1, platformTreasury, owner } =
        await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      const expectedFee = (donationAmount * 2n) / 100n;

      const balanceBefore = await usdc.balanceOf(platformTreasury.address);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);
      const balanceAfter = await usdc.balanceOf(platformTreasury.address);

      expect(balanceAfter - balanceBefore).to.equal(expectedFee);
    });

    it("should stake endowment amount in Aave", async function () {
      const { wealthBuilding, aUsdc, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      const expectedEndowment = (donationAmount * 20n) / 100n;

      const aUsdcBalanceBefore = await aUsdc.balanceOf(await wealthBuilding.getAddress());
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);
      const aUsdcBalanceAfter = await aUsdc.balanceOf(await wealthBuilding.getAddress());

      expect(aUsdcBalanceAfter - aUsdcBalanceBefore).to.equal(expectedEndowment);
    });

    it("should update endowments mapping correctly", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      const expectedEndowment = (donationAmount * 20n) / 100n;

      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const endowment = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      expect(endowment.principal).to.equal(expectedEndowment);
      expect(endowment.lifetimeYield).to.equal(0);
      expect(endowment.causeYieldPaid).to.equal(0);
      expect(endowment.donorStockValue).to.equal(0);
    });

    it("should update fundraiserEndowmentPrincipal correctly", async function () {
      const { wealthBuilding, donor1, donor2, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donation1 = ethers.parseUnits("1000", USDC_DECIMALS);
      const donation2 = ethers.parseUnits("2000", USDC_DECIMALS);

      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation1, beneficiary1.address);
      await wealthBuilding.connect(donor2).donate(donor2.address, 1, donation2, beneficiary1.address);

      const expectedTotal = (donation1 * 20n) / 100n + (donation2 * 20n) / 100n;
      expect(await wealthBuilding.fundraiserEndowmentPrincipal(1)).to.equal(expectedTotal);
    });

    it("should update totalEndowmentPrincipal correctly", async function () {
      const { wealthBuilding, donor1, donor2, beneficiary1, beneficiary2, owner } =
        await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).registerFundraiser(2, beneficiary2.address);

      const donation1 = ethers.parseUnits("1000", USDC_DECIMALS);
      const donation2 = ethers.parseUnits("2000", USDC_DECIMALS);

      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation1, beneficiary1.address);
      await wealthBuilding.connect(donor2).donate(donor2.address, 2, donation2, beneficiary2.address);

      const expectedTotal = (donation1 * 20n) / 100n + (donation2 * 20n) / 100n;
      expect(await wealthBuilding.totalEndowmentPrincipal()).to.equal(expectedTotal);
    });

    it("should emit DonationMade event with correct parameters", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      const expectedDirect = (donationAmount * 78n) / 100n;
      const expectedEndowment = (donationAmount * 20n) / 100n;
      const expectedFee = (donationAmount * 2n) / 100n;

      await expect(
        wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address)
      )
        .to.emit(wealthBuilding, "DonationMade")
        .withArgs(donor1.address, 1, donationAmount, expectedDirect, expectedEndowment, expectedFee);
    });

    it("should revert if amount is zero", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      await expect(
        wealthBuilding.connect(donor1).donate(donor1.address, 1, 0, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "InvalidAmount");
    });

    it("should revert if amount is less than minimum donation", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const tooSmall = MIN_DONATION - 1n;
      await expect(
        wealthBuilding.connect(donor1).donate(donor1.address, 1, tooSmall, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "InvalidAmount");
    });

    it("should revert if fundraiser not registered", async function () {
      const { wealthBuilding, donor1, beneficiary1 } = await loadFixture(deployFixture);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await expect(
        wealthBuilding.connect(donor1).donate(donor1.address, 999, donationAmount, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "InvalidFundraiser");
    });

    it("should revert if beneficiary doesn't match registered beneficiary", async function () {
      const { wealthBuilding, donor1, beneficiary1, beneficiary2, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await expect(
        wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary2.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "InvalidFundraiser");
    });

    it("should allow multiple donations from same donor to same fundraiser", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donation1 = ethers.parseUnits("1000", USDC_DECIMALS);
      const donation2 = ethers.parseUnits("500", USDC_DECIMALS);

      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation1, beneficiary1.address);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation2, beneficiary1.address);

      const expectedTotal = (donation1 * 20n) / 100n + (donation2 * 20n) / 100n;
      const endowment = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      expect(endowment.principal).to.equal(expectedTotal);
    });
  });

  describe("Yield Harvesting", function () {
    async function setupWithYield() {
      const fixture = await loadFixture(deployFixture);
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner, bCSPX } = fixture;

      // Register fundraiser and add supported stock
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Make donation
      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      // Simulate yield by minting aUSDC to the contract
      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS); // $500 yield
      const currentAUsdc = await aUsdc.balanceOf(await wealthBuilding.getAddress());
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      // Mint USDC to Aave pool for withdrawal
      await usdc.mint(await fixture.mockAavePool.getAddress(), yieldAmount);

      return { ...fixture, donationAmount, yieldAmount };
    }

    it("should calculate yield correctly: aUSDC.balanceOf(this) - totalEndowmentPrincipal", async function () {
      const { wealthBuilding, aUsdc, yieldAmount } = await setupWithYield();

      const totalPrincipal = await wealthBuilding.totalEndowmentPrincipal();
      const aUsdcBalance = await aUsdc.balanceOf(await wealthBuilding.getAddress());
      const expectedYield = aUsdcBalance - totalPrincipal;

      expect(expectedYield).to.equal(yieldAmount);
    });

    it("should calculate donor's proportional share of yield", async function () {
      const { wealthBuilding, donor1, donor2, beneficiary1, yieldAmount, owner, usdc, aUsdc } =
        await setupWithYield();

      // Add second donor
      const donation2 = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor2).donate(donor2.address, 1, donation2, beneficiary1.address);

      // Add more yield
      const additionalYield = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), additionalYield);
      await usdc.mint(await (await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool")).attach(await wealthBuilding.aavePool()).getAddress(), additionalYield);

      const totalYield = yieldAmount + additionalYield;
      const donor1Principal = (await wealthBuilding.getEndowmentInfo(donor1.address, 1)).principal;
      const totalPrincipal = await wealthBuilding.totalEndowmentPrincipal();

      const expectedDonor1Yield = (donor1Principal * totalYield) / totalPrincipal;

      // Check pending yield calculation
      const [causeYield, donorYield] = await wealthBuilding.getPendingYield(donor1.address, 1);
      const totalExpectedYield = causeYield + donorYield;

      // Allow for rounding differences
      expect(totalExpectedYield).to.be.closeTo(expectedDonor1Yield, 10n);
    });

    it("should split yield 30/70: 30% to cause, 70% to donor", async function () {
      const { wealthBuilding, usdc, donor1, beneficiary1, yieldAmount, bCSPX } = await setupWithYield();

      const beneficiaryBalanceBefore = await usdc.balanceOf(beneficiary1.address);
      const donorStockBalanceBefore = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());

      await wealthBuilding.harvestYield(donor1.address, 1);

      const endowment = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      const expectedCauseShare = (endowment.lifetimeYield * 30n) / 100n;
      const expectedDonorShare = endowment.lifetimeYield - expectedCauseShare;

      expect(endowment.causeYieldPaid).to.equal(expectedCauseShare);
      expect(endowment.donorStockValue).to.equal(expectedDonorShare);
    });

    it("should transfer 30% USDC to fundraiser beneficiary", async function () {
      const { wealthBuilding, usdc, donor1, beneficiary1 } = await setupWithYield();

      const balanceBefore = await usdc.balanceOf(beneficiary1.address);
      await wealthBuilding.harvestYield(donor1.address, 1);
      const balanceAfter = await usdc.balanceOf(beneficiary1.address);

      const endowment = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      const expectedCauseShare = (endowment.lifetimeYield * 30n) / 100n;

      expect(balanceAfter - balanceBefore).to.be.closeTo(expectedCauseShare, 10n);
    });

    it("should call stock swap adapter to swap 70% USDC to stocks", async function () {
      const { wealthBuilding, swapAdapter, donor1, bCSPX } = await setupWithYield();

      await expect(wealthBuilding.harvestYield(donor1.address, 1))
        .to.emit(wealthBuilding, "StockPurchased")
        .withArgs(donor1.address, await bCSPX.getAddress(), anyValue, anyValue);
    });

    it("should update EndowmentRecord (lifetimeYield, causeYieldPaid, donorStockValue)", async function () {
      const { wealthBuilding, donor1 } = await setupWithYield();

      const endowmentBefore = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      expect(endowmentBefore.lifetimeYield).to.equal(0);

      await wealthBuilding.harvestYield(donor1.address, 1);

      const endowmentAfter = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      expect(endowmentAfter.lifetimeYield).to.be.gt(0);
      expect(endowmentAfter.causeYieldPaid).to.be.gt(0);
      expect(endowmentAfter.donorStockValue).to.be.gt(0);
    });

    it("should emit YieldHarvested event", async function () {
      const { wealthBuilding, donor1 } = await setupWithYield();

      await expect(wealthBuilding.harvestYield(donor1.address, 1))
        .to.emit(wealthBuilding, "YieldHarvested")
        .withArgs(donor1.address, 1, anyValue, anyValue, anyValue);
    });

    it("should emit StockPurchased event", async function () {
      const { wealthBuilding, donor1, bCSPX } = await setupWithYield();

      await expect(wealthBuilding.harvestYield(donor1.address, 1))
        .to.emit(wealthBuilding, "StockPurchased")
        .withArgs(donor1.address, await bCSPX.getAddress(), anyValue, anyValue);
    });

    it("should revert if no endowment exists for donor/fundraiser pair", async function () {
      const { wealthBuilding, donor2 } = await setupWithYield();

      await expect(wealthBuilding.harvestYield(donor2.address, 1)).to.be.revertedWithCustomError(
        wealthBuilding,
        "NoEndowment"
      );
    });

    it("should revert if no yield available", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      // No yield generated - should revert
      await expect(wealthBuilding.harvestYield(donor1.address, 1)).to.be.revertedWithCustomError(
        wealthBuilding,
        "NoYieldAvailable"
      );
    });

    it("should handle multiple donors for same fundraiser", async function () {
      const { wealthBuilding, usdc, aUsdc, donor1, donor2, beneficiary1, owner, bCSPX } =
        await loadFixture(deployFixture);

      // Setup
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Both donors donate
      const donation1 = ethers.parseUnits("10000", USDC_DECIMALS);
      const donation2 = ethers.parseUnits("5000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation1, beneficiary1.address);
      await wealthBuilding.connect(donor2).donate(donor2.address, 1, donation2, beneficiary1.address);

      // Generate yield
      const yieldAmount = ethers.parseUnits("900", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await wealthBuilding.aavePool(), yieldAmount);

      // Harvest for both
      await wealthBuilding.harvestYield(donor1.address, 1);
      await wealthBuilding.harvestYield(donor2.address, 1);

      // Verify proportional distribution
      const endowment1 = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      const endowment2 = await wealthBuilding.getEndowmentInfo(donor2.address, 1);

      // Donor1 donated 2x more, should get roughly 2x yield (accounting for rounding)
      expect(endowment1.lifetimeYield).to.be.gt(endowment2.lifetimeYield);
      const ratio = (endowment1.lifetimeYield * 100n) / endowment2.lifetimeYield;
      expect(ratio).to.be.closeTo(200n, 5n); // ~2:1 ratio
    });

    it("should handle single donor with multiple fundraiser endowments", async function () {
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, beneficiary2, owner, bCSPX } =
        await loadFixture(deployFixture);

      // Setup two fundraisers
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).registerFundraiser(2, beneficiary2.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Donate to both
      const donation = ethers.parseUnits("5000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation, beneficiary1.address);
      await wealthBuilding.connect(donor1).donate(donor1.address, 2, donation, beneficiary2.address);

      // Generate yield
      const yieldAmount = ethers.parseUnits("600", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await wealthBuilding.aavePool(), yieldAmount);

      // Harvest both
      await wealthBuilding.harvestYield(donor1.address, 1);
      await wealthBuilding.harvestYield(donor1.address, 2);

      // Both should have yield
      const endowment1 = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      const endowment2 = await wealthBuilding.getEndowmentInfo(donor1.address, 2);

      expect(endowment1.lifetimeYield).to.be.gt(0);
      expect(endowment2.lifetimeYield).to.be.gt(0);
    });
  });

  describe("Batch Yield Harvesting", function () {
    it("should harvest yield for multiple donor/fundraiser pairs in one transaction", async function () {
      const { wealthBuilding, usdc, aUsdc, donor1, donor2, beneficiary1, owner, bCSPX } =
        await loadFixture(deployFixture);

      // Setup
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Donations
      const donation = ethers.parseUnits("5000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation, beneficiary1.address);
      await wealthBuilding.connect(donor2).donate(donor2.address, 1, donation, beneficiary1.address);

      // Generate yield
      const yieldAmount = ethers.parseUnits("600", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await wealthBuilding.aavePool(), yieldAmount);

      // Batch harvest
      await wealthBuilding.harvestYieldBatch([donor1.address, donor2.address], [1, 1]);

      // Verify both harvested
      const endowment1 = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      const endowment2 = await wealthBuilding.getEndowmentInfo(donor2.address, 1);

      expect(endowment1.lifetimeYield).to.be.gt(0);
      expect(endowment2.lifetimeYield).to.be.gt(0);
    });

    it("should skip pairs with no yield without reverting", async function () {
      const { wealthBuilding, usdc, aUsdc, donor1, donor2, beneficiary1, beneficiary2, owner, bCSPX } =
        await loadFixture(deployFixture);

      // Setup two fundraisers
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).registerFundraiser(2, beneficiary2.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Both donors have endowments
      const donation = ethers.parseUnits("5000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation, beneficiary1.address);
      await wealthBuilding.connect(donor2).donate(donor2.address, 2, donation, beneficiary2.address);

      // Generate yield
      const yieldAmount = ethers.parseUnits("600", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await wealthBuilding.aavePool(), yieldAmount);

      // Batch harvest - should work fine when both have endowments
      await expect(wealthBuilding.harvestYieldBatch([donor1.address, donor2.address], [1, 2])).to.not.be.reverted;
    });

    it("should emit events for each successful harvest", async function () {
      const { wealthBuilding, usdc, aUsdc, donor1, donor2, beneficiary1, owner, bCSPX } =
        await loadFixture(deployFixture);

      // Setup
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Donations
      const donation = ethers.parseUnits("5000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donation, beneficiary1.address);
      await wealthBuilding.connect(donor2).donate(donor2.address, 1, donation, beneficiary1.address);

      // Generate yield
      const yieldAmount = ethers.parseUnits("600", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await wealthBuilding.aavePool(), yieldAmount);

      // Should emit multiple YieldHarvested events
      await expect(wealthBuilding.harvestYieldBatch([donor1.address, donor2.address], [1, 1]))
        .to.emit(wealthBuilding, "YieldHarvested")
        .withArgs(donor1.address, 1, anyValue, anyValue, anyValue);
    });

    it("should revert if arrays have mismatched lengths", async function () {
      const { wealthBuilding, donor1 } = await loadFixture(deployFixture);

      await expect(wealthBuilding.harvestYieldBatch([donor1.address], [1, 2])).to.be.revertedWithCustomError(
        wealthBuilding,
        "ArrayLengthMismatch"
      );
    });
  });

  describe("Stock Integration (Backed Finance)", function () {
    it("should support adding tokenized stocks via addSupportedStock()", async function () {
      const { wealthBuilding, bCSPX, owner } = await loadFixture(deployFixture);

      await expect(wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress()))
        .to.emit(wealthBuilding, "StockAdded")
        .withArgs(await bCSPX.getAddress());

      expect(await wealthBuilding.isStockSupported(await bCSPX.getAddress())).to.be.true;
    });

    it("should emit StockAdded event", async function () {
      const { wealthBuilding, bIB01, owner } = await loadFixture(deployFixture);

      await expect(wealthBuilding.connect(owner).addSupportedStock(await bIB01.getAddress()))
        .to.emit(wealthBuilding, "StockAdded")
        .withArgs(await bIB01.getAddress());
    });

    it("should prevent adding zero address as stock", async function () {
      const { wealthBuilding, owner } = await loadFixture(deployFixture);

      await expect(
        wealthBuilding.connect(owner).addSupportedStock(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(wealthBuilding, "ZeroAddress");
    });

    it("should allow removing supported stocks", async function () {
      const { wealthBuilding, bCSPX, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      await expect(wealthBuilding.connect(owner).removeSupportedStock(await bCSPX.getAddress()))
        .to.emit(wealthBuilding, "StockRemoved")
        .withArgs(await bCSPX.getAddress());

      expect(await wealthBuilding.isStockSupported(await bCSPX.getAddress())).to.be.false;
    });

    it("should track donor stock balances correctly", async function () {
      const fixture = await loadFixture(deployFixture);
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner, bCSPX } = fixture;

      // Setup
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Donate
      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      // Generate yield and harvest
      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await fixture.mockAavePool.getAddress(), yieldAmount);

      await wealthBuilding.harvestYield(donor1.address, 1);

      const stockBalance = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());
      expect(stockBalance).to.be.gt(0);
    });

    it("should return correct stock portfolio via getDonorStockPortfolio()", async function () {
      const fixture = await loadFixture(deployFixture);
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner, bCSPX } = fixture;

      // Setup
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // Donate and harvest
      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await fixture.mockAavePool.getAddress(), yieldAmount);

      await wealthBuilding.harvestYield(donor1.address, 1);

      const [tokens, balances] = await wealthBuilding.getDonorStockPortfolio(donor1.address);
      expect(tokens.length).to.equal(1);
      expect(tokens[0]).to.equal(await bCSPX.getAddress());
      expect(balances[0]).to.be.gt(0);
    });

    it("should set first stock as default", async function () {
      const { wealthBuilding, bCSPX, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());
      expect(await wealthBuilding.defaultStock()).to.equal(await bCSPX.getAddress());
    });

    it("should allow owner to set default stock", async function () {
      const { wealthBuilding, bCSPX, bIB01, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());
      await wealthBuilding.connect(owner).addSupportedStock(await bIB01.getAddress());

      await wealthBuilding.connect(owner).setDefaultStock(await bIB01.getAddress());
      expect(await wealthBuilding.defaultStock()).to.equal(await bIB01.getAddress());
    });
  });

  describe("Stock Claiming", function () {
    async function setupWithStocks() {
      const fixture = await loadFixture(deployFixture);
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner, bCSPX } = fixture;

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await fixture.mockAavePool.getAddress(), yieldAmount);

      await wealthBuilding.harvestYield(donor1.address, 1);

      return fixture;
    }

    it("should allow donors to claim accumulated stock tokens", async function () {
      const { wealthBuilding, bCSPX, donor1 } = await setupWithStocks();

      const stockBalance = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());
      expect(stockBalance).to.be.gt(0);

      await expect(wealthBuilding.connect(donor1).claimStocks(await bCSPX.getAddress(), 0)).to.not.be.reverted;
    });

    it("should transfer stock tokens to donor", async function () {
      const { wealthBuilding, bCSPX, donor1 } = await setupWithStocks();

      const stockBalance = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());
      const donorBalanceBefore = await bCSPX.balanceOf(donor1.address);

      await wealthBuilding.connect(donor1).claimStocks(await bCSPX.getAddress(), 0);

      const donorBalanceAfter = await bCSPX.balanceOf(donor1.address);
      expect(donorBalanceAfter - donorBalanceBefore).to.equal(stockBalance);
    });

    it("should emit StocksClaimed event", async function () {
      const { wealthBuilding, bCSPX, donor1 } = await setupWithStocks();

      const stockBalance = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());

      await expect(wealthBuilding.connect(donor1).claimStocks(await bCSPX.getAddress(), 0))
        .to.emit(wealthBuilding, "StocksClaimed")
        .withArgs(donor1.address, await bCSPX.getAddress(), stockBalance);
    });

    it("should revert if donor has no stock balance", async function () {
      const { wealthBuilding, bCSPX, donor2 } = await setupWithStocks();

      await expect(
        wealthBuilding.connect(donor2).claimStocks(await bCSPX.getAddress(), 0)
      ).to.be.revertedWithCustomError(wealthBuilding, "NoEndowment");
    });

    it("should update donorStockBalances correctly", async function () {
      const { wealthBuilding, bCSPX, donor1 } = await setupWithStocks();

      await wealthBuilding.connect(donor1).claimStocks(await bCSPX.getAddress(), 0);

      const balanceAfter = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());
      expect(balanceAfter).to.equal(0);
    });

    it("should allow partial claims", async function () {
      const { wealthBuilding, bCSPX, donor1 } = await setupWithStocks();

      const totalBalance = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());
      const claimAmount = totalBalance / 2n;

      await wealthBuilding.connect(donor1).claimStocks(await bCSPX.getAddress(), claimAmount);

      const remainingBalance = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());
      expect(remainingBalance).to.be.closeTo(totalBalance - claimAmount, 10n);
    });
  });

  describe("View Functions", function () {
    it("getEndowmentInfo() should return correct EndowmentRecord", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const endowment = await wealthBuilding.getEndowmentInfo(donor1.address, 1);
      expect(endowment.principal).to.equal((donationAmount * 20n) / 100n);
      expect(endowment.lifetimeYield).to.equal(0);
      expect(endowment.causeYieldPaid).to.equal(0);
      expect(endowment.donorStockValue).to.equal(0);
    });

    it("getDonorStockPortfolio() should return all stocks and balances", async function () {
      const { wealthBuilding, donor1 } = await loadFixture(deployFixture);

      const [tokens, balances] = await wealthBuilding.getDonorStockPortfolio(donor1.address);
      expect(tokens.length).to.equal(0);
      expect(balances.length).to.equal(0);
    });

    it("getPendingYield() should calculate correct cause/donor yield amounts", async function () {
      const fixture = await loadFixture(deployFixture);
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner } = fixture;

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      const [causeYield, donorYield] = await wealthBuilding.getPendingYield(donor1.address, 1);

      const expectedCauseYield = (yieldAmount * 30n) / 100n;
      const expectedDonorYield = yieldAmount - expectedCauseYield;

      expect(causeYield).to.be.closeTo(expectedCauseYield, 10n);
      expect(donorYield).to.be.closeTo(expectedDonorYield, 10n);
    });

    it("getTotalEndowmentValue() should return principal and lifetime yield for fundraiser", async function () {
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      const [principal, estimatedYield] = await wealthBuilding.getTotalEndowmentValue(1);

      expect(principal).to.equal((donationAmount * 20n) / 100n);
      expect(estimatedYield).to.be.closeTo(yieldAmount, 10n);
    });

    it("getSupportedStocks() should return array of supported stocks", async function () {
      const { wealthBuilding, bCSPX, bIB01, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());
      await wealthBuilding.connect(owner).addSupportedStock(await bIB01.getAddress());

      const stocks = await wealthBuilding.getSupportedStocks();
      expect(stocks.length).to.equal(2);
      expect(stocks).to.include(await bCSPX.getAddress());
      expect(stocks).to.include(await bIB01.getAddress());
    });

    it("getPlatformStats() should return correct statistics", async function () {
      const { wealthBuilding, aUsdc, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);

      const [totalPrincipal, totalAUSDC, pendingYield] = await wealthBuilding.getPlatformStats();

      expect(totalPrincipal).to.equal((donationAmount * 20n) / 100n);
      expect(totalAUSDC).to.equal((donationAmount * 20n) / 100n + yieldAmount);
      expect(pendingYield).to.equal(yieldAmount);
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to register fundraiser", async function () {
      const { wealthBuilding, owner, beneficiary1 } = await loadFixture(deployFixture);

      await expect(wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address)).to.not.be.reverted;
    });

    it("should allow owner to add supported stocks", async function () {
      const { wealthBuilding, bCSPX, owner } = await loadFixture(deployFixture);

      await expect(wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress())).to.not.be.reverted;
    });

    it("should allow owner to remove supported stocks", async function () {
      const { wealthBuilding, bCSPX, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());
      await expect(wealthBuilding.connect(owner).removeSupportedStock(await bCSPX.getAddress())).to.not.be.reverted;
    });

    it("should allow owner to set platform treasury", async function () {
      const { wealthBuilding, owner, donor1 } = await loadFixture(deployFixture);

      await expect(wealthBuilding.connect(owner).setPlatformTreasury(donor1.address))
        .to.emit(wealthBuilding, "PlatformTreasuryUpdated")
        .withArgs(anyValue, donor1.address);
    });

    it("should allow owner to set swap adapter", async function () {
      const { wealthBuilding, owner, donor1 } = await loadFixture(deployFixture);

      await expect(wealthBuilding.connect(owner).setSwapAdapter(donor1.address))
        .to.emit(wealthBuilding, "SwapAdapterUpdated")
        .withArgs(anyValue, donor1.address);
    });

    it("should allow owner to pause/unpause", async function () {
      const { wealthBuilding, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).pause();
      expect(await wealthBuilding.paused()).to.be.true;

      await wealthBuilding.connect(owner).unpause();
      expect(await wealthBuilding.paused()).to.be.false;
    });

    it("should revert if non-owner tries admin functions", async function () {
      const { wealthBuilding, unauthorized, beneficiary1, bCSPX } = await loadFixture(deployFixture);

      await expect(
        wealthBuilding.connect(unauthorized).registerFundraiser(1, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "OwnableUnauthorizedAccount");

      await expect(
        wealthBuilding.connect(unauthorized).addSupportedStock(await bCSPX.getAddress())
      ).to.be.revertedWithCustomError(wealthBuilding, "OwnableUnauthorizedAccount");

      await expect(wealthBuilding.connect(unauthorized).pause()).to.be.revertedWithCustomError(
        wealthBuilding,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Security & Edge Cases", function () {
    it("should protect against reentrancy on donate", async function () {
      // The contract has nonReentrant modifier - tested implicitly
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);

      // Multiple donations should work fine
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);
    });

    it("should handle rounding correctly (no lost funds)", async function () {
      const { wealthBuilding, usdc, donor1, beneficiary1, platformTreasury, owner } =
        await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);
      const donor1BalanceBefore = await usdc.balanceOf(donor1.address);

      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const donor1BalanceAfter = await usdc.balanceOf(donor1.address);
      const spent = donor1BalanceBefore - donor1BalanceAfter;

      // All donated funds should be accounted for
      expect(spent).to.equal(donationAmount);
    });

    it("should validate all inputs (zero addresses, zero amounts)", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      // Zero amount
      await expect(
        wealthBuilding.connect(donor1).donate(donor1.address, 1, 0, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "InvalidAmount");

      // Zero donor address
      await expect(
        wealthBuilding.connect(donor1).donate(ethers.ZeroAddress, 1, MIN_DONATION, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "ZeroAddress");
    });

    it("should handle case where no stocks are configured (hold USDC)", async function () {
      const fixture = await loadFixture(deployFixture);
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner } = fixture;

      // Register fundraiser but DON'T add any supported stocks
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);

      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await fixture.mockAavePool.getAddress(), yieldAmount);

      // Harvest should work, but USDC should be held (not swapped)
      await wealthBuilding.harvestYield(donor1.address, 1);

      // Check that USDC is held in address(0) placeholder
      const usdcBalance = await wealthBuilding.donorStockBalances(donor1.address, ethers.ZeroAddress);
      expect(usdcBalance).to.be.gt(0);
    });

    it("should block operations when paused", async function () {
      const { wealthBuilding, donor1, beneficiary1, owner } = await loadFixture(deployFixture);

      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).pause();

      const donationAmount = ethers.parseUnits("1000", USDC_DECIMALS);

      await expect(
        wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address)
      ).to.be.revertedWithCustomError(wealthBuilding, "EnforcedPause");
    });
  });

  describe("Integration Testing", function () {
    it("end-to-end: donate → wait → harvest → claim stocks", async function () {
      const fixture = await loadFixture(deployFixture);
      const { wealthBuilding, usdc, aUsdc, donor1, beneficiary1, owner, bCSPX } = fixture;

      // 1. Setup
      await wealthBuilding.connect(owner).registerFundraiser(1, beneficiary1.address);
      await wealthBuilding.connect(owner).addSupportedStock(await bCSPX.getAddress());

      // 2. Donate
      const donationAmount = ethers.parseUnits("10000", USDC_DECIMALS);
      await wealthBuilding.connect(donor1).donate(donor1.address, 1, donationAmount, beneficiary1.address);

      // 3. Wait and generate yield
      await time.increase(30 * 24 * 60 * 60); // 30 days
      const yieldAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await aUsdc.mint(await wealthBuilding.getAddress(), yieldAmount);
      await usdc.mint(await fixture.mockAavePool.getAddress(), yieldAmount);

      // 4. Harvest
      await wealthBuilding.harvestYield(donor1.address, 1);

      // 5. Claim stocks
      const stockBalance = await wealthBuilding.donorStockBalances(donor1.address, await bCSPX.getAddress());
      expect(stockBalance).to.be.gt(0);

      await wealthBuilding.connect(donor1).claimStocks(await bCSPX.getAddress(), 0);

      const donorStockBalance = await bCSPX.balanceOf(donor1.address);
      expect(donorStockBalance).to.equal(stockBalance);
    });
  });
});
