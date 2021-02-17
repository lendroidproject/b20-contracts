const timeMachine = require("ganache-time-traveler");

const { BN, constants, time, ether, expectRevert } = require("@openzeppelin/test-helpers");

const { expect } = require("chai");

const Market2 = artifacts.require("SimpleMarket2");

const Token0 = artifacts.require("MockToken0");
const Token1 = artifacts.require("MockToken1");
const SimpleWallet = artifacts.require("MockSimpleWallet");

const INDIVIDUAL_CAP = 1000;
const TOTAL_CAP = 360000;
const TOKEN_0_PRICE_IN_TOKEN_1 = 0.36;// 1 Token0 = 0.36 Token1

contract("SimpleMarket2", (accounts) => {

    const owner = accounts[0];
    const tester1 = accounts[1];
    const tester2 = accounts[2];

    this.currentTime = null;

    this.market = null;
    this.marketStart = null;

    this.token0 = null;
    this.token1 = null;
    this.fundsWallet = null;

    before(async () => {
        this.market = await Market2.deployed();
        this.token0 = await Token0.deployed();
        this.token1 = await Token1.deployed();
        this.fundsWallet = await SimpleWallet.deployed();
    });

    beforeEach(async () => {
        this.currentTime = await time.latest();
        this.marketStart = this.currentTime.add(new BN(1209600));// 2 weeks from currentTime
    });

    describe("createMarket", () => {

        after(async () => {
            await time.increaseTo(this.marketStart.add(new BN(1)));// 1 second from marketStart
        });

        it("deploys with owner", async () => {
            assert.equal(owner, await this.market.owner(), "owner is not deployer");
        });

        it("cannot be called by non-owner", async () => {
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: tester1, gas: 2000000 }),
                "Ownable: caller is not the owner",
            );
        });

        it("fails with invalid token0Address", async () => {
            await expectRevert(
                this.market.createMarket(
                    constants.ZERO_ADDRESS, this.token1.address, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : token0Address is not contract",
            );
            await expectRevert(
                this.market.createMarket(
                    tester1, this.token1.address, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : token0Address is not contract",
            );
        });

        it("fails with invalid token1Address", async () => {
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, constants.ZERO_ADDRESS, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : token1Address is not contract",
            );
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, tester1, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : token1Address is not contract",
            );
        });

        it("fails with invalid fundsWalletAddress", async () => {
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, constants.ZERO_ADDRESS,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : invalid fundsWalletAddress",
            );
        });

        it("fails with invalid marketStart", async () => {
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, this.fundsWallet.address,
                    [
                        0,
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : marketStart should be in the future",
            );
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, this.fundsWallet.address,
                    [
                        this.currentTime.sub(new BN(1)),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : marketStart should be in the future",
            );
        });

        it("fails with invalid totalCap", async () => {
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei("0", "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : totalCap cannot be zero",
            );
        });

        it("fails with invalid token1PerToken0", async () => {
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei("0", "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : token1PerToken0 cannot be zero",
            );
        });

        it("fails with invalid individualCap", async () => {
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei("0", "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : individualCap cannot be zero",
            );
        });

        it("configures market parameters correctly", async () => {
            assert.equal(await this.market.token0(), constants.ZERO_ADDRESS);
            assert.equal(await this.market.fundsWallet(), constants.ZERO_ADDRESS);
            expect(await this.market.marketStart()).to.be.bignumber.equal("0");
            expect(await this.market.totalCap()).to.be.bignumber.equal("0");
            expect(await this.market.token1PerToken0()).to.be.bignumber.equal("0");
            expect(await this.market.totalBuyers()).to.be.bignumber.equal("0");
            assert.equal(await this.market.marketClosed(), false);
            await this.market.createMarket(
                this.token0.address, this.token1.address, this.fundsWallet.address,
                [
                    this.marketStart.toNumber(),
                    web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                    web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                    web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                ], { from: owner, gas: 2000000 });
            assert.equal(await this.market.token0(), this.token0.address);
            assert.equal(await this.market.fundsWallet(), this.fundsWallet.address);
            expect(await this.market.marketStart()).to.be.bignumber.equal(this.marketStart.toString());
            expect(await this.market.totalCap()).to.be.bignumber.equal(ether(TOTAL_CAP.toString()));
            expect(await this.market.token1PerToken0()).to.be.bignumber.equal(ether(TOKEN_0_PRICE_IN_TOKEN_1.toString()));
            expect(await this.market.totalBuyers()).to.be.bignumber.equal("0");
            assert.equal(await this.market.marketClosed(), false);
            // cannot createMarket again
            await expectRevert(
                this.market.createMarket(
                    this.token0.address, this.token1.address, this.fundsWallet.address,
                    [
                        this.marketStart.toNumber(),
                        web3.utils.toWei(TOTAL_CAP.toString(), "ether"),
                        web3.utils.toWei(TOKEN_0_PRICE_IN_TOKEN_1.toString(), "ether"),
                        web3.utils.toWei(INDIVIDUAL_CAP.toString(), "ether")
                    ], { from: owner, gas: 2000000 }),
                "{createMarket} : market has already been created",
            );
        });

    });

    describe("pay", () => {

        beforeEach(async() => {
            snapshotId = (await timeMachine.takeSnapshot())["result"];
            // owner mints 1.6M Token0 to owner
            await this.token0.mint(owner, web3.utils.toWei("1000000", "ether"), { from: owner, gas: 1000000 });
            // owner sends 1.6M Token0 to market
            await this.token0.transfer(this.market.address, web3.utils.toWei("1000000", "ether"), { from: owner, gas: 1000000 });
        });

        afterEach(async() => {
            await timeMachine.revertToSnapshot(snapshotId);
        });

        it("succeeds", async () => {
            expect(await this.market.totalBuyers()).to.be.bignumber.equal("0");
            expect(await this.market.totaltoken1Paid()).to.be.bignumber.equal("0");
            expect(await this.token0.balanceOf(this.fundsWallet.address)).to.be.bignumber.equal("0");
            let token1Amount = web3.utils.toWei("360", "ether");
            // owner mints 1000 Token1 to tester1
            await this.token1.mint(tester1, token1Amount, { from: owner, gas: 1000000 });
            expect(await this.token1.balanceOf(tester1)).to.be.bignumber.equal(token1Amount);
            // tester1 approves 1000 Token1 to app
            await this.token1.approve(this.market.address, token1Amount, { from: tester1, gas: 1000000 });
            // tester1 pays 1000 Token1
            expect(await this.token0.balanceOf(tester1)).to.be.bignumber.equal("0");
            await this.market.pay(token1Amount, {from: tester1, gas: 2500000});
            expect(await this.token0.balanceOf(tester1)).to.be.bignumber.equal(web3.utils.toWei("1000", "ether"));
            expect(await this.market.totalBuyers()).to.be.bignumber.equal("1");
            expect(await this.market.buyers(0)).to.be.equal(tester1);
            expect(await this.market.totaltoken1Paid()).to.be.bignumber.equal(token1Amount);
            expect(await this.token1.balanceOf(this.fundsWallet.address)).to.be.bignumber.equal(token1Amount);
            expect(await this.market.payments(tester1)).to.be.bignumber.equal(token1Amount);
        });

        it("fails when contribution amount is 0", async () => {
            await expectRevert(
                this.market.pay(web3.utils.toWei("0", "ether"), {from: tester1, gas: 2000000}),
                "{pay} : token1Amount cannot be zero",
            );
        });

        it("fails if contribution amount exceeds individualCap", async () => {
            let token1Amount = web3.utils.toWei("2000", "ether");
            // owner mints 1000 Token1 to tester1
            await this.token1.mint(tester1, token1Amount, { from: owner, gas: 1000000 });
            expect(await this.token1.balanceOf(tester1)).to.be.bignumber.equal(token1Amount);
            // tester1 approves 1000 Token1 to app
            await this.token1.approve(this.market.address, token1Amount, { from: tester1, gas: 1000000 });
            // tester1 pays 999 Token1 to app
            await this.market.pay(web3.utils.toWei("999", "ether"), {from: tester1, gas: 2500000});
            expect(await this.token1.balanceOf(this.fundsWallet.address)).to.be.bignumber.equal(web3.utils.toWei("999", "ether"));
            expect(await this.token0.balanceOf(tester1)).to.be.bignumber.equal(web3.utils.toWei("2775", "ether"));
            // fails when tester2 tries to pay 150K Token1 to app
            await expectRevert(
                this.market.pay(web3.utils.toWei("2", "ether"), {from: tester1, gas: 2500000}),
                "{pay} : token1Amount cannot exceed individualCap",
            );
        });
    });

    describe("closeMarket", () => {

        beforeEach(async() => {
            snapshotId = (await timeMachine.takeSnapshot())["result"];
            // owner mints 1.6M Token0 to owner
            await this.token0.mint(owner, web3.utils.toWei("1000000", "ether"), { from: owner, gas: 1000000 });
            // owner sends 1.6M Token0 to market
            await this.token0.transfer(this.market.address, web3.utils.toWei("1000000", "ether"), { from: owner, gas: 1000000 });
        });

        afterEach(async() => {
            await timeMachine.revertToSnapshot(snapshotId);
        });

        it("succeeds", async () => {
            // owner mints 300K Token1 to tester1
            let token1Amount = web3.utils.toWei("300000", "ether");
            await this.token1.mint(tester1, token1Amount, { from: owner, gas: 1000000 });
            // tester1 approves 300K Token1 to app
            await this.token1.approve(this.market.address, token1Amount, { from: tester1, gas: 1000000 });
            // owner mints 300K Token1 to tester2
            await this.token1.mint(tester2, token1Amount, { from: owner, gas: 1000000 });
            // tester2 approves 300K Token1 to app
            await this.token1.approve(this.market.address, token1Amount, { from: tester2, gas: 1000000 });
            // tester1 pays 1000 Token1 to app
            await this.market.pay(web3.utils.toWei("1000", "ether"), {from: tester1, gas: 2500000});
            // tester2 pays 1000 Token1 to app
            await this.market.pay(web3.utils.toWei("1000", "ether"), {from: tester2, gas: 2500000});
            expect(await this.market.marketOpen(), true);
            expect(await this.market.marketClosed(), false);
            // owner successfully closes the market
            await this.market.closeMarket({from: owner, gas: 100000});
            expect(await this.market.marketOpen(), false);
            expect(await this.market.marketClosed(), true);
        });

        it("works even if totaltoken1Paid is 0", async () => {
            expect(await this.market.totaltoken1Paid()).to.be.bignumber.equal("0");
            await this.market.closeMarket({from: owner, gas: 100000});
        });

        it("fails if called by non-owner", async () => {
            await expectRevert(
                this.market.closeMarket({from: tester1, gas: 100000}),
                "Ownable: caller is not the owner",
            );
        });

        it("fails if called more than once", async () => {
            await this.market.closeMarket({from: owner, gas: 100000});
            await expectRevert(
                this.market.closeMarket({from: owner, gas: 100000}),
                "{closeMarket} : marketStatus is not OPEN",
            );
        });
    });

});