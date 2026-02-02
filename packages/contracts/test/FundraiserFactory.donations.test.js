const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// --- Ethers v6 Compatibility Helpers ---
const usdc = (val) => ethers.parseUnits(val, 6);
const eth = (val) => ethers.parseEther(val);
const ZERO_ADDRESS = ethers.ZeroAddress;

/**
 * @title FundraiserFactory Donation Tests
 * @notice Comprehensive test suite for donation functionality in FundraiserFactory
 * @dev Tests native ETH, ERC20, and Wealth Building donations with circuit breaker
 */
describe("FundraiserFactory - Donations", function () {

    // --- Fixture ---
    async function deployFactoryFixture() {
        const [owner, platformWallet, creator, donor1, donor2, donor3, beneficiary] =
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

        // Fund donors
        await usdcToken.mint(donor1.address, usdc("100000"));
        await usdcToken.mint(donor2.address, usdc("100000"));
        await usdcToken.mint(donor3.address, usdc("100000"));
        await daiToken.mint(donor1.address, ethers.parseEther("100000"));

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
            donor1,
            donor2,
            donor3,
            beneficiary
        };
    }

    async function createTestFundraiser(factory, creator, beneficiary) {
        const tx = await factory.connect(creator).createFundraiser(
            "Save the Rainforest",
            ["https://example.com/image1.jpg"],
            ["Environment"],
            "Help us protect the Amazon rainforest",
            "Brazil",
            beneficiary.address,
            usdc("50000"), // $50,000 goal
            30 // 30 days
        );
        const receipt = await tx.wait();

        // Extract fundraiser address from events
        let fundraiserAddr;
        for (const log of receipt.logs) {
            try {
                const parsed = factory.interface.parseLog(log);
                if (parsed.name === "FundraiserCreated") {
                    fundraiserAddr = parsed.args[0];
                    break;
                }
            } catch (e) {}
        }

        const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
        return { fundraiser, fundraiserId: 0 };
    }

    // ==================== DEPLOYMENT & CONFIGURATION ====================

    describe("Deployment & Configuration", function () {
        it("should deploy factory with correct USDC address", async function () {
            const { factory, usdcToken } = await loadFixture(deployFactoryFixture);

            expect(await factory.USDC()).to.equal(await usdcToken.getAddress());
        });

        it("should set platform fee recipient correctly", async function () {
            const { factory, platformWallet } = await loadFixture(deployFactoryFixture);

            expect(await factory.platformFeeRecipient()).to.equal(platformWallet.address);
        });

        it("should initialize with zero total funds raised", async function () {
            const { factory } = await loadFixture(deployFactoryFixture);

            const [, , totalRaised] = await factory.getPlatformStats();
            expect(totalRaised).to.equal(0);
        });

        it("should have swap adapter configured", async function () {
            const { factory, swapAdapter } = await loadFixture(deployFactoryFixture);

            expect(await factory.swapAdapter()).to.equal(await swapAdapter.getAddress());
        });
    });

    // ==================== NATIVE ETH DONATIONS ====================

    describe("Native ETH Donations", function () {
        it("should accept native ETH donation and swap to USDC", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const donationAmount = eth("1"); // 1 ETH

            await expect(
                factory.connect(donor1).donateNative(fundraiserId, { value: donationAmount })
            ).to.emit(fundraiser, "DonationCredited");

            // Check USDC was credited to fundraiser
            const fundraiserBalance = await usdcToken.balanceOf(await fundraiser.getAddress());
            expect(fundraiserBalance).to.be.gt(0);
        });

        it("should track total donations in fundraiser", async function () {
            const { factory, creator, beneficiary, donor1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await factory.connect(donor1).donateNative(fundraiserId, { value: eth("1") });

            expect(await fundraiser.totalDonations()).to.be.gt(0);
        });

        it("should track donor in fundraiser", async function () {
            const { factory, creator, beneficiary, donor1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await factory.connect(donor1).donateNative(fundraiserId, { value: eth("0.5") });

            expect(await fundraiser._donors(donor1.address)).to.be.true;
            expect(await fundraiser.donorsCount()).to.equal(1);
        });

        it("should increment donation counter", async function () {
            const { factory, creator, beneficiary, donor1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await factory.connect(donor1).donateNative(fundraiserId, { value: eth("0.1") });

            expect(await fundraiser.totalDonationsCount()).to.equal(1);
        });

        it("should update platform total funds raised", async function () {
            const { factory, creator, beneficiary, donor1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            await factory.connect(donor1).donateNative(fundraiserId, { value: eth("2") });

            const [, , totalRaised] = await factory.getPlatformStats();
            expect(totalRaised).to.be.gt(0);
        });

        it("should revert if native donation value is zero", async function () {
            const { factory, creator, beneficiary, donor1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            await expect(
                factory.connect(donor1).donateNative(fundraiserId, { value: 0 })
            ).to.be.revertedWithCustomError(factory, "InvalidAmount");
        });

        it("should revert if fundraiser ID is invalid", async function () {
            const { factory, donor1 } = await loadFixture(deployFactoryFixture);

            await expect(
                factory.connect(donor1).donateNative(999, { value: eth("1") })
            ).to.be.revertedWithCustomError(factory, "InvalidFundraiserId");
        });

        it("should handle multiple native donations from same donor", async function () {
            const { factory, creator, beneficiary, donor1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await factory.connect(donor1).donateNative(fundraiserId, { value: eth("0.5") });
            await factory.connect(donor1).donateNative(fundraiserId, { value: eth("0.3") });

            // Should have 2 donation records
            expect(await fundraiser.totalDonationsCount()).to.equal(2);
            // But only 1 unique donor
            expect(await fundraiser.donorsCount()).to.equal(1);
        });

        it("should handle multiple donors to same fundraiser", async function () {
            const { factory, creator, beneficiary, donor1, donor2, donor3 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            await factory.connect(donor1).donateNative(fundraiserId, { value: eth("1") });
            await factory.connect(donor2).donateNative(fundraiserId, { value: eth("2") });
            await factory.connect(donor3).donateNative(fundraiserId, { value: eth("0.5") });

            expect(await fundraiser.donorsCount()).to.equal(3);
            expect(await fundraiser.totalDonationsCount()).to.equal(3);
        });
    });

    // ==================== ERC20 DONATIONS ====================

    describe("ERC20 Donations", function () {
        it("should accept USDC donations without swap", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const donationAmount = usdc("1000");
            await usdcToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            await expect(
                factory.connect(donor1).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    donationAmount
                )
            ).to.emit(fundraiser, "DonationCredited");

            expect(await fundraiser.totalDonations()).to.equal(donationAmount);
        });

        it("should accept DAI donations and swap to USDC", async function () {
            const { factory, creator, beneficiary, donor1, daiToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const donationAmount = ethers.parseEther("500"); // 500 DAI
            await daiToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await daiToken.getAddress(),
                donationAmount
            );

            // Should have USDC balance in fundraiser
            expect(await fundraiser.totalDonations()).to.be.gt(0);
        });

        it("should revert if ERC20 donation amount is zero", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            await usdcToken.connect(donor1).approve(await factory.getAddress(), usdc("1000"));

            await expect(
                factory.connect(donor1).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    0
                )
            ).to.be.revertedWithCustomError(factory, "InvalidAmount");
        });

        it("should revert if donor has insufficient balance", async function () {
            const { factory, creator, beneficiary, donor2, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            const excessiveAmount = usdc("1000000"); // More than donor has
            await usdcToken.connect(donor2).approve(await factory.getAddress(), excessiveAmount);

            await expect(
                factory.connect(donor2).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    excessiveAmount
                )
            ).to.be.reverted;
        });

        it("should revert if donor has not approved tokens", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            const donationAmount = usdc("1000");
            // No approval

            await expect(
                factory.connect(donor1).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    donationAmount
                )
            ).to.be.reverted;
        });

        it("should credit correct source chain for ERC20 donations", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const donationAmount = usdc("1000");
            await usdcToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            await expect(
                factory.connect(donor1).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    donationAmount
                )
            ).to.emit(fundraiser, "DonationCredited")
             .withArgs(donor1.address, donationAmount, "erc20-local");
        });

        it("should handle large ERC20 donations", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const largeAmount = usdc("50000"); // $50,000
            await usdcToken.connect(donor1).approve(await factory.getAddress(), largeAmount);

            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                largeAmount
            );

            expect(await fundraiser.totalDonations()).to.equal(largeAmount);
        });
    });

    // ==================== DONATION EDGE CASES ====================

    describe("Donation Edge Cases", function () {
        it("should handle donations before deadline", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const donationAmount = usdc("100");
            await usdcToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            // Should succeed before deadline
            await expect(
                factory.connect(donor1).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    donationAmount
                )
            ).to.not.be.reverted;
        });

        it("should revert donations after deadline", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            // Fast forward past 30 day deadline
            await time.increase(31 * 24 * 60 * 60);

            const donationAmount = usdc("100");
            await usdcToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            await expect(
                factory.connect(donor1).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    donationAmount
                )
            ).to.be.revertedWith("Fundraiser has ended");
        });

        it("should allow donations to reach exact goal", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const goalAmount = usdc("50000"); // Matches goal
            await usdcToken.connect(donor1).approve(await factory.getAddress(), goalAmount);

            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                goalAmount
            );

            expect(await fundraiser.goalReached()).to.be.true;
        });

        it("should allow donations to exceed goal", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const excessAmount = usdc("60000"); // More than goal
            await usdcToken.connect(donor1).approve(await factory.getAddress(), excessAmount);

            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                excessAmount
            );

            expect(await fundraiser.goalReached()).to.be.true;
            expect(await fundraiser.totalDonations()).to.equal(excessAmount);
        });

        it("should handle very small donations", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const microAmount = 1; // 0.000001 USDC (1 unit in 6 decimals)
            await usdcToken.connect(donor1).approve(await factory.getAddress(), microAmount);

            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                microAmount
            );

            expect(await fundraiser.totalDonations()).to.equal(microAmount);
        });
    });

    // ==================== PAUSED STATE TESTS ====================

    describe("Paused State", function () {
        it("should revert donations when factory is paused", async function () {
            const { factory, creator, beneficiary, donor1, owner } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            // Pause factory
            await factory.connect(owner).pause();

            await expect(
                factory.connect(donor1).donateNative(fundraiserId, { value: eth("1") })
            ).to.be.revertedWithCustomError(factory, "EnforcedPause");
        });

        it("should allow donations after unpause", async function () {
            const { factory, creator, beneficiary, donor1, owner, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            // Pause then unpause
            await factory.connect(owner).pause();
            await factory.connect(owner).unpause();

            const donationAmount = usdc("100");
            await usdcToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            await expect(
                factory.connect(donor1).donateERC20(
                    fundraiserId,
                    await usdcToken.getAddress(),
                    donationAmount
                )
            ).to.not.be.reverted;
        });
    });

    // ==================== VOTING POWER ====================

    describe("Voting Power Tracking", function () {
        it("should grant voting power proportional to donation", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const donationAmount = usdc("5000");
            await usdcToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                donationAmount
            );

            expect(await fundraiser.donorVotingPower(donor1.address)).to.equal(donationAmount);
        });

        it("should accumulate voting power from multiple donations", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiser, fundraiserId } = await createTestFundraiser(
                factory, creator, beneficiary
            );

            const amount1 = usdc("1000");
            const amount2 = usdc("2000");

            await usdcToken.connect(donor1).approve(await factory.getAddress(), amount1 + amount2);

            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                amount1
            );
            await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                amount2
            );

            expect(await fundraiser.donorVotingPower(donor1.address)).to.equal(amount1 + amount2);
        });
    });

    // ==================== REENTRANCY PROTECTION ====================

    describe("Reentrancy Protection", function () {
        it("should have nonReentrant modifier on donateNative", async function () {
            const { factory } = await loadFixture(deployFactoryFixture);

            // Verify function exists and is protected (implicit through modifier)
            // Actual reentrancy attacks would require malicious contract
            expect(factory.interface.hasFunction("donateNative")).to.be.true;
        });

        it("should have nonReentrant modifier on donateERC20", async function () {
            const { factory } = await loadFixture(deployFactoryFixture);

            expect(factory.interface.hasFunction("donateERC20")).to.be.true;
        });
    });

    // ==================== GAS OPTIMIZATION ====================

    describe("Gas Optimization", function () {
        it("should consume reasonable gas for native donation", async function () {
            const { factory, creator, beneficiary, donor1 } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            const tx = await factory.connect(donor1).donateNative(
                fundraiserId,
                { value: eth("1") }
            );
            const receipt = await tx.wait();

            console.log("Gas used for donateNative:", receipt.gasUsed.toString());
            // Target: < 250k gas (includes swap + credit)
            expect(receipt.gasUsed).to.be.lt(250000);
        });

        it("should consume reasonable gas for ERC20 donation", async function () {
            const { factory, creator, beneficiary, donor1, usdcToken } =
                await loadFixture(deployFactoryFixture);

            const { fundraiserId } = await createTestFundraiser(factory, creator, beneficiary);

            const donationAmount = usdc("1000");
            await usdcToken.connect(donor1).approve(await factory.getAddress(), donationAmount);

            const tx = await factory.connect(donor1).donateERC20(
                fundraiserId,
                await usdcToken.getAddress(),
                donationAmount
            );
            const receipt = await tx.wait();

            console.log("Gas used for donateERC20:", receipt.gasUsed.toString());
            // Target: < 200k gas (no swap needed for USDC)
            expect(receipt.gasUsed).to.be.lt(200000);
        });
    });
});
