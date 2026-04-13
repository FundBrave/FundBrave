const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying fresh MockUSDC with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MockERC20
  console.log("Deploying MockERC20...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();

  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Mint some test USDC to deployer
  console.log("\nMinting 100,000 USDC to deployer...");
  const tx = await usdc.mint(deployer.address, hre.ethers.parseUnits("100000", 6));
  await tx.wait();
  console.log("✅ Minted!");

  // Verify balance
  const balance = await usdc.balanceOf(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatUnits(balance, 6), "USDC");

  console.log("\n📝 IMPORTANT: Update your test-frontend/.env.local with:");
  console.log("NEXT_PUBLIC_USDC_ADDRESS=" + usdcAddress);
  console.log("\nThis new USDC contract has a PUBLIC mint function that anyone can call!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
