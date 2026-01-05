const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// --- Ethers v6 Compatibility Helpers ---
const fbt = (val) => ethers.parseEther(val);
const ZERO_ADDRESS = ethers.ZeroAddress;

// --- Time Constants ---
const ONE_DAY = 24 * 60 * 60;
const SEVEN_DAYS = 7 * ONE_DAY;
const THIRTY_DAYS = 30 * ONE_DAY;

describe("FundBraveToken", function () {
    async function deployTokenFixture() {
        const [owner, minter, vester, stakingContract, user1, user2, user3] = await ethers.getSigners();

        // Deploy upgradeable FundBraveToken
        const FundBraveToken = await ethers.getContractFactory("FundBraveToken");
        const token = await upgrades.deployProxy(FundBraveToken, [owner.address], {
            initializer: "initialize",
            kind: "uups",
        });

        return { token, owner, minter, vester, stakingContract, user1, user2, user3 };
    }

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            const { token } = await loadFixture(deployTokenFixture);
            expect(await token.name()).to.equal("FundBrave Token");
            expect(await token.symbol()).to.equal("FBT");
        });

        it("Should mint initial supply to owner", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);
            const expectedSupply = fbt("10000000"); // 10 million FBT
            expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
            expect(await token.totalSupply()).to.equal(expectedSupply);
        });

        it("Should set owner correctly", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);
            expect(await token.owner()).to.equal(owner.address);
        });

        it("Should revert if initialized with zero address", async function () {
            const FundBraveToken = await ethers.getContractFactory("FundBraveToken");
            await expect(
                upgrades.deployProxy(FundBraveToken, [ZERO_ADDRESS], {
                    initializer: "initialize",
                    kind: "uups",
                })
            ).to.be.revertedWithCustomError(FundBraveToken, "ZeroAddress");
        });
    });

    describe("Minting", function () {
        it("Should allow authorized minter to mint tokens", async function () {
            const { token, owner, minter, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setMinter(minter.address, true);
            expect(await token.minters(minter.address)).to.be.true;

            const mintAmount = fbt("1000");
            await token.connect(minter).mint(user1.address, mintAmount);
            expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
        });

        it("Should revert if non-minter tries to mint", async function () {
            const { token, user1 } = await loadFixture(deployTokenFixture);

            await expect(
                token.connect(user1).mint(user1.address, fbt("1000"))
            ).to.be.revertedWithCustomError(token, "NotAuthorizedMinter");
        });

        it("Should revert minting to zero address", async function () {
            const { token, owner, minter } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setMinter(minter.address, true);
            await expect(
                token.connect(minter).mint(ZERO_ADDRESS, fbt("1000"))
            ).to.be.revertedWithCustomError(token, "ZeroAddress");
        });

        it("Should revert minting zero amount", async function () {
            const { token, owner, minter, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setMinter(minter.address, true);
            await expect(
                token.connect(minter).mint(user1.address, 0)
            ).to.be.revertedWithCustomError(token, "InvalidAmount");
        });

        it("Should emit MinterAuthorizationChanged event", async function () {
            const { token, owner, minter } = await loadFixture(deployTokenFixture);

            await expect(token.connect(owner).setMinter(minter.address, true))
                .to.emit(token, "MinterAuthorizationChanged")
                .withArgs(minter.address, true);
        });

        it("Should revert if setting minter to same value", async function () {
            const { token, owner, minter } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setMinter(minter.address, true);
            await expect(
                token.connect(owner).setMinter(minter.address, true)
            ).to.be.revertedWithCustomError(token, "AuthorizationUnchanged");
        });
    });

    describe("Vesting", function () {
        describe("Creating Vesting Schedules", function () {
            it("Should allow authorized vester to create vesting schedule", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);

                const vestAmount = fbt("1000");
                const vestDuration = THIRTY_DAYS;

                const tx = await token.connect(vester).vestTokens(user1.address, vestAmount, vestDuration);
                const receipt = await tx.wait();
                const block = await ethers.provider.getBlock(receipt.blockNumber);

                await expect(tx)
                    .to.emit(token, "VestingScheduleCreated")
                    .withArgs(user1.address, 0, vestAmount, vestDuration, block.timestamp);

                const schedules = await token.getVestingSchedules(user1.address);
                expect(schedules.length).to.equal(1);
                expect(schedules[0].total).to.equal(vestAmount);
                expect(schedules[0].released).to.equal(0);
                expect(schedules[0].duration).to.equal(vestDuration);
            });

            it("Should allow owner to create vesting schedule", async function () {
                const { token, owner, user1 } = await loadFixture(deployTokenFixture);

                const vestAmount = fbt("500");
                await token.connect(owner).vestTokens(user1.address, vestAmount, SEVEN_DAYS);

                expect(await token.getVestingScheduleCount(user1.address)).to.equal(1);
            });

            it("Should create donation reward vesting (30 days)", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);

                const vestAmount = fbt("2000");
                await token.connect(vester).vestDonationReward(user1.address, vestAmount);

                const schedule = await token.getVestingSchedule(user1.address, 0);
                expect(schedule.duration).to.equal(THIRTY_DAYS);
                expect(schedule.total).to.equal(vestAmount);
            });

            it("Should create engagement reward vesting (7 days)", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);

                const vestAmount = fbt("100");
                await token.connect(vester).vestEngagementReward(user1.address, vestAmount);

                const schedule = await token.getVestingSchedule(user1.address, 0);
                expect(schedule.duration).to.equal(SEVEN_DAYS);
                expect(schedule.total).to.equal(vestAmount);
            });

            it("Should revert if non-vester tries to create vesting", async function () {
                const { token, user1, user2 } = await loadFixture(deployTokenFixture);

                await expect(
                    token.connect(user1).vestTokens(user2.address, fbt("100"), SEVEN_DAYS)
                ).to.be.revertedWithCustomError(token, "NotAuthorizedVester");
            });

            it("Should revert vesting to zero address", async function () {
                const { token, owner, vester } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                await expect(
                    token.connect(vester).vestTokens(ZERO_ADDRESS, fbt("100"), SEVEN_DAYS)
                ).to.be.revertedWithCustomError(token, "ZeroAddress");
            });

            it("Should revert vesting zero amount", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                await expect(
                    token.connect(vester).vestTokens(user1.address, 0, SEVEN_DAYS)
                ).to.be.revertedWithCustomError(token, "InvalidAmount");
            });

            it("Should revert vesting with zero duration", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                await expect(
                    token.connect(vester).vestTokens(user1.address, fbt("100"), 0)
                ).to.be.revertedWithCustomError(token, "InvalidVestingDuration");
            });
        });

        describe("Claiming Vested Tokens", function () {
            it("Should allow partial claiming after partial vesting", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);

                const vestAmount = fbt("1000");
                await token.connect(vester).vestTokens(user1.address, vestAmount, THIRTY_DAYS);

                // Fast forward 15 days (half the vesting period)
                await time.increase(15 * ONE_DAY);

                const claimableBefore = await token.getClaimableAmount(user1.address);
                // Should be approximately 50% vested
                expect(claimableBefore).to.be.closeTo(fbt("500"), fbt("1"));

                await token.connect(user1).claimVestedTokens();
                expect(await token.balanceOf(user1.address)).to.be.closeTo(fbt("500"), fbt("1"));
            });

            it("Should allow full claiming after vesting period", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);

                const vestAmount = fbt("1000");
                await token.connect(vester).vestTokens(user1.address, vestAmount, SEVEN_DAYS);

                // Fast forward past vesting period
                await time.increase(SEVEN_DAYS + ONE_DAY);

                const claimable = await token.getClaimableAmount(user1.address);
                expect(claimable).to.equal(vestAmount);

                await expect(token.connect(user1).claimVestedTokens())
                    .to.emit(token, "VestedTokensClaimed")
                    .withArgs(user1.address, vestAmount);

                expect(await token.balanceOf(user1.address)).to.equal(vestAmount);
            });

            it("Should allow claiming from specific schedule", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);

                // Create two vesting schedules
                await token.connect(vester).vestTokens(user1.address, fbt("1000"), SEVEN_DAYS);
                await token.connect(vester).vestTokens(user1.address, fbt("500"), THIRTY_DAYS);

                expect(await token.getVestingScheduleCount(user1.address)).to.equal(2);

                // Fast forward 7 days
                await time.increase(SEVEN_DAYS);

                // First schedule should be fully claimable
                const claimableFromFirst = await token.getClaimableAmountFromSchedule(user1.address, 0);
                expect(claimableFromFirst).to.equal(fbt("1000"));

                await token.connect(user1).claimVestedTokensFromSchedule(0);
                expect(await token.balanceOf(user1.address)).to.equal(fbt("1000"));
            });

            it("Should revert if nothing to claim", async function () {
                const { token, user1 } = await loadFixture(deployTokenFixture);

                await expect(
                    token.connect(user1).claimVestedTokens()
                ).to.be.revertedWithCustomError(token, "NoClaimableTokens");
            });

            it("Should revert claiming from invalid schedule index", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                await token.connect(vester).vestTokens(user1.address, fbt("100"), SEVEN_DAYS);

                await expect(
                    token.connect(user1).claimVestedTokensFromSchedule(1)
                ).to.be.revertedWithCustomError(token, "InvalidScheduleIndex");
            });

            it("Should track released tokens correctly across multiple claims", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                const vestAmount = fbt("1000");
                await token.connect(vester).vestTokens(user1.address, vestAmount, THIRTY_DAYS);

                // Claim at 10 days
                await time.increase(10 * ONE_DAY);
                await token.connect(user1).claimVestedTokens();
                const balance1 = await token.balanceOf(user1.address);

                // Claim at 20 days
                await time.increase(10 * ONE_DAY);
                await token.connect(user1).claimVestedTokens();
                const balance2 = await token.balanceOf(user1.address);

                // Claim at 30+ days
                await time.increase(15 * ONE_DAY);
                await token.connect(user1).claimVestedTokens();
                const finalBalance = await token.balanceOf(user1.address);

                expect(finalBalance).to.equal(vestAmount);
                expect(balance2).to.be.gt(balance1);
                expect(finalBalance).to.be.gt(balance2);
            });
        });

        describe("Vesting View Functions", function () {
            it("Should return correct vesting summary", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                await token.connect(vester).vestTokens(user1.address, fbt("1000"), THIRTY_DAYS);
                await token.connect(vester).vestTokens(user1.address, fbt("500"), SEVEN_DAYS);

                const summary = await token.getVestingSummary(user1.address);
                expect(summary.totalVested).to.equal(fbt("1500"));
                expect(summary.totalReleased).to.equal(0);
                expect(summary.scheduleCount).to.equal(2);
            });

            it("Should return total vested correctly", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                await token.connect(vester).vestTokens(user1.address, fbt("1000"), THIRTY_DAYS);

                expect(await token.getTotalVested(user1.address)).to.equal(fbt("1000"));
            });

            it("Should return total released correctly", async function () {
                const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

                await token.connect(owner).setAuthorizedVester(vester.address, true);
                await token.connect(vester).vestTokens(user1.address, fbt("1000"), SEVEN_DAYS);

                await time.increase(SEVEN_DAYS + ONE_DAY);
                await token.connect(user1).claimVestedTokens();

                expect(await token.getTotalReleased(user1.address)).to.equal(fbt("1000"));
            });
        });
    });

    describe("Burning", function () {
        it("Should allow users to burn their tokens", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);

            const burnAmount = fbt("1000");
            const initialBalance = await token.balanceOf(owner.address);

            await expect(token.connect(owner).burn(burnAmount))
                .to.emit(token, "TokensBurned")
                .withArgs(owner.address, burnAmount);

            expect(await token.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
        });

        it("Should allow burnFrom with approval", async function () {
            const { token, owner, user1 } = await loadFixture(deployTokenFixture);

            // Transfer some tokens to user1
            await token.connect(owner).transfer(user1.address, fbt("1000"));

            // User1 approves owner to burn
            await token.connect(user1).approve(owner.address, fbt("500"));

            await expect(token.connect(owner).burnFrom(user1.address, fbt("500")))
                .to.emit(token, "TokensBurned")
                .withArgs(user1.address, fbt("500"));

            expect(await token.balanceOf(user1.address)).to.equal(fbt("500"));
        });

        it("Should revert burning zero amount", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);

            await expect(token.connect(owner).burn(0))
                .to.be.revertedWithCustomError(token, "InvalidAmount");
        });

        it("Should revert burnFrom with zero amount", async function () {
            const { token, owner, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).transfer(user1.address, fbt("1000"));
            await token.connect(user1).approve(owner.address, fbt("500"));

            await expect(token.connect(owner).burnFrom(user1.address, 0))
                .to.be.revertedWithCustomError(token, "InvalidAmount");
        });
    });

    describe("Staking Tracking", function () {
        it("Should allow authorized staking contract to notify stake", async function () {
            const { token, owner, stakingContract, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedStakingContract(stakingContract.address, true);

            const stakeAmount = fbt("5000");
            await expect(token.connect(stakingContract).notifyStake(user1.address, stakeAmount))
                .to.emit(token, "StakeBalanceUpdated")
                .withArgs(user1.address, stakeAmount, true);

            expect(await token.stakedBalance(user1.address)).to.equal(stakeAmount);
            expect(await token.totalStaked()).to.equal(stakeAmount);
        });

        it("Should allow authorized staking contract to notify unstake", async function () {
            const { token, owner, stakingContract, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedStakingContract(stakingContract.address, true);

            const stakeAmount = fbt("5000");
            await token.connect(stakingContract).notifyStake(user1.address, stakeAmount);

            const unstakeAmount = fbt("2000");
            await expect(token.connect(stakingContract).notifyUnstake(user1.address, unstakeAmount))
                .to.emit(token, "StakeBalanceUpdated")
                .withArgs(user1.address, fbt("3000"), false);

            expect(await token.stakedBalance(user1.address)).to.equal(fbt("3000"));
            expect(await token.totalStaked()).to.equal(fbt("3000"));
        });

        it("Should revert if non-staking contract tries to notify stake", async function () {
            const { token, user1 } = await loadFixture(deployTokenFixture);

            await expect(
                token.connect(user1).notifyStake(user1.address, fbt("1000"))
            ).to.be.revertedWithCustomError(token, "NotAuthorizedStakingContract");
        });

        it("Should revert notifyStake with zero address", async function () {
            const { token, owner, stakingContract } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedStakingContract(stakingContract.address, true);

            await expect(
                token.connect(stakingContract).notifyStake(ZERO_ADDRESS, fbt("1000"))
            ).to.be.revertedWithCustomError(token, "ZeroAddress");
        });

        it("Should revert notifyStake with zero amount", async function () {
            const { token, owner, stakingContract, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedStakingContract(stakingContract.address, true);

            await expect(
                token.connect(stakingContract).notifyStake(user1.address, 0)
            ).to.be.revertedWithCustomError(token, "InvalidAmount");
        });

        it("Should calculate governance balance correctly", async function () {
            const { token, owner, stakingContract, user1 } = await loadFixture(deployTokenFixture);

            // Transfer some tokens to user1
            await token.connect(owner).transfer(user1.address, fbt("1000"));

            // Simulate staking
            await token.connect(owner).setAuthorizedStakingContract(stakingContract.address, true);
            await token.connect(stakingContract).notifyStake(user1.address, fbt("500"));

            // Governance balance = liquid + staked
            const govBalance = await token.getGovernanceBalance(user1.address);
            expect(govBalance).to.equal(fbt("1500"));
        });

        it("Should track multiple stakers correctly", async function () {
            const { token, owner, stakingContract, user1, user2 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedStakingContract(stakingContract.address, true);

            await token.connect(stakingContract).notifyStake(user1.address, fbt("1000"));
            await token.connect(stakingContract).notifyStake(user2.address, fbt("2000"));

            expect(await token.stakedBalance(user1.address)).to.equal(fbt("1000"));
            expect(await token.stakedBalance(user2.address)).to.equal(fbt("2000"));
            expect(await token.totalStaked()).to.equal(fbt("3000"));
        });
    });

    describe("Pausable", function () {
        it("Should allow owner to pause", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);

            await token.connect(owner).pause();
            expect(await token.paused()).to.be.true;
        });

        it("Should allow owner to unpause", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);

            await token.connect(owner).pause();
            await token.connect(owner).unpause();
            expect(await token.paused()).to.be.false;
        });

        it("Should revert transfers when paused", async function () {
            const { token, owner, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).pause();

            await expect(
                token.connect(owner).transfer(user1.address, fbt("100"))
            ).to.be.revertedWithCustomError(token, "EnforcedPause");
        });

        it("Should revert minting when paused", async function () {
            const { token, owner, minter, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setMinter(minter.address, true);
            await token.connect(owner).pause();

            await expect(
                token.connect(minter).mint(user1.address, fbt("100"))
            ).to.be.revertedWithCustomError(token, "EnforcedPause");
        });

        it("Should revert vesting when paused", async function () {
            const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedVester(vester.address, true);
            await token.connect(owner).pause();

            await expect(
                token.connect(vester).vestTokens(user1.address, fbt("100"), SEVEN_DAYS)
            ).to.be.revertedWithCustomError(token, "EnforcedPause");
        });

        it("Should revert burning when paused", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);

            await token.connect(owner).pause();

            await expect(
                token.connect(owner).burn(fbt("100"))
            ).to.be.revertedWithCustomError(token, "EnforcedPause");
        });

        it("Should revert claiming when paused", async function () {
            const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedVester(vester.address, true);
            await token.connect(vester).vestTokens(user1.address, fbt("100"), SEVEN_DAYS);

            await time.increase(SEVEN_DAYS + ONE_DAY);
            await token.connect(owner).pause();

            await expect(
                token.connect(user1).claimVestedTokens()
            ).to.be.revertedWithCustomError(token, "EnforcedPause");
        });
    });

    describe("ERC20 Permit", function () {
        it("Should support EIP-2612 permit", async function () {
            const { token, owner, user1 } = await loadFixture(deployTokenFixture);

            const nonce = await token.nonces(owner.address);
            const latestBlock = await ethers.provider.getBlock('latest');
            const deadline = latestBlock.timestamp + 3600;

            // Get domain separator
            const domain = {
                name: "FundBrave Token",
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: await token.getAddress(),
            };

            const types = {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                ],
            };

            const value = fbt("1000");
            const message = {
                owner: owner.address,
                spender: user1.address,
                value: value,
                nonce: nonce,
                deadline: deadline,
            };

            const signature = await owner.signTypedData(domain, types, message);
            const { v, r, s } = ethers.Signature.from(signature);

            await token.permit(owner.address, user1.address, value, deadline, v, r, s);
            expect(await token.allowance(owner.address, user1.address)).to.equal(value);
        });
    });

    describe("Upgradeability", function () {
        it("Should be upgradeable by owner", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);

            // Deploy V2 (using same implementation for testing)
            const FundBraveTokenV2 = await ethers.getContractFactory("FundBraveToken");

            // Upgrade
            const upgraded = await upgrades.upgradeProxy(await token.getAddress(), FundBraveTokenV2);

            // Verify state is preserved
            expect(await upgraded.owner()).to.equal(owner.address);
            expect(await upgraded.name()).to.equal("FundBrave Token");
        });

        it("Should revert upgrade from non-owner", async function () {
            const { token, user1 } = await loadFixture(deployTokenFixture);

            const FundBraveTokenV2 = await ethers.getContractFactory("FundBraveToken", user1);

            await expect(
                upgrades.upgradeProxy(await token.getAddress(), FundBraveTokenV2)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });
    });

    describe("Access Control", function () {
        it("Should only allow owner to set minter", async function () {
            const { token, user1, minter } = await loadFixture(deployTokenFixture);

            await expect(
                token.connect(user1).setMinter(minter.address, true)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should only allow owner to set authorized vester", async function () {
            const { token, user1, vester } = await loadFixture(deployTokenFixture);

            await expect(
                token.connect(user1).setAuthorizedVester(vester.address, true)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should only allow owner to set authorized staking contract", async function () {
            const { token, user1, stakingContract } = await loadFixture(deployTokenFixture);

            await expect(
                token.connect(user1).setAuthorizedStakingContract(stakingContract.address, true)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should only allow owner to pause/unpause", async function () {
            const { token, user1 } = await loadFixture(deployTokenFixture);

            await expect(
                token.connect(user1).pause()
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });
    });

    describe("Gas Optimization", function () {
        it("Should use gas-efficient loops in claim functions", async function () {
            const { token, owner, vester, user1 } = await loadFixture(deployTokenFixture);

            await token.connect(owner).setAuthorizedVester(vester.address, true);

            // Create multiple vesting schedules
            for (let i = 0; i < 5; i++) {
                await token.connect(vester).vestTokens(user1.address, fbt("100"), SEVEN_DAYS);
            }

            await time.increase(SEVEN_DAYS + ONE_DAY);

            // This should work efficiently with unchecked increments
            const tx = await token.connect(user1).claimVestedTokens();
            const receipt = await tx.wait();

            // Just verify it completes successfully - gas reporting is done by hardhat
            expect(receipt.status).to.equal(1);
            expect(await token.balanceOf(user1.address)).to.equal(fbt("500"));
        });
    });
});
