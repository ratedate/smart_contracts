var ETZallocation = artifacts.require('./ETZallocation.sol');
var PreSale = artifacts.require('./PreSale.sol');

module.exports = function(deployer, network, accounts) {

  const token = "0x60bA75EcA02cB7aC00ec3dd01Bb3FD90f46871E6"
  deployer.deploy(ETZallocation, token, {gas: 600000})
  // PreSale.deployed().then(function (instance){
  //   return instance.token.call();
  // }).then(function(token){
  //   deployer.deploy(ETZallocation, token, {gas: 600000})
  // });
};
