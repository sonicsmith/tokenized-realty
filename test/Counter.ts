import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Counter", function() {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCounterFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy();

    return { counter, owner, otherAccount };
  }

  describe("Deployment", function() {
    it("Should set the correct default state", async function() {
      const { counter } = await loadFixture(deployCounterFixture);

      expect(await counter.get()).to.equal("0");
    });
  });

  describe("Interactions", function() {
    it("Should increment count", async function() {
      const { counter } = await loadFixture(deployCounterFixture);
      await counter.inc();
      expect(await counter.get()).to.equal("1");
    });
    it("Should decrement count", async function() {
      const { counter } = await loadFixture(deployCounterFixture);
      await counter.inc();
      await counter.inc();
      await counter.dec();
      expect(await counter.get()).to.equal("1");
    });
    it("Should throw error when trying to set decrement below zero", async function() {
      const { counter } = await loadFixture(deployCounterFixture);
      await expect(counter.dec()).to.be.revertedWith(
        "Count cannot be negative"
      );
    });
  });
});
