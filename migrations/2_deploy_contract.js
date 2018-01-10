var PreSale = artifacts.require('./PreSale.sol');

module.exports = function(deployer, network, accounts) {
  const cap = web3.toWei(250, "ether")
  const rate = 9000
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10 // 1515533400 // 
  const endTime = 1517140800
  const wallet = accounts[0]
  console.log(cap)
  console.log(wallet)
  deployer.deploy(PreSale, startTime, endTime, rate, cap, wallet)
};
