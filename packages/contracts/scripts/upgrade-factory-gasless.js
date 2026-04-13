const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Upgrade script for FundraiserFactory — Gasless Campaign Creation
 *
 * This script redeploys ONLY the FundraiserFactory with the new
 * `createFundraiserFor()` function, then:
 *   1. Re-links all existing auxiliary contracts (WBD, ReceiptOFT, Bridge, etc.)
 *   2. Grants ADMIN_ROLE to the backend wallet so it can relay gasless transactions
 *   3. Re-grants permissions on ReceiptOFT and WBD to the new factory address
 *   4. Updates baseSepolia.json with the new factory address
 *
 * Prerequisites:
 *   - PRIVATE_KEY in .env (deployer with DEFAULT_ADMIN_ROLE on existing contracts)
 *   - BACKEND_WALLET_ADDRESS in .env (the public address of the backend wallet)
 *     OR pass it as: BACKEND_WALLET_ADDRESS=0x... npx hardhat run scripts/upgrade-factory-gasless.js --network baseSepolia
 *
 * Usage:
 *   BACKEND_WALLET_ADDRESS=0xYourBackendWallet npx hardhat run scripts/upgrade-factory-gasless.js --network baseSepolia
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployWithRetry(factory, args = [], retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const contract = await factory.deploy(...args);
      await contract.waitForDeployment();
      return contract;
    } catch (err) {
      const msg = err.message || String(err);
      if (
        msg.includes("replacement transaction underpriced") ||
        msg.includes("nonce has already been used")
      ) {
        console.log(`  ⏳ Retry ${attempt}/${retries} — waiting for pending tx to clear...`);
        await sleep(5000 * attempt);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Deploy failed after max retries");
}

async function txWithRetry(fn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const tx = await fn();
      if (tx && tx.wait) await tx.wait();
      return tx;
    } catch (err) {
      const msg = err.message || String(err);
      if (
        msg.includes("replacement transaction underpriced") ||
        msg.includes("nonce has already been used")
      ) {
        console.log(`  ⏳ Retry ${attempt}/${retries} — waiting for pending tx...`);
        await sleep(5000 * attempt);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Transaction failed after max retries");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════");
  console.log("  FundraiserFactory Upgrade — Gasless Campaign Support");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);

  // ─── 0. Load existing deployment addresses ───────────────────────────────

  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, "baseSepolia.json");

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(
      `No existing deployment found at ${deploymentFile}. Run the full deploy script first.`
    );
  }

  const addresses = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const oldFactoryAddress = addresses.FundraiserFactory;

  console.log("\nExisting deployment loaded:");
  console.log("  Old FundraiserFactory:", oldFactoryAddress);
  console.log("  FundraiserImpl:", addresses.FundraiserImplementation);
  console.log("  StakingPoolImpl:", addresses.StakingPoolImplementation);
  console.log("  USDC:", addresses.USDC);
  console.log("  WETH:", addresses.WETH);
  console.log("  AAVE_POOL:", addresses.AAVE_POOL);
  console.log("  aUSDC:", addresses.aUSDC);

  // ─── 1. Resolve backend wallet address ───────────────────────────────────

  const backendWalletAddress = process.env.BACKEND_WALLET_ADDRESS;
  if (!backendWalletAddress || !ethers.isAddress(backendWalletAddress)) {
    throw new Error(
      "BACKEND_WALLET_ADDRESS is required.\n" +
        "Usage: BACKEND_WALLET_ADDRESS=0x... npx hardhat run scripts/upgrade-factory-gasless.js --network baseSepolia\n" +
        "This is the public address of the wallet whose private key is set as BACKEND_WALLET_PK in the backend .env."
    );
  }
  console.log("\n  Backend wallet (will receive ADMIN_ROLE):", backendWalletAddress);

  // ─── 2. Deploy new FundraiserFactory ─────────────────────────────────────

  console.log("\n🔨 Deploying new FundraiserFactory...");
  const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");

  const newFactory = await deployWithRetry(FundraiserFactory, [
    addresses.FundraiserImplementation, // _fundraiserImplementation
    addresses.StakingPoolImplementation, // _stakingPoolImplementation
    addresses.SwapAdapter, // _swapAdapter
    addresses.USDC, // _usdc
    addresses.WETH, // _weth
    deployer.address, // _platformFeeRecipient
    addresses.AAVE_POOL, // _aavePool
    addresses.aUSDC, // _aUsdc
    ethers.ZeroAddress, // _morphoVault (not used on testnet)
    0, // _stakingPoolType = 0 (Aave)
  ]);

  const newFactoryAddress = await newFactory.getAddress();
  console.log("✅ New FundraiserFactory deployed to:", newFactoryAddress);

  // Wait for RPC sync
  await sleep(5000);

  // Re-instantiate via getContractAt for clean ABI bindings
  const factory = await ethers.getContractAt("FundraiserFactory", newFactoryAddress);

  // ─── 3. Re-link auxiliary contracts ──────────────────────────────────────

  console.log("\n🔗 Configuring auxiliary contracts on new factory...");

  if (addresses.WealthBuildingDonation) {
    await txWithRetry(() => factory.setWealthBuildingDonation(addresses.WealthBuildingDonation));
    console.log("  ✓ WealthBuildingDonation set");
  }

  if (addresses.ImpactDAOPool) {
    await txWithRetry(() => factory.setImpactDAOPool(addresses.ImpactDAOPool));
    console.log("  ✓ ImpactDAOPool set");
  }

  if (addresses.PlatformTreasury) {
    await txWithRetry(() => factory.setPlatformTreasury(addresses.PlatformTreasury));
    console.log("  ✓ PlatformTreasury set");
  }

  if (addresses.ReceiptOFT) {
    await txWithRetry(() => factory.setReceiptOFT(addresses.ReceiptOFT));
    console.log("  ✓ ReceiptOFT set");
  }

  if (addresses.FBT) {
    await txWithRetry(() => factory.setFBT(addresses.FBT));
    console.log("  ✓ FBT set");
  }

  if (addresses.FundBraveBridge) {
    await txWithRetry(() => factory.updateBridge(addresses.FundBraveBridge));
    console.log("  ✓ FundBraveBridge set");
  }

  if (addresses.BridgeRouter) {
    await txWithRetry(() => factory.setBridgeRouter(addresses.BridgeRouter));
    console.log("  ✓ BridgeRouter set");
  }

  // ─── 4. Grant ADMIN_ROLE to backend wallet ───────────────────────────────

  console.log("\n🔑 Granting ADMIN_ROLE to backend wallet...");
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  await txWithRetry(() => factory.grantRole(ADMIN_ROLE, backendWalletAddress));
  console.log("  ✓ ADMIN_ROLE granted to:", backendWalletAddress);

  // Verify the role was granted
  const hasRole = await factory.hasRole(ADMIN_ROLE, backendWalletAddress);
  console.log("  ✓ Verified hasRole(ADMIN_ROLE, backendWallet):", hasRole);

  // ─── 5. Update permissions on existing contracts ─────────────────────────

  console.log("\n🔐 Updating permissions on existing contracts...");

  // ReceiptOFT: set new factory as controllerAdmin
  if (addresses.ReceiptOFT) {
    try {
      const receiptOFT = await ethers.getContractAt("ReceiptOFT", addresses.ReceiptOFT);
      await txWithRetry(() => receiptOFT.setControllerAdmin(newFactoryAddress));
      console.log("  ✓ ReceiptOFT.controllerAdmin → new factory");
    } catch (err) {
      console.warn("  ⚠ Could not update ReceiptOFT controllerAdmin:", err.message.slice(0, 100));
    }
  }

  // WealthBuildingDonation: set new factory as authorized
  if (addresses.WealthBuildingDonation) {
    try {
      const wbd = await ethers.getContractAt(
        "WealthBuildingDonation",
        addresses.WealthBuildingDonation
      );
      await txWithRetry(() => wbd.setAuthorizedFactory(newFactoryAddress));
      console.log("  ✓ WealthBuildingDonation.authorizedFactory → new factory");
    } catch (err) {
      console.warn("  ⚠ Could not update WBD authorizedFactory:", err.message.slice(0, 100));
    }
  }

  // BridgeRouter: update factory reference if it has a setter
  if (addresses.BridgeRouter) {
    try {
      const bridgeRouter = await ethers.getContractAt("BridgeRouter", addresses.BridgeRouter);
      // BridgeRouter constructor takes factory — check if there's an update method
      if (bridgeRouter.setFundraiserFactory) {
        await txWithRetry(() => bridgeRouter.setFundraiserFactory(newFactoryAddress));
        console.log("  ✓ BridgeRouter.fundraiserFactory → new factory");
      } else {
        console.log(
          "  ℹ BridgeRouter has no setFundraiserFactory — may need redeployment if bridge donations break"
        );
      }
    } catch (err) {
      console.warn("  ⚠ Could not update BridgeRouter:", err.message.slice(0, 100));
    }
  }

  // FundBraveBridge: update factory reference if it has a setter
  if (addresses.FundBraveBridge) {
    try {
      const bridge = await ethers.getContractAt("FundBraveBridge", addresses.FundBraveBridge);
      if (bridge.setLocalFundraiserFactory) {
        await txWithRetry(() => bridge.setLocalFundraiserFactory(newFactoryAddress));
        console.log("  ✓ FundBraveBridge.localFundraiserFactory → new factory");
      } else {
        console.log(
          "  ℹ FundBraveBridge has no setLocalFundraiserFactory — may need redeployment if bridge breaks"
        );
      }
    } catch (err) {
      console.warn("  ⚠ Could not update FundBraveBridge:", err.message.slice(0, 100));
    }
  }

  // ─── 6. Save updated addresses ──────────────────────────────────────────

  addresses.FundraiserFactory = newFactoryAddress;
  addresses.FundraiserFactory_old = oldFactoryAddress;
  addresses.BackendWallet = backendWalletAddress;

  fs.writeFileSync(deploymentFile, JSON.stringify(addresses, null, 2));
  console.log("\n💾 Updated deployment addresses saved to:", deploymentFile);

  // ─── 7. Summary ─────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  ✅ UPGRADE COMPLETE");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("  Old Factory:", oldFactoryAddress);
  console.log("  New Factory:", newFactoryAddress);
  console.log("  Backend Wallet:", backendWalletAddress, "(ADMIN_ROLE ✓)");
  console.log("");
  console.log("  📋 Next steps:");
  console.log("  1. Update NEXT_PUBLIC_FACTORY_ADDRESS in frontend .env:");
  console.log(`     NEXT_PUBLIC_FACTORY_ADDRESS=${newFactoryAddress}`);
  console.log("");
  console.log("  2. Update FUNDRAISER_FACTORY_ADDRESS in backend .env:");
  console.log(`     FUNDRAISER_FACTORY_ADDRESS=${newFactoryAddress}`);
  console.log("");
  console.log("  3. Ensure BACKEND_WALLET_PK is set in backend .env");
  console.log(`     (public address: ${backendWalletAddress})`);
  console.log("");
  console.log("  4. Restart backend and frontend services");
  console.log("═══════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Upgrade failed:", error);
    process.exit(1);
  });
