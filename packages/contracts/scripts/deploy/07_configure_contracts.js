/**
 * @title Contract Configuration Script
 * @notice Links all deployed contracts together post-deployment
 * @dev Run: npx hardhat run scripts/deploy/07_configure_contracts.js --network baseSepolia
 *
 * This script:
 * 1. Sets FBT token in FundraiserFactory
 * 2. Sets WealthBuildingDonation in FundraiserFactory
 * 3. Sets PlatformTreasury in FundraiserFactory
 * 4. Authorizes Factory as vester in FBT
 * 5. Authorizes Factory as fee sender in PlatformTreasury
 * 6. Updates PlatformTreasury address in WealthBuildingDonation
 *
 * Prerequisites:
 * - All contracts must be deployed
 */

const { ethers, network } = require("hardhat");
const { getDeployedAddress, sleep } = require("./utils");

async function main() {
  console.log("\n========================================");
  console.log("Configuring FundBrave Contracts");
  console.log(`Network: ${network.name}`);
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Load deployed contract addresses
  const fbtAddress = getDeployedAddress(network.name, "FundBraveToken");
  const wbdAddress = getDeployedAddress(network.name, "WealthBuildingDonation");
  const ptAddress = getDeployedAddress(network.name, "PlatformTreasury");
  const factoryAddress = getDeployedAddress(network.name, "FundraiserFactory");

  console.log("\nDeployed Contracts:");
  console.log("- FundBraveToken:", fbtAddress || "NOT FOUND");
  console.log("- WealthBuildingDonation:", wbdAddress || "NOT FOUND");
  console.log("- PlatformTreasury:", ptAddress || "NOT FOUND");
  console.log("- FundraiserFactory:", factoryAddress || "NOT FOUND");

  // Validate all contracts are deployed
  if (!fbtAddress || !wbdAddress || !ptAddress || !factoryAddress) {
    throw new Error(
      "Not all contracts are deployed! Please deploy all contracts first."
    );
  }

  // Get contract instances
  const fbt = await ethers.getContractAt("FundBraveToken", fbtAddress);
  const wbd = await ethers.getContractAt("WealthBuildingDonation", wbdAddress);
  const pt = await ethers.getContractAt("PlatformTreasury", ptAddress);
  const factory = await ethers.getContractAt("FundraiserFactory", factoryAddress);

  const waitConfirmations = network.name !== "hardhat" && network.name !== "localhost" ? 2 : 1;

  console.log("\n========================================");
  console.log("Starting Configuration");
  console.log("========================================");

  // Configuration 1: Set FBT in FundraiserFactory
  console.log("\n[1/6] Setting FBT in FundraiserFactory...");
  try {
    const currentFbt = await factory.fbtToken();
    if (currentFbt.toLowerCase() === fbtAddress.toLowerCase()) {
      console.log("  Already configured, skipping...");
    } else {
      const tx = await factory.setFBT(fbtAddress);
      await tx.wait(waitConfirmations);
      console.log("  SUCCESS! Tx:", tx.hash);
    }
  } catch (error) {
    if (error.message.includes("already set") || error.message.includes("same address")) {
      console.log("  Already configured, skipping...");
    } else {
      console.log("  Error:", error.message);
    }
  }
  await sleep(2000);

  // Configuration 2: Set WealthBuildingDonation in FundraiserFactory
  console.log("\n[2/6] Setting WealthBuildingDonation in FundraiserFactory...");
  try {
    const currentWbd = await factory.wealthBuildingDonation();
    if (currentWbd.toLowerCase() === wbdAddress.toLowerCase()) {
      console.log("  Already configured, skipping...");
    } else {
      const tx = await factory.setWealthBuildingDonation(wbdAddress);
      await tx.wait(waitConfirmations);
      console.log("  SUCCESS! Tx:", tx.hash);
    }
  } catch (error) {
    if (error.message.includes("already set") || error.message.includes("same address")) {
      console.log("  Already configured, skipping...");
    } else {
      console.log("  Error:", error.message);
    }
  }
  await sleep(2000);

  // Configuration 3: Set PlatformTreasury in FundraiserFactory
  console.log("\n[3/6] Setting PlatformTreasury in FundraiserFactory...");
  try {
    const currentPt = await factory.platformTreasury();
    if (currentPt.toLowerCase() === ptAddress.toLowerCase()) {
      console.log("  Already configured, skipping...");
    } else {
      const tx = await factory.setPlatformTreasury(ptAddress);
      await tx.wait(waitConfirmations);
      console.log("  SUCCESS! Tx:", tx.hash);
    }
  } catch (error) {
    if (error.message.includes("already set") || error.message.includes("same address")) {
      console.log("  Already configured, skipping...");
    } else {
      console.log("  Error:", error.message);
    }
  }
  await sleep(2000);

  // Configuration 4: Authorize Factory as vester in FBT
  console.log("\n[4/6] Authorizing Factory as vester in FBT...");
  try {
    const isVester = await fbt.authorizedVesters(factoryAddress);
    if (isVester) {
      console.log("  Already authorized, skipping...");
    } else {
      const tx = await fbt.setAuthorizedVester(factoryAddress, true);
      await tx.wait(waitConfirmations);
      console.log("  SUCCESS! Tx:", tx.hash);
    }
  } catch (error) {
    if (error.message.includes("already") || error.message.includes("authorized")) {
      console.log("  Already authorized, skipping...");
    } else {
      console.log("  Error:", error.message);
    }
  }
  await sleep(2000);

  // Configuration 5: Authorize Factory as fee sender in PlatformTreasury
  console.log("\n[5/6] Authorizing Factory as fee sender in PlatformTreasury...");
  try {
    const isAuthorized = await pt.authorizedFeeSenders(factoryAddress);
    if (isAuthorized) {
      console.log("  Already authorized, skipping...");
    } else {
      const tx = await pt.authorizeFeeSender(factoryAddress);
      await tx.wait(waitConfirmations);
      console.log("  SUCCESS! Tx:", tx.hash);
    }
  } catch (error) {
    if (error.message.includes("already") || error.message.includes("authorized")) {
      console.log("  Already authorized, skipping...");
    } else {
      console.log("  Error:", error.message);
    }
  }
  await sleep(2000);

  // Configuration 6: Update PlatformTreasury in WealthBuildingDonation
  console.log("\n[6/6] Updating PlatformTreasury in WealthBuildingDonation...");
  try {
    const currentPtInWbd = await wbd.platformTreasury();
    if (currentPtInWbd.toLowerCase() === ptAddress.toLowerCase()) {
      console.log("  Already configured, skipping...");
    } else {
      const tx = await wbd.setPlatformTreasury(ptAddress);
      await tx.wait(waitConfirmations);
      console.log("  SUCCESS! Tx:", tx.hash);
    }
  } catch (error) {
    if (error.message.includes("already set") || error.message.includes("same address")) {
      console.log("  Already configured, skipping...");
    } else {
      console.log("  Error:", error.message);
    }
  }

  console.log("\n========================================");
  console.log("Configuration Complete!");
  console.log("========================================");

  // Verify final state
  console.log("\nVerifying final configuration...");

  try {
    const finalFbt = await factory.fbtToken();
    const finalWbd = await factory.wealthBuildingDonation();
    const finalPt = await factory.platformTreasury();
    const isVester = await fbt.authorizedVesters(factoryAddress);
    const isFeeSender = await pt.authorizedFeeSenders(factoryAddress);
    const wbdPt = await wbd.platformTreasury();

    console.log("\nFundraiserFactory:");
    console.log("  - FBT:", finalFbt);
    console.log("  - WealthBuildingDonation:", finalWbd);
    console.log("  - PlatformTreasury:", finalPt);
    console.log("\nFBT:");
    console.log("  - Factory is vester:", isVester);
    console.log("\nPlatformTreasury:");
    console.log("  - Factory is fee sender:", isFeeSender);
    console.log("\nWealthBuildingDonation:");
    console.log("  - PlatformTreasury:", wbdPt);

    // Check all configurations
    const allConfigured =
      finalFbt.toLowerCase() === fbtAddress.toLowerCase() &&
      finalWbd.toLowerCase() === wbdAddress.toLowerCase() &&
      finalPt.toLowerCase() === ptAddress.toLowerCase() &&
      isVester === true &&
      isFeeSender === true &&
      wbdPt.toLowerCase() === ptAddress.toLowerCase();

    if (allConfigured) {
      console.log("\n[OK] All contracts configured correctly!");
    } else {
      console.log("\n[WARNING] Some configurations may need attention.");
    }
  } catch (error) {
    console.log("\nVerification error:", error.message);
  }

  console.log("\n========================================");
  console.log("DEPLOYMENT AND CONFIGURATION COMPLETE!");
  console.log("========================================\n");

  console.log("Summary of deployed contracts:");
  console.log(`  FundBraveToken:            ${fbtAddress}`);
  console.log(`  WealthBuildingDonation:    ${wbdAddress}`);
  console.log(`  PlatformTreasury:          ${ptAddress}`);
  console.log(`  FundraiserFactory:         ${factoryAddress}`);

  return {
    FundBraveToken: fbtAddress,
    WealthBuildingDonation: wbdAddress,
    PlatformTreasury: ptAddress,
    FundraiserFactory: factoryAddress,
  };
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
