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

    // Give USD to otherAccount
    await usdTokenMock.transfer(otherAccount.address, 10000);

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

  describe("Property Tokens - Creation", function() {
    const propertyId = 1234;
    const endDate = 1666000000; // seconds since epoch
    const totalAmount = 5000; // usd

    let tokenizedRealty: any;
    let usdTokenMock: any;
    let oracleMock: any;
    let owner: any;
    let otherAccount: any;

    beforeEach(async () => {
      const fixture = await loadFixture(deployTokenizedRealtyFixture);
      tokenizedRealty = fixture.tokenizedRealty;
      usdTokenMock = fixture.usdTokenMock;
      oracleMock = fixture.oracleMock;
      owner = fixture.owner;
      otherAccount = fixture.otherAccount;
      await tokenizedRealty.createPropertyTokens(
        propertyId,
        endDate,
        totalAmount
      );
    });

    it("should correctly create a property token", async function() {
      const list = await tokenizedRealty.getPropertyTokenList();
      expect(Number(list[0])).to.equal(propertyId);
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

    it("should correctly create multiple property tokens", async function() {
      await tokenizedRealty.createPropertyTokens(1235, 1667000000, 20000);

      const list = await tokenizedRealty.getPropertyTokenList();
      expect(Number(list[0])).to.equal(propertyId);
      expect(Number(list[1])).to.equal(1235);
      const fields = await tokenizedRealty.getPropertyToken(1235);
      // endDate, totalAmount, amountAvailable, numberOfHolders, debit, credit
      const fieldsAsString = fields.map((field: any) => Number(field));
      expect(fieldsAsString).to.eql([1667000000, 20000, 20000, 0, 0, 0]);
    });

    it("should reject duplicate property id creation", async function() {
      await expect(
        tokenizedRealty.createPropertyTokens(1234, 1667000000, 20000)
      ).to.be.rejectedWith("Property exists");
    });
  });

  describe("Property Tokens - Purchasing", function() {
    const propertyId = 1234;
    const endDate = 1666000000; // seconds since epoch
    const totalAmount = 5000; // usd

    let tokenizedRealty: any;
    let usdTokenMock: any;
    let oracleMock: any;
    let owner: any;
    let otherAccount: any;

    beforeEach(async () => {
      const fixture = await loadFixture(deployTokenizedRealtyFixture);
      tokenizedRealty = fixture.tokenizedRealty;
      usdTokenMock = fixture.usdTokenMock;
      oracleMock = fixture.oracleMock;
      owner = fixture.owner;
      otherAccount = fixture.otherAccount;
      await tokenizedRealty.createPropertyTokens(
        propertyId,
        endDate,
        totalAmount
      );
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
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10000));
      const holdingInfo = await tokenizedRealty.getHolderForAddress(
        owner.address,
        propertyId
      );
      expect(Number(holdingInfo.valueAtPurchase)).to.eql(10000);
    });

    it("should correctly handle multiple purchasing of tokens", async function() {
      await usdTokenMock.approve(tokenizedRealty.address, 1700);
      let transaction = await tokenizedRealty.purchasePropertyTokens(
        propertyId,
        1700
      );
      // Populate the first valuation
      let transactionReceipt = await transaction.wait(1);
      let requestId = transactionReceipt?.events?.[2].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10000));

      // Second purchase
      await usdTokenMock
        .connect(otherAccount)
        .approve(tokenizedRealty.address, 3300);
      transaction = await tokenizedRealty
        .connect(otherAccount)
        .purchasePropertyTokens(propertyId, 3300);

      // Populate the second valuation
      transactionReceipt = await transaction.wait(1);
      requestId = transactionReceipt?.events?.[2].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(15000));

      const fields = await tokenizedRealty.getPropertyToken(propertyId);
      // endDate, totalAmount, amountAvailable, numberOfHolders, debit, credit
      expect(Number(fields[2])).to.eql(0);
      expect(Number(fields[3])).to.eql(2);

      let holdingInfo = await tokenizedRealty.getHolderForAddress(
        owner.address,
        propertyId
      );
      expect(Number(holdingInfo.valueAtPurchase)).to.eql(10000);
      holdingInfo = await tokenizedRealty.getHolderForAddress(
        otherAccount.address,
        propertyId
      );
      expect(Number(holdingInfo.valueAtPurchase)).to.eql(15000);
    });
  });

  // describe("Property Tokens - Reconciliation / Closing", function() {
  //   const propertyId = 1234;
  //   const endDate = 1666000000; // seconds since epoch
  //   const totalAmount = 5000; // usd

  //   let tokenizedRealty: any;
  //   let usdTokenMock: any;
  //   let oracleMock: any;
  //   let owner: any;
  //   let otherAccount: any;

  //   beforeEach(async () => {
  //     const fixture = await loadFixture(deployTokenizedRealtyFixture);
  //     tokenizedRealty = fixture.tokenizedRealty;
  //     usdTokenMock = fixture.usdTokenMock;
  //     oracleMock = fixture.oracleMock;
  //     owner = fixture.owner;
  //     otherAccount = fixture.otherAccount;
  //     await tokenizedRealty.createPropertyTokens(
  //       propertyId,
  //       endDate,
  //       totalAmount
  //     );
  //   });

  //   it("should correctly create a property token", async function() {});
  // });
});
