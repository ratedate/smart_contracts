pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./RDT.sol";


contract ICO is CappedCrowdsale, Ownable{
  uint256 public minAmount = 1 ether/10;

  mapping(address => uint256) balances;

  function ICO(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _cap, address _wallet, MintableToken _token) public
  CappedCrowdsale(_cap)
  Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    require(_token != address(0));
    token = _token;
  }
  function createTokenContract() internal returns (MintableToken) {
    return token;
  }


  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  function getTokenAmount(uint256 weiAmount) internal view returns(uint256) {
    uint256 bonus = 0;
    if(now <= 1519689599){
      bonus = 1200;
    }
    if(now > 1519689599 && now <= 1520294399){
      bonus = 900;
    }
    if(now > 1520294399 && now <= 1520899199){
      bonus = 600;
    }
    if(now > 1520899199 && now <= 1521503999){
      bonus = 300;
    }
    uint256 rateWithBonus = rate.add(bonus);
    return weiAmount.mul(rateWithBonus);
  }

  function validPurchase() internal view returns (bool) {
    bool overMinAmount = msg.value >= minAmount;
    return super.validPurchase() && overMinAmount;
  }

  function initICO() public onlyOwner returns (bool) {
    token.mint(this, 34423767855514000000000000);
    return true;
  }


  function allowTransfer(address _spender) public onlyOwner returns (bool){
    token.approve(_spender, 34423767855514000000000000);
    return true;
  }

  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = getTokenAmount(weiAmount);

    // update state
    weiRaised = weiRaised.add(weiAmount);


    balances[beneficiary] = balances[beneficiary].add(tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

}
