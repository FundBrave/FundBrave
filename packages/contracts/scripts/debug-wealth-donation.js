const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [donor] = await ethers.getSigners();

  const FACTORY_ADDRESS = "0x2d5079Eb16A5bFf660ee23D600aDDC90988c0410";
  const WEALTH_BUILDING_ADDRESS = "0x39af574bA37b8d3f7632dE5d2e07D08321617857";
  const USDC_ADDRESS = "0x73c7c7cCE591177e4a21eb1a5705Fe969FF74D3b";
  const CAMPAIGN_ID = 0;
  const DONATION_AMOUNT = ethers.parseUnits("100", 6);

  console.log("🔍 Debugging Wealth Building Donation Failure\n");

  const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
  const factory = await ethers.getContractAt("FundraiserFactory", FACTORY_ADDRESS);
  const wealthBuilding = await ethers.getContractAt("WealthBuildingDonation", WEALTH_BUILDING_ADDRESS);

  // Ensure donor has USDC and approval
  const balance = await usdc.balanceOf(donor.address);
  if (balance < DONATION_AMOUNT) {
    const mintTx = await usdc.mint(donor.address, DONATION_AMOUNT);
    await mintTx.wait();
  }

  const allowance = await usdc.allowance(donor.address, FACTORY_ADDRESS);
  if (allowance < DONATION_AMOUNT) {
    const approveTx = await usdc.approve(FACTORY_ADDRESS, DONATION_AMOUNT);
    await approveTx.wait();
  }

  console.log("1️⃣  Checking WealthBuilding configuration in Factory...");
  const configuredWB = await factory.wealthBuildingDonation();
  console.log("   Configured:", configuredWB);
  console.log("   Expected:", WEALTH_BUILDING_ADDRESS);
  console.log("   Match:", configuredWB.toLowerCase() === WEALTH_BUILDING_ADDRESS.toLowerCase() ? "✅" : "❌");

  console.log("\n2️⃣  Checking fundraiser registration in WealthBuilding...");
  const fundraiserAddr = await factory.getFundraiserById(CAMPAIGN_ID);
  const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
  const beneficiary = await fundraiser.beneficiary();
  const registeredBeneficiary = await wealthBuilding.fundraiserBeneficiaries(CAMPAIGN_ID);
  console.log("   Fundraiser beneficiary:", beneficiary);
  console.log("   Registered beneficiary:", registeredBeneficiary);
  console.log("   Match:", beneficiary.toLowerCase() === registeredBeneficiary.toLowerCase() ? "✅" : "❌");

  console.log("\n3️⃣  Testing static call to see exact error...");
  try {
    await factory.donateWealthBuilding.staticCall(CAMPAIGN_ID, DONATION_AMOUNT);
    console.log("   ✅ Static call succeeded (donation should work)");
  } catch (error) {
    console.log("   ❌ Static call failed:");
    console.log("   Error:", error.message);

    // Try to extract custom error
    if (error.data) {
      console.log("\n   Analyzing error data...");
      console.log("   Error data:", error.data);

      // Try to decode common errors
      const errorSelectors = {
        "0x9996b315": "InvalidAmount()",
        "0xa42dee65": "InvalidFundraiser()",
        "0xd92e233d": "ZeroAddress()",
        "0x6851e7f2": "WealthBuildingNotConfigured()",
        "0xf4844814": "ReentrancyGuardReentrantCall()",
        "0xed3ba6a6": "EnforcedPause()",
      };

      const errorSelector = error.data.substring(0, 10);
      if (errorSelectors[errorSelector]) {
        console.log("   Decoded error:", errorSelectors[errorSelector]);
      }
    }

    // Try direct call to WealthBuilding to isolate issue
    console.log("\n4️⃣  Testing direct call to WealthBuilding.donate()...");
    console.log("   (This should fail because we're not approved)");
    try {
      // Simulate what Factory does
      await wealthBuilding.donate.staticCall(
        donor.address,
        CAMPAIGN_ID,
        DONATION_AMOUNT,
        beneficiary
      );
      console.log("   ⚠️  Unexpected success");
    } catch (directError) {
      console.log("   Error:", directError.message.substring(0, 200));

      // The error should be about allowance since we're calling directly
      if (directError.message.includes("insufficient allowance") ||
          directError.message.includes("ERC20InsufficientAllowance")) {
        console.log("   ✅ Expected error (insufficient allowance)");
        console.log("\n💡 This confirms the issue is in how Factory calls WealthBuilding");
        console.log("   Factory needs to approve WealthBuilding BEFORE transferring to itself");
      } else {
        console.log("   ⚠️  Different error than expected");
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
