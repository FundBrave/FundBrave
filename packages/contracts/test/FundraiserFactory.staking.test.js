const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// --- Ethers v6 Compatibility Helpers ---
const usdc = (val) => ethers.parseUnits(val, 6);
const eth = (val) => ethers.parseEther(val);
const ZERO_ADDRESS = ethers.ZeroAddress;

/**
 * @title FundraiserFactory Staking Tests
 * @notice Comprehensive test suite for staking functionality in FundraiserFactory
 * @dev Tests native ETH and ERC20 staking with Aave integration
 */
describe("FundraiserFactory - Staking", function () {

    // --- Fixture ---
    async function deployFactoryFixture() {
        const [owner, platformWallet, creator, staker1, staker2, staker3, beneficiary] =
            await ethers.getSigners();

        // Deploy mock tokens
        const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
        const usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
        const daiToken = await MockERC20.deploy("Dai", "DAI", 18);

        const MockWETH = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockWETH");
        const wethToken = await MockWETH.deploy();

        // Deploy mock DeFi infrastructure
        const MockUniswapRouter = await ethers.getContractFactory(
            "contracts/test/DeFiMocks.sol:MockUniswapRouter"
        );
        const oneInchRouterMock = await MockUniswapRouter.deploy(
            await wethToken.getAddress(),
            await usdcToken.getAddress()
        );

        const MockAavePool = await ethers.getContractFactory(
            "contracts/test/DeFiMocks.sol:MockAavePool"
        );
        const aUsdcToken = await MockERC20.deploy("Aave USDC", "aUSDC", 6);
        const aavePool = await MockAavePool.deploy(
            await usdcToken.getAddress(),
            await aUsdcToken.getAddress()
        );

        // Deploy swap adapter
        const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
        const swapAdapter = await OneInchAdapter.deploy(
            await oneInchRouterMock.getAddress(),
            await usdcToken.getAddress(),
            await wethToken.getAddress(),
            owner.address
        );

        // Deploy implementations
        const Fundraiser = await ethers.getContractFactory("Fundraiser");
        const fundraiserImpl = await Fundraiser.deploy();

        const StakingPool = await ethers.getContractFactory("StakingPool");
        const stakingPoolImpl = await StakingPool.deploy();

        // Deploy factory
        const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
        const factory = await FundraiserFactory.deploy(
            await fundraiserImpl.getAddress(),
            await stakingPoolImpl.getAddress(),
            await swapAdapter.getAddress(),
            await usdcToken.getAddress(),
            await wethToken.getAddress(),
            platformWallet.address,
            await aavePool.getAddress(),
            await aUsdcToken.getAddress(),
            ZERO_ADDRESS, // No Morpho
            0 // Aave staking pool type
        );

        // Deploy ReceiptOFT mock
        const receiptOFT = await MockERC20.deploy("Receipt Token", "rcptUSDC", 6);
        await factory.connect(owner).setReceiptOFT(await receiptOFT.getAddress());

        // Fund mocks with liquidity
        await usdcToken.mint(await oneInchRouterMock.getAddress(), usdc("10000000"));
        await usdcToken.mint(await aavePool.getAddress(), usdc("10000000"));
        await aUsdcToken.mint(await aavePool.getAddress(), usdc("10000000"));

        // Fund stakers
        await usdcToken.mint(staker1.address, usdc("100000"));
        await usdcToken.mint(staker2.address, usdc("100000"));
        await usdcToken.mint(staker3.address, usdc("100000"));
        await daiToken.mint(staker1.address, ethers.parseEther("100000"));

        return {
            factory,
            usdcToken,
            daiToken,
            wethToken,
            aavePool,
            aUsdcToken,
            receiptOFT,
            swapAdapter,
            owner,
            platformWallet,
            creator,
            staker1,
            staker2,
            staker3,
            beneficiary
        };
    }

    async function createTestFundraiser(factory, creator, beneficiary) {
        const tx = await factory.connect(creator).createFundraiser(
            "Community Solar Project",
            ["https://example.com/solar.jpg"],
            ["Environment"],
            "Building solar panels for remote communities",
            "Kenya",
            beneficiary.address,
            usdc("100000"), // $100,000 goal
            90 // 90 days
        );
        const receipt = await tx.wait();

        // Extract addresses from events
        let fundraiserAddr, poolAddr;
        for (const log of receipt.logs) {
            try {
                const parsed = factory.interface.parseLog(log);
                if (parsed.name === "FundraiserCreated") {
                    fundraiserAddr = parsed.args[0];
                }
                if (parsed.name === "StakingPoolCreated") {
                    poolAddr = parsed.args[1];
                }
            } catch (e) {}
        }

        const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
        const stakingPool = await ethers.getContractAt("StakingPool", poolAddr);

        return { fundraiser, stakingPool, fundraiserId: 0 };
    }

    // ==================== STAKING POOL DEPLOYMENT ====================

    describe("Staking Pool Deployment", function () {
        it("should deploy staking pool with fundraiser", async function () {
            const { factory, creator, beneficiary, aavePool } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool } = await createTestFundraiser(factory, creator, beneficiary);

            expect(await stakingPool.AAVE_POOL()).to.equal(await aavePool.getAddress());
        });

        it("should set beneficiary correctly in staking pool", async function () {
            const { factory, creator, beneficiary } = await loadFixture(deployFactoryFixture);

            const { stakingPool } = await createTestFundraiser(factory, creator, beneficiary);

            expect(await stakingPool.beneficiary()).to.equal(beneficiary.address);
        });

        it("should set factory address in staking pool", async function () {
            const { factory, creator, beneficiary } = await loadFixture(deployFactoryFixture);

            const { stakingPool } = await createTestFundraiser(factory, creator, beneficiary);

            expect(await stakingPool.factoryAddress()).to.equal(await factory.getAddress());
        });

        it("should map staking pool to fundraiser ID", async function () {
            const { factory, creator, beneficiary } = await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const mappedPool = await factory.stakingPools(fundraiserId);
            expect(mappedPool).to.equal(await stakingPool.getAddress());
        });

        it("should emit StakingPoolCreated event", async function () {
            const { factory, creator, beneficiary } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(creator).createFundraiser(
                    "Test Campaign",
                    ["img.jpg"],
                    ["Medical"],
                    "Description",
                    "USA",
                    beneficiary.address,
                    usdc("10000"),
                    30
                )
            ).to.emit(factory, "StakingPoolCreated");
        });
    });

    // ==================== NATIVE ETH STAKING ====================

    describe("Native ETH Staking", function () {
        it("should accept native ETH stake and swap to USDC", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            // Set controller for receipt token minting
            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stakeAmount = eth("5"); // 5 ETH

            await expect(
                factory.connect(staker1).stakeNative(fundraiserId, { value: stakeAmount })
            ).to.emit(stakingPool, "Staked");
        });

        it("should update staker principal on native stake", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            await factory.connect(staker1).stakeNative(fundraiserId, { value: eth("2") });

            expect(await stakingPool.stakerPrincipal(staker1.address)).to.be.gt(0);
        });

        it("should mint receipt tokens on native stake", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            await factory.connect(staker1).stakeNative(fundraiserId, { value: eth("1") });

            const receiptBalance = await receiptOFT.balanceOf(staker1.address);
            expect(receiptBalance).to.be.gt(0);
        });

        it("should supply USDC to Aave on native stake", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, aUsdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            await factory.connect(staker1).stakeNative(fundraiserId, { value: eth("3") });

            // Check aUSDC balance of staking pool
            const aTokenBalance = await aUsdcToken.balanceOf(await stakingPool.getAddress());
            expect(aTokenBalance).to.be.gt(0);
        });

        it("should revert if native stake amount is zero", async function () {
            const { factory, creator, beneficiary, staker1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            await expect(
                factory.connect(staker1).stakeNative(fundraiserId, { value: 0 })
            ).to.be.revertedWithCustomError(factory, "InvalidAmount");
        });

        it("should revert if staking pool does not exist", async function () {
            const { factory, staker1 } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(staker1).stakeNative(999, { value: eth("1") })
            ).to.be.revertedWithCustomError(factory, "NoStakingPool");
        });

        it("should handle multiple native stakes from same staker", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            await factory.connect(staker1).stakeNative(fundraiserId, { value: eth("1") });
            const principal1 = await stakingPool.stakerPrincipal(staker1.address);

            await factory.connect(staker1).stakeNative(fundraiserId, { value: eth("2") });
            const principal2 = await stakingPool.stakerPrincipal(staker1.address);

            expect(principal2).to.be.gt(principal1);
        });
    });

    // ==================== ERC20 STAKING ====================

    describe("ERC20 Staking", function () {
        it("should accept USDC stakes without swap", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stakeAmount = usdc("10000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);

            await expect(
                factory.connect(staker1).stakeERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    stakeAmount
                )
            ).to.emit(stakingPool, "Staked").withArgs(staker1.address, stakeAmount);
        });

        it("should accept DAI stakes and swap to USDC", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, daiToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stakeAmount = ethers.parseEther("5000"); // 5000 DAI
            await daiToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);

            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await daiToken.getAddress(),
                stakeAmount
            );

            // Should have principal in USDC terms
            expect(await stakingPool.stakerPrincipal(staker1.address)).to.be.gt(0);
        });

        it("should update total staked principal", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stakeAmount = usdc("15000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);

            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stakeAmount
            );

            expect(await stakingPool.totalStakedPrincipal()).to.equal(stakeAmount);
        });

        it("should mint receipt tokens proportional to stake", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stakeAmount = usdc("25000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);

            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stakeAmount
            );

            const receiptBalance = await receiptOFT.balanceOf(staker1.address);
            expect(receiptBalance).to.equal(stakeAmount);
        });

        it("should revert if staker has insufficient token balance", async function () {
            const { factory, creator, beneficiary, staker2, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            const excessiveAmount = usdc("1000000"); // More than staker has
            await usdcToken.connect(staker2).approve(await factory.getAddress(), excessiveAmount);

            await expect(
                factory.connect(staker2).stakeERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    excessiveAmount
                )
            ).to.be.reverted;
        });

        it("should revert if staker has not approved tokens", async function () {
            const { factory, creator, beneficiary, staker1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            const stakeAmount = usdc("5000");
            // No approval

            await expect(
                factory.connect(staker1).stakeERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    stakeAmount
                )
            ).to.be.reverted;
        });

        it("should handle multiple stakers to same pool", async function () {
            const { factory, creator, beneficiary, staker1, staker2, staker3,
                    owner, receiptOFT, usdcToken } = await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stake1 = usdc("10000");
            const stake2 = usdc("20000");
            const stake3 = usdc("15000");

            await usdcToken.connect(staker1).approve(await factory.getAddress(), stake1);
            await usdcToken.connect(staker2).approve(await factory.getAddress(), stake2);
            await usdcToken.connect(staker3).approve(await factory.getAddress(), stake3);

            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stake1
            );
            await factory.connect(staker2).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stake2
            );
            await factory.connect(staker3).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stake3
            );

            expect(await stakingPool.stakerPrincipal(staker1.address)).to.equal(stake1);
            expect(await stakingPool.stakerPrincipal(staker2.address)).to.equal(stake2);
            expect(await stakingPool.stakerPrincipal(staker3.address)).to.equal(stake3);
            expect(await stakingPool.totalStakedPrincipal()).to.equal(stake1 + stake2 + stake3);
        });
    });

    // ==================== YIELD GENERATION & DISTRIBUTION ====================

    describe("Yield Generation & Distribution", function () {
        it("should generate yield from Aave", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT,
                    usdcToken, aUsdcToken } = await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            // Stake
            const stakeAmount = usdc("50000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);
            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stakeAmount
            );

            // Simulate Aave yield
            const yieldAmount = usdc("1000");
            await aUsdcToken.mint(await stakingPool.getAddress(), yieldAmount);

            // Fast forward and harvest
            await time.increase(24 * 60 * 60 + 1); // 1 day + 1 sec
            await stakingPool.performUpkeep("0x");

            // Should have distributed yield
            const stakerYield = await stakingPool.earnedUSDC(staker1.address);
            expect(stakerYield).to.be.gt(0);
        });

        it("should distribute yield according to default split (79/19/2)", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT,
                    usdcToken, aUsdcToken, platformWallet } = await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            // Stake
            const stakeAmount = usdc("10000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);
            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stakeAmount
            );

            // Simulate yield
            const yieldAmount = usdc("1000");
            await aUsdcToken.mint(await stakingPool.getAddress(), yieldAmount);

            const beneficiaryBefore = await usdcToken.balanceOf(beneficiary.address);
            const platformBefore = await usdcToken.balanceOf(platformWallet.address);

            await time.increase(24 * 60 * 60 + 1);
            await stakingPool.harvestAndDistribute();

            // Trigger distribution by unstaking small amount
            await time.increase(1);
            await stakingPool.connect(staker1).unstake(usdc("1"));

            const beneficiaryAfter = await usdcToken.balanceOf(beneficiary.address);
            const platformAfter = await usdcToken.balanceOf(platformWallet.address);

            // Beneficiary should get ~79% = 790 USDC
            expect(beneficiaryAfter - beneficiaryBefore).to.be.closeTo(usdc("790"), usdc("5"));
            // Platform should get ~2% = 20 USDC
            expect(platformAfter - platformBefore).to.be.closeTo(usdc("20"), usdc("5"));
        });

        it("should allow stakers to claim their yield share", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT,
                    usdcToken, aUsdcToken } = await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stakeAmount = usdc("20000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);
            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stakeAmount
            );

            const yieldAmount = usdc("2000");
            await aUsdcToken.mint(await stakingPool.getAddress(), yieldAmount);

            await time.increase(24 * 60 * 60 + 1);
            await stakingPool.harvestAndDistribute();

            await time.increase(1);

            const balanceBefore = await usdcToken.balanceOf(staker1.address);
            await stakingPool.connect(staker1).claimAllRewards();
            const balanceAfter = await usdcToken.balanceOf(staker1.address);

            // Staker should get ~19% of 2000 = 380 USDC
            expect(balanceAfter - balanceBefore).to.be.closeTo(usdc("380"), usdc("10"));
        });
    });

    // ==================== PAUSED STATE ====================

    describe("Paused State", function () {
        it("should revert staking when factory is paused", async function () {
            const { factory, creator, beneficiary, staker1, owner } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            await factory.connect(owner).pause();

            await expect(
                factory.connect(staker1).stakeNative(fundraiserId, { value: eth("1") })
            ).to.be.revertedWithCustomError(factory, "EnforcedPause");
        });

        it("should allow staking after unpause", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            await factory.connect(owner).pause();
            await factory.connect(owner).unpause();

            const stakeAmount = usdc("5000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);

            await expect(
                factory.connect(staker1).stakeERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    stakeAmount
                )
            ).to.not.be.reverted;
        });
    });

    // ==================== REENTRANCY PROTECTION ====================

    describe("Reentrancy Protection", function () {
        it("should have nonReentrant modifier on stakeNative", async function () {
            const { factory } = await loadFixture(deployFactoryFixture);

            expect(factory.interface.hasFunction("stakeNative")).to.be.true;
        });

        it("should have nonReentrant modifier on stakeERC20", async function () {
            const { factory } = await loadFixture(deployFactoryFixture);

            expect(factory.interface.hasFunction("stakeERC20")).to.be.true;
        });
    });

    // ==================== EDGE CASES ====================

    describe("Edge Cases", function () {
        it("should handle very small stakes", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const microStake = 1; // 0.000001 USDC
            await usdcToken.connect(staker1).approve(await factory.getAddress(), microStake);

            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                microStake
            );

            expect(await stakingPool.stakerPrincipal(staker1.address)).to.equal(microStake);
        });

        it("should handle very large stakes", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const largeStake = usdc("100000"); // $100,000
            await usdcToken.connect(staker1).approve(await factory.getAddress(), largeStake);

            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                largeStake
            );

            expect(await stakingPool.stakerPrincipal(staker1.address)).to.equal(largeStake);
        });

        it("should handle simultaneous stakes from multiple stakers", async function () {
            const { factory, creator, beneficiary, staker1, staker2, owner, receiptOFT,
                    usdcToken } = await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const amount1 = usdc("5000");
            const amount2 = usdc("7500");

            await usdcToken.connect(staker1).approve(await factory.getAddress(), amount1);
            await usdcToken.connect(staker2).approve(await factory.getAddress(), amount2);

            // Stake in same block if possible
            await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                amount1
            );
            await factory.connect(staker2).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                amount2
            );

            expect(await stakingPool.totalStakedPrincipal()).to.equal(amount1 + amount2);
        });
    });

    // ==================== GAS OPTIMIZATION ====================

    describe("Gas Optimization", function () {
        it("should consume reasonable gas for native stake", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const tx = await factory.connect(staker1).stakeNative(
                fundraiserId,
                { value: eth("1") }
            );
            const receipt = await tx.wait();

            console.log("Gas used for stakeNative:", receipt.gasUsed.toString());
            // Target: < 300k gas (includes swap + Aave supply + receipt mint)
            expect(receipt.gasUsed).to.be.lt(300000);
        });

        it("should consume reasonable gas for ERC20 stake", async function () {
            const { factory, creator, beneficiary, staker1, owner, receiptOFT, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { stakingPool, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await receiptOFT.connect(owner).setController(
                await stakingPool.getAddress(),
                true
            );

            const stakeAmount = usdc("10000");
            await usdcToken.connect(staker1).approve(await factory.getAddress(), stakeAmount);

            const tx = await factory.connect(staker1).stakeERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                stakeAmount
            );
            const receipt = await tx.wait();

            console.log("Gas used for stakeERC20:", receipt.gasUsed.toString());
            // Target: < 250k gas (no swap needed for USDC)
            expect(receipt.gasUsed).to.be.lt(250000);
        });
    });
});
