const PreSale = artifacts.require("./PreSale.sol")
const RDT = artifacts.require('./RDT')

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

contract('PreSale', function([_, investor, wallet, purchaser]){
  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })
  const rate = new BigNumber(1000);
  const cap = ether(10)
  const value = ether(1)
  const expectedTokenAmount = rate.mul(value)
  const expectedTotalSupply = new BigNumber(13000000*(10**18)).add(expectedTokenAmount)
  const lessThanCap = ether(1)

  beforeEach(async function () {
    this.startTime = latestTime() + duration.days(1);
    this.endTime =   this.startTime + duration.days(1);
    this.afterEndTime = this.endTime + duration.seconds(1)

    this.presale = await PreSale.new( this.startTime, this.endTime, rate, cap, wallet)

    this.token = RDT.at(await this.presale.token())
  })
  it("should have minAmount 0.1 ether", async function(){
    let minAmount = await this.presale.minAmount();
    assert.equal(minAmount,ether(1)/10,"minAmount is not 0.1 ether")
  });
  it("should be token owner", async function(){
    const owner = await this.token.owner();
    assert.equal(owner,this.presale.address);
  });

  it("should have right wallet", async function(){
    let expectedWallet = "0xFfc13f5F46BabD345db7E6AD2DAd229eC427Bf40"
    presale = await PreSale.new( this.startTime, this.endTime, rate, cap, expectedWallet)
    let wallet = await presale.wallet()
    expectedWallet.should.equal(wallet.toLowerCase())
  })

  it('should mint tokens to described wallets on start', async function(){
    let teamWallet = "0x52853f8189482C059ceA50F5BcFf849FcA311a2A"
    let teamBalance = ether(7500000)
    let bonusTokens = ether(2500000);
    let bonusWallet = "0x9D1Ed168DfD0FdeB78dEa2e25F51E4E77b75315c"
    let reserveTokens = ether(3000000);
    let reserveWallet = "0x997BFceD5B2c1ffce76c953E22AFC3c6af6c497F"
    let tokenTeamWallet = await this.token.teamWallet()
    tokenTeamWallet.should.equal(teamWallet.toLowerCase())
    let balance = await this.token.balanceOf(teamWallet)
    balance.should.be.bignumber.equal(teamBalance)
    balance = await this.token.balanceOf(bonusWallet)
    balance.should.be.bignumber.equal(bonusTokens)
    balance = await this.token.balanceOf(reserveWallet)
    balance.should.be.bignumber.equal(reserveTokens)
  })


  it("should be ended after end", async function(){
    let ended = await this.presale.hasEnded();
    assert.equal(ended,false,"was ended before end");
    await increaseTimeTo(this.afterEndTime)
    ended = await this.presale.hasEnded();
    assert.equal(ended,true,"was not ended after end");
  });
  it('should fail with zero cap', async function () {
    await PreSale.new(this.startTime, this.endTime, rate, 0, wallet).should.be.rejectedWith(EVMRevert);
  })
  describe('accepting payments', function () {

    it('should reject payments before start', async function () {
      let pass = true
      try {
        await this.presale.send(value)
        pass = false
      }catch(error){
        assert.include(error.message, "revert",)
      }
      try {
        await this.presale.buyTokens(investor, {from: purchaser, value: value})
        pass = false
      }catch(error){
        assert.include(error.message, "revert",)
      }
      assert.equal(pass, true, "testThrow was supposed to throw but didn't.");
      // await this.presale.buyTokens(investor, {from: purchaser, value: value}).should.be.rejectedWith(EVMRevert)
    })

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime)
      let pass = true
      try {
        await this.presale.send(value)
      }catch(error){
        if(error.message) pass = false
      }
      try {
        await this.presale.buyTokens(investor, {from: purchaser, value: value})
      }catch(error){
      }
      assert.equal(pass, true, "testThrow was supposed to throw but didn't.");
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      let pass = true
      try {
        await this.presale.send(value)
        pass = false
      }catch(error){
        assert.include(error.message, "revert",)
      }
      try {
        await this.presale.buyTokens(investor, {from: purchaser, value: value})
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
      const {logs} = await this.presale.sendTransaction({value: value, from: investor})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.purchaser.should.equal(investor)
      event.args.beneficiary.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should increase totalSupply', async function () {
      await this.presale.send(value)
      const totalSupply = await this.token.totalSupply()
      totalSupply.should.be.bignumber.equal(expectedTotalSupply)
    })

    it('should assign tokens to sender', async function () {
      await this.presale.sendTransaction({value: value, from: investor})
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet)
      await this.presale.sendTransaction({value, from: investor})
      const post = web3.eth.getBalance(wallet)
      post.minus(pre).should.be.bignumber.equal(value)
    })

  })

  describe('low-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('should log purchase', async function () {
      const {logs} = await this.presale.buyTokens(investor, {value: value, from: purchaser})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.purchaser.should.equal(purchaser)
      event.args.beneficiary.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should assign tokens to beneficiary', async function () {
      await this.presale.buyTokens(investor, {value: value, from: purchaser})
      const balance = await this.token.balanceOf(investor)
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })


    it('should increase totalSupply', async function () {
      await this.presale.buyTokens(investor, {value: value, from: purchaser})
      const totalSupply = await this.token.totalSupply()
      totalSupply.should.be.bignumber.equal(expectedTotalSupply)
    })


    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet)
      await this.presale.buyTokens(investor, {value: value, from: purchaser})
      const post = web3.eth.getBalance(wallet)
      post.minus(pre).should.be.bignumber.equal(value)
    })

  })

  describe('accepting payments', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should accept payments within cap', async function () {
      await this.presale.send(new BigNumber(cap).sub(lessThanCap)).should.be.fulfilled
      await this.presale.send(lessThanCap).should.be.fulfilled
    })

    it('should reject payments outside cap', async function () {
      await this.presale.send(cap)
      await this.presale.send(1).should.be.rejectedWith(EVMRevert)
    })

    it('should reject payments that exceed cap', async function () {
      await this.presale.send(new BigNumber(cap).add(1)).should.be.rejectedWith(EVMRevert)
    })

  })

  describe('ending', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })


    it('should reject transfer owner to ico contract before end PreSale', async function(){
      await this.presale.startICO(wallet).should.be.rejectedWith(EVMRevert)
    })

    it('should transfer owner to ico contract after end PreSale', async function(){
      await increaseTimeTo(this.afterEndTime)
      await this.presale.startICO(wallet)
      const owner = await this.token.owner()
      owner.should.equal(wallet)
    })

    it('should not be ended if under cap', async function () {
      let hasEnded = await this.presale.hasEnded()
      hasEnded.should.equal(false)
      await this.presale.send(lessThanCap)
      hasEnded = await this.presale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should not be ended if just under cap', async function () {
      await this.presale.send(new BigNumber(cap).sub(1))
      let hasEnded = await this.presale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should be ended if cap reached', async function () {
      await this.presale.send(cap)
      let hasEnded = await this.presale.hasEnded()
      hasEnded.should.equal(true)
    })


    it('should reject transfer before April 15', async function(){
      await this.presale.send(cap)
      await this.token.transfer(purchaser,1000).should.be.rejectedWith(EVMRevert)
    })

    it('should transfer after April 15', async function(){
      await this.presale.send(cap)
      await increaseTimeTo(1523793620)
      await this.token.transfer(purchaser,1000).should.be.fulfilled
      await increaseTimeTo(1551398420)
      await this.token.transfer(purchaser,15000,{from:"0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE"})
    })

  })
})
