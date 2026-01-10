const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Fundraiser - Refund Mechanism", function () {
  async function deployFixture() {
    const [owner, creator, beneficiary, donor1, donor2, donor3, factory, feeRecipient] = await ethers.getSigners();

    // Deploy USDC mock
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);

    // Deploy Fundraiser
    const Fundraiser = await ethers.getContractFactory("Fundraiser");

    const goal = ethers.parseUnits("10000", 6); // 10,000 USDC goal
    const deadline = (await time.latest()) + 30 * 24 * 60 * 60; // 30 days from now

    const fundraiser = await upgrades.deployProxy(Fundraiser, [
      1, // id
      "Test Fundraiser",
      ["https://image1.com"],
      ["Education"],
      "Test Description",
      "Global",
      beneficiary.address,
      creator.address,
      goal,
      deadline,
      await usdc.getAddress(),
      feeRecipient.address,
      factory.address
    ], { kind: 'uups' });

    await fundraiser.waitForDeployment();

    // Mint USDC to donors
    await usdc.mint(donor1.address, ethers.parseUnits("5000", 6));
    await usdc.mint(donor2.address, ethers.parseUnits("3000", 6));
    await usdc.mint(donor3.address, ethers.parseUnits("2000", 6));

    return {
      fundraiser,
      usdc,
      owner,
      creator,
      beneficiary,
      donor1,
      donor2,
      donor3,
      factory,
      goal,
      deadline
    };
  }

  describe("enableRefunds Function", function () {
    it("should enable refunds after deadline when goal not reached", async function () {
      const { fundraiser, usdc, donor1, factory, deadline } = await loadFixture(deployFixture);

      // Make donation (below goal)
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("3000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("3000", 6),
        "ethereum"
      );

      // Fast forward past deadline
      await time.increaseTo(deadline + 1);

      // Enable refunds
      const tx = await fundraiser.enableRefunds();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      // Verify event was emitted with correct timestamp
      await expect(tx)
        .to.emit(fundraiser, "RefundsEnabled")
        .withArgs(block.timestamp);

      expect(await fundraiser.refundsEnabled()).to.be.true;
    });

    it("should revert enableRefunds before deadline", async function () {
      const { fundraiser, usdc, donor1, factory } = await loadFixture(deployFixture);

      // Donate
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("2000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("2000", 6),
        "ethereum"
      );

      // Try to enable before deadline
      await expect(fundraiser.enableRefunds())
        .to.be.revertedWith("Fundraiser not ended");
    });

    it("should revert enableRefunds when goal is reached", async function () {
      const { fundraiser, usdc, donor1, donor2, factory, deadline, goal } = await loadFixture(deployFixture);

      // Donate enough to reach goal
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("6000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("6000", 6),
        "ethereum"
      );

      await usdc.connect(donor2).approve(await fundraiser.getAddress(), ethers.parseUnits("5000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor2.address,
        ethers.parseUnits("5000", 6),
        "ethereum"
      );

      expect(await fundraiser.totalDonations()).to.be.gte(goal);

      // Fast forward past deadline
      await time.increaseTo(deadline + 1);

      // Cannot enable refunds when goal reached
      await expect(fundraiser.enableRefunds())
        .to.be.revertedWith("Goal was reached");
    });

    it("should revert if refunds already enabled", async function () {
      const { fundraiser, usdc, donor1, factory, deadline } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      await time.increaseTo(deadline + 1);

      // Enable refunds
      await fundraiser.enableRefunds();

      // Try to enable again
      await expect(fundraiser.enableRefunds())
        .to.be.revertedWith("Refunds already enabled");
    });

    it("should allow anyone to call enableRefunds", async function () {
      const { fundraiser, usdc, donor1, donor2, factory, deadline } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      await time.increaseTo(deadline + 1);

      // Donor2 (not donor or owner) can enable refunds
      await expect(fundraiser.connect(donor2).enableRefunds())
        .to.not.be.reverted;

      expect(await fundraiser.refundsEnabled()).to.be.true;
    });
  });

  describe("claimRefund Function", function () {
    async function setupRefundScenario() {
      const fixture = await loadFixture(deployFixture);
      const { fundraiser, usdc, donor1, donor2, donor3, factory, deadline } = fixture;

      // Multiple donations from different donors
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("3000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("3000", 6),
        "ethereum"
      );

      await usdc.connect(donor2).approve(await fundraiser.getAddress(), ethers.parseUnits("2000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor2.address,
        ethers.parseUnits("2000", 6),
        "ethereum"
      );

      await usdc.connect(donor3).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor3.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      // Transfer USDC to fundraiser to ensure it has funds for refunds
      await usdc.mint(await fundraiser.getAddress(), ethers.parseUnits("6000", 6));

      // Fast forward and enable refunds
      await time.increaseTo(deadline + 1);
      await fundraiser.enableRefunds();

      return fixture;
    }

    it("should allow donor to claim full refund", async function () {
      const { fundraiser, usdc, donor1 } = await setupRefundScenario();

      const balanceBefore = await usdc.balanceOf(donor1.address);

      await expect(fundraiser.connect(donor1).claimRefund())
        .to.emit(fundraiser, "RefundClaimed")
        .withArgs(donor1.address, ethers.parseUnits("3000", 6));

      const balanceAfter = await usdc.balanceOf(donor1.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("3000", 6));
    });

    it("should update donorDonations mapping after refund", async function () {
      const { fundraiser, donor2 } = await setupRefundScenario();

      expect(await fundraiser.donorDonations(donor2.address)).to.equal(ethers.parseUnits("2000", 6));

      await fundraiser.connect(donor2).claimRefund();

      expect(await fundraiser.donorDonations(donor2.address)).to.equal(0);
    });

    it("should revert if refunds not enabled", async function () {
      const { fundraiser, usdc, donor1, factory } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      await usdc.mint(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));

      // Refunds not enabled yet
      await expect(fundraiser.connect(donor1).claimRefund())
        .to.be.revertedWith("Refunds not enabled");
    });

    it("should revert if donor has no donations", async function () {
      const { fundraiser, donor1 } = await setupRefundScenario();

      // donor1 already claimed or never donated
      await fundraiser.connect(donor1).claimRefund();

      // Try to claim again
      await expect(fundraiser.connect(donor1).claimRefund())
        .to.be.revertedWith("No donations to refund");
    });

    it("should revert if donor never donated", async function () {
      const { fundraiser, beneficiary } = await setupRefundScenario();

      // Beneficiary never donated
      await expect(fundraiser.connect(beneficiary).claimRefund())
        .to.be.revertedWith("No donations to refund");
    });

    it("should transfer correct USDC amount", async function () {
      const { fundraiser, usdc, donor3 } = await setupRefundScenario();

      const balanceBefore = await usdc.balanceOf(donor3.address);
      const refundAmount = await fundraiser.donorDonations(donor3.address);

      await fundraiser.connect(donor3).claimRefund();

      const balanceAfter = await usdc.balanceOf(donor3.address);
      expect(balanceAfter - balanceBefore).to.equal(refundAmount);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("1000", 6));
    });

    it("should update donor tracking correctly", async function () {
      const { fundraiser, donor1 } = await setupRefundScenario();

      const donorsCountBefore = await fundraiser.donorsCount();
      expect(await fundraiser._donors(donor1.address)).to.be.true;

      await fundraiser.connect(donor1).claimRefund();

      expect(await fundraiser._donors(donor1.address)).to.be.false;
      expect(await fundraiser.donorsCount()).to.equal(donorsCountBefore - 1n);
    });

    it("should handle multiple donors claiming refunds", async function () {
      const { fundraiser, usdc, donor1, donor2, donor3 } = await setupRefundScenario();

      // All donors claim
      await fundraiser.connect(donor1).claimRefund();
      await fundraiser.connect(donor2).claimRefund();
      await fundraiser.connect(donor3).claimRefund();

      // Verify all got refunds
      expect(await fundraiser.donorDonations(donor1.address)).to.equal(0);
      expect(await fundraiser.donorDonations(donor2.address)).to.equal(0);
      expect(await fundraiser.donorDonations(donor3.address)).to.equal(0);
    });

    it("should not allow claiming refund twice", async function () {
      const { fundraiser, donor1 } = await setupRefundScenario();

      // First claim succeeds
      await fundraiser.connect(donor1).claimRefund();

      // Second claim fails
      await expect(fundraiser.connect(donor1).claimRefund())
        .to.be.revertedWith("No donations to refund");
    });
  });

  describe("getRefundAmount Function", function () {
    it("should return correct refund amount for donor", async function () {
      const { fundraiser, usdc, donor1, factory, deadline } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1500", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1500", 6),
        "ethereum"
      );

      await time.increaseTo(deadline + 1);
      await fundraiser.enableRefunds();

      expect(await fundraiser.getRefundAmount(donor1.address)).to.equal(ethers.parseUnits("1500", 6));
    });

    it("should return 0 if refunds not enabled", async function () {
      const { fundraiser, usdc, donor1, factory } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      expect(await fundraiser.getRefundAmount(donor1.address)).to.equal(0);
    });

    it("should return 0 after donor claims refund", async function () {
      const { fundraiser, usdc, donor1, factory, deadline } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("2000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("2000", 6),
        "ethereum"
      );

      await usdc.mint(await fundraiser.getAddress(), ethers.parseUnits("2000", 6));

      await time.increaseTo(deadline + 1);
      await fundraiser.enableRefunds();

      expect(await fundraiser.getRefundAmount(donor1.address)).to.equal(ethers.parseUnits("2000", 6));

      await fundraiser.connect(donor1).claimRefund();

      expect(await fundraiser.getRefundAmount(donor1.address)).to.equal(0);
    });

    it("should handle multiple donations from same donor", async function () {
      const { fundraiser, usdc, donor1, factory, deadline } = await loadFixture(deployFixture);

      // First donation
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      // Second donation
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("500", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("500", 6),
        "ethereum"
      );

      await time.increaseTo(deadline + 1);
      await fundraiser.enableRefunds();

      // Should return total of all donations
      expect(await fundraiser.getRefundAmount(donor1.address)).to.equal(ethers.parseUnits("1500", 6));
    });
  });

  describe("Refund Integration with withdrawUSDT", function () {
    it("should prevent withdrawUSDT when refunds are enabled", async function () {
      const { fundraiser, usdc, donor1, factory, deadline, creator } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      await usdc.mint(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));

      await time.increaseTo(deadline + 1);
      await fundraiser.enableRefunds();

      // Owner cannot withdraw when refunds enabled
      await expect(fundraiser.connect(creator).withdrawUSDT())
        .to.be.revertedWith("Refunds are enabled, cannot withdraw");
    });

    it("should allow withdrawUSDT when goal reached (refunds not enabled)", async function () {
      const { fundraiser, usdc, donor1, donor2, factory, deadline, creator, beneficiary, goal } = await loadFixture(deployFixture);

      // Reach goal
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("6000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("6000", 6),
        "ethereum"
      );

      await usdc.connect(donor2).approve(await fundraiser.getAddress(), ethers.parseUnits("5000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor2.address,
        ethers.parseUnits("5000", 6),
        "ethereum"
      );

      await usdc.mint(await fundraiser.getAddress(), ethers.parseUnits("11000", 6));

      expect(await fundraiser.totalDonations()).to.be.gte(goal);

      await time.increaseTo(deadline + 1);

      // Cannot enable refunds
      await expect(fundraiser.enableRefunds())
        .to.be.revertedWith("Goal was reached");

      // Can withdraw
      await expect(fundraiser.connect(creator).withdrawUSDT())
        .to.not.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("should handle donor with minimal donation", async function () {
      const { fundraiser, usdc, donor1, factory, deadline } = await loadFixture(deployFixture);

      // Minimal donation: 1 USDC cent
      await usdc.connect(donor1).approve(await fundraiser.getAddress(), 1);
      await fundraiser.connect(factory).creditDonation(donor1.address, 1, "ethereum");

      await usdc.mint(await fundraiser.getAddress(), 1);

      await time.increaseTo(deadline + 1);
      await fundraiser.enableRefunds();

      expect(await fundraiser.getRefundAmount(donor1.address)).to.equal(1);

      await expect(fundraiser.connect(donor1).claimRefund())
        .to.emit(fundraiser, "RefundClaimed")
        .withArgs(donor1.address, 1);
    });

    it("should handle fundraiser with zero donations", async function () {
      const { fundraiser, deadline } = await loadFixture(deployFixture);

      await time.increaseTo(deadline + 1);

      // Can enable refunds even with zero donations
      await expect(fundraiser.enableRefunds())
        .to.not.be.reverted;

      expect(await fundraiser.refundsEnabled()).to.be.true;
    });

    it("should handle refund scenario at exact deadline", async function () {
      const { fundraiser, usdc, donor1, factory, deadline } = await loadFixture(deployFixture);

      await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
      await fundraiser.connect(factory).creditDonation(
        donor1.address,
        ethers.parseUnits("1000", 6),
        "ethereum"
      );

      // At exact deadline time
      await time.increaseTo(deadline);

      // At deadline, fundraiser is considered ended (deadline is inclusive)
      // So enableRefunds should work
      await expect(fundraiser.enableRefunds())
        .to.not.be.reverted;

      expect(await fundraiser.refundsEnabled()).to.be.true;
    });

    it("should correctly update state with partial refunds claimed", async function () {
      const { fundraiser, donor1, donor2, donor3 } = await setupRefundScenario();

      // Only donor1 and donor3 claim
      await fundraiser.connect(donor1).claimRefund();
      await fundraiser.connect(donor3).claimRefund();

      // donor2 hasn't claimed yet
      expect(await fundraiser.donorDonations(donor2.address)).to.equal(ethers.parseUnits("2000", 6));
      expect(await fundraiser.getRefundAmount(donor2.address)).to.equal(ethers.parseUnits("2000", 6));

      // donor2 can still claim
      await expect(fundraiser.connect(donor2).claimRefund())
        .to.not.be.reverted;
    });
  });

  async function setupRefundScenario() {
    const fixture = await loadFixture(deployFixture);
    const { fundraiser, usdc, donor1, donor2, donor3, factory, deadline } = fixture;

    await usdc.connect(donor1).approve(await fundraiser.getAddress(), ethers.parseUnits("3000", 6));
    await fundraiser.connect(factory).creditDonation(donor1.address, ethers.parseUnits("3000", 6), "ethereum");

    await usdc.connect(donor2).approve(await fundraiser.getAddress(), ethers.parseUnits("2000", 6));
    await fundraiser.connect(factory).creditDonation(donor2.address, ethers.parseUnits("2000", 6), "ethereum");

    await usdc.connect(donor3).approve(await fundraiser.getAddress(), ethers.parseUnits("1000", 6));
    await fundraiser.connect(factory).creditDonation(donor3.address, ethers.parseUnits("1000", 6), "ethereum");

    await usdc.mint(await fundraiser.getAddress(), ethers.parseUnits("6000", 6));

    await time.increaseTo(deadline + 1);
    await fundraiser.enableRefunds();

    return fixture;
  }
});
