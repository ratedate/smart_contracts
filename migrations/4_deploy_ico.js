var ICO = artifacts.require('./ICO.sol');

module.exports = function(deployer, network, accounts) {
  const cap = web3.toWei(4750, "ether")
  const rate = 6000
  const startTime = 1519480800
  const endTime = 1522260000
  const wallet = "0xFfc13f5F46BabD345db7E6AD2DAd229eC427Bf40"

  const token = "0x60bA75EcA02cB7aC00ec3dd01Bb3FD90f46871E6"
  deployer.deploy(ICO, startTime, endTime, rate, cap, wallet, token, {gas: 1000000})
};
