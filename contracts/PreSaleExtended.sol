pragma solidity ^0.4.11;

import "./RDT.sol";
import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract PreSaleExtended is CappedCrowdsale, Ownable{
  uint256 public minAmount = 1 ether/10;

  function PreSaleExtended(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _cap, address _wallet, MintableToken _token, uint256 _weiRaised) public
    CappedCrowdsale(_cap)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    require(_token!=address(0));
    require(_weiRaised > 0);
    token = _token;
    weiRaised = _weiRaised;
  }
  function validPurchase() internal view returns (bool){
    bool overMinAmount = msg.value >= minAmount;
    return super.validPurchase() && overMinAmount;
  }
  function createTokenContract() internal returns (MintableToken) {
    return token;
  }
  function startICO(address contractICO) onlyOwner public returns(bool){
    require(now > endTime);
    token.transferOwnership(contractICO);
    return true;
  }
}
