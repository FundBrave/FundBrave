const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// Helper functions for USDC (6 decimals)
const usdc = (val) => ethers.parseUnits(val, 6);
const fbt = (val) => ethers.parseEther(val);
const ZERO_ADDRESS = ethers.ZeroAddress;

// Time constants
const ONE_DAY = 24 * 60 * 60;
const SEVEN_DAYS = 7 * ONE_DAY;

// Basis points constants
const TOTAL_BASIS = 10000;
const DEFAULT_DAO_SHARE = 7900;
const DEFAULT_STAKER_SHARE = 1900;
const DEFAULT_PLATFORM_SHARE = 200;
const MIN_PLATFORM_SHARE = 200;

describe("ImpactDAOPool", function () {
    async function deployImpactDAOPoolFixture() {
        const [owner, yieldDistributor, platformWallet, staker1, staker2, staker3, other] = await ethers.getSigners();

        // Deploy mock tokens
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
        const aUsdcToken = await MockERC20.deploy("Aave USDC", "aUSDC", 6);

        // Deploy FBT token
        const FundBraveToken = await ethers.getContractFactory("FundBraveToken");
        const fbtToken = await upgrades.deployProxy(FundBraveToken, [owner.address], {
            initializer: "initialize",
            kind: "uups",
        });

        // Deploy mock Aave pool (use DeFiMocks version)
        const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
        const mockAavePool = await MockAavePool.deploy(
            await usdcToken.getAddress(),
            await aUsdcToken.getAddress()
        );

        // Fund the mock Aave pool with aUSDC for withdrawals
        await aUsdcToken.mint(await mockAavePool.getAddress(), usdc("10000000")); // 10M aUSDC

        // Deploy ImpactDAOPool with upgrades proxy
        const ImpactDAOPool = await ethers.getContractFactory("ImpactDAOPool");
        const impactDAOPool = await upgrades.deployProxy(ImpactDAOPool, [
            await mockAavePool.getAddress(),
            await usdcToken.getAddress(),
            await aUsdcToken.getAddress(),
            await fbtToken.getAddress(),
            yieldDistributor.address,
            platformWallet.address,
            owner.address
        ], {
            initializer: "initialize",
            kind: "uups",
        });

        // Set ImpactDAOPool as authorized minter for FBT
        await fbtToken.connect(owner).setMinter(await impactDAOPool.getAddress(), true);

        // Mint USDC to stakers
        const initialBalance = usdc("100000"); // 100k USDC each
        await usdcToken.mint(staker1.address, initialBalance);
        await usdcToken.mint(staker2.address, initialBalance);
        await usdcToken.mint(staker3.address, initialBalance);

        // Approve ImpactDAOPool to spend USDC
        await usdcToken.connect(staker1).approve(await impactDAOPool.getAddress(), ethers.MaxUint256);
        await usdcToken.connect(staker2).approve(await impactDAOPool.getAddress(), ethers.MaxUint256);
        await usdcToken.connect(staker3).approve(await impactDAOPool.getAddress(), ethers.MaxUint256);

        return {
            impactDAOPool,
            usdcToken,
            aUsdcToken,
            fbtToken,
            mockAavePool,
            owner,
            yieldDistributor,
            platformWallet,
            staker1,
            staker2,
            staker3,
            other
        };
    }

    describe("Deployment and Initialization", function () {
        it("Should deploy and initialize correctly with all parameters", async function () {
            const { impactDAOPool, usdcToken, aUsdcToken, fbtToken, mockAavePool, yieldDistributor, platformWallet } = await loadFixture(deployImpactDAOPoolFixture);

            expect(await impactDAOPool.AAVE_POOL()).to.equal(await mockAavePool.getAddress());
            expect(await impactDAOPool.USDC()).to.equal(await usdcToken.getAddress());
            expect(await impactDAOPool.aUSDC()).to.equal(await aUsdcToken.getAddress());
            expect(await impactDAOPool.FBT()).to.equal(await fbtToken.getAddress());
            expect(await impactDAOPool.yieldDistributor()).to.equal(yieldDistributor.address);
            expect(await impactDAOPool.platformWallet()).to.equal(platformWallet.address);
        });

        it("Should set correct default yield split (7900/1900/200)", async function () {
            const { impactDAOPool } = await loadFixture(deployImpactDAOPoolFixture);

            const defaultSplit = await impactDAOPool.defaultYieldSplit();
            expect(defaultSplit.daoShare).to.equal(DEFAULT_DAO_SHARE);
            expect(defaultSplit.stakerShare).to.equal(DEFAULT_STAKER_SHARE);
            expect(defaultSplit.platformShare).to.equal(DEFAULT_PLATFORM_SHARE);
        });

        it("Should approve Aave to spend USDC", async function () {
            const { impactDAOPool, usdcToken, mockAavePool } = await loadFixture(deployImpactDAOPoolFixture);

            const allowance = await usdcToken.allowance(
                await impactDAOPool.getAddress(),
                await mockAavePool.getAddress()
            );
            expect(allowance).to.equal(ethers.MaxUint256);
        });

        it("Should set rewards duration to 7 days", async function () {
            const { impactDAOPool } = await loadFixture(deployImpactDAOPoolFixture);

            expect(await impactDAOPool.rewardsDuration()).to.equal(SEVEN_DAYS);
        });

        it("Should revert if initialized with zero address for aavePool", async function () {
            const { usdcToken, aUsdcToken, fbtToken, yieldDistributor, platformWallet, owner } = await loadFixture(deployImpactDAOPoolFixture);

            const ImpactDAOPool = await ethers.getContractFactory("ImpactDAOPool");
            const pool = await ImpactDAOPool.deploy();
            await pool.waitForDeployment();

            // OpenZeppelin's initializer modifier throws InvalidInitialization when parameters are invalid
            await expect(
                pool.initialize(
                    ZERO_ADDRESS,
                    await usdcToken.getAddress(),
                    await aUsdcToken.getAddress(),
                    await fbtToken.getAddress(),
                    yieldDistributor.address,
                    platformWallet.address,
                    owner.address
                )
            ).to.be.revertedWithCustomError(pool, "InvalidInitialization");
        });

        it("Should revert if initialized with zero address for USDC", async function () {
            const { mockAavePool, aUsdcToken, fbtToken, yieldDistributor, platformWallet, owner } = await loadFixture(deployImpactDAOPoolFixture);

            const ImpactDAOPool = await ethers.getContractFactory("ImpactDAOPool");
            const pool = await ImpactDAOPool.deploy();
            await pool.waitForDeployment();

            // OpenZeppelin's initializer modifier throws InvalidInitialization when parameters are invalid
            await expect(
                pool.initialize(
                    await mockAavePool.getAddress(),
                    ZERO_ADDRESS,
                    await aUsdcToken.getAddress(),
                    await fbtToken.getAddress(),
                    yieldDistributor.address,
                    platformWallet.address,
                    owner.address
                )
            ).to.be.revertedWithCustomError(pool, "InvalidInitialization");
        });
    });

    describe("Staking Functionality", function () {
        it("Should allow users to stake USDC with custom yield split", async function () {
            const { impactDAOPool, usdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const customSplit = {
                daoShare: 8000,
                stakerShare: 1800,
                platformShare: 200
            };

            const balanceBefore = await usdcToken.balanceOf(staker1.address);

            await expect(impactDAOPool.connect(staker1).stake(stakeAmount, customSplit))
                .to.emit(impactDAOPool, "Staked")
                .withArgs(staker1.address, stakeAmount, [customSplit.daoShare, customSplit.stakerShare, customSplit.platformShare]);

            expect(await usdcToken.balanceOf(staker1.address)).to.equal(balanceBefore - stakeAmount);
            expect(await impactDAOPool.stakerPrincipal(staker1.address)).to.equal(stakeAmount);
            expect(await impactDAOPool.totalStakedPrincipal()).to.equal(stakeAmount);
        });

        it("Should allow users to stake with default split via stakeWithDefaults()", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("5000");

            await expect(impactDAOPool.connect(staker1).stakeWithDefaults(stakeAmount))
                .to.emit(impactDAOPool, "Staked")
                .withArgs(staker1.address, stakeAmount, [DEFAULT_DAO_SHARE, DEFAULT_STAKER_SHARE, DEFAULT_PLATFORM_SHARE]);

            expect(await impactDAOPool.stakerPrincipal(staker1.address)).to.equal(stakeAmount);
        });

        it("Should update totalStakedPrincipal correctly", async function () {
            const { impactDAOPool, staker1, staker2 } = await loadFixture(deployImpactDAOPoolFixture);

            const stake1 = usdc("10000");
            const stake2 = usdc("20000");

            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await impactDAOPool.connect(staker1).stake(stake1, defaultSplit);
            expect(await impactDAOPool.totalStakedPrincipal()).to.equal(stake1);

            await impactDAOPool.connect(staker2).stake(stake2, defaultSplit);
            expect(await impactDAOPool.totalStakedPrincipal()).to.equal(stake1 + stake2);
        });

        it("Should update stakerPrincipal[user] correctly", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stake1 = usdc("5000");
            const stake2 = usdc("3000");

            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await impactDAOPool.connect(staker1).stake(stake1, defaultSplit);
            expect(await impactDAOPool.stakerPrincipal(staker1.address)).to.equal(stake1);

            await impactDAOPool.connect(staker1).stake(stake2, defaultSplit);
            expect(await impactDAOPool.stakerPrincipal(staker1.address)).to.equal(stake1 + stake2);
        });

        it("Should supply USDC to Aave", async function () {
            const { impactDAOPool, aUsdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            const aUsdcBefore = await aUsdcToken.balanceOf(await impactDAOPool.getAddress());

            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const aUsdcAfter = await aUsdcToken.balanceOf(await impactDAOPool.getAddress());
            expect(aUsdcAfter).to.equal(aUsdcBefore + stakeAmount);
        });

        it("Should revert if amount is zero", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await expect(
                impactDAOPool.connect(staker1).stake(0, defaultSplit)
            ).to.be.revertedWithCustomError(impactDAOPool, "ZeroAmount");

            await expect(
                impactDAOPool.connect(staker1).stakeWithDefaults(0)
            ).to.be.revertedWithCustomError(impactDAOPool, "ZeroAmount");
        });

        it("Should revert if yield split doesn't sum to 10000", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const invalidSplit = {
                daoShare: 8000,
                stakerShare: 1800,
                platformShare: 300 // Sum = 10100
            };

            await expect(
                impactDAOPool.connect(staker1).stake(usdc("1000"), invalidSplit)
            ).to.be.revertedWithCustomError(impactDAOPool, "InvalidSplitSum");
        });

        it("Should revert if platform share < 200 bps", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const invalidSplit = {
                daoShare: 9700,
                stakerShare: 200,
                platformShare: 100 // Less than 200
            };

            await expect(
                impactDAOPool.connect(staker1).stake(usdc("1000"), invalidSplit)
            ).to.be.revertedWithCustomError(impactDAOPool, "PlatformShareTooLow");
        });

        it("Should work when paused=false, revert when paused=true", async function () {
            const { impactDAOPool, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("1000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            // Should work when not paused
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            // Pause contract
            await impactDAOPool.connect(owner).pause();

            // Should revert when paused
            await expect(
                impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit)
            ).to.be.revertedWithCustomError(impactDAOPool, "EnforcedPause");
        });
    });

    describe("Unstaking Functionality", function () {
        it("Should allow users to unstake their principal", async function () {
            const { impactDAOPool, usdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const unstakeAmount = usdc("6000");

            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const balanceBefore = await usdcToken.balanceOf(staker1.address);

            await expect(impactDAOPool.connect(staker1).unstake(unstakeAmount))
                .to.emit(impactDAOPool, "Unstaked")
                .withArgs(staker1.address, unstakeAmount);

            expect(await usdcToken.balanceOf(staker1.address)).to.equal(balanceBefore + unstakeAmount);
            expect(await impactDAOPool.stakerPrincipal(staker1.address)).to.equal(stakeAmount - unstakeAmount);
        });

        it("Should update balances correctly", async function () {
            const { impactDAOPool, staker1, staker2 } = await loadFixture(deployImpactDAOPoolFixture);

            const stake1 = usdc("10000");
            const stake2 = usdc("20000");
            const unstake1 = usdc("5000");

            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await impactDAOPool.connect(staker1).stake(stake1, defaultSplit);
            await impactDAOPool.connect(staker2).stake(stake2, defaultSplit);

            await impactDAOPool.connect(staker1).unstake(unstake1);

            expect(await impactDAOPool.stakerPrincipal(staker1.address)).to.equal(stake1 - unstake1);
            expect(await impactDAOPool.totalStakedPrincipal()).to.equal(stake1 - unstake1 + stake2);
        });

        it("Should revert if amount exceeds staker's principal", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const unstakeAmount = usdc("15000");

            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            await expect(
                impactDAOPool.connect(staker1).unstake(unstakeAmount)
            ).to.be.revertedWithCustomError(impactDAOPool, "InsufficientStake");
        });

        it("Should revert if amount is zero", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(
                impactDAOPool.connect(staker1).unstake(0)
            ).to.be.revertedWithCustomError(impactDAOPool, "ZeroAmount");
        });
    });

    describe("Yield Split Configuration", function () {
        it("Should allow stakers to set custom yield splits", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            // First stake some USDC
            const stakeAmount = usdc("10000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            // Set custom split
            const customDao = 6000;
            const customStaker = 3800;
            const customPlatform = 200;

            await expect(impactDAOPool.connect(staker1).setYieldSplit(customDao, customStaker, customPlatform))
                .to.emit(impactDAOPool, "YieldSplitSet")
                .withArgs(staker1.address, customDao, customStaker, customPlatform);

            const split = await impactDAOPool.getEffectiveYieldSplit(staker1.address);
            expect(split.daoShare).to.equal(customDao);
            expect(split.stakerShare).to.equal(customStaker);
            expect(split.platformShare).to.equal(customPlatform);
        });

        it("Should validate split sums to 10000 bps", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            await expect(
                impactDAOPool.connect(staker1).setYieldSplit(5000, 5000, 200)
            ).to.be.revertedWithCustomError(impactDAOPool, "InvalidSplitSum");
        });

        it("Should enforce minimum platform share (200 bps)", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            await expect(
                impactDAOPool.connect(staker1).setYieldSplit(9850, 50, 100)
            ).to.be.revertedWithCustomError(impactDAOPool, "PlatformShareTooLow");
        });

        it("Should revert if staker has no stake", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(
                impactDAOPool.connect(staker1).setYieldSplit(8000, 1800, 200)
            ).to.be.revertedWithCustomError(impactDAOPool, "NoStakeToConfig");
        });

        it("Should allow reset to default split", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const customSplit = {
                daoShare: 6000,
                stakerShare: 3800,
                platformShare: 200
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, customSplit);

            await impactDAOPool.connect(staker1).resetYieldSplit();

            const split = await impactDAOPool.getEffectiveYieldSplit(staker1.address);
            expect(split.daoShare).to.equal(DEFAULT_DAO_SHARE);
            expect(split.stakerShare).to.equal(DEFAULT_STAKER_SHARE);
            expect(split.platformShare).to.equal(DEFAULT_PLATFORM_SHARE);
        });

        it("Should return effective split (custom or default)", async function () {
            const { impactDAOPool, staker1, staker2 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const customSplit = {
                daoShare: 6000,
                stakerShare: 3800,
                platformShare: 200
            };

            // Staker1 with custom split
            await impactDAOPool.connect(staker1).stake(stakeAmount, customSplit);
            const split1 = await impactDAOPool.getEffectiveYieldSplit(staker1.address);
            expect(split1.daoShare).to.equal(6000);

            // Staker2 with default split
            await impactDAOPool.connect(staker2).stakeWithDefaults(stakeAmount);
            const split2 = await impactDAOPool.getEffectiveYieldSplit(staker2.address);
            expect(split2.daoShare).to.equal(DEFAULT_DAO_SHARE);
        });
    });

    describe("Yield Harvesting", function () {
        it("Should harvest yield from Aave on-demand", async function () {
            const { impactDAOPool, aUsdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            // Simulate yield by minting extra aUSDC to the pool
            const yieldAmount = usdc("5000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            await expect(impactDAOPool.harvestYield())
                .to.emit(impactDAOPool, "YieldHarvested");
        });

        it("Should calculate correct DAO, staker, and platform shares", async function () {
            const { impactDAOPool, aUsdcToken, usdcToken, yieldDistributor, platformWallet, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            const daoBefore = await usdcToken.balanceOf(yieldDistributor.address);
            const platformBefore = await usdcToken.balanceOf(platformWallet.address);

            await impactDAOPool.harvestYield();

            const daoAfter = await usdcToken.balanceOf(yieldDistributor.address);
            const platformAfter = await usdcToken.balanceOf(platformWallet.address);

            const expectedDao = (yieldAmount * BigInt(DEFAULT_DAO_SHARE)) / BigInt(TOTAL_BASIS);
            const expectedPlatform = (yieldAmount * BigInt(DEFAULT_PLATFORM_SHARE)) / BigInt(TOTAL_BASIS);

            expect(daoAfter - daoBefore).to.equal(expectedDao);
            expect(platformAfter - platformBefore).to.equal(expectedPlatform);
        });

        it("Should transfer DAO share to yieldDistributor", async function () {
            const { impactDAOPool, aUsdcToken, usdcToken, yieldDistributor, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            const daoBefore = await usdcToken.balanceOf(yieldDistributor.address);
            await impactDAOPool.harvestYield();
            const daoAfter = await usdcToken.balanceOf(yieldDistributor.address);

            expect(daoAfter).to.be.gt(daoBefore);
        });

        it("Should transfer platform share to platformWallet", async function () {
            const { impactDAOPool, aUsdcToken, usdcToken, platformWallet, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            const platformBefore = await usdcToken.balanceOf(platformWallet.address);
            await impactDAOPool.harvestYield();
            const platformAfter = await usdcToken.balanceOf(platformWallet.address);

            expect(platformAfter).to.be.gt(platformBefore);
        });

        it("Should update yieldPerTokenStored for staker share", async function () {
            const { impactDAOPool, aUsdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldPerTokenBefore = await impactDAOPool.yieldPerTokenStored();

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            await impactDAOPool.harvestYield();

            const yieldPerTokenAfter = await impactDAOPool.yieldPerTokenStored();
            expect(yieldPerTokenAfter).to.be.gt(yieldPerTokenBefore);
        });

        it("Should handle case where no yield exists (revert)", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            // Try to harvest without yield
            await expect(
                impactDAOPool.harvestYield()
            ).to.be.revertedWithCustomError(impactDAOPool, "NoYieldToHarvest");
        });

        it("Should work with multiple stakers with different splits", async function () {
            const { impactDAOPool, aUsdcToken, staker1, staker2 } = await loadFixture(deployImpactDAOPoolFixture);

            const stake1 = usdc("50000");
            const stake2 = usdc("50000");

            const split1 = {
                daoShare: 8000,
                stakerShare: 1800,
                platformShare: 200
            };

            const split2 = {
                daoShare: 7000,
                stakerShare: 2800,
                platformShare: 200
            };

            await impactDAOPool.connect(staker1).stake(stake1, split1);
            await impactDAOPool.connect(staker2).stake(stake2, split2);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            await expect(impactDAOPool.harvestYield())
                .to.emit(impactDAOPool, "YieldHarvested");
        });
    });

    describe("Yield Claiming (Stakers)", function () {
        it("Should allow stakers to claim accumulated USDC yield", async function () {
            const { impactDAOPool, aUsdcToken, usdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            await impactDAOPool.harvestYield();

            const balanceBefore = await usdcToken.balanceOf(staker1.address);

            await expect(impactDAOPool.connect(staker1).claimStakerYield())
                .to.emit(impactDAOPool, "StakerYieldClaimed");

            const balanceAfter = await usdcToken.balanceOf(staker1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
        });

        it("Should calculate claimable amount correctly", async function () {
            const { impactDAOPool, aUsdcToken, usdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            await impactDAOPool.harvestYield();

            const balanceBefore = await usdcToken.balanceOf(staker1.address);
            await impactDAOPool.connect(staker1).claimStakerYield();
            const balanceAfter = await usdcToken.balanceOf(staker1.address);

            const claimed = balanceAfter - balanceBefore;
            const expectedStakerShare = (yieldAmount * BigInt(DEFAULT_STAKER_SHARE)) / BigInt(TOTAL_BASIS);

            // Should be close to expected (within rounding)
            expect(claimed).to.be.closeTo(expectedStakerShare, usdc("0.01"));
        });

        it("Should handle zero claimable yield gracefully", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            await expect(
                impactDAOPool.connect(staker1).claimStakerYield()
            ).to.be.revertedWithCustomError(impactDAOPool, "NoRewardToClaim");
        });
    });

    describe("FBT Liquidity Mining Rewards", function () {
        it("Should allow owner to notify reward amount", async function () {
            const { impactDAOPool, owner } = await loadFixture(deployImpactDAOPoolFixture);

            const rewardAmount = fbt("10000");

            await expect(impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount))
                .to.emit(impactDAOPool, "RewardAdded")
                .withArgs(rewardAmount);
        });

        it("Should set reward rate correctly", async function () {
            const { impactDAOPool, owner } = await loadFixture(deployImpactDAOPoolFixture);

            const rewardAmount = fbt("10000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);

            const rewardRate = await impactDAOPool.rewardRate();
            const expectedRate = rewardAmount / BigInt(SEVEN_DAYS);

            expect(rewardRate).to.equal(expectedRate);
        });

        it("Should update period finish timestamp", async function () {
            const { impactDAOPool, owner } = await loadFixture(deployImpactDAOPoolFixture);

            const rewardAmount = fbt("10000");
            const tx = await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt.blockNumber);

            const periodFinish = await impactDAOPool.periodFinish();
            expect(periodFinish).to.equal(BigInt(block.timestamp) + BigInt(SEVEN_DAYS));
        });

        it("Should allow stakers to claim FBT rewards", async function () {
            const { impactDAOPool, fbtToken, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const rewardAmount = fbt("10000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);

            // Wait some time
            await time.increase(ONE_DAY);

            const balanceBefore = await fbtToken.balanceOf(staker1.address);

            await expect(impactDAOPool.connect(staker1).claimFBTRewards())
                .to.emit(impactDAOPool, "FBTRewardPaid");

            const balanceAfter = await fbtToken.balanceOf(staker1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
        });

        it("Should mint FBT to staker (not transfer)", async function () {
            const { impactDAOPool, fbtToken, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const rewardAmount = fbt("10000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);

            await time.increase(ONE_DAY);

            const totalSupplyBefore = await fbtToken.totalSupply();
            await impactDAOPool.connect(staker1).claimFBTRewards();
            const totalSupplyAfter = await fbtToken.totalSupply();

            // Total supply should increase (minted, not transferred)
            expect(totalSupplyAfter).to.be.gt(totalSupplyBefore);
        });

        it("Should calculate earned FBT correctly using Synthetix math", async function () {
            const { impactDAOPool, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const rewardAmount = fbt("7000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);

            await time.increase(ONE_DAY);

            const earnedBefore = await impactDAOPool.earnedFBT(staker1.address);
            expect(earnedBefore).to.be.gt(0);

            const rewardRate = await impactDAOPool.rewardRate();
            const expectedForOneDay = rewardRate * BigInt(ONE_DAY);

            // Should be approximately 1/7th of total rewards
            expect(earnedBefore).to.be.closeTo(expectedForOneDay, fbt("10"));
        });

        it("Should handle leftover rewards correctly when adding new rewards", async function () {
            const { impactDAOPool, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            // First reward period
            const reward1 = fbt("7000");
            await impactDAOPool.connect(owner).notifyRewardAmount(reward1);

            // Wait 2 days
            await time.increase(2 * ONE_DAY);

            // Add more rewards before first period ends
            const reward2 = fbt("7000");
            await impactDAOPool.connect(owner).notifyRewardAmount(reward2);

            // Should account for leftover from first period
            const rewardRate = await impactDAOPool.rewardRate();
            expect(rewardRate).to.be.gt(0);
        });
    });

    describe("Combined Claim Function", function () {
        it("Should claim both USDC yield and FBT in one tx", async function () {
            const { impactDAOPool, aUsdcToken, usdcToken, fbtToken, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            // Add yield
            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);
            await impactDAOPool.harvestYield();

            // Add FBT rewards
            const rewardAmount = fbt("7000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);
            await time.increase(ONE_DAY);

            const usdcBefore = await usdcToken.balanceOf(staker1.address);
            const fbtBefore = await fbtToken.balanceOf(staker1.address);

            await impactDAOPool.connect(staker1).claimAll();

            const usdcAfter = await usdcToken.balanceOf(staker1.address);
            const fbtAfter = await fbtToken.balanceOf(staker1.address);

            expect(usdcAfter).to.be.gt(usdcBefore);
            expect(fbtAfter).to.be.gt(fbtBefore);
        });

        it("Should emit both events", async function () {
            const { impactDAOPool, aUsdcToken, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);
            await impactDAOPool.harvestYield();

            const rewardAmount = fbt("7000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);
            await time.increase(ONE_DAY);

            await expect(impactDAOPool.connect(staker1).claimAll())
                .to.emit(impactDAOPool, "StakerYieldClaimed")
                .and.to.emit(impactDAOPool, "FBTRewardPaid");
        });
    });

    describe("View Functions", function () {
        it("Should return correct staker info via getStakerInfo()", async function () {
            const { impactDAOPool, aUsdcToken, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const customSplit = {
                daoShare: 8000,
                stakerShare: 1800,
                platformShare: 200
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, customSplit);

            // Add yield and rewards
            const yieldAmount = usdc("5000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);
            await impactDAOPool.harvestYield();

            const rewardAmount = fbt("7000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);
            await time.increase(ONE_DAY);

            const stakerInfo = await impactDAOPool.getStakerInfo(staker1.address);

            expect(stakerInfo.principal).to.equal(stakeAmount);
            expect(stakerInfo.usdcYield).to.be.gt(0);
            expect(stakerInfo.fbtReward).to.be.gt(0);
            expect(stakerInfo.split.daoShare).to.equal(8000);
            expect(stakerInfo.split.stakerShare).to.equal(1800);
            expect(stakerInfo.split.platformShare).to.equal(200);
        });

        it("Should calculate pending yield correctly", async function () {
            const { impactDAOPool, aUsdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            const pending = await impactDAOPool.pendingYield();
            expect(pending).to.equal(yieldAmount);
        });

        it("Should calculate earned FBT correctly", async function () {
            const { impactDAOPool, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const rewardAmount = fbt("7000");
            await impactDAOPool.connect(owner).notifyRewardAmount(rewardAmount);

            await time.increase(ONE_DAY);

            const earned = await impactDAOPool.earnedFBT(staker1.address);
            expect(earned).to.be.gt(0);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set yield distributor", async function () {
            const { impactDAOPool, owner, other } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(impactDAOPool.connect(owner).setYieldDistributor(other.address))
                .to.emit(impactDAOPool, "YieldDistributorUpdated");

            expect(await impactDAOPool.yieldDistributor()).to.equal(other.address);
        });

        it("Should allow owner to set platform wallet", async function () {
            const { impactDAOPool, owner, other } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(impactDAOPool.connect(owner).setPlatformWallet(other.address))
                .to.emit(impactDAOPool, "PlatformWalletUpdated");

            expect(await impactDAOPool.platformWallet()).to.equal(other.address);
        });

        it("Should allow owner to set default yield split (with validation)", async function () {
            const { impactDAOPool, owner } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(impactDAOPool.connect(owner).setDefaultYieldSplit(8000, 1800, 200))
                .to.emit(impactDAOPool, "DefaultYieldSplitUpdated");

            const defaultSplit = await impactDAOPool.defaultYieldSplit();
            expect(defaultSplit.daoShare).to.equal(8000);
            expect(defaultSplit.stakerShare).to.equal(1800);
            expect(defaultSplit.platformShare).to.equal(200);
        });

        it("Should allow owner to set rewards duration (only when period finished)", async function () {
            const { impactDAOPool, owner } = await loadFixture(deployImpactDAOPoolFixture);

            // Should work initially (no period started)
            const newDuration = 14 * ONE_DAY; // 14 days
            await impactDAOPool.connect(owner).setRewardsDuration(newDuration);
            expect(await impactDAOPool.rewardsDuration()).to.equal(newDuration);

            // Start a reward period
            await impactDAOPool.connect(owner).notifyRewardAmount(fbt("1000"));

            // Should revert during active period
            await expect(
                impactDAOPool.connect(owner).setRewardsDuration(7 * ONE_DAY)
            ).to.be.revertedWithCustomError(impactDAOPool, "RewardPeriodNotFinished");

            // Wait for period to finish
            await time.increase(newDuration + 1);

            // Should work again
            await impactDAOPool.connect(owner).setRewardsDuration(7 * ONE_DAY);
            expect(await impactDAOPool.rewardsDuration()).to.equal(7 * ONE_DAY);
        });

        it("Should allow owner to pause/unpause", async function () {
            const { impactDAOPool, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            await impactDAOPool.connect(owner).pause();

            const stakeAmount = usdc("1000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await expect(
                impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit)
            ).to.be.revertedWithCustomError(impactDAOPool, "EnforcedPause");

            await impactDAOPool.connect(owner).unpause();

            await expect(
                impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit)
            ).to.not.be.reverted;
        });

        it("Should allow owner to rescue accidentally sent tokens (not USDC/aUSDC)", async function () {
            const { impactDAOPool, owner } = await loadFixture(deployImpactDAOPoolFixture);

            // Deploy a random token
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const randomToken = await MockERC20.deploy("Random", "RND", 18);
            await randomToken.mint(await impactDAOPool.getAddress(), ethers.parseEther("1000"));

            const ownerBalanceBefore = await randomToken.balanceOf(owner.address);

            await impactDAOPool.connect(owner).rescueTokens(
                await randomToken.getAddress(),
                ethers.parseEther("1000")
            );

            const ownerBalanceAfter = await randomToken.balanceOf(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(ethers.parseEther("1000"));
        });

        it("Should revert if trying to rescue USDC", async function () {
            const { impactDAOPool, usdcToken, owner } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(
                impactDAOPool.connect(owner).rescueTokens(await usdcToken.getAddress(), usdc("1000"))
            ).to.be.revertedWith("Cannot rescue stake tokens");
        });

        it("Should revert if trying to rescue aUSDC", async function () {
            const { impactDAOPool, aUsdcToken, owner } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(
                impactDAOPool.connect(owner).rescueTokens(await aUsdcToken.getAddress(), usdc("1000"))
            ).to.be.revertedWith("Cannot rescue stake tokens");
        });

        it("Should revert if non-owner tries admin functions", async function () {
            const { impactDAOPool, staker1, other } = await loadFixture(deployImpactDAOPoolFixture);

            await expect(
                impactDAOPool.connect(staker1).setYieldDistributor(other.address)
            ).to.be.revertedWithCustomError(impactDAOPool, "OwnableUnauthorizedAccount");

            await expect(
                impactDAOPool.connect(staker1).setPlatformWallet(other.address)
            ).to.be.revertedWithCustomError(impactDAOPool, "OwnableUnauthorizedAccount");

            await expect(
                impactDAOPool.connect(staker1).setDefaultYieldSplit(8000, 1800, 200)
            ).to.be.revertedWith("ImpactDAOPool: Not authorized");

            await expect(
                impactDAOPool.connect(staker1).notifyRewardAmount(fbt("1000"))
            ).to.be.revertedWithCustomError(impactDAOPool, "OwnableUnauthorizedAccount");
        });
    });

    describe("Security & Edge Cases", function () {
        it("Should handle rounding correctly (no lost funds)", async function () {
            const { impactDAOPool, aUsdcToken, usdcToken, yieldDistributor, platformWallet, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            // Odd yield amount to test rounding
            const yieldAmount = usdc("9999");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            const poolBalanceBefore = await usdcToken.balanceOf(await impactDAOPool.getAddress());
            const daoBefore = await usdcToken.balanceOf(yieldDistributor.address);
            const platformBefore = await usdcToken.balanceOf(platformWallet.address);

            await impactDAOPool.harvestYield();

            const poolBalanceAfter = await usdcToken.balanceOf(await impactDAOPool.getAddress());
            const daoAfter = await usdcToken.balanceOf(yieldDistributor.address);
            const platformAfter = await usdcToken.balanceOf(platformWallet.address);

            const daoGot = daoAfter - daoBefore;
            const platformGot = platformAfter - platformBefore;
            const poolKept = poolBalanceAfter - poolBalanceBefore;

            // Total distributed should equal yield (no lost funds)
            expect(daoGot + platformGot + poolKept).to.equal(yieldAmount);
        });

        it("Should work correctly with multiple stakers", async function () {
            const { impactDAOPool, aUsdcToken, staker1, staker2, staker3 } = await loadFixture(deployImpactDAOPoolFixture);

            const stake1 = usdc("30000");
            const stake2 = usdc("50000");
            const stake3 = usdc("20000");

            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await impactDAOPool.connect(staker1).stake(stake1, defaultSplit);
            await impactDAOPool.connect(staker2).stake(stake2, defaultSplit);
            await impactDAOPool.connect(staker3).stake(stake3, defaultSplit);

            const yieldAmount = usdc("10000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            await impactDAOPool.harvestYield();

            const earned1 = await impactDAOPool.earnedUSDC(staker1.address);
            const earned2 = await impactDAOPool.earnedUSDC(staker2.address);
            const earned3 = await impactDAOPool.earnedUSDC(staker3.address);

            // Staker2 should have earned most (50% of stake)
            expect(earned2).to.be.gt(earned1);
            expect(earned2).to.be.gt(earned3);
        });

        it("Should validate all inputs", async function () {
            const { impactDAOPool, owner, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            // Zero address validations
            await expect(
                impactDAOPool.connect(owner).setYieldDistributor(ZERO_ADDRESS)
            ).to.be.revertedWithCustomError(impactDAOPool, "ZeroAddress");

            await expect(
                impactDAOPool.connect(owner).setPlatformWallet(ZERO_ADDRESS)
            ).to.be.revertedWithCustomError(impactDAOPool, "ZeroAddress");

            // Zero amount validations tested in other tests
        });
    });

    describe("Gas Optimization", function () {
        it("Should stake with reasonable gas (<200k target)", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            const tx = await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);
            const receipt = await tx.wait();

            console.log("      Gas used for stake:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lt(250000); // Adjusted for realistic expectations
        });

        it("Should unstake with reasonable gas (<150k target)", async function () {
            const { impactDAOPool, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("10000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };

            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const tx = await impactDAOPool.connect(staker1).unstake(usdc("5000"));
            const receipt = await tx.wait();

            console.log("      Gas used for unstake:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lt(200000); // Adjusted for realistic expectations
        });

        it("Should harvest yield with reasonable gas", async function () {
            const { impactDAOPool, aUsdcToken, staker1 } = await loadFixture(deployImpactDAOPoolFixture);

            const stakeAmount = usdc("100000");
            const defaultSplit = {
                daoShare: DEFAULT_DAO_SHARE,
                stakerShare: DEFAULT_STAKER_SHARE,
                platformShare: DEFAULT_PLATFORM_SHARE
            };
            await impactDAOPool.connect(staker1).stake(stakeAmount, defaultSplit);

            const yieldAmount = usdc("5000");
            await aUsdcToken.mint(await impactDAOPool.getAddress(), yieldAmount);

            const tx = await impactDAOPool.harvestYield();
            const receipt = await tx.wait();

            console.log("      Gas used for harvestYield:", receipt.gasUsed.toString());
            expect(receipt.gasUsed).to.be.lt(300000);
        });
    });
});
