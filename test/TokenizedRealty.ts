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
    const [
      owner,
      otherAccountA,
      otherAccountB,
      otherAccountC,
    ] = await ethers.getSigners();
    const chainId = network.config.chainId || 31337;
    const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"]);
    const fee = networkConfig[chainId]["fee"];
    const linkTokenMockFactory = await ethers.getContractFactory("LinkToken");
    const linkTokenMock = await linkTokenMockFactory.deploy();

    const usdTokenMockFactory = await ethers.getContractFactory("ERC20Mock");
    const usdTokenMock = await usdTokenMockFactory.deploy(
      "USDC",
      "USDC",
      100000
    );

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

    // Give USD to other accounts
    await usdTokenMock.transfer(otherAccountA.address, 10000);
    await usdTokenMock.transfer(otherAccountB.address, 10000);
    await usdTokenMock.transfer(otherAccountC.address, 10000);

    return {
      tokenizedRealty,
      owner,
      otherAccountA,
      otherAccountB,
      otherAccountC,
      oracleMock,
      linkTokenMock,
      usdTokenMock,
    };
  }

  describe("Deployment", function() {
    it("should set the correct default state", async function() {
      const { tokenizedRealty } = await loadFixture(
        deployTokenizedRealtyFixture
      );
      const list = await tokenizedRealty.getPropertyTokenList();
      expect(list.length).to.eql(0);
    });
  });

  describe("Property Tokens - Creation", function() {
    const propertyZip = 90210;
    const tokenExpiry = Math.round(Date.now() / 1000);
    const totalAmount = 5000; // usd

    let tokenizedRealty: any;
    let usdTokenMock: any;

    beforeEach(async () => {
      const fixture = await loadFixture(deployTokenizedRealtyFixture);
      tokenizedRealty = fixture.tokenizedRealty;
      usdTokenMock = fixture.usdTokenMock;
      const collateral = totalAmount * 0.1;
      await usdTokenMock.approve(tokenizedRealty.address, collateral);
      await tokenizedRealty.createPropertyTokens(
        propertyZip,
        tokenExpiry,
        totalAmount
      );
    });

    it("should correctly create a property token", async function() {
      const list = await tokenizedRealty.getPropertyTokenList();
      expect(Number(list[0])).to.equal(propertyZip);
      const fields = await tokenizedRealty.getPropertyToken(propertyZip);
      const formattedFields = fields.map((field: BigInt) => Number(field));
      expect(formattedFields).to.eql([
        tokenExpiry,
        totalAmount,
        totalAmount, // amountAvailable
        0, // numberOfHolders
        0, // debit
        0, // credit
      ]);
    });

    it("should correctly create multiple property tokens", async function() {
      const collateral = 20000 * 0.1;
      await usdTokenMock.approve(tokenizedRealty.address, collateral);
      await tokenizedRealty.createPropertyTokens(1235, 1667000000, 20000);

      const list = await tokenizedRealty.getPropertyTokenList();
      expect(Number(list[0])).to.equal(propertyZip);
      expect(Number(list[1])).to.equal(1235);
      const fields = await tokenizedRealty.getPropertyToken(1235);
      const formattedFields = fields.map((field: BigInt) => Number(field));
      expect(formattedFields).to.eql([
        1667000000,
        20000,
        20000, // amountAvailable
        0, // numberOfHolders
        0, // debit
        0, // credit
      ]);
    });

    it("should reject duplicate property id creation", async function() {
      const collateral = totalAmount * 0.1;
      await usdTokenMock.approve(tokenizedRealty.address, collateral);
      await expect(
        tokenizedRealty.createPropertyTokens(
          propertyZip,
          1667000000,
          totalAmount
        )
      ).to.be.rejectedWith("Property exists");
    });
  });

  describe("Property Tokens - Purchasing", function() {
    const propertyZip = 90210;
    const tokenExpiry = Math.round(Date.now() / 1000) + 10;
    const totalAmount = 5000; // usd

    let tokenizedRealty: any;
    let usdTokenMock: any;
    let oracleMock: any;
    let owner: any;
    let otherAccountA: any;

    beforeEach(async () => {
      const fixture = await loadFixture(deployTokenizedRealtyFixture);
      tokenizedRealty = fixture.tokenizedRealty;
      usdTokenMock = fixture.usdTokenMock;
      oracleMock = fixture.oracleMock;
      owner = fixture.owner;
      otherAccountA = fixture.otherAccountA;
      const collateral = totalAmount * 0.1;
      await usdTokenMock.approve(tokenizedRealty.address, collateral);
      await tokenizedRealty.createPropertyTokens(
        propertyZip,
        tokenExpiry,
        totalAmount
      );
    });

    it("should correctly handle purchasing of tokens", async function() {
      await usdTokenMock.approve(tokenizedRealty.address, 1700);
      const transaction = await tokenizedRealty.purchasePropertyTokens(
        propertyZip,
        1700
      );
      const transactionReceipt = await transaction.wait(1);
      const requestId = transactionReceipt?.events?.[2].topics[1];
      const fields = await tokenizedRealty.getPropertyToken(propertyZip);
      const formattedFields = fields.map((field: BigInt) => Number(field));
      expect(formattedFields).to.eql([
        tokenExpiry,
        totalAmount,
        3300, // amountAvailable
        1, // numberOfHolders
        0, // debit
        0, // credit
      ]);
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10000));
      const holdingInfo = await tokenizedRealty.getHolderForAddress(
        owner.address,
        propertyZip
      );
      expect(Number(holdingInfo.valueAtPurchase)).to.eql(10000);
    });

    it("should correctly handle multiple purchasing of tokens", async function() {
      await usdTokenMock.approve(tokenizedRealty.address, 1700);
      let transaction = await tokenizedRealty.purchasePropertyTokens(
        propertyZip,
        1700
      );
      // Populate the first valuation
      let transactionReceipt = await transaction.wait(1);
      let requestId = transactionReceipt?.events?.[2].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10000));

      // Second purchase
      await usdTokenMock
        .connect(otherAccountA)
        .approve(tokenizedRealty.address, 3300);
      transaction = await tokenizedRealty
        .connect(otherAccountA)
        .purchasePropertyTokens(propertyZip, 3300);

      // Populate the second valuation
      transactionReceipt = await transaction.wait(1);
      requestId = transactionReceipt?.events?.[2].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(15000));
      const fields = await tokenizedRealty.getPropertyToken(propertyZip);
      const formattedFields = fields.map((field: BigInt) => Number(field));
      expect(formattedFields).to.eql([
        tokenExpiry,
        totalAmount,
        0, // amountAvailable
        2, // numberOfHolders
        0, // debit
        0, // credit
      ]);
      let holdingInfo = await tokenizedRealty.getHolderForAddress(
        owner.address,
        propertyZip
      );
      expect(Number(holdingInfo.valueAtPurchase)).to.eql(10000);
      holdingInfo = await tokenizedRealty.getHolderForAddress(
        otherAccountA.address,
        propertyZip
      );
      expect(Number(holdingInfo.valueAtPurchase)).to.eql(15000);
    });

    it("should reject multiple purchasing by same user of tokens", async function() {
      await usdTokenMock.approve(tokenizedRealty.address, 1700);
      await tokenizedRealty.purchasePropertyTokens(propertyZip, 1700);

      // Second purchase
      await usdTokenMock.approve(tokenizedRealty.address, 3300);
      await expect(
        tokenizedRealty.purchasePropertyTokens(propertyZip, 3300)
      ).to.be.rejectedWith("Holder already exists");
    });

    describe("Property Tokens - Reconciliation", function() {
      const propertyZip = 90210;
      const tokenExpiry = Math.round(Date.now() / 1000) + 10;
      const totalAmount = 5000; // usd

      let tokenizedRealty: any;
      let usdTokenMock: any;
      let oracleMock: any;
      let owner: any;
      let otherAccountA: any;
      let otherAccountB: any;

      beforeEach(async () => {
        const fixture = await loadFixture(deployTokenizedRealtyFixture);
        tokenizedRealty = fixture.tokenizedRealty;
        usdTokenMock = fixture.usdTokenMock;
        oracleMock = fixture.oracleMock;
        owner = fixture.owner;
        otherAccountA = fixture.otherAccountA;
        otherAccountB = fixture.otherAccountB;
        const collateral = totalAmount * 0.1;
        await usdTokenMock.approve(tokenizedRealty.address, collateral);
        await tokenizedRealty.createPropertyTokens(
          propertyZip,
          tokenExpiry,
          totalAmount
        );

        // First purchase
        await usdTokenMock
          .connect(otherAccountA)
          .approve(tokenizedRealty.address, 2000);
        let transaction = await tokenizedRealty
          .connect(otherAccountA)
          .purchasePropertyTokens(propertyZip, 2000);
        // Populate the first valuation
        let transactionReceipt = await transaction.wait(1);
        let requestId = transactionReceipt?.events?.[2].topics[1];
        await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10000));

        // Second purchase
        await usdTokenMock
          .connect(otherAccountB)
          .approve(tokenizedRealty.address, 3000);
        transaction = await tokenizedRealty
          .connect(otherAccountB)
          .purchasePropertyTokens(propertyZip, 3000);

        // Populate the second valuation
        transactionReceipt = await transaction.wait(1);
        requestId = transactionReceipt?.events?.[2].topics[1];
        await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10100));
      });

      it("should correctly return list of holders", async function() {
        const holders = await tokenizedRealty.getHoldersForToken(propertyZip);
        expect(holders).to.eql([
          owner.address,
          otherAccountA.address,
          otherAccountB.address,
        ]);
      });

      it("should correctly reconcile property tokens", async function() {
        const transaction = await tokenizedRealty.reconcilePropertyTokens(
          propertyZip
        );
        const transactionReceipt = await transaction.wait(1);
        const requestId = transactionReceipt?.events?.[0].topics[1];
        await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10200));

        let holdingInfo = await tokenizedRealty.getHolderForAddress(
          otherAccountA.address,
          propertyZip
        );
        // 2% of $2000
        expect(Number(holdingInfo.credit)).to.eql(40);

        holdingInfo = await tokenizedRealty.getHolderForAddress(
          otherAccountB.address,
          propertyZip
        );
        // 0.99% of $3000
        expect(Number(holdingInfo.credit)).to.eql(29);

        const fields = await tokenizedRealty.getPropertyToken(propertyZip);
        const formattedFields = fields.map((field: BigInt) => Number(field));
        expect(formattedFields).to.eql([
          tokenExpiry,
          totalAmount,
          0, // amountAvailable
          2, // numberOfHolders
          69, // debit
          0, // credit
        ]);
      });

      it("should correctly cap amount owing in line with COLLATERALIZED_PERCENTAGE", async function() {
        const transaction = await tokenizedRealty.reconcilePropertyTokens(
          propertyZip
        );
        const transactionReceipt = await transaction.wait(1);
        const requestId = transactionReceipt?.events?.[0].topics[1];
        await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(20000));

        let holdingInfo = await tokenizedRealty.getHolderForAddress(
          otherAccountA.address,
          propertyZip
        );
        // 10% (COLLATERALIZED_PERCENTAGE) of $2000
        expect(Number(holdingInfo.credit)).to.eql(200);
      });

      it("should block reconciliation of property tokens before end date", async function() {
        const collateral = totalAmount * 0.1;
        await usdTokenMock.approve(tokenizedRealty.address, collateral);
        const tomorrow = Date.now() + 86400;
        await tokenizedRealty.createPropertyTokens(1235, tomorrow, totalAmount);
        await expect(
          tokenizedRealty.reconcilePropertyTokens(1235)
        ).to.be.revertedWith("Tokens still active");
      });
    });
  });

  describe("Property Tokens - Claiming", function() {
    const propertyZip = 90210;
    const tokenExpiry = Math.round(Date.now() / 1000) + 10;
    const totalAmount = 5000; // usd

    let tokenizedRealty: any;
    let usdTokenMock: any;
    let oracleMock: any;
    let owner: any;
    let otherAccountA: any;
    let otherAccountB: any;
    let otherAccountC: any;

    beforeEach(async () => {
      const fixture = await loadFixture(deployTokenizedRealtyFixture);
      tokenizedRealty = fixture.tokenizedRealty;
      usdTokenMock = fixture.usdTokenMock;
      oracleMock = fixture.oracleMock;
      owner = fixture.owner;
      otherAccountA = fixture.otherAccountA;
      otherAccountB = fixture.otherAccountB;
      otherAccountC = fixture.otherAccountC;
      const collateral = totalAmount * 0.1;
      await usdTokenMock.approve(tokenizedRealty.address, collateral);
      await tokenizedRealty.createPropertyTokens(
        propertyZip,
        tokenExpiry,
        totalAmount
      );

      // First purchase
      await usdTokenMock
        .connect(otherAccountA)
        .approve(tokenizedRealty.address, 2000);
      let transaction = await tokenizedRealty
        .connect(otherAccountA)
        .purchasePropertyTokens(propertyZip, 2000);
      // Populate the first valuation
      let transactionReceipt = await transaction.wait(1);
      let requestId = transactionReceipt?.events?.[2].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10000));

      // Second purchase
      await usdTokenMock
        .connect(otherAccountB)
        .approve(tokenizedRealty.address, 3000);
      transaction = await tokenizedRealty
        .connect(otherAccountB)
        .purchasePropertyTokens(propertyZip, 3000);
      // Populate the second valuation
      transactionReceipt = await transaction.wait(1);
      requestId = transactionReceipt?.events?.[2].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10100));

      // Reconcile
      transaction = await tokenizedRealty.reconcilePropertyTokens(propertyZip);
      transactionReceipt = await transaction.wait(1);
      requestId = transactionReceipt?.events?.[0].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10200));
    });

    it("should allow claiming of profits from property tokens", async function() {
      // Check holder 1
      let balanceA = await usdTokenMock.balanceOf(otherAccountA.address);
      expect(Number(balanceA)).to.eql(8000);
      await tokenizedRealty
        .connect(otherAccountA)
        .claimPropertyTokenEarnings(propertyZip);
      balanceA = await usdTokenMock.balanceOf(otherAccountA.address);
      // Gain of $40
      expect(Number(balanceA)).to.eql(8000 + 2040);
      // Check holder 2
      let balanceB = await usdTokenMock.balanceOf(otherAccountB.address);
      expect(Number(balanceB)).to.eql(7000);
      await tokenizedRealty
        .connect(otherAccountB)
        .claimPropertyTokenEarnings(propertyZip);
      balanceB = await usdTokenMock.balanceOf(otherAccountB.address);
      // Gain of $29
      expect(Number(balanceB)).to.eql(7000 + 3029);
      // Check creator of tokens
      let balanceC = await usdTokenMock.balanceOf(owner.address);
      expect(Number(balanceC)).to.eql(69500);
      await tokenizedRealty
        .connect(owner)
        .claimPropertyTokenEarnings(propertyZip);
      balanceC = await usdTokenMock.balanceOf(owner.address);
      // Loss of $69
      expect(Number(balanceC)).to.eql(69500 + 431);
    });

    it("should allow duplicate creation of property tokens after settlement", async function() {
      await tokenizedRealty
        .connect(otherAccountA)
        .claimPropertyTokenEarnings(propertyZip);
      await tokenizedRealty
        .connect(otherAccountB)
        .claimPropertyTokenEarnings(propertyZip);
      await tokenizedRealty
        .connect(owner)
        .claimPropertyTokenEarnings(propertyZip);
      const collateral = totalAmount * 0.1;
      await usdTokenMock.approve(tokenizedRealty.address, collateral);
      await expect(
        tokenizedRealty.createPropertyTokens(
          propertyZip,
          1667000000,
          totalAmount
        )
      ).to.not.be.reverted;
    });

    it("should block claiming of profits before property tokens life has ended ", async function() {
      const collateral = totalAmount * 0.1;
      await usdTokenMock.approve(tokenizedRealty.address, collateral);
      await tokenizedRealty.createPropertyTokens(
        1235,
        tokenExpiry,
        totalAmount
      );

      // First purchase
      await usdTokenMock
        .connect(otherAccountA)
        .approve(tokenizedRealty.address, 2000);
      let transaction = await tokenizedRealty
        .connect(otherAccountA)
        .purchasePropertyTokens(1235, 2000);
      // Populate the first valuation
      let transactionReceipt = await transaction.wait(1);
      let requestId = transactionReceipt?.events?.[2].topics[1];
      await oracleMock.fulfillOracleRequest(requestId!, numToBytes32(10000));
      await expect(
        tokenizedRealty.connect(otherAccountA).claimPropertyTokenEarnings(1235)
      ).to.be.revertedWith("Tokens not yet reconciled");
    });

    it("should block claiming of already claimed profits from property tokens", async function() {
      await tokenizedRealty
        .connect(otherAccountA)
        .claimPropertyTokenEarnings(propertyZip);
      await expect(
        tokenizedRealty
          .connect(otherAccountA)
          .claimPropertyTokenEarnings(propertyZip)
      ).to.be.revertedWith("Tokens already claimed");
    });

    it("should block claiming of profits for non-holders", async function() {
      await expect(
        tokenizedRealty
          .connect(otherAccountC)
          .claimPropertyTokenEarnings(propertyZip)
      ).to.be.revertedWith("Caller not a holder");
    });
  });
});
