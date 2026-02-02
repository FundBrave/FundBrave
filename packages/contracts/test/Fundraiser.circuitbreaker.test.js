const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// --- Ethers v6 Compatibility Helpers ---
const usdc = (val) => ethers.parseUnits(val, 6);
const ZERO_ADDRESS = ethers.ZeroAddress;

/**
 * @title Fundraiser Circuit Breaker & Withdrawal Tests
 * @notice Comprehensive test suite for circuit breaker protection and fund withdrawal
 * @dev Tests transaction limits, withdrawal conditions, and security controls
 */
describe("Fundraiser - Circuit Breaker & Withdrawal", function () {

    // --- Fixture ---
    async function deployFundraiserFixture() {
        const [owner, creator, beneficiary, donor1, donor2, platformWallet] =
            await ethers.getSigners();

        // Deploy mock USDC
        const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
        const usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);

        // Deploy Fundraiser as UUPS proxy
        const Fundraiser = await ethers.getContractFactory("Fundraiser");
        const fundraiser = await upgrades.deployProxy(
            Fundraiser,
            [
                0, // id
                "Emergency Relief Fund",
                ["https://example.com/relief.jpg"],
                ["Emergency"],
                "Providing emergency relief to disaster victims",
                "Philippines",
                beneficiary.address,
                creator.address,
                usdc("100000"), // $100,000 goal
                Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
                await usdcToken.getAddress(),
                platformWallet.address,
                owner.address // factory address
            ],
            {
                initializer: "initialize",
                kind: "uups"
            }
        );
        await fundraiser.waitForDeployment();

        // Mint USDC to donors
        await usdcToken.mint(donor1.address, usdc("10000000")); // Large amount for testing
        await usdcToken.mint(donor2.address, usdc("10000000"));

        return {
            fundraiser,
            usdcToken,
            owner,
            creator,
            beneficiary,
            donor1,
            donor2,
            platformWallet
        };
    }

    async function makeDonation(fundraiser, usdcToken, donor, amount) {
        await usdcToken.mint(await fundraiser.getAddress(), amount);
        const ownerSigner = await ethers.provider.getSigner(await fundraiser.owner());
        await fundraiser.connect(ownerSigner).creditDonation(
            donor.address,
            amount,
            "test-local"
        );
    }

    // ==================== CIRCUIT BREAKER INITIALIZATION ====================

    describe("Circuit Breaker Initialization", function () {
        it("should initialize with default limits", async function () {
            const { fundraiser } = await loadFixture(deployFundraiserFixture);

            const [maxSingle, hourlyRemaining, dailyRemaining] =
                await fundraiser.getCircuitBreakerStatus();

            // Default: 1M USDC max single, 5M hourly, 20M daily
            expect(maxSingle).to.equal(usdc("1000000"));
            expect(hourlyRemaining).to.equal(usdc("5000000"));
            expect(dailyRemaining).to.equal(usdc("20000000"));
        });

        it("should not be triggered initially", async function () {
            const { fundraiser } = await loadFixture(deployFundraiserFixture);

            expect(await fundraiser.isCircuitBreakerTriggered()).to.be.false;
        });
    });

    // ==================== SINGLE TRANSACTION LIMITS ====================

    describe("Single Transaction Limits", function () {
        it("should accept donations below max single transaction", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const amount = usdc("500000"); // Below 1M limit

            await expect(
                makeDonation(fundraiser, usdcToken, donor1, amount)
            ).to.not.be.reverted;
        });

        it("should accept donation exactly at max single transaction", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const amount = usdc("1000000"); // Exactly 1M limit

            await expect(
                makeDonation(fundraiser, usdcToken, donor1, amount)
            ).to.not.be.reverted;
        });

        it("should block donations exceeding max single transaction", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const amount = usdc("1000001"); // Just over 1M limit

            await expect(
                makeDonation(fundraiser, usdcToken, donor1, amount)
            ).to.be.revertedWith("Transaction blocked by circuit breaker");
        });

        it("should block large donations triggering single transaction limit", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const largeAmount = usdc("5000000"); // 5M, way over limit

            await expect(
                makeDonation(fundraiser, usdcToken, donor1, largeAmount)
            ).to.be.revertedWith("Transaction blocked by circuit breaker");
        });
    });

    // ==================== HOURLY VOLUME LIMITS ====================

    describe("Hourly Volume Limits", function () {
        it("should track hourly volume correctly", async function () {
            const { fundraiser, usdcToken, owner, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("2000000"));

            const [, hourlyRemaining] = await fundraiser.getCircuitBreakerStatus();

            // Should have 5M - 3M = 2M remaining
            expect(hourlyRemaining).to.equal(usdc("2000000"));
        });

        it("should block transactions exceeding hourly limit", async function () {
            const { fundraiser, usdcToken, owner, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            // Use up most of hourly capacity (5M total)
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));

            // This should fail (would exceed hourly limit)
            await expect(
                makeDonation(fundraiser, usdcToken, donor2, usdc("100000"))
            ).to.be.revertedWith("Transaction blocked by circuit breaker");
        });

        it("should reset hourly limit after 1 hour", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Max out hourly capacity
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));

            // Fast forward 1 hour + 1 second
            await time.increase(60 * 60 + 1);

            // Should work now
            await expect(
                makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"))
            ).to.not.be.reverted;
        });
    });

    // ==================== DAILY VOLUME LIMITS ====================

    describe("Daily Volume Limits", function () {
        it("should track daily volume correctly", async function () {
            const { fundraiser, usdcToken, owner, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("500000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("300000"));

            const [, , dailyRemaining] = await fundraiser.getCircuitBreakerStatus();

            // Should have 20M - 800k = 19.2M remaining
            expect(dailyRemaining).to.equal(usdc("19200000"));
        });

        it("should block transactions exceeding daily limit", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Use up daily capacity (20M total) over multiple hours
            for (let i = 0; i < 4; i++) {
                // Each iteration: 5M (hourly max)
                for (let j = 0; j < 5; j++) {
                    await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
                }
                // Move to next hour
                if (i < 3) {
                    await time.increase(60 * 60 + 1);
                }
            }

            // This should fail (would exceed daily limit)
            await time.increase(60 * 60 + 1);
            await expect(
                makeDonation(fundraiser, usdcToken, donor1, usdc("100000"))
            ).to.be.revertedWith("Transaction blocked by circuit breaker");
        });

        it("should reset daily limit after 24 hours", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Make a large donation
            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));

            // Fast forward 24 hours + 1 second
            await time.increase(24 * 60 * 60 + 1);

            // Daily capacity should be reset
            const [, , dailyRemaining] = await fundraiser.getCircuitBreakerStatus();
            expect(dailyRemaining).to.equal(usdc("20000000"));
        });
    });

    // ==================== CIRCUIT BREAKER TRIGGERED ====================

    describe("Circuit Breaker Triggered State", function () {
        it("should trigger circuit breaker on suspicious activity", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Attempt to donate amount exceeding single transaction limit
            await expect(
                makeDonation(fundraiser, usdcToken, donor1, usdc("2000000"))
            ).to.be.revertedWith("Transaction blocked by circuit breaker");
        });

        it("should block all donations when circuit breaker is triggered", async function () {
            const { fundraiser, usdcToken, owner, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            // Trigger circuit breaker by exceeding hourly limit
            for (let i = 0; i < 5; i++) {
                await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            }

            // Now circuit breaker should block even small donations
            await expect(
                makeDonation(fundraiser, usdcToken, donor2, usdc("10"))
            ).to.be.revertedWith("Transaction blocked by circuit breaker");
        });
    });

    // ==================== CIRCUIT BREAKER MANAGEMENT ====================

    describe("Circuit Breaker Management", function () {
        it("should allow owner to reset circuit breaker", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            // Reset should work (even if not triggered)
            await expect(fundraiser.connect(creator).resetCircuitBreaker()).to.not.be.reverted;

            expect(await fundraiser.isCircuitBreakerTriggered()).to.be.false;
        });

        it("should allow owner to update circuit breaker limits", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            const newMaxTransaction = usdc("2000000"); // 2M
            const newMaxHourly = usdc("10000000"); // 10M
            const newMaxDaily = usdc("50000000"); // 50M

            await fundraiser.connect(creator).updateCircuitBreakerLimits(
                newMaxTransaction,
                newMaxHourly,
                newMaxDaily
            );

            const [maxSingle, hourlyRemaining, dailyRemaining] =
                await fundraiser.getCircuitBreakerStatus();

            expect(maxSingle).to.equal(newMaxTransaction);
            expect(hourlyRemaining).to.equal(newMaxHourly);
            expect(dailyRemaining).to.equal(newMaxDaily);
        });

        it("should revert if non-owner tries to reset circuit breaker", async function () {
            const { fundraiser, donor1 } = await loadFixture(deployFundraiserFixture);

            await expect(
                fundraiser.connect(donor1).resetCircuitBreaker()
            ).to.be.revertedWithCustomError(fundraiser, "OwnableUnauthorizedAccount");
        });

        it("should revert if non-owner tries to update limits", async function () {
            const { fundraiser, donor1 } = await loadFixture(deployFundraiserFixture);

            await expect(
                fundraiser.connect(donor1).updateCircuitBreakerLimits(
                    usdc("1000000"),
                    usdc("5000000"),
                    usdc("20000000")
                )
            ).to.be.revertedWithCustomError(fundraiser, "OwnableUnauthorizedAccount");
        });
    });

    // ==================== WITHDRAWAL FUNCTIONALITY ====================

    describe("Withdrawal", function () {
        it("should allow withdrawal after goal is reached", async function () {
            const { fundraiser, usdcToken, owner, creator, beneficiary, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Reach goal
            await makeDonation(fundraiser, usdcToken, donor1, usdc("100000"));

            expect(await fundraiser.goalReached()).to.be.true;

            const balanceBefore = await usdcToken.balanceOf(beneficiary.address);
            await fundraiser.connect(creator).withdrawUSDT();
            const balanceAfter = await usdcToken.balanceOf(beneficiary.address);

            expect(balanceAfter - balanceBefore).to.equal(usdc("100000"));
        });

        it("should allow withdrawal after deadline even if goal not reached", async function () {
            const { fundraiser, usdcToken, owner, creator, beneficiary, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Partial donation
            await makeDonation(fundraiser, usdcToken, donor1, usdc("50000"));

            // Fast forward past deadline
            await time.increase(31 * 24 * 60 * 60);

            const balanceBefore = await usdcToken.balanceOf(beneficiary.address);
            await fundraiser.connect(creator).withdrawUSDT();
            const balanceAfter = await usdcToken.balanceOf(beneficiary.address);

            expect(balanceAfter - balanceBefore).to.equal(usdc("50000"));
        });

        it("should revert withdrawal before deadline if goal not reached", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("50000"));

            await expect(
                fundraiser.connect(creator).withdrawUSDT()
            ).to.be.revertedWith("Cannot withdraw before deadline unless goal reached");
        });

        it("should revert if non-owner tries to withdraw", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("100000"));

            await expect(
                fundraiser.connect(donor1).withdrawUSDT()
            ).to.be.revertedWithCustomError(fundraiser, "OwnableUnauthorizedAccount");
        });

        it("should revert if no funds to withdraw", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            // Fast forward past deadline
            await time.increase(31 * 24 * 60 * 60);

            await expect(
                fundraiser.connect(creator).withdrawUSDT()
            ).to.be.revertedWith("No funds to withdraw");
        });

        it("should emit Withdraw event", async function () {
            const { fundraiser, usdcToken, owner, creator, beneficiary, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("100000"));

            await expect(fundraiser.connect(creator).withdrawUSDT())
                .to.emit(fundraiser, "Withdraw")
                .withArgs(usdc("100000"), await usdcToken.getAddress());
        });

        it("should prevent withdrawal when refunds are enabled", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Partial donation
            await makeDonation(fundraiser, usdcToken, donor1, usdc("50000"));

            // Fast forward past deadline
            await time.increase(31 * 24 * 60 * 60);

            // Enable refunds
            await fundraiser.enableRefunds();

            await expect(
                fundraiser.connect(creator).withdrawUSDT()
            ).to.be.revertedWith("Refunds are enabled, cannot withdraw");
        });
    });

    // ==================== PAUSE FUNCTIONALITY ====================

    describe("Pause Functionality", function () {
        it("should allow owner to pause fundraiser", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            await fundraiser.connect(creator).pause();
            expect(await fundraiser.paused()).to.be.true;
        });

        it("should block donations when paused", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await fundraiser.connect(creator).pause();

            await expect(
                makeDonation(fundraiser, usdcToken, donor1, usdc("1000"))
            ).to.be.revertedWithCustomError(fundraiser, "EnforcedPause");
        });

        it("should allow owner to unpause", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            await fundraiser.connect(creator).pause();
            await fundraiser.connect(creator).unpause();

            expect(await fundraiser.paused()).to.be.false;
        });

        it("should allow donations after unpause", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await fundraiser.connect(creator).pause();
            await fundraiser.connect(creator).unpause();

            await expect(
                makeDonation(fundraiser, usdcToken, donor1, usdc("1000"))
            ).to.not.be.reverted;
        });

        it("should revert if non-owner tries to pause", async function () {
            const { fundraiser, donor1 } = await loadFixture(deployFundraiserFixture);

            await expect(
                fundraiser.connect(donor1).pause()
            ).to.be.revertedWithCustomError(fundraiser, "OwnableUnauthorizedAccount");
        });
    });

    // ==================== INTEGRATION SCENARIOS ====================

    describe("Integration Scenarios", function () {
        it("should handle complete fundraiser lifecycle with withdrawals", async function () {
            const { fundraiser, usdcToken, owner, creator, beneficiary, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            // Donations under circuit breaker limits
            await makeDonation(fundraiser, usdcToken, donor1, usdc("60000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("40000"));

            // Goal reached
            expect(await fundraiser.goalReached()).to.be.true;

            // Withdraw
            await fundraiser.connect(creator).withdrawUSDT();

            const beneficiaryBalance = await usdcToken.balanceOf(beneficiary.address);
            expect(beneficiaryBalance).to.equal(usdc("100000"));

            // No funds left
            const fundraiserBalance = await usdcToken.balanceOf(await fundraiser.getAddress());
            expect(fundraiserBalance).to.equal(0);
        });

        it("should protect against rapid-fire donation attacks", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Attempt many large donations quickly
            for (let i = 0; i < 5; i++) {
                await makeDonation(fundraiser, usdcToken, donor1, usdc("1000000"));
            }

            // Next donation should be blocked
            await expect(
                makeDonation(fundraiser, usdcToken, donor1, usdc("100000"))
            ).to.be.revertedWith("Transaction blocked by circuit breaker");
        });
    });
});
