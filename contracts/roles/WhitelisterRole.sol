pragma solidity 0.5.8;

import "./OwnerRole.sol";

contract WhitelisterRole is OwnerRole {

    event WhitelisterAdded(address indexed addedWhitelister, address indexed addedBy);
    event WhitelisterRemoved(address indexed removedWhitelister, address indexed removedBy);

    Roles.Role private _whitelisters;

    modifier onlyWhitelister() {
        require(isWhitelister(msg.sender), "WhitelisterRole: caller does not have the Whitelister role");
        _;
    }

    function isWhitelister(address account) public view returns (bool) {
        return _whitelisters.has(account);
    }

    function addWhitelister(address account) public onlyOwner {
        _addWhitelister(account);
    }

    function removeWhitelister(address account) public onlyOwner {
        _removeWhitelister(account);
    }

    function _addWhitelister(address account) internal {
        _whitelisters.add(account);
        emit WhitelisterAdded(account, msg.sender);
    }

    function _removeWhitelister(address account) internal {
        _whitelisters.remove(account);
        emit WhitelisterRemoved(account, msg.sender);
    }
}