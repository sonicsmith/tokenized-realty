import { ethers } from "hardhat";

async function main() {
  const TokenizedRealty = await ethers.getContractFactory("TokenizedRealty");
  const counter = await TokenizedRealty.deploy();

  await counter.deployed();

  console.log(`TokenizedRealty contract deployed to ${counter.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
