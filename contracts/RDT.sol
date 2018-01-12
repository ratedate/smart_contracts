pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/MintableToken.sol";

contract RDT is MintableToken {
  string public name = "Rate Date Token";
  string public symbol = "RDT";
  uint8 public decimals = 18;
  /* 50 000 000 cap for RDT tokens */
  uint256 public cap = 50000000000000000000000000;
  /* freeze transfer until 15 Apr 2018 */
  uint256 transferFreezeUntil = 1523793600;
  /* End mint 28 Mar 2018(ICO end date) */
  uint256 endMint = 1522260000;
  /* freeze team tokens until Mar 2019 */
  uint256 teamFreeze = 1551398400;
  address public teamWallet = 0x52853f8189482C059ceA50F5BcFf849FcA311a2A;


  function RDT() public
  {
    uint256 teamTokens = 7500000000000000000000000;
    uint256 bonusTokens = 2500000000000000000000000;
    address bonusWallet = 0x9D1Ed168DfD0FdeB78dEa2e25F51E4E77b75315c;
    uint256 reserveTokens = 3000000000000000000000000;
    address reserveWallet = 0x997BFceD5B2c1ffce76c953E22AFC3c6af6c497F;
    mint(teamWallet,teamTokens);
    mint(bonusWallet,bonusTokens);
    mint(reserveWallet,reserveTokens);
  }

  function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool){
    require(endMint >= now);
    require(totalSupply.add(_amount) <= cap);
    return super.mint(_to, _amount);
  }

  modifier notFrozen(){
    require(transferFreezeUntil <= now);
    if(msg.sender==teamWallet){
      require(now >= teamFreeze);
    }
    _;
  }

  function transfer(address _to, uint256 _value) notFrozen public returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) notFrozen public returns (bool){
    return super.transferFrom(_from, _to, _value);
  }
}
