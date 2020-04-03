pragma solidity 0.5.8;

import "../roles/PauserRole.sol";

/**
 * Allows transfers on a token contract to be paused by an administrator.
 */
contract Pausable is PauserRole {
    event Paused();
    event Unpaused();

    bool private _paused;

    /**
     * @return true if the contract is paused, false otherwise.
     */
    function paused() external view returns (bool) {
        return _paused;
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function _pause() internal {
        _paused = true;
        emit Paused();
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function _unpause() internal {
        _paused = false;
        emit Unpaused();
    }

     /**
     * @dev called by pauser role to pause, triggers stopped state
     */
    function pause() public onlyPauser {
        _pause();
    }

    /**
     * @dev called by pauer role to unpause, returns to normal state
     */
    function unpause() public onlyPauser {
        _unpause();
    }
}