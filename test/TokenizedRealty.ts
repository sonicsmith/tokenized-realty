import { network } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { networkConfig } from "./../helper-hardhat-config";
import { numToBytes32 } from "./../helper-functions";

describe("TokenizedRealty", function() {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTokenizedRealtyFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const chainId = network.config.chainId || 31337;
    const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"]);
    const fee = networkConfig[chainId]["fee"];
    const linkTokenMockFactory = await ethers.getContractFactory("LinkToken");
    const linkTokenMock = await linkTokenMockFactory.deploy();

    const usdTokenMockFactory = await ethers.getContractFactory("ERC20Mock");
    const usdTokenMock = await usdTokenMockFactory.deploy("USDC", "USDC");

    const oracleMockFactory = await ethers.getContractFactory("MockOracle");
    const oracleMock = await oracleMockFactory.deploy(linkTokenMock.address);

    const tokenizedRealtyFactory = await ethers.getContractFactory(
      "TokenizedRealty"
    );

    const tokenizedRealty = await tokenizedRealtyFactory.deploy(
      linkTokenMock.address,
      oracleMock.address,
      jobId,
      fee,
      usdTokenMock.address
    );

    // Add LINK to contract
    const fundAmount =
      networkConfig[chainId]["fundAmount"] || "1000000000000000000";
    await linkTokenMock.transfer(tokenizedRealty.address, fundAmount);

    return {
      tokenizedRealty,
      owner,
      otherAccount,
      oracleMock,
      linkTokenMock,
      usdTokenMock,
    };
  }

  describe("Deployment", function() {
    it("should set the correct default state", async function() {
      const { tokenizedRealty, oracleMock } = await loadFixture(
        deployTokenizedRealtyFixture
      );
      expect(await tokenizedRealty.getOracleAddress()).to.equal(
        oracleMock.address
      );
    });
  });

  describe("Property Tokens", function() {
    const propertyId = 1234;
    const endDate = 1666000000;
    const totalAmount = 5000; // usd

    let tokenizedRealty: any;
    let usdTokenMock: any;
    let oracleMock: any;
    let owner: any;

    beforeEach(async () => {
      const fixture = await loadFixture(deployTokenizedRealtyFixture);
      tokenizedRealty = fixture.tokenizedRealty;
      usdTokenMock = fixture.usdTokenMock;
      oracleMock = fixture.oracleMock;
      owner = fixture.owner;
      await tokenizedRealty.createPropertyTokens(
        propertyId,
        endDate,
        totalAmount
      );
    });

    it("should correctly create a property token", async function() {
      const list = await tokenizedRealty.getPropertyTokenList();
      expect(list[0].toString()).to.equal(propertyId.toString());
      const fields = await tokenizedRealty.getPropertyToken(1234);
      // endDate, totalAmount, amountAvailable, numberOfHolders, debit, credit
      const fieldsAsString = fields.map((field: any) => Number(field));
      expect(fieldsAsString).to.eql([
        endDate,
        totalAmount,
        totalAmount,
        0,
        0,
        0,
      ]);
    });

    it("should correctly handle purchasing of tokens", async function() {
      await usdTokenMock.approve(tokenizedRealty.address, 1700);
      const transaction = await tokenizedRealty.purchasePropertyTokens(
        propertyId,
        1700
      );
      const transactionReceipt = await transaction.wait(1);
      const requestId = transactionReceipt?.events?.[2].topics[1];
      const fields = await tokenizedRealty.getPropertyToken(propertyId);
      // endDate, totalAmount, amountAvailable, numberOfHolders, debit, credit
      expect(Number(fields[2])).to.eql(3300);
      expect(Number(fields[3])).to.eql(1);
      const avm = 10000;
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(avm));
      const holdingInfo = await tokenizedRealty.getHolderForAddress(
        owner.address,
        propertyId
      );
      expect(holdingInfo.valueAtPurchase.toString()).to.eql(avm.toString());
    });
  });
});
