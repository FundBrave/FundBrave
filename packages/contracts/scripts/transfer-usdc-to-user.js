const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer (owner):", deployer.address);

  // Your MetaMask address from the failed transaction
  const userAddress = "0x396E931faD8c43c7200D70BbDE91e962CfaCCa5e"; // Replace with your full address if different

  // Existing USDC contract
  const usdcAddress = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";

  const usdc = await hre.ethers.getContractAt("MockERC20", usdcAddress);

  console.log("\n1️⃣  Minting 100,000 USDC to deployer...");
  const mintTx = await usdc.mint(deployer.address, hre.ethers.parseUnits("100000", 6));
  await mintTx.wait();
  console.log("   ✅ Minted");

  console.log("\n2️⃣  Transferring 50,000 USDC to your address...");
  const transferTx = await usdc.transfer(userAddress, hre.ethers.parseUnits("50000", 6));
  await transferTx.wait();
  console.log("   ✅ Transferred");

  const balance = await usdc.balanceOf(userAddress);
  console.log("\n✅ Your USDC balance:", hre.ethers.formatUnits(balance, 6));
  console.log("\nYou can now test creating campaigns and donating!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
