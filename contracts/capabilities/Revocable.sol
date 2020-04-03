pragma solidity 0.5.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../roles/RevokerRole.sol";

/**
 * Allows an administrator to move tokens from a target account to their own.
 */
contract Revocable is ERC20, RevokerRole {

  event Revoke(address indexed revoker, address indexed from, uint256 amount);

  function revoke(
    address _from,
    uint256 _amount
  )
    public
    onlyRevoker
    returns (bool)
  {
    ERC20._transfer(_from, msg.sender, _amount);
    emit Revoke(msg.sender, _from, _amount);
    return true;
  }
}