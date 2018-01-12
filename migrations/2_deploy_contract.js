var PreSale = artifacts.require('./PreSale.sol');

module.exports = function(deployer, network, accounts) {
  const cap = web3.toWei(250, "ether")
  const rate = 9000
  const startTime = 1516024800
  const endTime = 1517162400
  const wallet = "0xFfc13f5F46BabD345db7E6AD2DAd229eC427Bf40"
  console.log(wallet)
  deployer.deploy(PreSale, startTime, endTime, rate, cap, wallet)
};
