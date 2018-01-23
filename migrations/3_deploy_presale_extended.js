var PreSaleExtended = artifacts.require('./PreSaleExtended.sol');
var PreSale = artifacts.require('./PreSale.sol');

module.exports = function(deployer, network, accounts) {
  const cap = web3.toWei(250, "ether")
  const rate = 9000
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 120
  const endTime = 1518285600
  const wallet = "0xFfc13f5F46BabD345db7E6AD2DAd229eC427Bf40"
  const weiRaised = web3.toWei(9.1755, "ether")
  PreSale.deployed().then(function (instance){
    return instance.token.call();
  }).then(function(token){
    deployer.deploy(PreSaleExtended, startTime, endTime, rate, cap, wallet, token, weiRaised, {gas: 5000000})
  });
};
