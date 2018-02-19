pragma solidity ^0.4.11;

import "./RDT.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract ETZallocation is Ownable{
  RDT public token;
  bool public allocated = false;
  function ETZallocation (RDT _token) public{
    require(_token!=address(0));
    token = _token;
  }

  function RDTallocation() onlyOwner public {
    require(!allocated);
    require(token!=address(0));
    token.mint(0x6b6dc58D937E8DB3814BA067C29689dd3CEE2126,2877002640000000000000);
    token.mint(0x570E2260BaD08E8cf094583F5C5424d3c82d429d,35962533000000000000000);
    token.mint(0x570E2260BaD08E8cf094583F5C5424d3c82d429d,2001012660000000000000000);
    token.mint(0x8f43eE13B1Bc1A42E86BaF3E9b1e084dD284a513,336155490000000000000);
    token.mint(0x8f43eE13B1Bc1A42E86BaF3E9b1e084dD284a513,342000360000000000000);
    token.mint(0xB8A1895FBc198D165981d087EF7b41a1F6520115,449954640036000000000000);
    allocated = true;
  }

  function startICO(address contractICO) onlyOwner public{
    require(contractICO!=address(0));
    require(allocated);
    token.transferOwnership(contractICO);
  }
}
