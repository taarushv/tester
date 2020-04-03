pragma solidity 0.5.8;

import "./OwnerRole.sol";

contract TimelockerRole is OwnerRole {

    event TimelockerAdded(address indexed addedTimelocker, address indexed addedBy);
    event TimelockerRemoved(address indexed removedTimelocker, address indexed removedBy);

    Roles.Role private _timelockers;

    modifier onlyTimelocker() {
        require(isTimelocker(msg.sender), "TimelockerRole: caller does not have the Timelocker role");
        _;
    }

    function isTimelocker(address account) public view returns (bool) {
        return _timelockers.has(account);
    }

    function addTimelocker(address account) public onlyOwner {
        _addTimelocker(account);
    }

    function removeTimelocker(address account) public onlyOwner {
        _removeTimelocker(account);
    }

    function _addTimelocker(address account) internal {
        _timelockers.add(account);
        emit TimelockerAdded(account, msg.sender);
    }

    function _removeTimelocker(address account) internal {
        _timelockers.remove(account);
        emit TimelockerRemoved(account, msg.sender);
    }
}