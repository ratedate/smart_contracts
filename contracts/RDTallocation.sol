pragma solidity ^0.4.18;

import "./RDT.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract RDTallocation is Ownable{
  RDT public token;
  address public ICO;

  function RDTallocation(RDT _token, address _ICO) public{
    require(_token!=address(0));
    require(_ICO!=address(0));
    token = _token;
    ICO = _ICO;
  }

  function allocate() onlyOwner public{
    token.transferFrom(ICO, 0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc, 500000000000000000000000);
    uint256 toBurnTokens = token.balanceOf(address(ICO));
    token.transferFrom(ICO, 0x1000000000000000000000000000000000000000, toBurnTokens);
  }
}
