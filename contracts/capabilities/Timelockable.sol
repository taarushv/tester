pragma solidity 0.5.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../roles/TimelockerRole.sol";

/**
 * @title INX Timelockable
 * @dev Lockup all or a portion of an accounts tokens until an expiration date
 */
contract Timelockable is TimelockerRole {

    using SafeMath for uint256;

    struct lockupItem {
        uint256 amount;
        uint256 releaseTime;
    }

    mapping (address => lockupItem) lockups;

    event AccountLock(address _address, uint256 amount, uint256 releaseTime);
    event AccountRelease(address _address, uint256 amount);


    /**
    * @dev lock address and amount and lock it, set the release time
    * @param _address the address to lock
    * @param amount the amount to lock
    * @param releaseTime of the locked amount (in seconds since the epoch)
    */
    function lock( address _address, uint256 amount, uint256 releaseTime) public onlyTimelocker returns (bool) {
        require(releaseTime > block.timestamp, "Release time needs to be in the future");
        require(_address != address(0), "Address must be valid for lockup");

        lockupItem memory _lockupItem = lockupItem(amount, releaseTime);
        lockups[_address] = _lockupItem;
        emit AccountLock(_address, amount, releaseTime);
        return true;
    }

    /**
    * @dev release locked amount
    * @param _address the address to retrieve the data from
    * @param amountToRelease the amount to check
    */
    function release( address _address, uint256 amountToRelease) public onlyTimelocker returns(bool) {
        require(_address != address(0), "Address must be valid for release");

        uint256 _lockedAmount = lockups[_address].amount;

        // nothing to release
        if(_lockedAmount == 0){
            emit AccountRelease(_address, 0);
            return true;
        }

        // extract release time for re-locking
        uint256 _releaseTime = lockups[_address].releaseTime;

        // delete the lock entry
        delete lockups[_address];

        if(_lockedAmount >= amountToRelease){
           uint256 newLockedAmount = _lockedAmount.sub(amountToRelease);

           // re-lock the new locked balance
           lock(_address, newLockedAmount, _releaseTime);
           emit AccountRelease(_address, amountToRelease);
           return true;
        } else {
            // if they requested to release more than the locked amount emit the event with the locked amount that has been released
            emit AccountRelease(_address, _lockedAmount);
            return true;
        }
    }

    /**
    * @dev return true if the given account has enough unlocked tokens to send the requested amount
    * @param _address the address to retrieve the data from
    * @param amount the amount to send
    * @param balance the token balance of the sending account
    */
    function checkTimelock(address _address, uint256 amount, uint256 balance) external view returns (bool) {
        // if the user does not have enough tokens to send regardless of lock return true here
        // the failure will still fail but this should make it explicit that the transfer failure is not
        // due to locked tokens but because of too low token balance
        if (balance < amount) {
            return true;
        }

        // get the sending addresses token balance that is not locked
        uint256 nonLockedAmount = balance.sub(lockups[_address].amount);

        // determine if the sending address has enough free tokens to send the entire amount
        bool notLocked = amount <= nonLockedAmount;

        // if the timelock is greater then the release time the time lock is expired
        bool timeLockExpired = block.timestamp > lockups[_address].releaseTime;

        // if the timelock is expired OR the requested amount is available the transfer is not locked
        if(timeLockExpired || notLocked){
            return true;

        // if the timelocked is not expired AND the requested amount is not available the tranfer is locked
        } else {
            return false;
        }
    }

    /**
    * @dev get address lockup info
    * @param _address the address to retrieve the data from
    * @return array of 2 uint256, release time (in seconds since the epoch) and amount (in INX)
    */
    function checkLockup(address _address) public view returns(uint256, uint256) {
        // copy lockup data into memory
        lockupItem memory _lockupItem = lockups[_address];

        return (_lockupItem.releaseTime, _lockupItem.amount);
    }
}