import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenizedRealty", function() {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTokenizedRealtyFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const linkTokenFactory = await ethers.getContractFactory("ERC20Mock");
    const linkToken = await linkTokenFactory.deploy("Chainlink", "LINK");

    const usdTokenFactory = await ethers.getContractFactory("ERC20Mock");
    const usdToken = await usdTokenFactory.deploy("USDC", "USDC");

    const oracleMockFactory = await ethers.getContractFactory("OracleMock");
    const oracleMock = await oracleMockFactory.deploy(linkToken.address);

    const tokenizedRealtyFactory = await ethers.getContractFactory(
      "TokenizedRealty"
    );
    const tokenizedRealty = await tokenizedRealtyFactory.deploy(
      linkToken.address,
      oracleMock.address,
      ethers.utils.formatBytes32String(""), // Not used
      "100000000000000000", // 0.1 LINK
      usdToken.address
    );

    return { tokenizedRealty, owner, otherAccount, oracleMock };
  }

  describe("Deployment", function() {
    it("Should set the correct default state", async function() {
      const { tokenizedRealty, oracleMock } = await loadFixture(
        deployTokenizedRealtyFixture
      );

      expect(await tokenizedRealty.getOracleAddress()).to.equal(
        oracleMock.address
      );
    });
  });
});
