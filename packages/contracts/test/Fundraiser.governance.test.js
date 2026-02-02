const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// --- Ethers v6 Compatibility Helpers ---
const usdc = (val) => ethers.parseUnits(val, 6);
const ZERO_ADDRESS = ethers.ZeroAddress;

/**
 * @title Fundraiser Governance Tests
 * @notice Comprehensive test suite for governance features (proposals, voting, execution)
 * @dev Tests voting power, proposal lifecycle, and circuit breaker
 */
describe("Fundraiser - Governance & Proposals", function () {

    // --- Fixture ---
    async function deployFundraiserFixture() {
        const [owner, creator, beneficiary, donor1, donor2, donor3, donor4, platformWallet] =
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
                "Medical Fund for Children",
                ["https://example.com/child1.jpg", "https://example.com/child2.jpg"],
                ["Medical", "Community"],
                "Providing medical care to underserved children",
                "Nigeria",
                beneficiary.address,
                creator.address,
                usdc("50000"), // $50,000 goal
                Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60, // 60 days from now
                await usdcToken.getAddress(),
                platformWallet.address,
                owner.address // factory address for testing
            ],
            {
                initializer: "initialize",
                kind: "uups"
            }
        );
        await fundraiser.waitForDeployment();

        // Mint USDC to donors
        await usdcToken.mint(donor1.address, usdc("100000"));
        await usdcToken.mint(donor2.address, usdc("100000"));
        await usdcToken.mint(donor3.address, usdc("100000"));
        await usdcToken.mint(donor4.address, usdc("100000"));

        return {
            fundraiser,
            usdcToken,
            owner,
            creator,
            beneficiary,
            donor1,
            donor2,
            donor3,
            donor4,
            platformWallet
        };
    }

    async function makeDonation(fundraiser, usdcToken, donor, amount) {
        await usdcToken.mint(await fundraiser.getAddress(), amount);
        // Call creditDonation as factory (owner in our fixture)
        const ownerSigner = await ethers.provider.getSigner(await fundraiser.owner());
        await fundraiser.connect(ownerSigner).creditDonation(
            donor.address,
            amount,
            "test-local"
        );
    }

    // ==================== VOTING POWER ====================

    describe("Voting Power", function () {
        it("should grant voting power equal to donation amount", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const donationAmount = usdc("5000");
            await makeDonation(fundraiser, usdcToken, donor1, donationAmount);

            expect(await fundraiser.donorVotingPower(donor1.address)).to.equal(donationAmount);
        });

        it("should accumulate voting power from multiple donations", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const amount1 = usdc("3000");
            const amount2 = usdc("2000");
            const amount3 = usdc("1500");

            await makeDonation(fundraiser, usdcToken, donor1, amount1);
            await makeDonation(fundraiser, usdcToken, donor1, amount2);
            await makeDonation(fundraiser, usdcToken, donor1, amount3);

            expect(await fundraiser.donorVotingPower(donor1.address)).to.equal(
                amount1 + amount2 + amount3
            );
        });

        it("should track voting power for multiple donors independently", async function () {
            const { fundraiser, usdcToken, owner, donor1, donor2, donor3 } =
                await loadFixture(deployFundraiserFixture);

            const amount1 = usdc("10000");
            const amount2 = usdc("5000");
            const amount3 = usdc("7500");

            await makeDonation(fundraiser, usdcToken, donor1, amount1);
            await makeDonation(fundraiser, usdcToken, donor2, amount2);
            await makeDonation(fundraiser, usdcToken, donor3, amount3);

            expect(await fundraiser.donorVotingPower(donor1.address)).to.equal(amount1);
            expect(await fundraiser.donorVotingPower(donor2.address)).to.equal(amount2);
            expect(await fundraiser.donorVotingPower(donor3.address)).to.equal(amount3);
        });

        it("should have zero voting power for non-donors", async function () {
            const { fundraiser, donor4 } = await loadFixture(deployFundraiserFixture);

            expect(await fundraiser.donorVotingPower(donor4.address)).to.equal(0);
        });
    });

    // ==================== PROPOSAL CREATION ====================

    describe("Proposal Creation", function () {
        it("should allow creator to create proposals", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            await expect(
                fundraiser.connect(creator).createProposal(
                    "Purchase Medical Equipment",
                    "Buy ultrasound machine and sterilizers",
                    usdc("20000")
                )
            ).to.emit(fundraiser, "ProposalCreated")
             .withArgs(1, "Purchase Medical Equipment", usdc("20000"));
        });

        it("should increment proposal count", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            expect(await fundraiser.proposalCount()).to.equal(0);

            await fundraiser.connect(creator).createProposal(
                "Proposal 1",
                "Description 1",
                usdc("10000")
            );
            expect(await fundraiser.proposalCount()).to.equal(1);

            await fundraiser.connect(creator).createProposal(
                "Proposal 2",
                "Description 2",
                usdc("15000")
            );
            expect(await fundraiser.proposalCount()).to.equal(2);
        });

        it("should store proposal details correctly", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            const title = "Build New Wing";
            const description = "Expand hospital with pediatric wing";
            const requiredVotes = usdc("25000");

            await fundraiser.connect(creator).createProposal(title, description, requiredVotes);

            const proposal = await fundraiser.proposals(1);
            expect(proposal.id).to.equal(1);
            expect(proposal.title).to.equal(title);
            expect(proposal.description).to.equal(description);
            expect(proposal.requiredVotes).to.equal(requiredVotes);
            expect(proposal.upvotes).to.equal(0);
            expect(proposal.downvotes).to.equal(0);
            expect(proposal.executed).to.be.false;
            expect(proposal.exists).to.be.true;
        });

        it("should revert if non-owner creates proposal", async function () {
            const { fundraiser, donor1 } = await loadFixture(deployFundraiserFixture);

            await expect(
                fundraiser.connect(donor1).createProposal(
                    "Unauthorized Proposal",
                    "Should fail",
                    usdc("1000")
                )
            ).to.be.revertedWithCustomError(fundraiser, "OwnableUnauthorizedAccount");
        });

        it("should allow creating multiple proposals", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            await fundraiser.connect(creator).createProposal("Prop 1", "Desc 1", usdc("5000"));
            await fundraiser.connect(creator).createProposal("Prop 2", "Desc 2", usdc("10000"));
            await fundraiser.connect(creator).createProposal("Prop 3", "Desc 3", usdc("7500"));

            expect(await fundraiser.proposalCount()).to.equal(3);

            const prop1 = await fundraiser.proposals(1);
            const prop2 = await fundraiser.proposals(2);
            const prop3 = await fundraiser.proposals(3);

            expect(prop1.title).to.equal("Prop 1");
            expect(prop2.title).to.equal("Prop 2");
            expect(prop3.title).to.equal("Prop 3");
        });
    });

    // ==================== VOTING ====================

    describe("Voting", function () {
        it("should allow donors to upvote proposals", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const donationAmount = usdc("10000");
            await makeDonation(fundraiser, usdcToken, donor1, donationAmount);

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("5000")
            );

            await expect(fundraiser.connect(donor1).vote(1, true))
                .to.emit(fundraiser, "Voted")
                .withArgs(1, donor1.address, true);

            const proposal = await fundraiser.proposals(1);
            expect(proposal.upvotes).to.equal(donationAmount);
        });

        it("should allow donors to downvote proposals", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            const donationAmount = usdc("8000");
            await makeDonation(fundraiser, usdcToken, donor1, donationAmount);

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("5000")
            );

            await fundraiser.connect(donor1).vote(1, false);

            const proposal = await fundraiser.proposals(1);
            expect(proposal.downvotes).to.equal(donationAmount);
            expect(proposal.upvotes).to.equal(0);
        });

        it("should use voting power for vote weight", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("15000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("25000"));

            await fundraiser.connect(creator).createProposal(
                "Weighted Vote Test",
                "Description",
                usdc("10000")
            );

            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(donor2).vote(1, true);

            const proposal = await fundraiser.proposals(1);
            expect(proposal.upvotes).to.equal(usdc("40000")); // 15000 + 25000
        });

        it("should revert if non-donor tries to vote", async function () {
            const { fundraiser, creator, donor4 } = await loadFixture(deployFundraiserFixture);

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("5000")
            );

            await expect(
                fundraiser.connect(donor4).vote(1, true)
            ).to.be.revertedWith("Only donors can perform this action");
        });

        it("should revert if voting on non-existent proposal", async function () {
            const { fundraiser, usdcToken, owner, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("1000"));

            await expect(
                fundraiser.connect(donor1).vote(999, true)
            ).to.be.revertedWith("Proposal does not exist");
        });

        it("should prevent double voting on same proposal", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("5000"));

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("2000")
            );

            await fundraiser.connect(donor1).vote(1, true);

            await expect(
                fundraiser.connect(donor1).vote(1, true)
            ).to.be.revertedWith("Already voted");
        });

        it("should allow voting on different proposals", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("10000"));

            await fundraiser.connect(creator).createProposal("Prop 1", "Desc 1", usdc("3000"));
            await fundraiser.connect(creator).createProposal("Prop 2", "Desc 2", usdc("4000"));

            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(donor1).vote(2, false);

            const prop1 = await fundraiser.proposals(1);
            const prop2 = await fundraiser.proposals(2);

            expect(prop1.upvotes).to.equal(usdc("10000"));
            expect(prop2.downvotes).to.equal(usdc("10000"));
        });

        it("should revert if donor has zero voting power", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            // Make a donation but check edge case where voting power is somehow 0
            // In reality this would require donation then refund
            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("1000")
            );

            await expect(
                fundraiser.connect(donor1).vote(1, true)
            ).to.be.revertedWith("Only donors can perform this action");
        });

        it("should handle mixed upvotes and downvotes", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1, donor2, donor3 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("10000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("15000"));
            await makeDonation(fundraiser, usdcToken, donor3, usdc("8000"));

            await fundraiser.connect(creator).createProposal(
                "Controversial Proposal",
                "Description",
                usdc("15000")
            );

            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(donor2).vote(1, true);
            await fundraiser.connect(donor3).vote(1, false);

            const proposal = await fundraiser.proposals(1);
            expect(proposal.upvotes).to.equal(usdc("25000"));
            expect(proposal.downvotes).to.equal(usdc("8000"));
        });
    });

    // ==================== PROPOSAL EXECUTION ====================

    describe("Proposal Execution", function () {
        it("should execute proposal when it reaches required votes", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("15000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("10000"));

            const requiredVotes = usdc("20000");
            await fundraiser.connect(creator).createProposal(
                "Achievable Proposal",
                "Should pass",
                requiredVotes
            );

            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(donor2).vote(1, true);

            await expect(fundraiser.connect(creator).executeProposal(1))
                .to.emit(fundraiser, "ProposalExecuted")
                .withArgs(1);

            const proposal = await fundraiser.proposals(1);
            expect(proposal.executed).to.be.true;
        });

        it("should revert if proposal hasn't reached required votes", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("5000"));

            const requiredVotes = usdc("10000");
            await fundraiser.connect(creator).createProposal(
                "Unachievable Proposal",
                "Not enough votes",
                requiredVotes
            );

            await fundraiser.connect(donor1).vote(1, true);

            await expect(
                fundraiser.connect(creator).executeProposal(1)
            ).to.be.revertedWith("Not enough votes");
        });

        it("should revert if non-owner tries to execute", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("20000"));

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("10000")
            );

            await fundraiser.connect(donor1).vote(1, true);

            await expect(
                fundraiser.connect(donor1).executeProposal(1)
            ).to.be.revertedWithCustomError(fundraiser, "OwnableUnauthorizedAccount");
        });

        it("should prevent re-execution of already executed proposal", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("20000"));

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("10000")
            );

            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(creator).executeProposal(1);

            await expect(
                fundraiser.connect(creator).executeProposal(1)
            ).to.be.revertedWith("Already executed");
        });

        it("should revert if executing non-existent proposal", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            await expect(
                fundraiser.connect(creator).executeProposal(999)
            ).to.be.revertedWith("Proposal does not exist");
        });

        it("should prevent voting on executed proposals", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("15000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("10000"));

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("10000")
            );

            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(creator).executeProposal(1);

            await expect(
                fundraiser.connect(donor2).vote(1, true)
            ).to.be.revertedWith("Proposal already executed");
        });
    });

    // ==================== GET PROPOSALS ====================

    describe("Get Proposals", function () {
        it("should return all proposals", async function () {
            const { fundraiser, creator } = await loadFixture(deployFundraiserFixture);

            await fundraiser.connect(creator).createProposal("Prop 1", "Desc 1", usdc("5000"));
            await fundraiser.connect(creator).createProposal("Prop 2", "Desc 2", usdc("7000"));
            await fundraiser.connect(creator).createProposal("Prop 3", "Desc 3", usdc("9000"));

            const proposals = await fundraiser.getProposals();

            expect(proposals.length).to.equal(3);
            expect(proposals[0].title).to.equal("Prop 1");
            expect(proposals[1].title).to.equal("Prop 2");
            expect(proposals[2].title).to.equal("Prop 3");
        });

        it("should return empty array when no proposals exist", async function () {
            const { fundraiser } = await loadFixture(deployFundraiserFixture);

            const proposals = await fundraiser.getProposals();
            expect(proposals.length).to.equal(0);
        });

        it("should include vote counts in returned proposals", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("10000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("8000"));

            await fundraiser.connect(creator).createProposal(
                "Test Proposal",
                "Description",
                usdc("5000")
            );

            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(donor2).vote(1, false);

            const proposals = await fundraiser.getProposals();

            expect(proposals[0].upvotes).to.equal(usdc("10000"));
            expect(proposals[0].downvotes).to.equal(usdc("8000"));
        });
    });

    // ==================== INTEGRATION SCENARIOS ====================

    describe("Integration Scenarios", function () {
        it("should handle full proposal lifecycle", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1, donor2, donor3 } =
                await loadFixture(deployFundraiserFixture);

            // Donors make donations
            await makeDonation(fundraiser, usdcToken, donor1, usdc("10000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("15000"));
            await makeDonation(fundraiser, usdcToken, donor3, usdc("8000"));

            // Creator creates proposal
            await fundraiser.connect(creator).createProposal(
                "Equipment Purchase",
                "Buy essential medical equipment",
                usdc("25000")
            );

            // Donors vote
            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(donor2).vote(1, true);
            await fundraiser.connect(donor3).vote(1, true);

            // Check proposal state before execution
            let proposal = await fundraiser.proposals(1);
            expect(proposal.upvotes).to.equal(usdc("33000"));
            expect(proposal.executed).to.be.false;

            // Execute proposal
            await fundraiser.connect(creator).executeProposal(1);

            // Check proposal state after execution
            proposal = await fundraiser.proposals(1);
            expect(proposal.executed).to.be.true;
        });

        it("should handle multiple concurrent proposals", async function () {
            const { fundraiser, usdcToken, owner, creator, donor1, donor2 } =
                await loadFixture(deployFundraiserFixture);

            await makeDonation(fundraiser, usdcToken, donor1, usdc("20000"));
            await makeDonation(fundraiser, usdcToken, donor2, usdc("15000"));

            // Create multiple proposals
            await fundraiser.connect(creator).createProposal("Prop 1", "Desc 1", usdc("10000"));
            await fundraiser.connect(creator).createProposal("Prop 2", "Desc 2", usdc("12000"));
            await fundraiser.connect(creator).createProposal("Prop 3", "Desc 3", usdc("15000"));

            // Vote on different proposals
            await fundraiser.connect(donor1).vote(1, true);
            await fundraiser.connect(donor1).vote(2, false);
            await fundraiser.connect(donor2).vote(2, true);
            await fundraiser.connect(donor2).vote(3, true);

            // Execute passing proposals
            await fundraiser.connect(creator).executeProposal(1); // 20000 upvotes > 10000 required
            await fundraiser.connect(creator).executeProposal(3); // 15000 upvotes = 15000 required

            const prop1 = await fundraiser.proposals(1);
            const prop2 = await fundraiser.proposals(2);
            const prop3 = await fundraiser.proposals(3);

            expect(prop1.executed).to.be.true;
            expect(prop2.executed).to.be.false; // Mixed votes, upvotes < required
            expect(prop3.executed).to.be.true;
        });
    });
});
