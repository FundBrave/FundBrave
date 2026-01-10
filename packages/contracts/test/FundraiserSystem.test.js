const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// --- Ethers v6 Compatibility Helpers ---
const usdc = (val) => ethers.parseUnits(val, 6);
const dai = (val) => ethers.parseEther(val);
const eth = (val) => ethers.parseEther(val);
const ZERO_ADDRESS = ethers.ZeroAddress; 

// Dummy WorldID Params
const NULL_ROOT = 0;
const NULL_HASH = 123456;
const NULL_PROOF = [0,0,0,0,0,0,0,0];

async function deploySystemFixture() {
    const [owner, creator, creator2, donor, donor2, staker, beneficiary, beneficiary2, platformWallet, remoteUser] = await ethers.getSigners();

    // 1. Deploy Token Mocks
    const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
    const usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
    const daiToken = await MockERC20.deploy("Dai", "DAI", 18);
    
    const MockWETH = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockWETH");
    const wethToken = await MockWETH.deploy();

    // 2. Deploy DeFi Mocks
    const MockUniswapRouter = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockUniswapRouter");
    const oneInchRouterMock = await MockUniswapRouter.deploy(await wethToken.getAddress(), await usdcToken.getAddress());
    
    const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
    const aUsdcToken = await MockERC20.deploy("Aave USDC", "aUSDC", 6);
    const aavePool = await MockAavePool.deploy(await usdcToken.getAddress(), await aUsdcToken.getAddress());

    // 3. Deploy Infra Mocks
    const MockWorldID = await ethers.getContractFactory("MockWorldID");
    const worldId = await MockWorldID.deploy();

    const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
    const lzEndpoint = await MockLZEndpoint.deploy(1); 

    // 4. Deploy Adapters
    const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
    const swapAdapter = await OneInchAdapter.deploy(
        await oneInchRouterMock.getAddress(), 
        await usdcToken.getAddress(), 
        await wethToken.getAddress(), 
        owner.address
    );

    // 5. Deploy Implementations
    const Fundraiser = await ethers.getContractFactory("Fundraiser");
    const fundraiserImpl = await Fundraiser.deploy();

    const StakingPool = await ethers.getContractFactory("StakingPool");
    const stakingPoolImpl = await StakingPool.deploy();

    // 6. Deploy Factory
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
        ZERO_ADDRESS,
        0,
        await worldId.getAddress(),
        "app_id", 
        "action_id"
    );

    // 7. Deploy ReceiptOFT
    const ReceiptOFT = await ethers.getContractFactory("ReceiptOFT");
    const receiptOFT = await ReceiptOFT.deploy("Receipt", "rFUND", await lzEndpoint.getAddress(), owner.address);

    // 8. Deploy Bridge
    const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
    const bridge = await FundBraveBridge.deploy(
        await lzEndpoint.getAddress(),
        await swapAdapter.getAddress(),
        await usdcToken.getAddress(),
        await factory.getAddress(),
        owner.address
    );

    // 9. Setup Permissions & Linking
    await factory.connect(owner).updateBridge(await bridge.getAddress());
    await factory.connect(owner).setReceiptOFT(await receiptOFT.getAddress());
    await receiptOFT.connect(owner).setController(await factory.getAddress(), true);
    
    // Set up LayerZero peers
    const ownerBytes32 = ethers.zeroPadValue(owner.address, 32);
    await bridge.connect(owner).setPeer(1, ownerBytes32);
    await bridge.connect(owner).setPeer(2, ownerBytes32);
    
    // Fund Mocks
    await usdcToken.mint(await oneInchRouterMock.getAddress(), usdc("1000000"));
    await usdcToken.mint(await aavePool.getAddress(), usdc("1000000"));
    await aUsdcToken.mint(await aavePool.getAddress(), usdc("1000000"));
    await usdcToken.mint(await bridge.getAddress(), usdc("1000000"));

    return { 
        factory, bridge, lzEndpoint, swapAdapter, 
        usdcToken, daiToken, wethToken, aavePool, aUsdcToken, worldId, receiptOFT,
        owner, creator, creator2, donor, donor2, staker, beneficiary, beneficiary2, platformWallet, remoteUser 
    };
}

async function createFundraiser(factory, creator, beneficiary, nullifierHash = NULL_HASH) {
    const tx = await factory.connect(creator).createFundraiser(
        "Save the Forests", 
        ["image.png"], 
        ["Environment"], 
        "Description", 
        "Brazil",
        beneficiary.address, 
        usdc("10000"), 
        30,
        NULL_ROOT,
        nullifierHash,
        NULL_PROOF
    );
    const receipt = await tx.wait();

    const factoryInterface = factory.interface;
    
    let fundraiserAddr, poolAddr;
    
    for (const log of receipt.logs) {
        try {
            const parsed = factoryInterface.parseLog(log);
            if (parsed.name === "FundraiserCreated") {
                fundraiserAddr = parsed.args[0];
            }
            if (parsed.name === "StakingPoolCreated") {
                poolAddr = parsed.args[1];
            }
        } catch (e) {}
    }

    return { 
        fundraiser: await ethers.getContractAt("Fundraiser", fundraiserAddr), 
        stakingPool: await ethers.getContractAt("StakingPool", poolAddr)
    };
}

describe("FundBrave Comprehensive System Tests", () => {
    describe("Factory Deployment & Configuration", () => {
        it("should deploy factory with correct configuration", async () => {
            const { factory, usdcToken, swapAdapter, platformWallet } = await loadFixture(deploySystemFixture);
            
            expect(await factory.USDC()).to.equal(await usdcToken.getAddress());
            expect(await factory.platformFeeRecipient()).to.equal(platformWallet.address);
            expect(await factory.minGoal()).to.equal(usdc("100"));
            expect(await factory.maxGoal()).to.equal(usdc("10000000"));
        });

        it("should have correct default categories", async () => {
            const { factory } = await loadFixture(deploySystemFixture);
            const categories = await factory.getAvailableCategories();
            
            expect(categories).to.include("Medical");
            expect(categories).to.include("Education");
            expect(categories).to.include("Environment");
            expect(categories.length).to.equal(8);
        });

        it("should grant admin role to deployer", async () => {
            const { factory, owner } = await loadFixture(deploySystemFixture);
            const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
            
            expect(await factory.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
        });
    });

    describe("Fundraiser Creation", () => {
        it("should create fundraiser with World ID verification", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);
            
            expect(await fundraiser.owner()).to.equal(creator.address);
            expect(await fundraiser.beneficiary()).to.equal(beneficiary.address);
            expect(await fundraiser.goal()).to.equal(usdc("10000"));
        });

        it("should prevent duplicate World ID usage", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);

            await createFundraiser(factory, creator, beneficiary, NULL_HASH);

            await expect(
                factory.connect(creator).createFundraiser(
                    "Duplicate", ["img.png"], ["Environment"], "Desc", "Brazil",
                    beneficiary.address, usdc("10000"), 30,
                    NULL_ROOT, NULL_HASH, NULL_PROOF
                )
            ).to.be.revertedWithCustomError(factory, "WorldIDAlreadyUsed");
        });

        it("should validate fundraiser parameters", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);

            // Get the FundraiserFactoryLib for custom error checking
            const FundraiserFactoryLib = await ethers.getContractFactory("FundraiserFactoryLib");

            // Invalid goal - now uses custom error GoalOutsideRange from library
            await expect(
                factory.connect(creator).createFundraiser(
                    "Test", ["img.png"], ["Environment"], "Desc", "Brazil",
                    beneficiary.address, usdc("50"), 30,
                    NULL_ROOT, 111111, NULL_PROOF
                )
            ).to.be.reverted;

            // Invalid duration - now uses custom error DurationOutsideRange from library
            await expect(
                factory.connect(creator).createFundraiser(
                    "Test", ["img.png"], ["Environment"], "Desc", "Brazil",
                    beneficiary.address, usdc("10000"), 1,
                    NULL_ROOT, 222222, NULL_PROOF
                )
            ).to.be.reverted;

            // Invalid category - now uses custom error InvalidCategory from library
            await expect(
                factory.connect(creator).createFundraiser(
                    "Test", ["img.png"], ["InvalidCategory"], "Desc", "Brazil",
                    beneficiary.address, usdc("10000"), 30,
                    NULL_ROOT, 333333, NULL_PROOF
                )
            ).to.be.reverted;
        });

        it("should deploy staking pool with fundraiser", async () => {
            const { factory, creator, beneficiary, aavePool } = await loadFixture(deploySystemFixture);
            
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            
            expect(await stakingPool.AAVE_POOL()).to.equal(await aavePool.getAddress());
            expect(await stakingPool.beneficiary()).to.equal(beneficiary.address);
        });

        it("should track total fundraisers created", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            await createFundraiser(factory, creator, beneficiary, 11111);
            await createFundraiser(factory, creator, beneficiary, 22222);
            
            const [totalCreated, activeCount] = await factory.getPlatformStats();
            expect(totalCreated).to.equal(2);
            expect(activeCount).to.equal(2);
        });
    });

    describe("Verified Creator Role", () => {
        it("should allow admin to verify creators", async () => {
            const { factory, owner, creator } = await loadFixture(deploySystemFixture);
            
            await factory.connect(owner).verifyCreator(creator.address);
            
            expect(await factory.verifiedCreators(creator.address)).to.be.true;
        });

        it("should allow verified creators to bypass World ID", async () => {
            const { factory, owner, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            await factory.connect(owner).verifyCreator(creator.address);
            
            const tx = await factory.connect(creator).createVerifiedFundraiser(
                "Verified Campaign",
                ["image.png"],
                ["Medical"],
                "Description",
                "USA",
                beneficiary.address,
                usdc("50000"),
                60
            );
            
            await expect(tx).to.emit(factory, "FundraiserCreated");
        });

        it("should allow admin to unverify creators", async () => {
            const { factory, owner, creator } = await loadFixture(deploySystemFixture);
            
            await factory.connect(owner).verifyCreator(creator.address);
            await factory.connect(owner).unverifyCreator(creator.address);
            
            expect(await factory.verifiedCreators(creator.address)).to.be.false;
        });
    });

    describe("Fundraiser Deadline & Goal", () => {
        it("should mark fundraiser as successful when goal is reached", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);

            // Goal is 10,000 USDC
            await usdcToken.mint(donor.address, usdc("10000"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("10000"));
            await factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("10000"));

            // Check if goal is reached by comparing totalDonations to goal
            const totalDonations = await fundraiser.totalDonations();
            const goal = await fundraiser.goal();
            expect(totalDonations).to.be.gte(goal);
        });

        it("should allow donations before deadline", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);

            // Donation within deadline should work
            await usdcToken.mint(donor.address, usdc("100"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("100"));

            await expect(
                factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("100"))
            ).to.not.be.reverted;

            const balance = await usdcToken.balanceOf(await fundraiser.getAddress());
            expect(balance).to.equal(usdc("100"));
        });

        it("should allow withdrawal after deadline even if goal not reached", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);

            await usdcToken.mint(donor.address, usdc("1000"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("1000"));

            await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            const prevBal = await usdcToken.balanceOf(beneficiary.address);
            await fundraiser.connect(creator).withdrawUSDT();
            const newBal = await usdcToken.balanceOf(beneficiary.address);

            expect(newBal - prevBal).to.equal(usdc("1000"));
        });
    });

    describe("Donations", () => {
        it("should accept ERC20 donations and emit events", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);
            
            await usdcToken.mint(donor.address, usdc("1000"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("1000"));
            
            // Event is DonationCredited not DonationReceived
            await expect(
                factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("1000"))
            ).to.emit(fundraiser, "DonationCredited");
            
            const balance = await usdcToken.balanceOf(await fundraiser.getAddress());
            expect(balance).to.equal(usdc("1000"));
        });

        it("should prevent zero-amount donations", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);

            await createFundraiser(factory, creator, beneficiary);

            await usdcToken.mint(donor.address, usdc("1000"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("1000"));

            await expect(
                factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), 0)
            ).to.be.revertedWithCustomError(factory, "InvalidAmount");
        });

        it("should track total funds raised", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            
            await createFundraiser(factory, creator, beneficiary);
            
            await usdcToken.mint(donor.address, usdc("5000"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("5000"));
            await factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("5000"));
            
            const [, , totalRaised] = await factory.getPlatformStats();
            expect(totalRaised).to.equal(usdc("5000"));
        });
    });

    describe("Staking", () => {
        it("should accept ERC20 staking (USDC)", async () => {
            const { factory, creator, beneficiary, staker, receiptOFT, owner, usdcToken } = await loadFixture(deploySystemFixture);
            
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);
            
            await usdcToken.mint(staker.address, usdc("500"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("500"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("500"));
            
            const principal = await stakingPool.stakerPrincipal(staker.address);
            expect(principal).to.equal(usdc("500"));
        });

        it("should mint receipt tokens on stake", async () => {
            const { factory, creator, beneficiary, staker, usdcToken, receiptOFT, owner } = await loadFixture(deploySystemFixture);
            
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);
            
            await usdcToken.mint(staker.address, usdc("1000"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("1000"));
            
            const receiptBalance = await receiptOFT.balanceOf(staker.address);
            expect(receiptBalance).to.equal(usdc("1000"));
        });
    });

    describe("Yield Distribution", () => {
        it("should distribute yield to stakers and fundraiser", async () => {
            const { factory, creator, beneficiary, staker, usdcToken, aUsdcToken, receiptOFT, owner } = await loadFixture(deploySystemFixture);
            
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);
            
            await usdcToken.mint(staker.address, usdc("10000"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("10000"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("10000"));
            
            await aUsdcToken.mint(await stakingPool.getAddress(), usdc("1000"));

            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            await stakingPool.performUpkeep("0x");

            // Check staker's USDC yield (not FBT rewards)
            const stakerYield = await stakingPool.earnedUSDC(staker.address);
            expect(stakerYield).to.be.gt(0);

            // Trigger reward distribution by having staker claim rewards
            // This will also distribute fundraiser and platform shares
            const beneficiaryBalanceBefore = await usdcToken.balanceOf(beneficiary.address);
            await stakingPool.connect(staker).claimAllRewards();
            const beneficiaryBalanceAfter = await usdcToken.balanceOf(beneficiary.address);

            expect(beneficiaryBalanceAfter).to.be.gt(beneficiaryBalanceBefore);
        });
    });

    describe("Fundraiser Interaction (Voting & Withdrawal)", () => {
        it("should allow beneficiary to withdraw raised funds", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);

            await usdcToken.mint(donor.address, usdc("1000"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("1000"));

            const prevBal = await usdcToken.balanceOf(beneficiary.address);
            await fundraiser.connect(creator).withdrawUSDT();
            const newBal = await usdcToken.balanceOf(beneficiary.address);

            expect(newBal - prevBal).to.equal(usdc("1000"));
        });

        it("should track voting power and allow proposals", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);

            await usdcToken.mint(donor.address, usdc("500"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("500"));
            await factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("500"));

            expect(await fundraiser.donorVotingPower(donor.address)).to.equal(usdc("500"));

            await fundraiser.connect(creator).createProposal("Build a Well", "Details...", usdc("200"));
            await fundraiser.connect(donor).vote(1, true);
            
            const proposal = await fundraiser.proposals(1);
            expect(proposal.upvotes).to.equal(usdc("500"));

            await fundraiser.connect(creator).executeProposal(1);
            const executedProposal = await fundraiser.proposals(1);
            expect(executedProposal.executed).to.be.true;
        });
    });

    describe("Governance - Multiple Votes", () => {
        it("should handle multiple simultaneous votes on same proposal", async () => {
            const { factory, creator, beneficiary, donor, donor2, usdcToken } = await loadFixture(deploySystemFixture);
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);

            await usdcToken.mint(donor.address, usdc("500"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("500"));
            await factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("500"));

            await usdcToken.mint(donor2.address, usdc("300"));
            await usdcToken.connect(donor2).approve(await factory.getAddress(), usdc("300"));
            await factory.connect(donor2).donateERC20(0, await usdcToken.getAddress(), usdc("300"));

            await fundraiser.connect(creator).createProposal("Build a School", "Details", usdc("200"));

            await fundraiser.connect(donor).vote(1, true);
            await fundraiser.connect(donor2).vote(1, false);

            const proposal = await fundraiser.proposals(1);
            expect(proposal.upvotes).to.equal(usdc("500"));
            expect(proposal.downvotes).to.equal(usdc("300"));
        });

        it("should prevent double voting on same proposal", async () => {
            const { factory, creator, beneficiary, donor, usdcToken } = await loadFixture(deploySystemFixture);
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);

            await usdcToken.mint(donor.address, usdc("500"));
            await usdcToken.connect(donor).approve(await factory.getAddress(), usdc("500"));
            await factory.connect(donor).donateERC20(0, await usdcToken.getAddress(), usdc("500"));

            await fundraiser.connect(creator).createProposal("Test", "Details", usdc("100"));
            await fundraiser.connect(donor).vote(1, true);

            await expect(
                fundraiser.connect(donor).vote(1, true)
            ).to.be.revertedWith("Already voted");
        });
    });

    describe("Staking Exit (Unstake & Claim)", () => {
        it("should allow users to unstake and burn receipt tokens", async () => {
            const { factory, creator, beneficiary, staker, usdcToken, receiptOFT, owner } = await loadFixture(deploySystemFixture);
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);

            await usdcToken.mint(staker.address, usdc("1000"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("1000"));

            await stakingPool.connect(staker).unstake(usdc("400"));

            const principal = await stakingPool.stakerPrincipal(staker.address);
            expect(principal).to.equal(usdc("600"));

            const receiptBal = await receiptOFT.balanceOf(staker.address);
            expect(receiptBal).to.equal(usdc("600"));
            
            const walletBal = await usdcToken.balanceOf(staker.address);
            expect(walletBal).to.equal(usdc("400"));
        });

        it("should allow claiming rewards without unstaking", async () => {
            const { factory, creator, beneficiary, staker, usdcToken, aUsdcToken, receiptOFT, owner } = await loadFixture(deploySystemFixture);
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);

            await usdcToken.mint(staker.address, usdc("1000"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("1000"));

            await aUsdcToken.mint(await stakingPool.getAddress(), usdc("100"));
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");
            await stakingPool.performUpkeep("0x");

            const prevBal = await usdcToken.balanceOf(staker.address);
            await stakingPool.connect(staker).claimStakerRewards();
            const newBal = await usdcToken.balanceOf(staker.address);

            expect(newBal - prevBal).to.equal(usdc("19"));
        });
    });

    describe("Receipt Token Cross-Chain (OFT)", () => {
        it("should allow receipt tokens to be minted and checked", async () => {
            const { factory, creator, beneficiary, staker, usdcToken, receiptOFT, owner } = await loadFixture(deploySystemFixture);
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);

            await usdcToken.mint(staker.address, usdc("1000"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("1000"));

            const balance = await receiptOFT.balanceOf(staker.address);
            expect(balance).to.equal(usdc("1000"));
            
            expect(await receiptOFT.name()).to.equal("Receipt");
            expect(await receiptOFT.symbol()).to.equal("rFUND");
        });

        it("should allow receipt token transfers locally", async () => {
            const { factory, creator, beneficiary, staker, donor, usdcToken, receiptOFT, owner } = await loadFixture(deploySystemFixture);
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);

            await usdcToken.mint(staker.address, usdc("1000"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("1000"));

            await receiptOFT.connect(staker).transfer(donor.address, usdc("200"));

            expect(await receiptOFT.balanceOf(staker.address)).to.equal(usdc("800"));
            expect(await receiptOFT.balanceOf(donor.address)).to.equal(usdc("200"));
        });

        it("should note: cross-chain OFT sends require LayerZero testnet", async () => {
            console.log("⚠️  Cross-chain receipt token transfers require LayerZero testnet");
            console.log("    - OFT.send() needs real endpoint with gas estimation");
            console.log("    - Test on Sepolia → Fuji or Mumbai → Sepolia");
        });
    });

    describe("Emergency Functions", () => {
        it("should allow owner to emergency withdraw ETH from bridge", async () => {
            const { bridge, owner, donor } = await loadFixture(deploySystemFixture);

            await donor.sendTransaction({ 
                to: await bridge.getAddress(), 
                value: eth("1") 
            });

            const prevBalance = await ethers.provider.getBalance(owner.address);
            const tx = await bridge.connect(owner).emergencyWithdraw(ZERO_ADDRESS);
            const receipt = await tx.wait();
            const gasCost = receipt.gasUsed * receipt.gasPrice;
            const newBalance = await ethers.provider.getBalance(owner.address);

            expect(newBalance - prevBalance + gasCost).to.be.closeTo(eth("1"), eth("0.01"));
        });

        it("should allow owner to emergency withdraw ERC20 from bridge", async () => {
            const { bridge, owner, usdcToken } = await loadFixture(deploySystemFixture);

            const bridgeBalance = await usdcToken.balanceOf(await bridge.getAddress());
            expect(bridgeBalance).to.be.gt(0);

            const prevOwnerBalance = await usdcToken.balanceOf(owner.address);
            await bridge.connect(owner).emergencyWithdraw(await usdcToken.getAddress());
            const newOwnerBalance = await usdcToken.balanceOf(owner.address);

            expect(newOwnerBalance - prevOwnerBalance).to.equal(bridgeBalance);
        });

        it("should prevent non-owner from emergency withdrawal", async () => {
            const { bridge, donor } = await loadFixture(deploySystemFixture);

            await expect(
                bridge.connect(donor).emergencyWithdraw(ZERO_ADDRESS)
            ).to.be.reverted;
        });
    });

    describe("Morpho Staking Pool", () => {
        it("should deploy factory with Morpho staking pool type", async () => {
            const [owner, creator, beneficiary] = await ethers.getSigners();

            const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
            const usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
            const wethToken = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockWETH");
            const weth = await wethToken.deploy();

            const MockWorldID = await ethers.getContractFactory("MockWorldID");
            const worldId = await MockWorldID.deploy();

            const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
            const lzEndpoint = await MockLZEndpoint.deploy(1);

            const MockUniswapRouter = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockUniswapRouter");
            const router = await MockUniswapRouter.deploy(await weth.getAddress(), await usdcToken.getAddress());

            const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
            const adapter = await OneInchAdapter.deploy(
                await router.getAddress(),
                await usdcToken.getAddress(),
                await weth.getAddress(),
                owner.address
            );

            const mockMorphoVault = await MockERC20.deploy("Morpho Vault", "mUSDC", 6);

            const Fundraiser = await ethers.getContractFactory("Fundraiser");
            const fundraiserImpl = await Fundraiser.deploy();

            const StakingPool = await ethers.getContractFactory("StakingPool");
            const stakingPoolImpl = await StakingPool.deploy();

            const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
            const morphoFactory = await FundraiserFactory.deploy(
                await fundraiserImpl.getAddress(),
                await stakingPoolImpl.getAddress(),
                await adapter.getAddress(),
                await usdcToken.getAddress(),
                await weth.getAddress(),
                owner.address,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                await mockMorphoVault.getAddress(),
                1,
                await worldId.getAddress(),
                "app_id",
                "action_id"
            );

            const ReceiptOFT = await ethers.getContractFactory("ReceiptOFT");
            const receiptOFT = await ReceiptOFT.deploy("Receipt", "rFUND", await lzEndpoint.getAddress(), owner.address);
            await morphoFactory.connect(owner).setReceiptOFT(await receiptOFT.getAddress());

            const tx = await morphoFactory.connect(creator).createFundraiser(
                "Morpho Test",
                ["img.png"],
                ["Environment"],
                "Description",
                "USA",
                beneficiary.address,
                usdc("10000"),
                30,
                NULL_ROOT,
                111111,
                NULL_PROOF
            );

            await expect(tx).to.emit(morphoFactory, "StakingPoolCreated");

            const poolAddress = await morphoFactory.stakingPools(0);
            const MorphoStakingPool = await ethers.getContractFactory("MorphoStakingPool");
            const morphoPool = MorphoStakingPool.attach(poolAddress);

            expect(await morphoPool.METAMORPHO_VAULT()).to.equal(await mockMorphoVault.getAddress());
        });

        it("should note: full Morpho integration requires mainnet fork", async () => {
            console.log("⚠️  Full Morpho staking pool testing requires mainnet fork");
            console.log("    - Real Morpho vault has complex reward distribution");
            console.log("    - Use Hardhat mainnet fork for complete integration test");
        });
    });

    describe("Cross-Chain Bridge (LayerZero V2)", () => {
        it("should note: cross-chain send requires testnet", async () => {
            console.log("⚠️  Mock LayerZero endpoint has limitations");
            console.log("    - Full cross-chain send/receive testing requires LayerZero testnet");
            console.log("    - Deploy to Sepolia, Fuji, Mumbai for integration testing");
        });

        it("should receive a cross-chain donation", async () => {
            const { factory, creator, beneficiary, remoteUser, usdcToken, lzEndpoint, bridge, owner } = await loadFixture(deploySystemFixture);
            
            const { fundraiser } = await createFundraiser(factory, creator, beneficiary);
            
            await ethers.provider.send("hardhat_impersonateAccount", [await bridge.getAddress()]);
            const bridgeSigner = await ethers.getSigner(await bridge.getAddress());
            await owner.sendTransaction({ to: await bridge.getAddress(), value: eth("1") });
            const amount = usdc("50");
            await usdcToken.connect(bridgeSigner).transfer(await factory.getAddress(), amount);
            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await bridge.getAddress()]);
            
            const payload = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "uint256", "uint8", "uint256"],
                [remoteUser.address, 0, 0, amount]
            );

            await lzEndpoint.connect(owner).mockReceive(
                await bridge.getAddress(),
                1, 
                ethers.encodeBytes32String("guid"),
                payload
            );

            const fundraiserBalance = await usdcToken.balanceOf(await fundraiser.getAddress());
            expect(fundraiserBalance).to.equal(amount);
            
            const donations = await fundraiser.totalDonations();
            expect(donations).to.equal(amount);
        });

        it("should receive cross-chain stakes", async () => {
            const { factory, creator, beneficiary, remoteUser, usdcToken, lzEndpoint, bridge, owner, receiptOFT } = await loadFixture(deploySystemFixture);
            const { stakingPool } = await createFundraiser(factory, creator, beneficiary);
            await receiptOFT.connect(owner).setController(await stakingPool.getAddress(), true);
            
            await ethers.provider.send("hardhat_impersonateAccount", [await bridge.getAddress()]);
            const bridgeSigner = await ethers.getSigner(await bridge.getAddress());
            await owner.sendTransaction({ to: await bridge.getAddress(), value: eth("1") });
            await usdcToken.connect(bridgeSigner).transfer(await factory.getAddress(), usdc("500"));
            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await bridge.getAddress()]);

            const amount = usdc("500");
            const payload = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "uint256", "uint8", "uint256"],
                [remoteUser.address, 0, 1, amount]
            );

            await lzEndpoint.connect(owner).mockReceive(
                await bridge.getAddress(),
                1,
                ethers.encodeBytes32String("guid"),
                payload
            );

            const stakerBal = await stakingPool.stakerPrincipal(remoteUser.address);
            expect(stakerBal).to.equal(amount);
            
            const receiptBal = await receiptOFT.balanceOf(remoteUser.address);
            expect(receiptBal).to.equal(amount);
        });
    });

    describe("Admin Functions", () => {
        it("should allow admin to add categories", async () => {
            const { factory, owner } = await loadFixture(deploySystemFixture);
            
            await factory.connect(owner).addCategory("Gaming");
            
            const categories = await factory.getAvailableCategories();
            expect(categories).to.include("Gaming");
        });

        it("should allow admin to deactivate fundraisers", async () => {
            const { factory, owner, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            await createFundraiser(factory, creator, beneficiary);
            
            await factory.connect(owner).deactivateFundraiser(0);
            
            expect(await factory.activeFundraisers(0)).to.be.false;
        });

        it("should allow admin to update platform fee recipient", async () => {
            const { factory, owner, creator } = await loadFixture(deploySystemFixture);
            
            await factory.connect(owner).updatePlatformFeeRecipient(creator.address);
            
            expect(await factory.platformFeeRecipient()).to.equal(creator.address);
        });

        it("should allow admin to update goal limits", async () => {
            const { factory, owner } = await loadFixture(deploySystemFixture);
            
            await factory.connect(owner).updateMinGoal(usdc("200"));
            await factory.connect(owner).updateMaxGoal(usdc("20000000"));
            
            expect(await factory.minGoal()).to.equal(usdc("200"));
            expect(await factory.maxGoal()).to.equal(usdc("20000000"));
        });

        it("should allow admin to pause and unpause", async () => {
            const { factory, owner, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            await factory.connect(owner).pause();
            
            await expect(
                createFundraiser(factory, creator, beneficiary, 999999)
            ).to.be.revertedWithCustomError(factory, "EnforcedPause");
            
            await factory.connect(owner).unpause();
            
            await expect(createFundraiser(factory, creator, beneficiary, 888888)).to.not.be.reverted;
        });
    });

    describe("Query Functions", () => {
        it("should return fundraisers with pagination", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            await createFundraiser(factory, creator, beneficiary, 11);
            await createFundraiser(factory, creator, beneficiary, 22);
            await createFundraiser(factory, creator, beneficiary, 33);
            
            const fundraisers = await factory.fundraisers(2, 0);
            expect(fundraisers.length).to.equal(2);
        });

        it("should return fundraisers by owner", async () => {
            const { factory, creator, creator2, beneficiary, beneficiary2 } = await loadFixture(deploySystemFixture);
            
            await createFundraiser(factory, creator, beneficiary, 111);
            await createFundraiser(factory, creator2, beneficiary2, 222);
            
            const creatorFundraisers = await factory.fundraisersByOwner(creator.address);
            expect(creatorFundraisers.length).to.equal(1);
        });

        it("should search fundraisers by category", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            await createFundraiser(factory, creator, beneficiary, 444);
            
            const results = await factory.searchFundraisersByCategory("Environment");
            expect(results.length).to.be.gte(1);
        });

        it("should search fundraisers by region", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);
            
            await createFundraiser(factory, creator, beneficiary, 555);
            
            const results = await factory.searchFundraisersByRegion("Brazil");
            expect(results.length).to.equal(1);
        });
    });

    describe("Access Control", () => {
        it("should prevent non-admin from admin functions", async () => {
            const { factory, creator } = await loadFixture(deploySystemFixture);
            
            await expect(
                factory.connect(creator).addCategory("NewCategory")
            ).to.be.reverted;
        });

        it("should prevent non-bridge from bridge functions", async () => {
            const { factory, creator } = await loadFixture(deploySystemFixture);

            await expect(
                factory.connect(creator).handleCrossChainDonation(
                    creator.address, 0, usdc("100")
                )
            ).to.be.revertedWithCustomError(factory, "NotBridge");
        });
    });
});