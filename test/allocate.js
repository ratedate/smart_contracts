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


  describe('ending', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
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

    it('should burn tokens', async function(){
      await increaseTimeTo(1523793601)
      await this.ico.burnTokens()
      const balance = await this.token.balanceOf(this.ico.address)
      balance.should.equal(0)
      const totalSupply1 = await this.token.totalSupply()
      console.log(totalSupply1);
    })

  })
})
