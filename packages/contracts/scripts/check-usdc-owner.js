const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Current deployer:", deployer.address);

  const usdcAddress = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
  const usdc = await hre.ethers.getContractAt("MockERC20", usdcAddress);

  try {
    const owner = await usdc.owner();
    console.log("USDC owner:", owner);
    console.log("Are you the owner?", owner.toLowerCase() === deployer.address.toLowerCase());
  } catch (error) {
    console.log("Error checking owner:", error.message);
    console.log("This contract might not have an owner() function");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
