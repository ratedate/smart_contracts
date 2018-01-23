pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/RefundableCrowdsale.sol";
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import "./RDT.sol";

contract ICO is CappedCrowdsale, RefundableCrowdsale{
  /* uint256 icoStartTime = 1518444000;
  uint256 icoEndTime = 1522260000;
  uint256 icoCap = 5000*1 ether - weiRaised;
  uint256 icoRate = 6000;
  uint256 icoGoal = 250 * 1 ether; */
  function ICO(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _goal, uint256 _cap, address _wallet, MintableToken _token) public
  CappedCrowdsale(_cap)
  FinalizableCrowdsale()
  RefundableCrowdsale(_goal)
  Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    require(_goal <= _cap);
    require(_token != address(0));
    token = _token;
  }
  function createTokenContract() internal returns (MintableToken) {
    return token;
  }
  function getTokenAmount(uint256 weiAmount) internal view returns(uint256) {
    uint256 bonus = 0;
    if(now <= 1518703200){
      bonus = 1200;
    }
    if(now > 1518703200 && now <= 1519308000){
      bonus = 900;
    }
    if(now > 1519308000 && now <= 1519912800){
      bonus = 600;
    }
    if(now > 1519912800 && now <= 1520517600){
      bonus = 300;
    }
    uint256 rateWithBonus = rate.add(bonus);
    return weiAmount.mul(rateWithBonus);
  }
}
