const ICO = artifacts.require("./ICO.sol")
const RDT = artifacts.require('./RDT.sol')
const RDTallocation = artifacts.require('./RDTallocation.sol')

const EVMRevert = "revert"
const BigNumber = web3.BigNumber
const increaseTime = function(duration) {
  const id = Date.now()

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id: id,
    }, err1 => {
      if (err1) return reject(err1)

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id+1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res)
      })
    })
  })
}
function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}
function increaseTimeTo(target) {
  let now = latestTime();
  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  let diff = target - now;
  return increaseTime(diff);
}
const ether = function(eth){
  return web3.toWei(eth, 'ether')
}
const duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)}
};
function advanceBlock() {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now(),
    }, (err, res) => {
      return err ? reject(err) : resolve(res)
    })
  })
}
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('ICO', function([_, investor, wallet, purchaser]){
  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })
  const rate = new BigNumber(1000);
  const cap = ether(10)
  const value = ether(1)
  const expectedTokenAmount = rate.add(1200).mul(value)
  const expectedTotalSupply = new BigNumber(15576232144486000000000000)
  const lessThanCap = ether(1)
  const ICObalance = new BigNumber(34423767855514000000000000);

  beforeEach(async function () {
    this.startTime = latestTime() + duration.days(1);
    this.endTime =   this.startTime + duration.days(1);
    this.afterEndTime = this.endTime + duration.seconds(1)

    this.token = await RDT.new({gas: 3000000});
    const presaleSupply = 2576232144486000000000000;
    const result = await this.token.mint(purchaser, presaleSupply);
    this.ico = await ICO.new( this.startTime, this.endTime, rate, cap, wallet, this.token.address,{gas: 3000000})
    const result1 = await this.token.transferOwnership(this.ico.address);
  })
  it("should have minAmount 0.1 ether", async function(){
    let minAmount = await this.ico.minAmount();
    assert.equal(minAmount,ether(1)/10,"minAmount is not 0.1 ether")
  });
  it("should be token owner", async function(){
    const owner = await this.token.owner();
    assert.equal(owner,this.ico.address);
  });

  it("should have right wallet", async function(){
    let expectedWallet = "0xffc13f5f46babd345db7e6ad2dad229ec427bf40"
    ico = await ICO.new( this.startTime, this.endTime, rate, cap, expectedWallet, this.token.address)
    let wallet = await ico.wallet()
    expectedWallet.should.equal(wallet)
  })

  it('should mint tokens to themself', async function(){
    await this.ico.initICO();
    let balance = await this.token.balanceOf(this.ico.address)
    balance.should.be.bignumber.equal(ICObalance)
  })


  it("should be ended after end", async function(){
    let ended = await this.ico.hasEnded();
    assert.equal(ended,false,"was ended before end");
    await increaseTimeTo(this.afterEndTime)
    ended = await this.ico.hasEnded();
    assert.equal(ended,true,"was not ended after end");
  });
  it('should fail with zero cap', async function () {
    await ICO.new(this.startTime, this.endTime, rate, 0, wallet).should.be.rejectedWith(EVMRevert);
  })
  describe('accepting payments', function () {

    it('should reject payments before start', async function () {
      let pass = true
      try {
        await this.ico.send(value)
        pass = false
      }catch(error){
        assert.include(error.message, "revert",)
      }
      try {
        await this.ico.buyTokens(investor, {from: purchaser, value: value})
        pass = false
      }catch(error){
        assert.include(error.message, "revert",)
      }
      assert.equal(pass, true, "testThrow was supposed to throw but didn't.");
      // await this.ico.buyTokens(investor, {from: purchaser, value: value}).should.be.rejectedWith(EVMRevert)
    })

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime)
      let pass = true
      try {
        await this.ico.send(value)
      }catch(error){
        if(error.message) pass = false
      }
      try {
        await this.ico.buyTokens(investor, {from: purchaser, value: value})
      }catch(error){
      }
      assert.equal(pass, true, "testThrow was supposed to throw but didn't.");
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      let pass = true
      try {
        await this.ico.send(value)
        pass = false
      }catch(error){
        assert.include(error.message, "revert",)
      }
      try {
        await this.ico.buyTokens(investor, {from: purchaser, value: value})
        pass = false
      }catch(error){
        assert.include(error.message, "revert",)
      }
      assert.equal(pass, true, "testThrow was supposed to throw but didn't.");
    })

  })

  describe('high-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('should log purchase', async function () {
      const {logs} = await this.ico.sendTransaction({value: value, from: investor})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.purchaser.should.equal(investor)
      event.args.beneficiary.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should not increase totalSupply', async function () {
      await this.ico.send(value)
      const totalSupply = await this.token.totalSupply()
      totalSupply.should.be.bignumber.equal(expectedTotalSupply)
    })

    it('should assign tokens to sender(at ICO)', async function () {
      await this.ico.sendTransaction({value: value, from: investor})
      let balance = await this.ico.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet)
      await this.ico.sendTransaction({value, from: investor})
      const post = web3.eth.getBalance(wallet)
      post.minus(pre).should.be.bignumber.equal(value)
    })

  })

  describe('low-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('should log purchase', async function () {
      const {logs} = await this.ico.buyTokens(investor, {value: value, from: purchaser})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.purchaser.should.equal(purchaser)
      event.args.beneficiary.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should assign tokens to beneficiary', async function () {
      await this.ico.buyTokens(investor, {value: value, from: purchaser})
      const balance = await this.ico.balanceOf(investor)
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })


    it('should increase totalSupply', async function () {
      await this.ico.buyTokens(investor, {value: value, from: purchaser})
      const totalSupply = await this.token.totalSupply()
      totalSupply.should.be.bignumber.equal(expectedTotalSupply)
    })


    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet)
      await this.ico.buyTokens(investor, {value: value, from: purchaser})
      const post = web3.eth.getBalance(wallet)
      post.minus(pre).should.be.bignumber.equal(value)
    })

  })

  describe('accepting payments', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should accept payments within cap', async function () {
      await this.ico.send(new BigNumber(cap).sub(lessThanCap)).should.be.fulfilled
      await this.ico.send(lessThanCap).should.be.fulfilled
    })

    it('should reject payments outside cap', async function () {
      await this.ico.send(cap)
      await this.ico.send(1).should.be.rejectedWith(EVMRevert)
    })

    it('should reject payments that exceed cap', async function () {
      await this.ico.send(new BigNumber(cap).add(1)).should.be.rejectedWith(EVMRevert)
    })

  })

  describe('ending', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })


    it('should not be ended if under cap', async function () {
      let hasEnded = await this.ico.hasEnded()
      hasEnded.should.equal(false)
      await this.ico.send(lessThanCap)
      hasEnded = await this.ico.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should not be ended if just under cap', async function () {
      await this.ico.send(new BigNumber(cap).sub(1))
      let hasEnded = await this.ico.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should be ended if cap reached', async function () {
      await this.ico.send(cap)
      let hasEnded = await this.ico.hasEnded()
      hasEnded.should.equal(true)
    })


    it('should be ended manually', async function () {
      await this.ico.endICO()
      let hasEnded = await this.ico.hasEnded()
      hasEnded.should.equal(true)
    })


    it('should allow transfer after April 15', async function (){
      await this.ico.initICO();
      this.rdtallocation = await RDTallocation.new(this.token.address, this.ico.address)
      await this.ico.allowTransfer(this.rdtallocation.address)
      let transferAmount = await this.token.allowance(this.ico.address, this.rdtallocation.address)
      transferAmount.should.be.bignumber.equal(ICObalance)
      await increaseTimeTo(1523793601)
      let transfer = await this.rdtallocation.allocate()
      let balance = await this.token.balanceOf("0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc")
      const expextedBalance = ether(500000)
      balance.should.be.bignumber.equal(expextedBalance)
    })

  })
})
