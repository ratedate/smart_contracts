var PreSale = artifacts.require('./PreSale.sol');

module.exports = function(deployer, network, accounts) {
  const cap = web3.toWei(250, "ether")
  const rate = 9000
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 120
  const endTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10000
  const wallet = "0xFfc13f5F46BabD345db7E6AD2DAd229eC427Bf40"
  deployer.deploy(PreSale, startTime, endTime, rate, cap, wallet, {gas: 4000000})
};
