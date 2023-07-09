const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("EdArt", () => {
  let deployer, minter;
  let edArt;

  const OWNER = process.env.OWNER;
  const BASE_URI = process.env.BASE_URI;
  const COST = tokens(process.env.COST);

  beforeEach(async () => {
    // Setup accounts
    [deployer, minter] = await ethers.getSigners();

    // Deploy the contract with constructor arguments
    const EdArt = await ethers.getContractFactory("EdArt");
    edArt = await EdArt.deploy(OWNER, BASE_URI, COST);

    // reserve
    const transaction_reserve = await edArt.connect(deployer).reserve();
    await transaction_reserve.wait();

    // activate Sale
    const transaction_sale_state = await edArt.connect(deployer).setSaleState(true);
    await transaction_sale_state.wait();

    // mint
    const transaction_mint = await edArt.connect(minter).mint(1, { value: tokens(0.069) });
    await transaction_mint.wait();
  });

  describe("Deployment", () => {
    it("Returns owner", async () => {
      const result = await edArt.owner();
      expect(result).to.be.equal(deployer.address);
    });

    it("Returns cost", async () => {
      const result = await edArt.cost();
      expect(result).to.be.equal(COST);
    });

    it("Returns sale state", async () => {
      const result = await edArt.saleIsActive();
      expect(result).to.be.true;
    });
  });

  describe("Minting", () => {
    it("Returns owner", async () => {
      const result = await edArt.ownerOf("10");
      expect(result).to.be.equal(deployer.address);
    });

    it("Returns URI", async () => {
      const result = await edArt.tokenURI("10");
      expect(result).to.be.equal(BASE_URI + "10");
    });

    it("Updates total supply", async () => {
      const result = await edArt.totalSupply();
      expect(result).to.be.equal("41");
    });
  });

  describe("Redeeming", () => {
    it("Is not redeemed", async () => {
      const result = await edArt.connect(deployer).isRedeemed(0);
      expect(result).to.be.equal(false);
    });

    it("Is redeemed", async () => {
      const transaction = await edArt.connect(deployer).redeem(0);
      await transaction.wait();

      const result = await edArt.connect(deployer).isRedeemed(0);
      expect(result).to.be.equal(true);
    });

    it("Is only token owner redeemable", async () => {
      try {
        const transaction = await edArt.connect(minter).redeem(0);
        await transaction.wait();
        assert.fail("Expected an error to be thrown");
      } catch (error) {
        assert.include(error.message, "Only the owner", "Error message mismatch");
      }
    });
  });

  describe("Withdrawing", () => {
    let balanceBefore;

    beforeEach(async () => {
      balanceBefore = await ethers.provider.getBalance(deployer.address);
      const transaction = await edArt.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Updates the owner balance", async () => {
      const result = await ethers.provider.getBalance(deployer.address);
      const result_float = parseFloat(ethers.utils.formatEther(result));
      const balanceBefore_float = parseFloat(ethers.utils.formatEther(balanceBefore));
      expect(result_float).to.be.greaterThan(balanceBefore_float);
    });

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(edArt.address);
      expect(result).to.equal(0);
    });
  });
});
