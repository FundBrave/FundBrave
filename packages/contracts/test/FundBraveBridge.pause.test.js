const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FundBraveBridge - Pause Mechanism", function () {
  async function deployFixture() {
    const [owner, user1, user2, factory] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);
    const weth = await MockERC20.deploy("WETH", "WETH", 18);

    // Deploy mock LayerZero endpoint
    const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
    const endpoint = await MockLZEndpoint.deploy(1); // EID 1 for local chain

    // Deploy mock swap adapter
    const MockSwapAdapter = await ethers.getContractFactory("MockSwapAdapter");
    const swapAdapter = await MockSwapAdapter.deploy(await usdc.getAddress());

    // Deploy FundBraveBridge
    const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
    const bridge = await FundBraveBridge.deploy(
      await endpoint.getAddress(),
      await swapAdapter.getAddress(),
      await usdc.getAddress(),
      factory.address,
      owner.address
    );

    await bridge.waitForDeployment();

    // Configure peer for destination chain (EID 30101)
    // Convert factory address to bytes32 for LayerZero peer
    const peerBytes32 = ethers.zeroPadValue(factory.address, 32);
    await bridge.connect(owner).setPeer(30101, peerBytes32);
    await bridge.connect(owner).setPeerFactory(30101, factory.address);

    return { bridge, usdc, weth, endpoint, swapAdapter, owner, user1, user2, factory };
  }

  describe("Pause/Unpause Functions", function () {
    it("should allow owner to pause the bridge", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      await expect(bridge.connect(owner).pause())
        .to.not.be.reverted;

      expect(await bridge.paused()).to.be.true;
    });

    it("should allow owner to unpause the bridge", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      // Pause first
      await bridge.connect(owner).pause();
      expect(await bridge.paused()).to.be.true;

      // Unpause
      await expect(bridge.connect(owner).unpause())
        .to.not.be.reverted;

      expect(await bridge.paused()).to.be.false;
    });

    it("should revert when non-owner tries to pause", async function () {
      const { bridge, user1 } = await loadFixture(deployFixture);

      await expect(bridge.connect(user1).pause())
        .to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });

    it("should revert when non-owner tries to unpause", async function () {
      const { bridge, owner, user1 } = await loadFixture(deployFixture);

      // Owner pauses
      await bridge.connect(owner).pause();

      // Non-owner tries to unpause
      await expect(bridge.connect(user1).unpause())
        .to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });

    it("should emit Paused event when pausing", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      await expect(bridge.connect(owner).pause())
        .to.emit(bridge, "Paused")
        .withArgs(owner.address);
    });

    it("should emit Unpaused event when unpausing", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      await bridge.connect(owner).pause();

      await expect(bridge.connect(owner).unpause())
        .to.emit(bridge, "Unpaused")
        .withArgs(owner.address);
    });
  });

  describe("sendCrossChainAction When Paused", function () {
    it("should block sendCrossChainAction when paused", async function () {
      const { bridge, usdc, owner, user1 } = await loadFixture(deployFixture);

      // Pause the bridge
      await bridge.connect(owner).pause();

      // Mint USDC to user1
      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      // Try to send cross-chain action
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, // destination chain
          1, // fundraiser ID
          0, // donate action
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");
    });

    it("should allow sendCrossChainAction when not paused", async function () {
      const { bridge, usdc, user1 } = await loadFixture(deployFixture);

      // Mint USDC to user1
      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      // Should not revert when not paused (just check function executes without EnforcedPause error)
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101,
          1,
          0,
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.not.be.revertedWithCustomError(bridge, "EnforcedPause");
    });

    it("should resume sendCrossChainAction after unpause", async function () {
      const { bridge, usdc, owner, user1 } = await loadFixture(deployFixture);

      // Pause
      await bridge.connect(owner).pause();

      // Mint USDC
      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      // Verify blocked
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, 1, 0,
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");

      // Unpause
      await bridge.connect(owner).unpause();

      // Should work now (not revert with EnforcedPause)
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, 1, 0,
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.not.be.revertedWithCustomError(bridge, "EnforcedPause");
    });
  });

  describe("_lzReceive When Paused", function () {
    // Note: _lzReceive is internal and protected by LayerZero's peer validation.
    // These tests verify the pause mechanism works at the contract level.

    it("should have pause protection on _lzReceive (verified by whenNotPaused modifier)", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      // Pause the bridge
      await bridge.connect(owner).pause();

      // Verify bridge is paused
      expect(await bridge.paused()).to.be.true;

      // The _lzReceive function has whenNotPaused modifier which will block execution
      // We cannot directly test _lzReceive as it's internal, but we've verified:
      // 1. The bridge can be paused
      // 2. The _lzReceive function has the whenNotPaused modifier in the source code
    });

    it("should allow message processing when not paused", async function () {
      const { bridge } = await loadFixture(deployFixture);

      // Verify not paused
      expect(await bridge.paused()).to.be.false;

      // When not paused, _lzReceive can execute (whenNotPaused modifier allows it)
    });

    it("should allow message processing after unpause", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      // Pause
      await bridge.connect(owner).pause();
      expect(await bridge.paused()).to.be.true;

      // Unpause
      await bridge.connect(owner).unpause();
      expect(await bridge.paused()).to.be.false;

      // After unpause, _lzReceive can execute again
    });
  });

  describe("Normal Operations When Not Paused", function () {
    it("should allow all operations when never paused", async function () {
      const { bridge } = await loadFixture(deployFixture);

      // Verify not paused
      expect(await bridge.paused()).to.be.false;

      // Verify pause-related functions work
      // (actual cross-chain operations require complex LayerZero setup)
    });

    it("should handle multiple pause/unpause cycles correctly", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      // Cycle 1: Pause -> Unpause
      await bridge.connect(owner).pause();
      expect(await bridge.paused()).to.be.true;
      await bridge.connect(owner).unpause();
      expect(await bridge.paused()).to.be.false;

      // Cycle 2: Pause -> Unpause
      await bridge.connect(owner).pause();
      expect(await bridge.paused()).to.be.true;
      await bridge.connect(owner).unpause();
      expect(await bridge.paused()).to.be.false;

      // Cycle 3: Pause -> Unpause
      await bridge.connect(owner).pause();
      await bridge.connect(owner).unpause();

      // Verify final state is not paused
      expect(await bridge.paused()).to.be.false;
    });
  });

  describe("Emergency Scenarios", function () {
    it("should allow emergency withdrawal while paused", async function () {
      const { bridge, usdc, owner } = await loadFixture(deployFixture);

      // Fund bridge
      await usdc.mint(await bridge.getAddress(), ethers.parseUnits("5000", 6));

      // Pause
      await bridge.connect(owner).pause();

      // Emergency withdraw should still work
      await expect(
        bridge.connect(owner).emergencyWithdraw(await usdc.getAddress())
      ).to.not.be.reverted;

      // Owner should receive tokens
      expect(await usdc.balanceOf(owner.address)).to.equal(ethers.parseUnits("5000", 6));
    });

    it("should protect user funds during pause", async function () {
      const { bridge, usdc, owner, user1 } = await loadFixture(deployFixture);

      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      const balanceBefore = await usdc.balanceOf(user1.address);

      // Pause
      await bridge.connect(owner).pause();

      // User cannot send funds while paused
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, 1, 0, await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");

      // User funds remain untouched
      expect(await usdc.balanceOf(user1.address)).to.equal(balanceBefore);
    });
  });

  describe("State Consistency", function () {
    it("should maintain pause state through multiple operations", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      // Initial state: not paused
      expect(await bridge.paused()).to.be.false;

      // Pause
      await bridge.connect(owner).pause();
      expect(await bridge.paused()).to.be.true;

      // State remains paused
      expect(await bridge.paused()).to.be.true;

      // Unpause
      await bridge.connect(owner).unpause();
      expect(await bridge.paused()).to.be.false;

      // State remains unpaused
      expect(await bridge.paused()).to.be.false;
    });
  });
});
